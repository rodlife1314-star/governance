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

> **Nemotron-550B sizing note**: The model is a 550B-parameter MoE (55B active parameters). FP8/BF16 checkpoint requires ~1.1 TB VRAM across the full weight matrix, but MoE active-weight footprint is ~110 GB for BF16. A practical minimum is **8× H100-80GB** for tensor parallelism, or 4× H100 with FP8 quantization.

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
export VLLM_MODEL=nvidia/Nemotron-3-Ultra-550B-A55B
export VLLM_TENSOR_PARALLEL=8          # one per H100
export VLLM_PORT=8001
export VLLM_MAX_MODEL_LEN=32768
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
export SGLANG_MODEL=nvidia/Nemotron-3-Ultra-550B-A55B
export SGLANG_TENSOR_PARALLEL=8
export SGLANG_PORT=8002
export HF_TOKEN=<your_hf_token>

./scripts/ray-cluster-setup.sh sglang
```

SGLang serves at:

```
http://<head_node_ip>:8002/v1
```

---

## 4. Wire the NVIDIA Adapter to the Local Cluster

The `api-server` NVIDIA adapter (`artifacts/api-server/src/lib/nvidia.ts`) reads `NVIDIA_API_KEY` and targets `https://integrate.api.nvidia.com/v1` by default.

To point it at your local cluster instead, set:

```bash
# In your api-server environment (or .env.local):
NVIDIA_API_BASE_URL=http://<head_node_ip>:8001/v1   # vLLM endpoint
NVIDIA_API_KEY=not-required-locally                  # vLLM ignores this; must be non-empty
```

Then update `artifacts/api-server/src/lib/nvidia.ts` to read the base URL from env:

```typescript
function createClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.NVIDIA_API_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    apiKey:  process.env.NVIDIA_API_KEY ?? "",
  });
}
```

No other changes are needed — vLLM and SGLang both speak the OpenAI API protocol.

---

## 5. Environment Variable Reference

| Variable | Default | Description |
|---|---|---|
| `RAY_HEAD_IP` | *(required)* | IP address of the Ray head node |
| `RAY_PORT` | `6379` | Ray GCS port |
| `RAY_DASHBOARD_PORT` | `8265` | Ray web dashboard port |
| `VLLM_MODEL` | `nvidia/Nemotron-3-Ultra-550B-A55B` | HuggingFace model ID or local path |
| `VLLM_TENSOR_PARALLEL` | `8` | GPU count for tensor parallelism |
| `VLLM_PORT` | `8001` | vLLM OpenAI-compatible API port |
| `VLLM_MAX_MODEL_LEN` | `32768` | Maximum sequence length |
| `SGLANG_MODEL` | *(same as VLLM_MODEL)* | Model for SGLang |
| `SGLANG_TENSOR_PARALLEL` | *(same as VLLM_TENSOR_PARALLEL)* | GPU count for SGLang |
| `SGLANG_PORT` | `8002` | SGLang API port |
| `HF_TOKEN` | *(optional)* | HuggingFace token for gated/private models |
| `NVIDIA_API_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Override to point at local vLLM/SGLang |
| `NVIDIA_API_KEY` | *(from Replit Secrets)* | Cloud API key; set to any string for local |
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
    "model": "nvidia/Nemotron-3-Ultra-550B-A55B",
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
      └─── NVIDIA Nemotron-550B ──► NVIDIA cloud API  (INFERENCE_PROVIDER=nvidia)
                                 └► local vLLM/SGLang  (NVIDIA_API_BASE_URL set)
                                        │
                                        ▼
                                   Ray cluster
                                   (N × H100)
```

The RAPIDS Substrate (cuDF/cuML/cuGraph) handles structural resolution at velocity regardless of which inference provider is active. The inference adapter layer is orthogonal to GPU-accelerated data processing.
