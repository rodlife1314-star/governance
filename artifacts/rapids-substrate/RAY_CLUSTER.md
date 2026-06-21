# RAPIDS Substrate — Ray Cluster Deployment Guide

## Overview

The RAPIDS Substrate runs as a FastAPI service handling GPU-accelerated structural resolution (cuDF, cuML, cuGraph). For large-scale inference workloads — particularly running Nemotron-550B or other frontier models locally — the substrate can be backed by a **Ray cluster** running either **vLLM** or **SGLang** as the inference engine.

This guide covers:
1. Cluster setup (head node + workers)
2. vLLM and SGLang inference server configuration
3. Wiring the RAPIDS Substrate to talk to the local inference server
4. Environment variable reference

---

## Prerequisites

Every node in the cluster needs:

```bash
# CUDA 12.x driver — verify first
nvidia-smi

# Python 3.11 or 3.12
python --version

# Ray with dashboard
pip install "ray[default]>=2.40.0"

# GPU acceleration — install via conda (recommended) or pip
conda install -c rapidsai -c conda-forge \
  cudf=25.04 cuml=25.04 cugraph=25.04 \
  cupy-cuda12x python=3.12 cuda-version=12.0

# Inference engine — pick one (or both)
pip install vllm          # vLLM
pip install sglang        # SGLang
```

> **Nemotron-550B NVFP4 sizing note**: The `NVFP4` checkpoint uses 4-bit quantization (~0.5 bytes/param), reducing the full weight footprint to ~275 GB — roughly **4× smaller than BF16** (1.1 TB). The MoE active-parameter footprint is ~27 GB, but all expert weights must be resident. Practical minimum: **4× H100-80GB** (TP=4, 320 GB total). For the BF16/FP8 checkpoint, 8× H100 is required.

---

## 1. Start the Ray Head Node

On the machine that will coordinate the cluster:

```bash
export RAY_HEAD_IP=<this_machine_ip>    # e.g. 10.0.0.10
export RAY_PORT=6379

./scripts/ray-cluster-setup.sh head
```

The Ray dashboard will be available at `http://${RAY_HEAD_IP}:8265`.

Verify it is up:

```bash
ray status --address=${RAY_HEAD_IP}:${RAY_PORT}
```

---

## 2. Join Worker Nodes

On each GPU worker machine:

```bash
export RAY_HEAD_IP=<head_node_ip>
export RAY_PORT=6379

./scripts/ray-cluster-setup.sh worker
```

Workers connect, register their GPUs, and block until the cluster shuts down. Run this in a `tmux` or `screen` session, or as a systemd unit.

---

## 3. Launch the Inference Server

### Option A — vLLM (recommended for OpenAI-compatible API)

On the head node (or any node with GPU access to the cluster):

```bash
export RAY_HEAD_IP=<head_node_ip>
export MODEL_CKPT=nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4
export VLLM_MODEL="${MODEL_CKPT}"
export VLLM_TENSOR_PARALLEL=4          # 4× H100-80GB minimum for NVFP4
export VLLM_PORT=8001
export VLLM_MAX_MODEL_LEN=262144         # 256K context window
export VLLM_QUANTIZATION=auto          # vLLM detects NVFP4 from model config;
                                       # set fp4 explicitly if auto-detection fails
export HF_TOKEN=<your_hf_token>        # required for gated model

./scripts/ray-cluster-setup.sh vllm
```

vLLM will use Ray internally to shard the model across `VLLM_TENSOR_PARALLEL` GPUs. The OpenAI-compatible API is available at:

```
http://<head_node_ip>:8001/v1
```

### Option B — SGLang

```bash
export RAY_HEAD_IP=<head_node_ip>
export MODEL_CKPT=nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4
export SGLANG_MODEL="${MODEL_CKPT}"
export SGLANG_TENSOR_PARALLEL=4
export SGLANG_PORT=8002
export HF_TOKEN=<your_hf_token>

./scripts/ray-cluster-setup.sh sglang
```

SGLang serves at:

```
http://<head_node_ip>:8002/v1
```

### Option C — Docker (single node, no Ray required)

This is the production-tested single-node deployment path. No Ray cluster setup is needed — vLLM manages GPU sharding internally.

