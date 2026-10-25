import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Server, Cpu, MemoryStick, Activity, HeartPulse, Clock3, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/PageHeader'
import { selectWorkers } from '@/store/slices/workersSlice'
import { selectAllJobs } from '@/store/slices/jobsSlice'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { cn } from '@/lib/utils'

const STATUS_META = {
  online: { label: 'online', cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
  draining: { label: 'draining', cls: 'border-amber-500/25 bg-amber-500/10 text-amber-400', dot: 'bg-amber-500' },
  offline: { label: 'offline', cls: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400', dot: 'bg-zinc-400' },
}

export default function Workers() {
  const workers = useSelector(selectWorkers)
  const jobs = useSelector(selectAllJobs)
  const running = jobs.filter((j) => j.status === 'RUNNING')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Worker fleet"
        description="Stateless Go processes consuming jobs.ready as competing consumers. Scale = start another container — no coordination needed."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {workers.map((w) => {
          const st = STATUS_META[w.status] ?? STATUS_META.offline
          const activeJobs = running.filter((j) => j.lockedBy === w.id)
          return (
            <Card key={w.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-violet-500/10">
                      <Server className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-2 font-mono text-sm font-medium">{w.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {w.region} · {w.version}
                      </div>
                    </div>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium', st.cls)}>
                    <span className="relative flex h-1.5 w-1.5">
                      {w.status === 'online' && (
                        <span className={cn('absolute h-full w-full animate-pulse-ring rounded-full', st.dot)} />
                      )}
                      <span className={cn('relative h-1.5 w-1.5 rounded-full', st.dot)} />
                    </span>
                    {st.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="processed" value={w.jobsProcessed.toLocaleString()} />
                  <Metric label="failed" value={w.jobsFailed.toLocaleString()} tone="text-rose-400" />
                  <Metric label="in flight" value={activeJobs.length} tone="text-cyan-400" />
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <Progress value={w.cpu} className="h-1.5" indicatorClassName="bg-violet-400" />
                    <span className="w-9 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{w.cpu}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MemoryStick className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <Progress value={w.mem} className="h-1.5" indicatorClassName="bg-fuchsia-400" />
                    <span className="w-9 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{w.mem}%</span>
                  </div>
                </div>

                {activeJobs.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">executing now</div>
                    {activeJobs.map((j) => (
                      <Link
                        key={j.id}
                        to={`/jobs/${j.id}`}
                        className="flex items-center gap-2 rounded-md border bg-background/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
                      >
                        <Activity className="h-3 w-3 shrink-0 text-cyan-400" />
                        <span className="truncate font-mono text-[11px]">{j.type}</span>
                        {j.progress != null && (
                          <span className="ml-auto font-mono text-[10px] text-cyan-400">{j.progress}%</span>
                        )}
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <HeartPulse className="h-3 w-3" /> heartbeat <TimeAgo ts={w.lastHeartbeat} suffix=" ago" />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" /> up <TimeAgo ts={w.startedAt} />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="rounded-lg border bg-background/40 py-2">
      <div className={cn('font-mono text-base font-semibold tabular-nums', tone)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}
