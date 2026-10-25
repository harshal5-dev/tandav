import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  Plus,
  Inbox,
  Play,
  Check,
  X,
  RotateCw,
  Skull,
  Ban,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { selectEvents } from '@/store/slices/eventsSlice'
import { LiveDot } from '@/components/shared/LiveDot'
import { shortId, cn } from '@/lib/utils'

const KIND_META = {
  CREATED: { icon: Plus, cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  QUEUED: { icon: Inbox, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  RUNNING: { icon: Play, cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  SUCCEEDED: { icon: Check, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  FAILED: { icon: X, cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  RETRY_SCHEDULED: { icon: RotateCw, cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  DEAD: { icon: Skull, cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  CANCELED: { icon: Ban, cls: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  PROGRESS: { icon: Loader2, cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  REQUEUED: { icon: RefreshCw, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  REDELIVERED: { icon: TriangleAlert, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

function timeOf(ts) {
  return new Date(ts).toLocaleTimeString([], { hour12: false })
}

export function EventFeed({ className, limit = 30 }) {
  const events = useSelector(selectEvents)

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          Event stream <span className="font-mono text-[10px] text-muted-foreground">kafka/job.events</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <LiveDot /> ws
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {events.slice(0, limit).map((ev) => {
            const meta = KIND_META[ev.kind] ?? KIND_META.CREATED
            return (
              <Link
                key={ev.id}
                to={`/jobs/${ev.jobId}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
              >
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border', meta.cls)}>
                  <meta.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-medium">{ev.kind}</span>
                    <span className="truncate font-mono text-[10.5px] text-muted-foreground">
                      {ev.jobType}·{shortId(ev.jobId)}
                    </span>
                  </div>
                  {ev.note && <div className="truncate text-[10.5px] text-muted-foreground">{ev.note}</div>}
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {timeOf(ev.ts)}
                </span>
              </Link>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
