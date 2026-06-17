# PATHFINDER APERTURE — DEPLOYMENT
> How it is instantiated · Runtime environments
> See `docs/architecture.md` for the layer architecture.

---

## Current Environment — Replit

The canonical development and demonstration environment runs on Replit.

**Services:**

| Service | Command | Port |
|---------|---------|------|
| API Server | `pnpm --filter @workspace/api-server run dev` | `$PORT` (env) |
| Pathfinder Frontend | `pnpm --filter @workspace/pathfinder run dev` | `$PORT` (env) |
| OCTAGON Frontend | `pnpm --filter @workspace/octagon run dev` | `$PORT` (env) |

**Required environment variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Google AI for SIMON analysis
- `SESSION_SECRET` — Express session signing

**Proxy routing:** The shared reverse proxy routes all services by path. The API server handles `/api/*`. Frontends handle their respective base paths.

---

## Database

PostgreSQL via Drizzle ORM.

**Schema packages:** `@workspace/db`

**Push schema changes (dev only):**
```bash
pnpm --filter @workspace/db run push
```

**Seed authority registry:**
```bash
pnpm --filter @workspace/scripts run seed:authorities
```

**Tables:**
- `domain_authorities` — registered governing bodies per domain
- `data_sources` — registered data feeds per domain
- `audit_records` — immutable sealed observations (OCTAGON archive)
- `memory_entries` — MEMORY_BANK entries
- `doctrine_rules` — DOCTRINE governance rules
- `workflows` — operational workflow tracking
- `routing_decisions` — ROUTING history
- `scenarios` — competition demo scenarios

---

## Target Environment — Google Cloud Platform

**Target runtime:** Cloud Run (containerized, serverless)

**Architecture:**

```
Cloud Run (API Server)
   ↑
Firebase (Persistence Layer)
   ├── Google Authentication
   ├── Firestore (session data, workspace history)
   └── Offline cache fallback

Cloud Run (Pathfinder Frontend)
   ↑
NVIDIA RAPIDS (Structural Resolution)
   ├── cuDF  — GPU DataFrame operations
   ├── cuML  — GPU machine learning
   └── cuGraph — GPU graph analytics
```

**Firebase multi-session features (planned):**
- Google Authentication — operator identity
- Firestore persistence — session save/load
- Offline cache fallback — field operation continuity
- Workspace history — full session trail

---

## Substrate Delta Layer

Pathfinder is designed to operate across multiple environments without architectural change.

| Environment | Status | Purpose |
|-------------|--------|---------|
| Replit | Active | Development and governance source |
| Google AI Studio | Active | Delta layer experiment (The Tree) |
| Cloud Run | Planned | Production deployment |
| Local Runtime | Supported | Operator field use |

Each environment discovery becomes an auditable rule in the acquisition ledger. Platform constraints are doctrine, not bugs.

---

## Build

```bash
# Full typecheck (libs + leaf packages)
pnpm run typecheck

# Build all packages
pnpm run build

# Typecheck a specific artifact
pnpm --filter @workspace/pathfinder run typecheck

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## GitHub Sync

The governance repository syncs to GitHub as the authoritative source of record.

```
Remote: https://github.com/rodlife1314-star/governance.git
Branch: main
```

Push after each checkpoint:
```bash
git push "https://rodlife1314-star:${GITHUB_TOKEN}@github.com/rodlife1314-star/governance.git" main
```
