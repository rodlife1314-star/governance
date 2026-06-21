#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RAPIDS Substrate — Ray Cluster Setup Script
# Supports: head node, worker node, and vLLM/SGLang inference server launch.
#
# Usage:
#   ./scripts/ray-cluster-setup.sh head          — start Ray head node
#   ./scripts/ray-cluster-setup.sh worker        — start Ray worker node
#   ./scripts/ray-cluster-setup.sh vllm          — start vLLM on head node
#   ./scripts/ray-cluster-setup.sh sglang        — start SGLang on head node
#   ./scripts/ray-cluster-setup.sh status        — check cluster status
#   ./scripts/ray-cluster-setup.sh stop          — stop Ray on this node
#
# Required env vars:
#   RAY_HEAD_IP   — IP of the head node (all roles)
#   RAY_PORT      — Ray GCS port (default: 6379)
#
# Optional env vars for vLLM / SGLang:
#   VLLM_MODEL        — HuggingFace model ID or local path
#                       (default: nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4)
#   VLLM_TENSOR_PARALLEL — number of GPUs for tensor parallelism (default: 4 for NVFP4)
#   VLLM_PORT         — port for the OpenAI-compatible API (default: 8001)
#   VLLM_QUANTIZATION — quantization backend: auto | fp4 | nvfp4 (default: auto)
#   SGLANG_MODEL      — model ID for SGLang (default: same as VLLM_MODEL)
#   SGLANG_PORT       — port for SGLang server (default: 8002)
#   HF_TOKEN          — HuggingFace token (required for gated models)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
RAY_PORT="${RAY_PORT:-6379}"
RAY_DASHBOARD_PORT="${RAY_DASHBOARD_PORT:-8265}"
RAY_HEAD_IP="${RAY_HEAD_IP:-}"

VLLM_MODEL="${VLLM_MODEL:-nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4}"
VLLM_TENSOR_PARALLEL="${VLLM_TENSOR_PARALLEL:-4}"
VLLM_PIPELINE_PARALLEL="${VLLM_PIPELINE_PARALLEL:-2}"
VLLM_PORT="${VLLM_PORT:-8001}"
VLLM_MAX_MODEL_LEN="${VLLM_MAX_MODEL_LEN:-262144}"
VLLM_MAX_NUM_SEQS="${VLLM_MAX_NUM_SEQS:-256}"
VLLM_QUANTIZATION="${VLLM_QUANTIZATION:-auto}"
VLLM_DIST_TIMEOUT="${VLLM_DIST_TIMEOUT:-3600}"

SGLANG_MODEL="${SGLANG_MODEL:-${VLLM_MODEL}}"
SGLANG_PORT="${SGLANG_PORT:-8002}"
SGLANG_TENSOR_PARALLEL="${SGLANG_TENSOR_PARALLEL:-${VLLM_TENSOR_PARALLEL}}"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date -u +%H:%M:%SZ)] $*"; }
die()  { echo "[ERROR] $*" >&2; exit 1; }

require_head_ip() {
  if [[ -z "${RAY_HEAD_IP}" ]]; then
    die "RAY_HEAD_IP is not set. Export it before running this script."
  fi
}

