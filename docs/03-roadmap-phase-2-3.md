# Tandav — Roadmap: Phase 2 & Phase 3

> What comes after the monolith, and why each phase unlocks when it does. Phases are earned, not scheduled: a phase starts only when the previous phase's Definition of Done is green.
> See also: [01-domain-knowledge.md](01-domain-knowledge.md) · [02-phase-1-system-design.md](02-phase-1-system-design.md)

---

## The Arc In One Table

| | Phase 1 — The Monolith | Phase 2 — The Dance Spreads | Phase 3 — The Eternal Dance |
|---|---|---|---|
| **Shape** | One binary + Postgres | Engine + worker fleet + events | HA, sharded, observable |
| **Go power** | event sourcing, replay, goroutines | gRPC, messaging, distributed workers | partitioning, ops, scale |
| **New tech** | net/http, SQL, slog | **gRPC, NATS, WebSocket, webhooks** | metrics, tracing, rate limiting |
| **Companies this signals** | any Go backend team | Temporal, Inngest, Grafana | infra/platform teams at scale |
| **Demo** | order saga in dashboard | live multi-worker dashboard + webhook consumer | chaos demo: kill nodes under load |

---

## Phase 2 — "The Dance Spreads" (≈ 5–6 weeks)

**Theme:** turn the monolith's in-process seams into real distributed components. Everything you build here was *designed* in P1 — this is extraction, not redesign.

### P2.1 — Network the worker protocol (gRPC)

- Convert `internal/matching`'s Poll/Ack/Heartbeat interface into a **protobuf contract** + gRPC server
- `tandav-worker` becomes a **separate binary** importing the SDK, connecting over gRPC
- Learn: protobuf contracts, codegen, gRPC streaming (worker poll = server-stream), deadlines, interceptors (auth, logging), connection retry/backoff
- **Toy version first** (our method): hand-roll a JSON-over-HTTP poll/ack before generating the protobuf — feel why contracts exist

### P2.2 — Distributed task queues (NATS)

- Matching dispatches tasks via **NATS** (JetStream) instead of in-process channels
- Worker fleet: multiple `tandav-worker` processes (docker-compose: 3 replicas) competing for leases
- Learn: at-least-once delivery in practice, ack/nak semantics, backpressure, consumer groups, poison-message handling
- Keep the DB as source of truth — NATS is transport, not storage (the outbox pattern: events committed with state, published after — P3 tightens this)

### P2.3 — Event fan-out (the engine becomes event-driven for the world)

- Every history event streams to NATS subject `tandav.events.<type>` (`workflow.started`, `activity.failed`, ...)
- Other services subscribe — the engine emits **domain events** like a good citizen
- Learn: event taxonomy design, schema evolution, fan-out at-least-once + dedup on the consumer side

### P2.4 — Webhooks (out + in)

- **Outbound:** subscription API (`POST /v1/webhooks` with URL + secret + event filters); milestone delivery with retries + exponential backoff + **HMAC signatures** + dead-letter visibility
- **Inbound:** `POST /v1/hooks/{source}` receivers → verified payload → `Signal` into a running workflow (Stripe-payment-succeeded → `payment.confirmed` signal). Uses `signals_inbox.dedup_key` for inbound idempotency
- Learn: webhook security (signature verification, replay protection), exactly-once effects at the boundary

### P2.5 — Live dashboard (WebSocket) + API gateway

- `web/` upgrades: **WebSocket** live execution view (history streaming in as it happens), queue depth meters, worker fleet status
- **API gateway layer** in front of the engine: JWT auth (replacing the static token), rate limiting, routing, `/v1` versioning — your `web/` and external clients both enter through it
- Learn: WS connection lifecycle + fan-out + backpressure; gateway middleware chains

### P2 exit criteria
- [ ] 3+ workers on a NATS-backed queue complete a 1000-execution load test with zero lost work
- [ ] Kill 1 of 3 workers mid-activity → lease expiry → another worker finishes (demonstrated live in dashboard)
- [ ] Webhook consumer receives signed, retried, deduped notifications; inbound webhook signals a waiting workflow
- [ ] gRPC contract documented (`proto/tandav/v1/*.proto`); toy-HTTP version archived in `examples/`
- [ ] Explain-test: "how does a task travel from API to worker and back?" — whiteboard the P2 data flow

