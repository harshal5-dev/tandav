# Tandav Dashboard (web/)

The React dashboard for **Tandav** — the distributed job scheduler. Live view of jobs, retries,
the dead-letter queue, worker fleet health, and job submission.

Built with **JavaScript** (no TypeScript):

| Concern | Choice |
|---|---|
| Build | Vite + React 19 |
| UI | shadcn/ui-style components (`src/components/ui`) on Radix primitives + Tailwind CSS |
| Routing | react-router-dom v6 |
| State | Redux Toolkit (`src/store`) |
| Charts | recharts |
| Icons | lucide-react |
| Toasts | sonner |

## Run it

```bash
cd web
npm install
npm run dev       # http://localhost:5173
npm run build     # production bundle in dist/
```

## What you'll see

The dashboard runs entirely on **mock data** with a simulated realtime engine
(`src/store/realtime.js`) that stands in for the WebSocket feed from the system design:

- A seeded fleet of ~50 jobs across every state (PENDING → QUEUED → RUNNING → SUCCEEDED / FAILED
  → RETRYING → DEAD), with consistent attempt histories — reload-stable via a fixed PRNG seed.
- A tick engine that advances the job state machine every ~2.4s: dispatches due jobs, starts
  work on workers, streams progress for `long_task`, fails `flaky_job` ~50%, applies
  exponential-backoff retries, dead-letters exhausted jobs, and occasionally simulates a
  worker crash with RabbitMQ redelivery.
- All 7 demo handlers from the design (`send_email`, `generate_report`, `process_image`,
  `cleanup_expired`, `http_callback`, `flaky_job`, `long_task`) with realistic payloads.

### Pages

| Route | What |
|---|---|
| `/` | Overview — stat cards, throughput chart, state donut, recent jobs, live event stream |
| `/jobs` | Filterable/searchable job table with pagination |
| `/jobs/:id` | Lifecycle timeline, attempt history (`job_runs`), JSON payload, cancel/requeue actions |
| `/dlq` | Dead-letter queue with one-click requeue |
| `/workers` | Worker fleet cards — heartbeats, CPU/mem, in-flight jobs |
| `/submit` | Job submission form (Now / Delayed / Cron) mirroring `POST /api/v1/jobs` |

The **Live** toggle in the topbar pauses/resumes the simulated event stream.

## Structure

```
src/
├── components/ui/        # shadcn-style primitives (JS): button, card, table, select, dialog…
├── components/layout/    # sidebar + topbar shell
├── components/dashboard/ # stat cards, charts, event feed
├── components/jobs/      # jobs table, status badges, state timeline
├── data/                 # job type metadata + seeded mock dataset
├── store/                # RTK slices (jobs, workers, events, stats) + realtime tick engine
├── hooks/                # realtime simulation driver, theme
└── pages/                # route views
```

When the Go backend lands, swap the tick engine for the real WebSocket (`/ws`) and the
slices for API data — the components are already shaped around the design doc's contracts.
