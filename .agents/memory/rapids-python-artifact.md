---
name: RAPIDS Substrate Python artifact setup
description: How to run a Python FastAPI service in this pnpm monorepo, and quirks of the Replit workflow/package system for Python.
---

## Rules

**createArtifact does not support Python.** Only react-vite, expo, slides, video-js, data-visualization, and mockup-sandbox are supported types. For a Python service, create all files manually and register via `configureWorkflow`.

**uvicorn must use its full absolute path** in workflow commands — the packages are installed via `uv` into `.pythonlibs` at the workspace root, and `uvicorn` is NOT on the system PATH by default:
- Binary: `/home/runner/workspace/.pythonlibs/bin/uvicorn`
- `which uvicorn` confirms the path but hangs if run in bash (use it carefully)

**`configureWorkflow` with `waitForPort` always fails for Python services** — even when the server starts and the port opens, the port check races the startup lifespan. Omit `waitForPort` for Python services and use `outputType: "console"`.

**`verifyAndReplaceArtifactToml` requires the target file to already exist.** Cannot use it to create a new artifact.toml for a Python service — the call fails with ENOENT. Python services won't appear in the preview dropdown but they run and are reachable.

**Why:** Replit's artifact system is Node.js/JS framework centric. Python is a second-class citizen for artifact registration but a first-class runtime.

**How to apply:** When building any Python FastAPI/Flask/etc. service, skip createArtifact and verifyAndReplaceArtifactToml. Write all files directly, install packages with `installLanguagePackages`, and register with `configureWorkflow` without `waitForPort`.