**Prerequisites:** Docker Engine with `--gpus all` support (`nvidia-container-toolkit` installed and configured), NVFP4 checkpoint already downloaded at `$MODEL_CKPT`.

```bash
export MODEL_CKPT=/path/to/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4

docker run -d --name nemotron-ultra-vllm \
  --gpus all \
  --ipc=host \
  --network=host \
  --shm-size=16g \
  --ulimit memlock=-1 \
  --ulimit stack=67108864 \
  -v $MODEL_CKPT:/model:ro \
  -e VLLM_WORKER_MULTIPROC_METHOD=spawn \
  -e SAFETENSORS_FAST_GPU=1 \
  -e NVIDIA_TF32_OVERRIDE=1 \
  -e VLLM_LOGGING_LEVEL=INFO \
  vllm/vllm-openai:v0.22.0 \
  /model \
  --host 0.0.0.0 \
  --port 8000 \
  --served-model-name nvidia/nemotron-3-ultra \
  --trust-remote-code \
  --tensor-parallel-size 4 \
  --enable-expert-parallel \
  --kv-cache-dtype fp8 \
  --max-model-len 262144 \
  --gpu-memory-utilization 0.90 \
  --max-num-seqs 16 \
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
  --model-loader-extra-config '{"enable_multithread_load": true, "num_threads": 96}'
```

**Flag breakdown:**

| Group | Flags | Purpose |
|---|---|---|
| **Parallelism** | `--tensor-parallel-size 4` | Shards model across 4 GPUs |
| **MoE routing** | `--enable-expert-parallel` | Separate expert-layer parallelism for MoE blocks |
| **KV cache** | `--kv-cache-dtype fp8` | Halves KV cache VRAM vs fp16; no quality impact for this model |
| **Context** | `--max-model-len 262144` | Full 256K context window |
| **Throughput** | `--enable-chunked-prefill`, `--enable-prefix-caching` | Reduce TTFT for long-context requests and repeated system prompts |
| **Mamba hybrid** | `--mamba-ssm-cache-dtype float16`<br>`--mamba-backend flashinfer`<br>`--enable-mamba-cache-stochastic-rounding`<br>`--mamba-cache-philox-rounds 5` | Nemotron Ultra is a **Hybrid Mamba-Transformer**; these flags configure the SSM state cache correctly |
| **Reasoning trace** | `--reasoning-parser nemotron_v3` | Parses `<think>…</think>` tokens into `delta.reasoning_content` — **required** for the SPECTRA-7 thinking trace to appear |
| **Tool calls** | `--enable-auto-tool-choice`<br>`--tool-call-parser qwen3_coder` | Enables structured tool-call output |
| **Speculative decoding** | `--speculative-config '{"method":"nemotron_h_mtp","num_speculative_tokens":5}'` | Multi-Token Prediction (MTP) for ~1.5–2× throughput at low batch sizes |
| **Fast load** | `--model-loader-extra-config '{"enable_multithread_load":true,"num_threads":96}'` | Parallel checkpoint loading — cuts cold-start time significantly |

> **On `--reasoning-parser nemotron_v3`**: this is what emits the thinking trace as `delta.reasoning_content` in the streaming response — the same field our `nvidia.ts` client reads. Without this flag, thinking tokens appear inline in `delta.content` and the thinking trace panel in SPECTRA-7 will be empty.

The API is served at `http://localhost:8000/v1` (host network mode). The served model name is `nvidia/nemotron-3-ultra`.

**Monitor the container:**

```bash
docker logs -f nemotron-ultra-vllm
# Ready when you see: "Application startup complete."

# Smoke test
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia/nemotron-3-ultra",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 8,
    "stream": false
  }'
```

---

## 4. Wire the NVIDIA Adapter to the Local Cluster

The `api-server` NVIDIA adapter (`artifacts/api-server/src/lib/nvidia.ts`) reads `NVIDIA_API_KEY` and targets `https://integrate.api.nvidia.com/v1` by default.

To point it at your local cluster instead, set:

