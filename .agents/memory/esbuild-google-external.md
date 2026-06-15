---
name: esbuild external list and @google/genai
description: @google/* in external list prevents bundling of @google/genai, causing runtime ERR_MODULE_NOT_FOUND
---

## Rule
The build.mjs external list uses `@google-cloud/*` (NOT `@google/*`) to allow `@google/genai` to be bundled inline by esbuild.

**Why:** `@google/*` is too broad — it catches `@google/genai`. When externalized, Node.js must find the package at runtime relative to dist/, but workspace symlinks don't follow there. Narrowing to `@google-cloud/*` lets esbuild bundle the Gemini SDK inline.

**How to apply:** If adding other Google packages that truly can't be bundled (e.g. have native .proto file path traversal), add them specifically rather than using the wildcard.
