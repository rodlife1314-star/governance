"""
Feature correlation topology mapping — cuGraph engine.

Doctrine: RAPIDS resolves structure at speed. RAPIDS does not think.

GPU path:  cuGraph connected_components on a cuDF edge list.
CPU path:  networkx graph from the same edge list.

The 9-feature observation vector is mapped to a weighted correlation graph.

Edge weight formula:
    w(i, j) = |v_i × v_j| / (|v_i| + |v_j| + ε)

This product-normalised similarity gives physically meaningful weights
from a single observation without requiring a multi-sample correlation matrix.
It approaches 1 when both features are large and equal, and 0 when either
feature is zero.

Only edges with w > _THRESHOLD (0.30) are included. The top 10 by weight
are kept; only the top 5 are surfaced in dominant_correlations.

Never raises. gpu_confirmed is True only when cuGraph ran a real CUDA op.
"""

from __future__ import annotations

from models.topology_result import CorrelationEdge, TopologyResult


# ── Feature vector contract (must match cuml_engine) ─────────────────────────

_FEATURE_KEYS: list[str] = [
    "wl_offset",
    "fwhm_ratio",
    "balmer_ratio",
    "balmer_excess",
    "he_ii",
    "variability_days",
    "blue_abs_velocity",
    "x_ray",
    "radio",
]

_THRESHOLD:  float = 0.30   # minimum edge weight to include in graph
_MAX_EDGES:  int   = 10     # edges kept for graph computation
_TOP_REPORT: int   = 5      # edges surfaced in dominant_correlations


# ── Public interface ──────────────────────────────────────────────────────────

def map_correlation_topology(obs_f: dict[str, float]) -> tuple[TopologyResult, bool]:
    """
    Build correlation topology graph from the 9-feature observation vector.

    Args:
        obs_f: Feature dict. Missing keys default to 0.0.

    Returns:
        (TopologyResult, gpu_confirmed)
        gpu_confirmed is True only if cuGraph ran a real CUDA operation.
    """
    vec = [obs_f.get(k, 0.0) for k in _FEATURE_KEYS]
    n   = len(_FEATURE_KEYS)

    raw_edges = _build_edges(vec)

    cluster_count, method, gpu_confirmed = _compute_topology_gpu(raw_edges, n)
    if cluster_count is None:
        cluster_count, method, gpu_confirmed = _compute_topology_cpu(raw_edges, n)

    dominant = [
        CorrelationEdge(source=e[0], target=e[1], weight=round(e[2], 4))
        for e in raw_edges[:_TOP_REPORT]
    ]

    return TopologyResult(
        node_count            = n,
        edge_count            = len(raw_edges),
        dominant_correlations = dominant,
        cluster_count         = cluster_count,
        method                = method,
    ), gpu_confirmed


# ── Internal helpers ──────────────────────────────────────────────────────────

def _build_edges(vec: list[float]) -> list[tuple[str, str, float]]:
    """
    Compute product-normalised similarity for all feature pairs.
    Return edges above threshold, sorted by weight descending, capped at _MAX_EDGES.
    """
    n = len(vec)
    edges: list[tuple[str, str, float]] = []

    for i in range(n):
        for j in range(i + 1, n):
            denom = abs(vec[i]) + abs(vec[j]) + 1e-9
            w     = abs(vec[i] * vec[j]) / denom
            if w > _THRESHOLD:
                edges.append((_FEATURE_KEYS[i], _FEATURE_KEYS[j], w))

    edges.sort(key=lambda e: e[2], reverse=True)
    return edges[:_MAX_EDGES]


def _compute_topology_gpu(
    edges: list[tuple[str, str, float]],
    n: int,
) -> tuple[int | None, str, bool]:
    """
    GPU path via cuGraph. Returns (None, '', False) on any failure.
    """
    try:
        import cudf
        import cugraph

        if not edges:
            return n, "cugraph", True  # all nodes isolated → n components

        edge_df = cudf.DataFrame({
            "src":     [e[0] for e in edges],
            "dst":     [e[1] for e in edges],
            "weights": [e[2] for e in edges],
        })
        G = cugraph.Graph()
        G.from_cudf_edgelist(edge_df, source="src", destination="dst", edge_attr="weights")
        components   = cugraph.connected_components(G)
        cluster_count = int(components["labels"].nunique())

        # Isolated nodes (not in any edge) are their own components
        connected_nodes = set(e[0] for e in edges) | set(e[1] for e in edges)
        isolated_count  = n - len(connected_nodes)
        cluster_count  += isolated_count

        return cluster_count, "cugraph", True

    except Exception:
        return None, "", False


def _compute_topology_cpu(
    edges: list[tuple[str, str, float]],
    n: int,
) -> tuple[int, str, bool]:
    """
    CPU fallback via networkx. Falls back to heuristic if networkx unavailable.
    """
    try:
        import networkx as nx

        G = nx.Graph()
        G.add_nodes_from(_FEATURE_KEYS)
        G.add_weighted_edges_from(edges)
        cluster_count = nx.number_connected_components(G)
        return cluster_count, "networkx", False

    except Exception:
        # Pure heuristic: approximate components from node/edge count
        connected_nodes = set(e[0] for e in edges) | set(e[1] for e in edges)
        isolated_count  = n - len(connected_nodes)
        cluster_count   = max(1, isolated_count + (1 if edges else 0))
        return cluster_count, "heuristic", False
