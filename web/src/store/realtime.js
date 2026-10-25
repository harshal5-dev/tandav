import { jobsPatched, jobsPruned } from './slices/jobsSlice'
import { workersPatched } from './slices/workersSlice'
import { eventsPushed } from './slices/eventsSlice'
import { throughputTicked } from './slices/statsSlice'
import { JOB_TYPES, JOB_TYPE_LIST, ERROR_POOL, pick, randInt, randId, uuid } from '@/data/jobTypes'

/**
 * The realtime engine — simulates the Kafka `job.events` stream that the
 * design doc pipes through the Realtime service into the dashboard over
 * WebSocket. Each tick advances the job state machine exactly like the
 * scheduler/worker fleet would.
 */

function newEvent(job, kind, extra = {}) {
  return { id: uuid(), jobId: job.id, jobType: job.type, kind, attempt: job.attempt, ts: Date.now(), ...extra }
}

function closeRun(job, status, error = null, durMs = 0) {
  const run = job.runs.find((r) => r.status === 'RUNNING')
  if (run) {
    run.status = status
    run.error = error
    run.finishedAt = Date.now()
    run.durationMs = durMs
  }
}

function durFor(type) {
  const [lo, hi] = JOB_TYPES[type].avgMs
  return randInt(lo, hi)
}

function freshJob() {
  const type = pick(JOB_TYPE_LIST)
  const mode = Math.random() < 0.7 ? 'immediate' : 'delayed'
  const now = Date.now()
  return {
    id: uuid(),
    type,
    payload: JOB_TYPES[type].payload(),
    status: 'PENDING',
    priority: pick([1, 3, 5, 5, 5, 7, 9]),
    scheduleMode: mode,
    cronExpr: null,
    runAt: mode === 'immediate' ? now : now + randInt(2, 30) * 60_000,
    maxRetries: pick([3, 5, 5, 8]),
    attempt: 0,
    idempotencyKey: Math.random() < 0.4 ? `${type.split('_')[0]}-${randId()}` : null,
    lockedBy: null,
    lockedAt: null,
    lastError: null,
    progress: null,
    durationMs: null,
    createdAt: now,
    updatedAt: now,
    workerId: null,
    runs: [],
    deadAt: null,
    nextRetryAt: null,
  }
}

