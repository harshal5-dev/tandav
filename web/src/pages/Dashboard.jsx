import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Activity, Layers, Gauge, Skull, Server, Timer, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { ThroughputChart, StatusDonut, StatusLegend } from '@/components/dashboard/Charts'
import { EventFeed } from '@/components/dashboard/EventFeed'
import { JobsTable } from '@/components/jobs/JobsTable'
import { selectAllJobs } from '@/store/slices/jobsSlice'
import { selectWorkers } from '@/store/slices/workersSlice'
import { selectDispatchLatency } from '@/store/slices/statsSlice'

export default function Dashboard() {
  const jobs = useSelector(selectAllJobs)
  const workers = useSelector(selectWorkers)
  const latency = useSelector(selectDispatchLatency)

  const stats = useMemo(() => {
    const now = Date.now()
    const active = jobs.filter((j) => ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].includes(j.status))
    const queued = jobs.filter((j) => j.status === 'QUEUED' || (j.status === 'PENDING' && j.runAt <= now))
    const terminal = jobs.filter((j) => ['SUCCEEDED', 'FAILED', 'DEAD'].includes(j.status))
    const succeeded = jobs.filter((j) => j.status === 'SUCCEEDED').length
    const dlq = jobs.filter((j) => j.status === 'DEAD').length
    const rate = terminal.length ? Math.round((succeeded / terminal.length) * 1000) / 10 : 100
    return { active: active.length, queued: queued.length, rate, dlq, running: jobs.filter((j) => j.status === 'RUNNING').length }
  }, [jobs])

  const recent = useMemo(() => [...jobs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8), [jobs])
  const online = workers.filter((w) => w.status === 'online').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Srishti · Sthiti · Laya"
        title="The dance, live."
        description="Every state transition in the cluster, streamed from kafka/job.events over WebSocket. Created, executed, completed — never missing a beat."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Active jobs"
          value={stats.active}
          sub={`${stats.running} executing now`}
          icon={Activity}
          iconClass="border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
          trend={4}
        />
        <StatCard
          label="Queue depth"
          value={stats.queued}
          sub="rabbitmq · jobs.ready"
          icon={Layers}
          iconClass="border-blue-500/25 bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Success rate"
          value={`${stats.rate}%`}
          sub="terminal states"
          icon={Gauge}
          iconClass="border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
          trend={1}
        />
        <StatCard
          label="Dead letters"
          value={stats.dlq}
          sub={stats.dlq > 0 ? 'needs attention' : 'all clear'}
          icon={Skull}
          iconClass="border-red-500/25 bg-red-500/10 text-red-400"
          alert={stats.dlq > 0}
        />
        <StatCard
          label="Workers online"
          value={`${online}/${workers.length}`}
          sub="heartbeats < 10s"
          icon={Server}
          iconClass="border-violet-500/25 bg-violet-500/10 text-violet-400"
        />
        <StatCard
          label="Dispatch p95"
          value={`${latency.p95}ms`}
          sub={`p50 ${latency.p50}ms · due→start`}
          icon={Timer}
          iconClass="border-amber-500/25 bg-amber-500/10 text-amber-400"
          trend={-2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Throughput</CardTitle>
              <CardDescription className="text-xs">jobs per minute · last 30 min</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> succeeded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> failed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ThroughputChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job states</CardTitle>
            <CardDescription className="text-xs">current distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusDonut />
            <StatusLegend />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Recent jobs</CardTitle>
              <CardDescription className="text-xs">live · updates without refresh</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/jobs">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <JobsTable jobs={recent} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:row-span-1">
          <EventFeed className="h-[420px]" />
        </Card>
      </div>
    </div>
  )
}