```bash
# Option A/B — Ray cluster (vLLM Python or SGLang):
NVIDIA_API_BASE_URL=http://<head_node_ip>:8001/v1
NVIDIA_API_KEY=not-required-locally          # vLLM ignores this; must be non-empty
NVIDIA_MODEL_NAME=nvidia/nemotron-3-ultra    # matches --served-model-name in docker/vllm

# Option C — Docker (host network):
NVIDIA_API_BASE_URL=http://localhost:8000/v1
NVIDIA_API_KEY=not-required-locally
NVIDIA_MODEL_NAME=nvidia/nemotron-3-ultra
```

`nvidia.ts` already reads all three env vars — `NVIDIA_API_BASE_URL`, `NVIDIA_API_KEY`, and `NVIDIA_MODEL_NAME`. No code changes are needed. vLLM, SGLang, and the NVIDIA cloud API all speak the OpenAI protocol.

---

## 5. Environment Variable Reference

| Variable | Default | Description |
|---|---|---|
| `RAY_HEAD_IP` | *(required)* | IP address of the Ray head node |
| `RAY_PORT` | `6379` | Ray GCS port |
| `RAY_DASHBOARD_PORT` | `8265` | Ray web dashboard port |
| `VLLM_MODEL` | `nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4` | HuggingFace model ID or local path |
| `VLLM_TENSOR_PARALLEL` | `4` | GPU count (4× H100-80GB minimum for NVFP4) |
| `VLLM_QUANTIZATION` | `auto` | `auto` \| `fp4` \| `nvfp4` — explicit override if auto-detect fails |
| `VLLM_PORT` | `8001` | vLLM OpenAI-compatible API port |
| `VLLM_MAX_MODEL_LEN` | `262144` | Maximum sequence length (256K context) |
| `SGLANG_MODEL` | *(same as VLLM_MODEL)* | Model for SGLang |
| `SGLANG_TENSOR_PARALLEL` | *(same as VLLM_TENSOR_PARALLEL)* | GPU count for SGLang |
| `SGLANG_PORT` | `8002` | SGLang API port |
| `HF_TOKEN` | *(optional)* | HuggingFace token for gated/private models |
| `NVIDIA_API_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Override to point at local vLLM/SGLang |
| `NVIDIA_API_KEY` | *(from Replit Secrets)* | Cloud API key; set to any string for local |
| `NVIDIA_MODEL_NAME` | `nvidia/nemotron-3-ultra-550b-a55b` | Override to `nvidia/nemotron-3-ultra` when using local vLLM/Docker |
| `INFERENCE_PROVIDER` | `gemini` | RAPIDS adapter: `gemini` or `nvidia` |

---

## 6. Verify End-to-End

```bash
# 1. Cluster health
./scripts/ray-cluster-setup.sh status

# 2. vLLM model endpoint
curl http://<head_node_ip>:8001/v1/models

# 3. Inference smoke test
curl http://<head_node_ip>:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 16
  }'

# 4. RAPIDS Substrate health (via shared proxy)
curl http://localhost:80/rapids/health
```

---

## 7. Systemd Unit (optional — for persistent worker nodes)

Create `/etc/systemd/system/ray-worker.service`:

```ini
[Unit]
Description=Ray Worker Node
After=network.target

[Service]
Type=simple
User=ubuntu
Environment=RAY_HEAD_IP=10.0.0.10
Environment=RAY_PORT=6379
ExecStart=/usr/local/bin/bash /opt/rapids-substrate/scripts/ray-cluster-setup.sh worker
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ray-worker
sudo journalctl -u ray-worker -f
```

---

## Architecture Note

```
Operator query
      │
      ▼
  API Server (Express)
      │  getRapidsAdapter() / getSpectraAdapter()
      │
      ├─── Gemini 2.5 Flash (cloud, default for RAPIDS)
      │
      └─── NVIDIA Nemotron-550B ──► NVIDIA cloud API        (INFERENCE_PROVIDER=nvidia)
              (NVFP4 checkpoint) └► local vLLM/SGLang       (NVIDIA_API_BASE_URL set)
                                        │
                                        ▼
                                   Ray cluster
                                   (N × H100)
```

The RAPIDS Substrate (cuDF/cuML/cuGraph) handles structural resolution at velocity regardless of which inference provider is active. The inference adapter layer is orthogonal to GPU-accelerated data processing.
