# PATHFINDER / GOVERNANCE

A cognitive telemetry architecture that transforms high-volume data into traceable,
operator-governed understanding. Structure is resolved, evidence is grounded, claims
are challenged, governance is enforced, and the operator authorizes action — in that
order. No subsystem holds authority.

> **Canonical identity:** This repo is **PATHFINDER** (GitHub: `rodlife1314-star/governance`).
> Earlier scaffolding referred to it as OCTAGON / `octagon-augment`; OCTAGON is now one
> *artifact* (`artifacts/octagon`), not the whole system. README.md is the source of truth
> for product framing; this file is the operational/agent reference.

## What actually deploys

- **Deploy target:** `@workspace/api-server` only (see `Dockerfile` + `cloudbuild.yaml`).
  Built with esbuild to `dist/index.mjs`, served on `PORT` (8080 in prod), Cloud Run
  `governance` in `europe-west2`. The four React artifacts are NOT built or served by
  this image — they are developed/deployed separately. Do not assume the Cloud Run
  service serves a UI.
- **RAPIDS substrate:** `artifacts/rapids-substrate` is a separate FastAPI/uvicorn
  service (port 8000, root-path `/rapids`). It is a subordinate compute service, not
  the governance API.
- Both run in parallel under the Replit run button (see `.replit` workflows).

## Run & Operate

- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the governance API
- `pnpm --filter @workspace/pathfinder run dev` — Pathfinder frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

### Required env

- `DATABASE_URL` — Postgres connection string
- `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini integration (fails loudly if unset)
- `OPERATOR_TOKEN` — bearer token gating all write endpoints. **Fails closed in production if unset** (writes return 503). Unset in dev = writes allowed with a loud warning.
- `NVIDIA_API_KEY` (optional) — enables the NVIDIA inference adapter; falls back to Gemini when absent.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind, shadcn/ui, Recharts, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)
- Compute substrate: FastAPI + (target) NVIDIA RAPIDS cuDF/cuML/cuGraph

## Architecture (8-layer pipeline)

```
AETHER → HERMES → RAPIDS → SIMON → JEMMA → DELTA[not built] → OCTAGON → CRYSTAL BRIDGE
```

The operator is the final decision authority at the CRYSTAL BRIDGE. See `docs/architecture.md`.

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle tables (authorities, doctrine, memory, routing, scenarios, sovereign, workflows)
- `artifacts/api-server/src/routes/` — Express handlers (one file per domain)
- `artifacts/api-server/src/middlewares/operatorAuth.ts` — write-gate auth
- `lib/integrations-gemini-ai/` — the ONE Gemini client (the dead `lib/integrations/` duplicate was removed)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- **Reality-first data contracts** (`.agents/memory/pathfinder-reality-first.md`): no
  fabrication anywhere. Unavailable data → `null` + `dataQuality[field]: "unavailable"`.
  Never `Math.random()`, never a typical value. The RAPIDS degraded path returns an
  explicit `status: "error"` envelope with all numeric fields nulled — it is NOT presented
  as `ready`.
- **Context custody law** (`.agents/memory/context-custody-law.md`): a packet's domain is
  set by AETHER and is immutable downstream. Build downstream request bodies from the
  packet, never from UI session state.
- **Operator authorization at the HTTP boundary**: all state-mutating endpoints
  (memory, doctrine, workflows, scenarios, sovereign, authorities) sit behind
  `operatorAuth`. Reads stay open (dashboards + "Remove Rod" stranger test). Stateless
  compute routes (gemini, spectra, observe, aether, routing) are ungated — they persist nothing.
- **Local-first routing engine**: `/api/routing` scores queries deterministically — no LLM call for the routing decision itself.
- **OpenAPI contract-first**: types flow openapi.yaml → codegen → hooks + Zod. Never hand-write codegen types.
- **Single API server for all artifacts**: shared `api-server` serves all `/api` routes.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Drizzle array columns: `text("col").array()`, not `array(text("col"))`
- `executionMode` in `workflow_steps` maps to `execution_mode` in the DB
- Sovereign audit POST is fail-honest: absent fields → `PENDING`/`false`/`ALIGNED`, never auto-`APPROVED`
- Writes require `Authorization: Bearer $OPERATOR_TOKEN`

## GitHub Sync

- **Remote**: `origin https://github.com/rodlife1314-star/governance.git`
- **Auth**: `GITHUB_TOKEN` secret (classic PAT, `repo` scope) via `git credential.helper store`
- **Push**: `git push origin main` after any checkpoint
- Repo was originally `octagon-augment`, renamed to `governance`; both URLs redirect.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
