"""
Correlation graph topology result from cuGraph (or networkx CPU fallback).

RAPIDS maps the 9-feature observation vector onto a weighted correlation graph.
Edge weight is a product-normalised similarity: |v_i × v_j| / (|v_i| + |v_j| + ε).
Only edges above the threshold (0.30) are included.

HERMES uses this topology as a structural fingerprint — which features
co-activate, which are isolated, and how clustered the signal geometry is.
"""

from pydantic import BaseModel, Field


class CorrelationEdge(BaseModel):
    source: str = Field(..., description="Source feature node name.")
    target: str = Field(..., description="Target feature node name.")
    weight: float = Field(..., ge=0.0, description="Product-normalised similarity weight (unbounded above 1 for large feature values).")


class TopologyResult(BaseModel):
    """
    Feature correlation topology from the observation vector.

    cluster_count: number of connected components. A single cluster means
    features co-activate as a unified signal. Many clusters mean fragmented
    or independently varying features.
    """

    node_count: int = Field(
        ...,
        description="Number of feature nodes (= 9 for the standard observation vector).",
    )
    edge_count: int = Field(
        ...,
        description="Number of significant correlation edges above the 0.30 threshold.",
    )
    dominant_correlations: list[CorrelationEdge] = Field(
        default_factory=list,
        description="Top 5 strongest correlation edges, sorted by weight descending.",
    )
    cluster_count: int = Field(
        ...,
        description="Number of connected components in the correlation graph.",
    )
    method: str = Field(
        ...,
        description="Computation path: cugraph | networkx",
    )