check_ray() {
  if ! command -v ray &>/dev/null; then
    die "ray not found. Install with: pip install ray[default] vllm"
  fi
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_head() {
  require_head_ip
  check_ray
  log "Starting Ray HEAD node at ${RAY_HEAD_IP}:${RAY_PORT} ..."
  ray start \
    --head \
    --node-ip-address="${RAY_HEAD_IP}" \
    --port="${RAY_PORT}" \
    --dashboard-host="0.0.0.0" \
    --dashboard-port="${RAY_DASHBOARD_PORT}" \
    --num-gpus="$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | wc -l || echo 0)" \
    --verbose
  log "Head node started. Dashboard: http://${RAY_HEAD_IP}:${RAY_DASHBOARD_PORT}"
  log "Workers connect with: RAY_HEAD_IP=${RAY_HEAD_IP} RAY_PORT=${RAY_PORT} $0 worker"
}

cmd_worker() {
  require_head_ip
  check_ray
  RAY_ADDRESS="${RAY_HEAD_IP}:${RAY_PORT}"
  log "Joining Ray cluster at ${RAY_ADDRESS} as WORKER ..."
  ray start \
    --address="${RAY_ADDRESS}" \
    --num-gpus="$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | wc -l || echo 0)" \
    --block
}

cmd_vllm() {
  require_head_ip
  check_ray
  if ! command -v vllm &>/dev/null; then
    die "vllm not found. Install with: pip install vllm"
  fi

  # Total GPUs = TP × PP
  TOTAL_GPUS=$(( VLLM_TENSOR_PARALLEL * VLLM_PIPELINE_PARALLEL ))

  log "Launching vLLM server on Ray cluster at ${RAY_HEAD_IP}:${RAY_PORT}"
  log "Model:               ${VLLM_MODEL}"
  log "Tensor parallel:     ${VLLM_TENSOR_PARALLEL}"
  log "Pipeline parallel:   ${VLLM_PIPELINE_PARALLEL}  (total GPUs: ${TOTAL_GPUS})"
  log "Max model len:       ${VLLM_MAX_MODEL_LEN}"
  log "Max seqs:            ${VLLM_MAX_NUM_SEQS}"
  log "Dist timeout:        ${VLLM_DIST_TIMEOUT}s"
  log "Serving on port:     ${VLLM_PORT}"

  # Quantization override — "auto" lets vLLM detect NVFP4 from model config;
  # set VLLM_QUANTIZATION=fp4 explicitly if auto-detection fails.
  QUANT_FLAG=()
  if [[ "${VLLM_QUANTIZATION}" != "auto" ]]; then
    QUANT_FLAG=(--quantization "${VLLM_QUANTIZATION}")
  fi

  RAY_ADDRESS="${RAY_HEAD_IP}:${RAY_PORT}" \
  vllm serve "${VLLM_MODEL}" \
    --host 0.0.0.0 \
    --port "${VLLM_PORT}" \
    --served-model-name nvidia/nemotron-3-ultra \
    --tensor-parallel-size "${VLLM_TENSOR_PARALLEL}" \
    --pipeline-parallel-size "${VLLM_PIPELINE_PARALLEL}" \
    --distributed-executor-backend ray \
    --trust-remote-code \
    --kv-cache-dtype fp8 \
    --gpu-memory-utilization 0.90 \
    --max-model-len "${VLLM_MAX_MODEL_LEN}" \
    --max-num-seqs "${VLLM_MAX_NUM_SEQS}" \
    --max-num-batched-tokens 32768 \
    --enable-chunked-prefill \
    --enable-prefix-caching \
    --reasoning-parser nemotron_v3 \
    --enable-auto-tool-choice \
    --tool-call-parser qwen3_coder \
    --mamba-ssm-cache-dtype float16 \
    --mamba-backend flashinfer \
    --enable-mamba-cache-stochastic-rounding \
    --mamba-cache-philox-rounds 5 \
    --speculative-config '{"method": "nemotron_h_mtp", "num_speculative_tokens": 5}' \
    --model-loader-extra-config '{"enable_multithread_load": true, "num_threads": 96}' \
    --compilation-config '{"pass_config": {"fuse_allreduce_rms": false}}' \
    --distributed-timeout-seconds "${VLLM_DIST_TIMEOUT}" \
    "${QUANT_FLAG[@]}" \
    ${HF_TOKEN:+--huggingface-token "${HF_TOKEN}"}
}

cmd_sglang() {
  require_head_ip
  if ! python -c "import sglang" &>/dev/null 2>&1; then
    die "sglang not found. Install with: pip install sglang"
  fi
  log "Launching SGLang server"
  log "Model:            ${SGLANG_MODEL}"
  log "Tensor parallel:  ${SGLANG_TENSOR_PARALLEL}"
  log "Serving on port:  ${SGLANG_PORT}"

  python -m sglang.launch_server \
    --model-path "${SGLANG_MODEL}" \
    --tp "${SGLANG_TENSOR_PARALLEL}" \
    --port "${SGLANG_PORT}" \
    --trust-remote-code \
    ${HF_TOKEN:+--hf-token "${HF_TOKEN}"}
}

cmd_status() {
  require_head_ip
  check_ray
  log "Ray cluster status — address: ${RAY_HEAD_IP}:${RAY_PORT}"
  ray status --address="${RAY_HEAD_IP}:${RAY_PORT}"
}

cmd_stop() {
  check_ray
  log "Stopping Ray on this node ..."
  ray stop --force
  log "Done."
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
COMMAND="${1:-help}"
case "${COMMAND}" in
  head)   cmd_head   ;;
  worker) cmd_worker ;;
  vllm)   cmd_vllm   ;;
  sglang) cmd_sglang ;;
  status) cmd_status ;;
  stop)   cmd_stop   ;;
  *)
    echo ""
    echo "RAPIDS Substrate — Ray Cluster Setup"
    echo ""
    echo "  Usage: $0 <command>"
    echo ""
    echo "  Commands:"
    echo "    head    — start Ray head node (run on head node first)"
    echo "    worker  — join existing cluster as a worker (run on each GPU worker)"
    echo "    vllm    — start vLLM OpenAI-compatible inference server on this node"
    echo "    sglang  — start SGLang inference server on this node"
    echo "    status  — show cluster node/GPU summary"
    echo "    stop    — stop Ray on this node"
    echo ""
    echo "  Required env:"
    echo "    RAY_HEAD_IP   head node IP address"
    echo "    RAY_PORT      GCS port (default: 6379)"
    echo ""
    echo "  Optional env (vLLM / SGLang):"
    echo "    VLLM_MODEL              model checkpoint path (default: NVFP4 checkpoint)"
    echo "    VLLM_TENSOR_PARALLEL    TP size per node (default: 4)"
    echo "    VLLM_PIPELINE_PARALLEL  PP stages across nodes (default: 2; total GPUs = TP×PP)"
    echo "    VLLM_MAX_NUM_SEQS       max concurrent sequences (default: 256)"
    echo "    VLLM_QUANTIZATION       auto | fp4 | nvfp4 (default: auto)"
    echo "    VLLM_DIST_TIMEOUT       distributed timeout in seconds (default: 3600)"
    echo "    VLLM_PORT               API port (default: 8001)"
    echo "    SGLANG_PORT             SGLang API port (default: 8002)"
    echo "    HF_TOKEN                HuggingFace token for gated models"
    echo ""
    exit 1
    ;;
esac
