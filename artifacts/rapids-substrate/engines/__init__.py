"""
RAPIDS engine layer.

Three engines — each tries GPU first, falls back to CPU silently.
gpu_confirmed is returned as a bool from cuml and cugraph engines.
The cudf engine (Balmer) does not return gpu_confirmed — it is
purely structural arithmetic with no anomaly/topology state.

RAPIDS doctrine: never raise from an engine. Always resolve.
"""
