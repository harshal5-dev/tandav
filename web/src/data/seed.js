import { JOB_TYPES, JOB_TYPE_LIST, ERROR_POOL, pick, randInt, randId, uuid } from './jobTypes'

/**
 * Deterministic PRNG (mulberry32) — the same seed on every reload keeps the
 * demo dataset stable across refreshes, which makes screenshots & demos
 * reproducible. Live simulation adds randomness on top after load.
 */
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20260830)
const rpick = (arr) => arr[Math.floor(rng() * arr.length)]
const rint = (min, max) => Math.floor(rng() * (max - min + 1)) + min
const MIN = 60_000

export const WORKERS_SEED = [
  {
    id: 'wk-rudra-01',
    name: 'wk-rudra-01',
    region: 'ap-south-1',
    status: 'online',
    version: 'v1.0.3',
    concurrency: 12,
    jobsProcessed: 0,
    jobsFailed: 0,
    startedAt: Date.now() - 14 * 24 * 3600_000 - 5 * 3600_000,
    cpu: 41,
    mem: 58,
    memMb: 598,
  },
  {
    id: 'wk-nataraja-02',
    name: 'wk-nataraja-02',
    region: 'ap-south-1',
    status: 'online',
    version: 'v1.0.3',
    concurrency: 12,
    jobsProcessed: 0,
    jobsFailed: 0,
    startedAt: Date.now() - 6 * 24 * 3600_000 - 2 * 3600_000,
    cpu: 22,
    mem: 35,
    memMb: 361,
  },
  {
    id: 'wk-shakti-03',
    name: 'wk-shakti-03',
    region: 'eu-west-1',
    status: 'online',
    version: 'v1.0.2',
    concurrency: 8,
    jobsProcessed: 0,
    jobsFailed: 0,
    startedAt: Date.now() - 2 * 24 * 3600_000 - 9 * 3600_000,
    cpu: 67,
    mem: 72,
    memMb: 743,
  },
  {
    id: 'wk-kalagni-04',
    name: 'wk-kalagni-04',
    region: 'us-east-1',
    status: 'draining',
    version: 'v1.0.2',
    concurrency: 8,
    jobsProcessed: 0,
    jobsFailed: 0,
    startedAt: Date.now() - 31 * 24 * 3600_000,
    cpu: 12,
    mem: 28,
    memMb: 289,
  },
]

function typeMeta(t) {
  return JOB_TYPES[t]
}

function durationFor(t) {
  const [lo, hi] = typeMeta(t).avgMs
  return rint(lo, hi)
}

function scheduleFor(t) {
  if (t === 'cleanup_expired') {
    return { mode: 'cron', cronExpr: rpick(['0 */6 * * *', '30 3 * * *', '*/15 * * * *']) }
  }
  const roll = rng()
  if (roll < 0.6) return { mode: 'immediate', cronExpr: null, runAtOffset: 0 }
  if (roll < 0.85) return { mode: 'delayed', cronExpr: null, runAtOffset: rint(2, 45) * MIN }
  return { mode: 'cron', cronExpr: rpick(['0 9 * * mon', '0 */2 * * *', '0 0 1 * *']) }
}

/** Build one seeded job in the given status, with a consistent attempt history. */
function makeJob({ status, createdAgoMin, forcedType }) {
  const type = forcedType ?? rpick(JOB_TYPE_LIST)
  const meta = typeMeta(type)
  const id = uuid()
  const now = Date.now()
  const createdAt = now - createdAgoMin * MIN
  const sched = scheduleFor(type)
  const maxRetries = rpick([3, 5, 5, 8])
  const runAt = createdAt + (sched.runAtOffset || 0)

  const job = {
    id,
    type,
    payload: meta.payload(),
    status,
    priority: rpick([1, 3, 5, 5, 5, 7, 9]),
    scheduleMode: sched.mode,
    cronExpr: sched.cronExpr,
    runAt,
    maxRetries,
    attempt: 0,
    idempotencyKey: rng() < 0.35 ? `${type.split('_')[0]}-${randId()}` : null,
    lockedBy: null,
    lockedAt: null,
    lastError: null,
    progress: null,
    durationMs: null,
    createdAt,
    updatedAt: createdAt,
    workerId: null,
    runs: [],
    deadAt: null,
    nextRetryAt: null,
  }
  return job
}

function addRun(job, { status, worker, error = null, durMs }) {
  const startedAt = job.updatedAt
  const finishedAt = startedAt + durMs
  job.runs.push({
    id: job.runs.length + 1,
    attempt: job.attempt,
    workerId: worker,
    workerName: worker,
    startedAt,
    finishedAt,
    status,
    error,
    durationMs: durMs,
  })
  job.updatedAt = finishedAt
  return finishedAt
}

const onlineWorkers = WORKERS_SEED.filter((w) => w.status === 'online').map((w) => w.id)

