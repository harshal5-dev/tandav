import { CircleDot, Inbox, Play, Check, X, Skull, Ban, RotateCw, FilePlus2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeShort } from '@/components/shared/TimeAgo'

function fmt(ts) {
  return <TimeShort ts={ts} />
}

/**
 * Horizontal lifecycle visualization of the job state machine from the
 * design doc: PENDING → QUEUED → RUNNING → terminal, with the retry loop
 * shown as a chip when the job is in backoff.
 */
export function StateTimeline({ job }) {
  const hasRuns = job.runs.length > 0
  const finished = ['SUCCEEDED', 'FAILED', 'DEAD', 'CANCELED'].includes(job.status)

  const terminalLabel =
    job.status === 'SUCCEEDED' ? 'Succeeded'
      : job.status === 'DEAD' ? 'Dead-lettered'
        : job.status === 'CANCELED' ? 'Canceled'
          : job.status === 'FAILED' ? 'Failed'
            : job.status === 'RETRYING' ? 'Failed'
              : 'Terminal'

  const steps = [
    {
      key: 'submitted',
      label: 'Submitted',
      icon: FilePlus2,
      ts: job.createdAt,
      done: true,
      tone: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
    },
    {
      key: 'queued',
      label: 'Queued',
      icon: Inbox,
      ts: job.status === 'QUEUED' ? job.updatedAt : hasRuns ? job.runs[0].startedAt : null,
      done: hasRuns || job.status === 'QUEUED',
      current: job.status === 'QUEUED',
      tone: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      key: 'running',
      label: 'Running',
      icon: Play,
      ts: job.runs.at(-1)?.startedAt ?? null,
      done: finished,
      current: job.status === 'RUNNING',
      tone: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      key: 'terminal',
      label: terminalLabel,
      icon:
        job.status === 'SUCCEEDED' ? Check
          : job.status === 'DEAD' ? Skull
            : job.status === 'CANCELED' ? Ban
              : X,
      ts: job.runs.at(-1)?.finishedAt ?? job.updatedAt,
      done: finished,
      current: ['FAILED', 'DEAD', 'CANCELED'].includes(job.status) === false && finished === false && ['RETRYING'].includes(job.status),
      tone:
        job.status === 'SUCCEEDED'
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          : 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
  ]

  return (
    <div>
      <div className="flex items-start">
        {steps.map((s, i) => (
          <div key={s.key} className={cn('flex min-w-0', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                  s.done || s.current ? s.tone : 'border-border bg-muted text-muted-foreground/40',
                  s.current && 'animate-pulse'
                )}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-center leading-tight">
                <div className={cn('text-[11px] font-medium', s.done || s.current ? 'text-foreground' : 'text-muted-foreground/60')}>
                  {s.label}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{fmt(s.ts)}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="mt-[18px] h-0.5 min-w-4 flex-1 rounded-full bg-border">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    steps[i + 1].done || steps[i + 1].current ? 'w-full bg-gradient-to-r from-violet-500/60 to-blue-500/60' : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {job.status === 'RETRYING' && (
        <div className="mt-4 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-400">
            <RotateCw className="h-3 w-3" />
            retry loop · attempt {job.attempt}/{job.maxRetries} · backoff until next dispatch
          </span>
        </div>
      )}
      {job.status === 'RUNNING' && job.attempt > 1 && (
        <div className="mt-4 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-400">
            <CircleDot className="h-3 w-3" />
            attempt {job.attempt} of {job.maxRetries} — redelivered after crash
          </span>
        </div>
      )}
    </div>
  )
}
