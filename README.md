# Tandav

> *Creation. Preservation. Destruction. On beat.*

In Hindu cosmology, the Tandav is Shiva's cosmic dance — the eternal cycle of creation, preservation, and destruction that sustains the universe. Tandav keeps your background jobs in that rhythm: created, executed, completed — millions of times over, never missing a beat.

**Tandav is a durable workflow engine written in Go**, inspired by [Temporal](https://temporal.io). Write long-running business processes — payment sagas, subscription billing, provisioning pipelines — as plain Go code; Tandav guarantees they survive crashes, retry failures, honor timers, and remain fully auditable.

*Like the Nataraja dancing unburned within the ring of fire: workflows born in Tandav endure every failure the distributed world throws at them — and complete their rhythm.*

---

## Why

Long-running processes (order fulfillment, KYC onboarding, media pipelines) fail in the real world: services crash, networks partition, APIs time out. The usual fixes — cron + status columns, in-memory orchestrators — lose work, double-charge cards, and make every deploy dangerous.

Tandav's answer is **durable execution**:

- **Event sourcing + replay** — every step is an append-only event; state is reconstructed by replaying history, so crashes cost nothing
- **Deterministic workflow code** — side effects live in retried **activities**; the choreography replays, beat for beat
- **Durable timers** — `workflow.Sleep(24h)` survives restarts without holding memory
- **Signals & queries** — the outside world reaches into running workflows safely
- **Full history** — "what happened to workflow X?" is always answerable

Read the full primer: **[docs/01-domain-knowledge.md](docs/01-domain-knowledge.md)**.

## Status

🔨 **Phase 1 — design complete, pre-coding.** See the roadmap below.

| Phase | Name | Shape | Status |
|---|---|---|---|
| **P1** | The Monolith | One Go binary + Postgres + Go SDK + dashboard | 📐 Designed → building next |
| **P2** | The Dance Spreads | gRPC worker protocol · NATS queues · webhooks · WebSocket dashboard · API gateway | 🗺️ [Roadmap](docs/03-roadmap-phase-2-3.md) |
| **P3** | The Eternal Dance | History sharding · HA · observability · rate limiting · workflow versioning | 🗺️ [Roadmap](docs/03-roadmap-phase-2-3.md) |

## Architecture (target shape, Phase 2)

```
Client / web dashboard ──► API gateway (JWT · rate limit) ──► Frontend ──► History (event store)
                                                        └──► Matching (task queues) ◄──► Worker fleet (gRPC)
                                                                     │
                                                        NATS events · webhooks · WebSocket live view
```

Phase 1 runs all four engine roles (Frontend · History · Matching · Worker) in one binary against PostgreSQL — the same seams, in-process. Details: **[docs/02-phase-1-system-design.md](docs/02-phase-1-system-design.md)**.

## Repository Layout

```
tandav/
├── cmd/            # tandav-engine · tandav-demo (P1)
├── sdk/            # Go SDK for workflow authors: workflow/ activity/ worker/
├── internal/       # domain · history · matching · timers · store · httpapi
├── migrations/     # SQL schema
├── examples/       # order saga · subscription billing (the showcases)
├── web/            # React dashboard (Vite + Tailwind)
├── docs/           # design documents (start here)
└── journal/        # learning journal + concept ledger
```

## Documentation

| Document | What it is |
|---|---|
| [docs/01-domain-knowledge.md](docs/01-domain-knowledge.md) | **The complete domain primer** — durable execution, event sourcing, replay, determinism, sagas, industry landscape |
| [docs/02-phase-1-system-design.md](docs/02-phase-1-system-design.md) | **Phase 1 design** — architecture, API, data model, SDK contract, build order, ADRs, DoD |
| [docs/03-roadmap-phase-2-3.md](docs/03-roadmap-phase-2-3.md) | **Upcoming phases** — gRPC, NATS, webhooks, sharding, HA, observability |

## Getting Started

*Prerequisites: Go 1.22+, Docker (for Postgres), Node 20+ (for `web/`).*

```bash
# coming with Phase 1 implementation:
make migrate      # apply SQL migrations
make run          # start the engine + in-process worker
make demo         # run the order-saga showcase
make test         # unit + golden-history replay + crash-recovery tests
```

## The Showcase (Phase 1 exit demo)

An **order saga** — `charge payment → reserve inventory → ship` with compensation — where the engine is SIGKILLed mid-saga and, on restart, resumes and completes with **zero duplicate side effects**. Watch it in the `web/` dashboard.

## Development Philosophy

This project is also a deep-learning vehicle for Go and distributed systems:

1. **Design docs first** — everything in `docs/` is written and reviewed before code
2. **Three-pass features** — make it work → open the hood (stdlib/source) → deepen (toy version, race test, contrast)
3. **Toy before tool** — hand-rolled routers, JSON-RPC, and in-process queues before adopting frameworks
4. **No unexplainable code** — every line is interview-explainable
5. **Journal + concept ledger** — documented learning in `journal/`

## Name

**Tandav** — the cosmic dance that sustains the universe through creation, preservation, and destruction: the exact lifecycle of a workflow. The engine's timer subsystem is called **damaru** (शिव's drum that sets the rhythm of creation). The dance replays; the drumbeat stays recorded.

## License

See [LICENSE](LICENSE).