/** A believable attempt history for finished/in-flight jobs. */
function simulateHistory(job) {
  const meta = typeMeta(job.type)
  const worker = () => rpick(onlineWorkers)

  if (job.status === 'SUCCEEDED') {
    const attempts = rng() < 0.82 ? 1 : rint(2, 3)
    for (let i = 0; i < attempts - 1; i++) {
      job.attempt += 1
      addRun(job, { status: 'FAILED', worker: worker(), error: rpick(ERROR_POOL), durMs: durationFor(job.type) })
    }
    job.attempt += 1
    job.durationMs = durationFor(job.type)
    addRun(job, { status: 'SUCCEEDED', worker: worker(), durMs: job.durationMs })
    job.workerId = job.runs.at(-1).workerId
    return
  }

  if (job.status === 'FAILED' || job.status === 'RETRYING') {
    const attempts = job.status === 'RETRYING' ? rint(1, job.maxRetries) : 0
    for (let i = 0; i < attempts; i++) {
      job.attempt += 1
      addRun(job, { status: 'FAILED', worker: worker(), error: rpick(ERROR_POOL), durMs: durationFor(job.type) })
    }
    job.lastError = attempts > 0 ? job.runs.at(-1).error : null
    if (job.status === 'RETRYING') {
      job.nextRetryAt = Date.now() + rint(3, 9) * 1000
    }
    return
  }

  if (job.status === 'DEAD') {
    const attempts = job.maxRetries + 1
    for (let i = 0; i < attempts; i++) {
      job.attempt += 1
      addRun(job, { status: 'FAILED', worker: worker(), error: rpick(ERROR_POOL), durMs: durationFor(job.type) })
    }
    job.lastError = job.runs.at(-1).error
    job.deadAt = job.updatedAt
    return
  }

  if (job.status === 'RUNNING') {
    job.attempt = rng() < 0.8 ? 1 : rint(2, 3)
    for (let i = 1; i < job.attempt; i++) {
      addRun(job, { status: 'FAILED', worker: worker(), error: rpick(ERROR_POOL), durMs: durationFor(job.type) })
    }
    job.attempt += 0
    job.runs.push({
      id: job.runs.length + 1,
      attempt: job.attempt,
      workerId: (job.lockedBy = rpick(onlineWorkers)),
      workerName: job.lockedBy,
      startedAt: job.updatedAt,
      finishedAt: null,
      status: 'RUNNING',
      error: null,
      durationMs: null,
    })
    job.workerId = job.lockedBy
    job.lockedAt = job.updatedAt
    job.progress = job.type === 'long_task' ? rint(15, 85) : null
    return
  }

  if (job.status === 'CANCELED') {
    job.attempt = rng() < 0.7 ? 0 : 1
    if (job.attempt === 1) {
      addRun(job, { status: 'FAILED', worker: worker(), error: 'canceled by operator before dispatch', durMs: rint(200, 900) })
    }
    job.lastError = null
    return
  }
  // PENDING / QUEUED — untouched
}

/** The seeded dataset: a healthy mixed fleet of ~48 jobs. */
export function createInitialJobs() {
  const plan = [
    ['SUCCEEDED', 26],
    ['PENDING', 4],
    ['QUEUED', 3],
    ['RUNNING', 3],
    ['RETRYING', 3],
    ['FAILED', 1],
    ['DEAD', 4],
    ['CANCELED', 2],
  ]
  const jobs = []
  for (const [status, count] of plan) {
    for (let i = 0; i < count; i++) {
      const createdAgoMin = status === 'SUCCEEDED' ? rint(4, 55) : rint(1, 30)
      const job = makeJob({ status, createdAgoMin })
      simulateHistory(job)
      // future-dated PENDING for delayed jobs
      if (status === 'PENDING' && job.scheduleMode === 'delayed') {
        job.runAt = Date.now() + rint(2, 40) * MIN
      }
      jobs.push(job)
    }
  }
  // guarantee at least one of each hero type in a terminal/active state
  const long = makeJob({ status: 'RUNNING', createdAgoMin: 1, forcedType: 'long_task' })
  simulateHistory(long)
  long.progress = 64
  jobs.push(long)

  const flakyDead = makeJob({ status: 'DEAD', createdAgoMin: 22, forcedType: 'flaky_job' })
  simulateHistory(flakyDead)
  jobs.push(flakyDead)

  return jobs.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Worker seed + historical counters. */
export function createWorkers() {
  return WORKERS_SEED.map((w, i) => ({
    ...w,
    jobsProcessed: 1800 + i * 617 + rint(0, 250),
    jobsFailed: 40 + i * 13 + rint(0, 30),
    lastHeartbeat: Date.now() - (w.status === 'online' ? rint(1, 9) * 1000 : rint(40, 180) * 1000),
  }))
}

/** Initial live-event feed, newest first. */
export function createInitialEvents(jobs) {
  const events = []
  const recent = [...jobs]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 14)
  for (const job of recent) {
    const kind =
      job.status === 'SUCCEEDED'
        ? 'SUCCEEDED'
        : job.status === 'DEAD'
          ? 'DEAD'
          : job.status === 'RUNNING'
            ? 'RUNNING'
            : job.status === 'RETRYING'
              ? 'RETRY_SCHEDULED'
              : 'CREATED'
    events.push({ id: uuid(), jobId: job.id, jobType: job.type, kind, attempt: job.attempt, ts: job.updatedAt })
  }
  return events
}

/** Throughput buckets: last 30 minutes, succeeded vs failed. */
export function createThroughput() {
  const out = []
  const now = Date.now()
  for (let i = 29; i >= 0; i--) {
    const t = now - i * MIN
    const wave = Math.sin((i / 30) * Math.PI * 1.4) * 18
    const succeeded = Math.max(4, Math.round(34 + wave + rint(-6, 8)))
    const failed = Math.max(0, Math.round(succeeded * (0.04 + rng() * 0.07)))
    out.push({ t, label: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), succeeded, failed })
  }
  return out
}
