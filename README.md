# PATHFINDER APERTURE
### Structure at velocity. Sovereignty at the center.

Pathfinder Aperture is a cognitive telemetry architecture designed to transform high-volume data into traceable, operator-governed understanding.

It separates structural resolution from interpretation, governance, and action. Rather than treating intelligence as a single process, Pathfinder decomposes cognition into specialized layers that operate under evidence, challenge, and governance constraints.

---

## Core Principle

Raw data is not intelligence.

Data becomes useful only when:

1. Structure is identified
2. Evidence is grounded
3. Interpretations are challenged
4. Governance rules are enforced
5. The operator authorizes action

Pathfinder exists to make that process explicit and traceable.

---

## Architecture

```
AETHER          map uncertainty before assumptions form
   ↓
HERMES          ground claims to traceable sources
   ↓
RAPIDS          resolve structural patterns at speed
   ↓
SIMON           interpret verified structure
   ↓
JEMMA           challenge assumptions, surface contradictions
   ↓
DELTA           measure acquisition and internalization  [not yet built]
   ↓
OCTAGON         enforce governance and authority requirements
   ↓
CRYSTAL BRIDGE  controlled dispatch — operator authorization required
```

No subsystem holds authority. The operator is the final decision authority.

---

## Status

**Active Development**

| Domain | Live | Data Feeds |
|--------|------|-----------|
| Finance | ✓ | BTC/USD · Gold · NASDAQ · Dow · Silver |
| Medicine | Standby | Authority registry seeded |
| Law | Standby | Authority registry seeded |
| IT / Applied Sciences | Standby | Authority registry seeded |
| Astrophysics | Standby | Authority registry + 8 data sources defined |

---

## Run

```bash
# Install
pnpm install

# API server
pnpm --filter @workspace/api-server run dev

# Pathfinder frontend
pnpm --filter @workspace/pathfinder run dev

# Push DB schema (dev only)
pnpm --filter @workspace/db run push

# Seed authority registry
pnpm --filter @workspace/scripts run seed:authorities

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

**Required env:** `DATABASE_URL` (PostgreSQL connection string)

---

## Stack

Node 24 · TypeScript 5.9 · React + Vite · Express 5 · PostgreSQL + Drizzle ORM · Tailwind · shadcn/ui

**Target acceleration layer:** NVIDIA RAPIDS (cuDF · cuML · cuGraph) — structural resolution pipeline

---

## Documentation

| Doc | Question it answers |
|-----|-------------------|
| [`docs/philosophy.md`](docs/philosophy.md) | Why does this exist? (spatial cognition + doctrine precedes technology) |
| [`docs/architecture.md`](docs/architecture.md) | How does it work? (all 8 layers) |
| [`docs/doctrine.md`](docs/doctrine.md) | What laws govern it? (8 foundational laws) |
| [`docs/vocabulary.md`](docs/vocabulary.md) | What do the terms mean? (single source of truth) |
| [`docs/rapids.md`](docs/rapids.md) | How is structure resolved? |
| [`docs/simon.md`](docs/simon.md) | How is structure interpreted? |
| [`docs/octagon.md`](docs/octagon.md) | How is authority enforced? |
| [`docs/deployment.md`](docs/deployment.md) | How is it instantiated? |
| [`docs/alice-handshake.md`](docs/alice-handshake.md) | Context for external AI co-pilots |
| [`docs/jemma-handshake.md`](docs/jemma-handshake.md) | Context for The Tree experiment |

Recommended reading order for newcomers: philosophy → architecture → doctrine → vocabulary

---

*Repo: `rodlife1314-star/governance`*
