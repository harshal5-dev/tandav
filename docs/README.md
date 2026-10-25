# Tandav — Documentation Index

Read in this order:

| # | Document | Purpose | Read when |
|---|---|---|---|
| 1 | [01-domain-knowledge.md](01-domain-knowledge.md) | Complete domain primer: durable execution, event sourcing, replay, determinism, activities, timers, signals, sagas, industry landscape, interview angles | **Before any code** |
| 2 | [02-phase-1-system-design.md](02-phase-1-system-design.md) | Phase 1 ("The Monolith") full design: architecture, API, data model, SDK contract, testing, build order, ADRs, Definition of Done | Before building P1 |
| 3 | [03-roadmap-phase-2-3.md](03-roadmap-phase-2-3.md) | Upcoming phases: gRPC, NATS, webhooks, WebSocket dashboard, sharding, HA, observability, versioning | When P1 DoD is green |

## Conventions

- Documents are **living**: when implementation deviates, update the doc in the same commit.
- Decisions use **ADR-lite** tables (see `02-phase-1-system-design.md` §13) — every choice records its rejected alternative.
- Diagrams are **Mermaid** (rendered natively by GitHub) — sources live in the docs, never screenshots-only.
- The learning journal and concept ledger live in `../journal/` (created with Phase 1 kickoff).

## Status Board

| Phase | Design | Implementation |
|---|---|---|
| P1 — The Monolith | ✅ Draft v1 | ⏳ not started |
| P2 — The Dance Spreads | 🗺️ Roadmap only | ⏳ |
| P3 — The Eternal Dance | 🗺️ Roadmap only | ⏳ |
