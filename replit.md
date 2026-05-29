# OCTAGON

A local-first operator assistant architecture for competition demonstration — helping Rod plan, organize, retrieve, and execute real operational workflows while preserving sovereignty and architectural clarity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from env)
- `pnpm --filter @workspace/octagon run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind, shadcn/ui, Recharts, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (memory, doctrine, workflows, routing, scenarios)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/octagon/src/` — React frontend (pages + components)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not edit)

## Architecture decisions

- **Local-first routing engine**: The `/api/routing` POST endpoint evaluates queries using a scoring algorithm based on signal keywords, query length, and context. Scores are deterministic — no external LLM call needed for the routing decision itself.
- **OpenAPI contract-first**: All types flow from `openapi.yaml` → codegen → typed hooks (client) + Zod schemas (server). Never hand-write types that codegen produces.
- **Markdown doctrine as source of truth**: The doctrine system is designed so human-readable rules always take precedence over inferred behavior. JSON governance is machine-readable layer on top.
- **Array fields in Postgres**: Tags and steps use native `text[]` columns via Drizzle's `.array()` method.
- **Single API server for all artifacts**: The shared `api-server` artifact serves all backend routes under `/api`.

## Product

OCTAGON has 7 core modules:
1. **SYS_STATUS** — Dashboard with live system metrics, routing distribution chart, and recent activity feed
2. **MEMORY_BANK** — Browse, search, tag-filter, create, and edit markdown-style memory entries
3. **DOCTRINE** — Manage governance rules with priority ordering, scope (local/cloud/hybrid), conditions, and active toggle
4. **WORKFLOWS** — Operational workflow tracking with per-step execution mode (local/cloud/hybrid) and status
5. **ROUTING** — Interactive routing evaluator: enter a query, see local vs cloud scores and reasoning, browse decision history
6. **SCENARIOS** — Competition demo scenarios with steps and status management (draft/ready/running/completed)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Array columns in Drizzle: use `text("col").array()`, not `array(text("col"))`
- Routing engine is deterministic (no LLM call) — scores are computed via keyword signals and query length heuristics
- The `executionMode` column in `workflow_steps` is stored as `execution_mode` in the DB (Drizzle camelCase mapping)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