---

## Phase 3 — "The Eternal Dance" (≈ 5–6 weeks)

**Theme:** the hard parts of real distributed systems — scale, failure, and observability. This is the interview-deep phase.

### P3.1 — History sharding & scale

- Shard workflow histories across Postgres partitions by `workflow_id` hash (or one store per shard)
- Timer ownership per shard; avoid hot-shard workflow IDs
- Learn: partitioning strategies, rebalancing, why Temporal shards histories, connection pooling at scale
- Optional: archive completed histories to object storage (S3/MinIO) + compaction

### P3.2 — High availability

- Multiple engine replicas behind the gateway; leadership per shard for scanners (timers/reclaim)
- Learn: leader election vs lease-based ownership, split-brain avoidance, graceful failover (Kleppmann ch. 5–9 live here)

### P3.3 — Observability (the "design Datadog" muscle)

- **Metrics** (Prometheus): task latency histograms, schedule-to-start lag, backlog depth, retry rate, error budget
- **Tracing** (OpenTelemetry): span per workflow → activity chain across services
- **Structured audit**: every execution fully reconstructable from logs + history
- Learn: RED/USE methods, exemplars, tracing propagation over gRPC/NATS

### P3.4 — Rate limiting & quotas

- Per-queue dispatch throttling; per-tenant start-rate limits; fairness policies
- Learn: token bucket vs sliding window, backpressure propagation, load shedding

### P3.5 — Workflow versioning & patching

- `workflow.GetVersion(ctx, "added-refund-step", min, max)` semantics: running executions complete on old code, new ones take the new path
- Learn: the hardest real-world engine problem — evolving long-running processes without breaking in-flight ones

### P3 exit criteria
- [ ] Load test: 10k concurrent workflows, engine survives node loss mid-test
- [ ] Chaos demo: SIGKILL engine + workers + NATS mid-saga → system self-heals → saga completes (recorded demo!)
- [ ] Prometheus dashboards + alerts for backlog, lease expiries, nondeterminism errors
- [ ] Version-patched workflow migrates in-flight executions safely (test suite proves it)
- [ ] Explain-test: "Design a durable workflow engine" — 30-minute whiteboard, interview-ready

---

## Stretch Goals (any phase, as energy allows)

| Goal | Why |
|---|---|
| **Sidecar demo apps** — a payment service + email service (in `examples/`) so activities call *real* HTTP services | Makes the saga demo honest |
| **Temporal compatibility layer** — implement a slice of Temporal's Go SDK API so real Temporal samples run on Tandav | The ultimate "I understand this domain" flex |
| **OpenTelemetry-native demo** — trace a workflow end-to-end with spans | Portfolio screenshot gold |
| **Blog series** — one post per phase ("How I built a workflow engine in Go") | Turns the journal into career capital |
| **Benchmarks vs Temporal** — throughput numbers on the same hardware | Honest engineering write-up |

---

## What Stays Constant Across All Phases (the learning method)

1. **Design doc first** — update `docs/` before building a phase
2. **Three-pass features** — make it work → open the hood → deepen (toy version, race test, or contrast)
3. **Journal + concept ledger** — `journal/` entries for every new concept; status 🟡 → 🟠 → 🟢
4. **The explain test** — 5-minute whiteboard at each phase exit
5. **No unexplainable code** — interview insurance, enforced at every commit

## Suggested Study Order Alongside (JIT, not front-loaded)

| When | Read |
|---|---|
| Before P1 coding | *The Go Programming Language* ch. 1–5 |
| During P1 (weeks 3–7) | Temporal docs: *Workflows*, *Activities*, *Server architecture* |
| During P2 | gRPC docs; NATS JetStream docs; Kleppmann ch. 4 (Replication) |
| During P3 | Kleppmann ch. 5 (Partitioning), 7 (Transactions), 8–9 (Distributed trouble); *System Design Interview* (Alex Xu) ch. on real systems |

---

*The dance was never about one dancer. P2 adds dancers; P3 ensures the dance never stops.*