export function tickRealtime() {
  return (dispatch, getState) => {
    const state = getState()
    if (state.events.paused) return

    const now = Date.now()
    const jobs = state.jobs.list.map((j) => structuredClone(j))
    const workers = state.workers.list
    const onlineWorkers = workers.filter((w) => w.status === 'online')
    const events = []
    const patches = []
    const prunes = []
    let succeeded = 0
    let failed = 0

    let dispatchedCount = 0
    let startedCount = 0

    for (const job of jobs) {
      switch (job.status) {
        case 'PENDING': {
          if (job.runAt <= now && dispatchedCount < 2) {
            job.status = 'QUEUED'
            job.updatedAt = now
            events.push(newEvent(job, 'QUEUED'))
            dispatchedCount++
          }
          break
        }
        case 'RETRYING': {
          if (job.nextRetryAt && job.nextRetryAt <= now && dispatchedCount < 2) {
            job.status = 'QUEUED'
            job.updatedAt = now
            events.push(newEvent(job, 'QUEUED', { note: 'backoff elapsed — requeued' }))
            dispatchedCount++
          }
          break
        }
        case 'QUEUED': {
          if (startedCount < 3 && Math.random() < 0.75 && onlineWorkers.length) {
            const worker = pick(onlineWorkers)
            job.status = 'RUNNING'
            job.attempt += 1
            job.lockedBy = worker.id
            job.lockedAt = now
            job.workerId = worker.id
            job.progress = job.type === 'long_task' ? 0 : null
            job.updatedAt = now
            job.runs.push({
              id: job.runs.length + 1,
              attempt: job.attempt,
              workerId: worker.id,
              workerName: worker.name,
              startedAt: now,
              finishedAt: null,
              status: 'RUNNING',
              error: null,
              durationMs: null,
            })
            events.push(newEvent(job, 'RUNNING', { worker: worker.name }))
            startedCount++
          }
          break
        }
        case 'RUNNING': {
          // worker crash simulation — unacked message gets redelivered
          if (Math.random() < 0.025) {
            closeRun(job, 'FAILED', 'worker heartbeat lost (30s) — message redelivered by RabbitMQ', 0)
            job.status = 'QUEUED'
            job.lastError = 'worker heartbeat lost — redelivering'
            job.updatedAt = now
            events.push(newEvent(job, 'REDELIVERED', { note: 'crash recovery' }))
            failed++
            break
          }
          if (job.type === 'long_task') {
            job.progress = Math.min(100, (job.progress ?? 0) + randInt(6, 14))
            job.updatedAt = now
            if (job.progress >= 100) {
              finishJob(job, true, events, now)
              succeeded++
            } else if (Math.random() < 0.5) {
              events.push(newEvent(job, 'PROGRESS', { percent: job.progress }))
            }
            break
          }
          if (Math.random() < 0.7) {
            const ok = Math.random() < JOB_TYPES[job.type].successRate
            finishJob(job, ok, events, now)
            if (ok) succeeded++
            else failed++
          }
          break
        }
        default:
          break
      }
    }

    function finishJob(job, ok, events, now) {
      const worker = job.lockedBy
      if (ok) {
        const dur = durFor(job.type)
        closeRun(job, 'SUCCEEDED', null, dur)
        job.status = 'SUCCEEDED'
        job.durationMs = dur
        job.progress = null
        job.updatedAt = now
        events.push(newEvent(job, 'SUCCEEDED', { worker }))
      } else {
        const err = pick(ERROR_POOL)
        closeRun(job, 'FAILED', err, randInt(300, durFor(job.type)))
        job.lastError = err
        job.updatedAt = now
        if (job.attempt >= job.maxRetries) {
          job.status = 'DEAD'
          job.deadAt = now
          events.push(newEvent(job, 'DEAD', { note: 'retries exhausted → jobs.dead (DLQ)' }))
        } else {
          job.status = 'RETRYING'
          const delay = Math.min(8000, 900 * Math.pow(2, job.attempt)) + randInt(0, 800)
          job.nextRetryAt = now + delay
          events.push(newEvent(job, 'RETRY_SCHEDULED', { note: `backoff ${(delay / 1000).toFixed(1)}s` }))
        }
      }
    }

    // someone keeps submitting jobs
    const activeCount = jobs.filter((j) => ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].includes(j.status)).length
    if (Math.random() < 0.4 && activeCount < 26) {
      const job = freshJob()
      jobs.push(job)
      events.push(newEvent(job, 'CREATED', { note: `${job.scheduleMode} submission` }))
    }

    // housekeeping — keep the table snappy
    const done = jobs
      .filter((j) => j.status === 'SUCCEEDED' && now - j.updatedAt > 4 * 60_000)
      .sort((a, b) => a.updatedAt - b.updatedAt)
    if (done.length > 0 && jobs.length - done.length >= 60) {
      prunes.push(...done.slice(0, done.length - (jobs.length - 60)))
    }

    // worker telemetry
    const runningByWorker = {}
    for (const j of jobs) if (j.status === 'RUNNING') runningByWorker[j.lockedBy] = (runningByWorker[j.lockedBy] || 0) + 1
    const workerPatches = workers.map((w) => ({
      ...w,
      lastHeartbeat: w.status === 'online' ? now - randInt(0, 8000) : w.lastHeartbeat,
      cpu: w.status === 'online' ? Math.min(96, Math.max(6, w.cpu + randInt(-6, 6))) : w.cpu,
      mem: w.status === 'online' ? Math.min(92, Math.max(22, w.mem + randInt(-3, 3))) : w.mem,
      activeJobs: runningByWorker[w.id] || 0,
    }))

    const pruneIds = new Set(prunes.map((p) => p.id))
    dispatch(jobsPatched(jobs.filter((j) => !pruneIds.has(j.id))))
    if (prunes.length) dispatch(jobsPruned(prunes))
    dispatch(workersPatched(workerPatches))
    if (events.length) dispatch(eventsPushed(events))
    dispatch(throughputTicked({ succeeded, failed }))
  }
}

/** User action: cancel a pending/queued/running job (context cancellation). */
export function cancelJobAction(id) {
  return (dispatch, getState) => {
    const job = getState().jobs.list.find((j) => j.id === id)
    if (!job || !['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].includes(job.status)) return
    const next = structuredClone(job)
    closeRun(next, 'CANCELED', 'context canceled by operator')
    next.status = 'CANCELED'
    next.updatedAt = Date.now()
    next.progress = null
    dispatch(jobsPatched([next]))
    dispatch(eventsPushed([newEvent(next, 'CANCELED')]))
  }
}

/** User action: requeue a dead-lettered job for a fresh run. */
export function requeueJobAction(id) {
  return (dispatch, getState) => {
    const job = getState().jobs.list.find((j) => j.id === id)
    if (!job || job.status !== 'DEAD') return
    const next = structuredClone(job)
    next.status = 'PENDING'
    next.attempt = 0
    next.runAt = Date.now()
    next.deadAt = null
    next.lastError = null
    next.nextRetryAt = null
    next.updatedAt = Date.now()
    dispatch(jobsPatched([next]))
    dispatch(eventsPushed([newEvent(next, 'REQUEUED', { note: 'pulled out of DLQ by operator' })]))
  }
}

/** User action: submit a new job from the form. */
export function submitJobAction({ type, payload, scheduleMode, runAt, cronExpr, priority, maxRetries, idempotencyKey }) {
  return (dispatch) => {
    const now = Date.now()
    const job = {
      id: uuid(),
      type,
      payload,
      status: 'PENDING',
      priority,
      scheduleMode,
      cronExpr: cronExpr || null,
      runAt: runAt || now,
      maxRetries,
      attempt: 0,
      idempotencyKey: idempotencyKey || null,
      lockedBy: null,
      lockedAt: null,
      lastError: null,
      progress: null,
      durationMs: null,
      createdAt: now,
      updatedAt: now,
      workerId: null,
      runs: [],
      deadAt: null,
      nextRetryAt: null,
    }
    dispatch(jobsPatched([job]))
    dispatch(eventsPushed([newEvent(job, 'CREATED', { note: 'submitted via dashboard' })]))
    return job
  }
}
