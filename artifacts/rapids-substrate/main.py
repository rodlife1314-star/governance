"""
RAPIDS Substrate — FastAPI microservice.

Doctrine:
    RAPIDS does not think.
    RAPIDS resolves structure at speed.
    HERMES carries that resolved structure into the cognitive pipeline.
    JEMMA challenges interpretation.
    OCTAGON governs verdict.

This service is a field, not a structure.
It sits beneath the seed kernel — not inside it as a sequential layer.
It is called before the cognitive pipeline fires, to pre-resolve
structural signatures that HERMES then carries as grounded evidence.

GPU detection is lazy — import cudf is never at module level.
gpu_confirmed is never set True until a real CUDA operation returns.
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException

from models.thread_input  import ThreadInput
from models.thread_output import ThreadOutput
from engines.cudf_engine   import resolve_balmer
from engines.cuml_engine   import score_anomaly
from engines.cugraph_engine import map_correlation_topology


# ── GPU availability check — lazy, never crashes the service ─────────────────

def probe_gpu() -> dict:
    """
    Attempts to import cudf and create a trivial dataframe.
    Returns status dict. Never raises.
    """
    try:
        import cudf
        test = cudf.DataFrame({"x": [1.0, 2.0]})
        _ = test["x"].mean()
        return {
            "available":    True,
            "cudf_version": cudf.__version__,
            "note":         "CUDA device confirmed via cudf operation",
        }
    except ImportError:
        return {
            "available": False,
            "note":      "cuDF not installed — pip install cudf-cu12 or use conda rapidsai channel",
        }
    except Exception as e:
        return {
            "available": False,
            "note":      f"cuDF import succeeded but CUDA device unavailable: {e}",
        }


# ── App lifecycle ─────────────────────────────────────────────────────────────

_startup_state: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    _startup_state["gpu"] = probe_gpu()
    status = "CONFIRMED" if _startup_state["gpu"]["available"] else "UNAVAILABLE"
    print(f"[RAPIDS SUBSTRATE] GPU: {status} — {_startup_state['gpu']['note']}")
    yield
    print("[RAPIDS SUBSTRATE] Shutdown.")


app = FastAPI(
    title       = "RAPIDS Substrate",
    description = "GPU-accelerated structural resolution. Sits beneath the seed kernel.",
    version     = "1.0.0",
    lifespan    = lifespan,
)


# ── Health endpoint ───────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """
    Always responds. Never crashes.
    GPU state is reported honestly — not assumed.
    """
    gpu = _startup_state.get("gpu") or probe_gpu()
    return {
        "status":        "ACTIVE",
        "gpu_available": gpu["available"],
        "gpu_note":      gpu["note"],
        "doctrine":      "RAPIDS resolves structure. RAPIDS does not think.",
    }


# ── Resolution endpoint ───────────────────────────────────────────────────────

@app.post("/resolve", response_model=ThreadOutput)
def resolve(thread: ThreadInput):
    """
    The thread enters. RAPIDS resolves structure at velocity.
    Returns ThreadOutput carrying structural signatures for HERMES to ingest.

    gpu_confirmed is only True if at least one real CUDA operation succeeded.
    """
    t0 = time.perf_counter()

    # ── Balmer resolution — always runs, pure arithmetic, no GPU required ──
    try:
        balmer = resolve_balmer(thread.observation)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Build observation feature vector for cuML ──────────────────────────
    obs_f = {
        "wl_offset":           thread.observation.peak_wavelength_nm - thread.observation.rest_wavelength_nm,
        "fwhm_ratio":          thread.observation.fwhm_kms / max(thread.observation.expected_fwhm_kms, 0.001),
        "balmer_ratio":        balmer.ratio_observed,
        "balmer_excess":       balmer.excess_factor,
        "he_ii":               float(thread.observation.he_ii_4686_present),
        "variability_days":    thread.observation.temporal_variability_days,
        "blue_abs_velocity":   thread.observation.blue_absorption_velocity,
        "x_ray":               thread.observation.x_ray_association,
        "radio":               thread.observation.radio_flux_mjy,
    }

    # ── cuML anomaly detection ─────────────────────────────────────────────
    anomaly_result, gpu_anomaly = score_anomaly(obs_f)

    # ── cuGraph topology mapping ───────────────────────────────────────────
    topology_result, gpu_topology = map_correlation_topology(obs_f)

    # ── gpu_confirmed: only True if at least one real CUDA op succeeded ────
    gpu_confirmed = gpu_anomaly or gpu_topology

    velocity_ms = round((time.perf_counter() - t0) * 1000, 3)

    return ThreadOutput(
        domain             = thread.domain,
        case_id            = thread.case_id,
        resolution_mode    = thread.resolution_mode,
        balmer_resolution  = balmer,
        anomaly_result     = anomaly_result,
        topology_result    = topology_result,
        gpu_confirmed      = gpu_confirmed,
        velocity_ms        = velocity_ms,
    )
