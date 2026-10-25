import { cn } from '@/lib/utils'
import { STATUSES } from '@/data/jobTypes'

const TONES = {
  amber: 'border-amber-500/25 bg-amber-500/10 text-amber-500',
  blue: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
  cyan: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400',
  orange: 'border-orange-500/25 bg-orange-500/10 text-orange-400',
  emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  rose: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
  red: 'border-red-500/30 bg-red-500/15 text-red-400',
  zinc: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
}

const DOT = {
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  red: 'bg-red-500',
  zinc: 'bg-zinc-400',
}

export function JobStatusBadge({ status, className }) {
  const meta = STATUSES[status] ?? { label: status, tone: 'zinc' }
  const running = status === 'RUNNING'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        TONES[meta.tone],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {running && (
          <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full', DOT[meta.tone])} />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', DOT[meta.tone])} />
      </span>
      {meta.label}
    </span>
  )
}

export function TypeBadge({ type, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs text-foreground/80',
        className
      )}
    >
      {type}
    </span>
  )
}
