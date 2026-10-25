import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Activity,
  ListChecks,
  Skull,
  Server,
  PlusCircle,
  Drum,
  Lock,
  Database,
  Rabbit,
  Zap,
  Wind,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectCountsByStatus } from '@/store/slices/jobsSlice'
import { LiveDot } from '@/components/shared/LiveDot'

const NAV = [
  {
    section: 'Monitor',
    items: [
      { to: '/', label: 'Overview', icon: Activity, end: true },
      { to: '/jobs', label: 'Jobs', icon: ListChecks, end: false },
      { to: '/dlq', label: 'Dead Letters', icon: Skull, end: false, badge: 'DEAD' },
      { to: '/workers', label: 'Workers', icon: Server, end: false },
    ],
  },
  {
    section: 'Manage',
    items: [{ to: '/submit', label: 'Submit Job', icon: PlusCircle, end: false }],
  },
]

const INFRA = [
  { name: 'postgres', icon: Database, detail: 'source of truth' },
  { name: 'rabbitmq', icon: Rabbit, detail: 'jobs.ready' },
  { name: 'kafka', icon: Zap, detail: 'job.events' },
  { name: 'redis', icon: Wind, detail: 'locks + zset' },
]

export function Sidebar() {
  const counts = useSelector(selectCountsByStatus)
  const dlq = counts.DEAD || 0

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/50 backdrop-blur md:flex">
      {/* brand */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-violet-500/25">
          <Drum className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">Tandav</div>
          <div className="text-[11px] text-muted-foreground">the dance that never stops</div>
        </div>
      </div>

      {/* nav */}
      <nav className="mt-2 flex-1 space-y-5 px-3">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      isActive && 'bg-accent text-foreground shadow-sm'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && dlq > 0 && (
                    <span className="ml-auto rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                      {dlq}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* cluster health */}
      <div className="space-y-3 border-t p-4">
        <div className="rounded-lg border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Scheduler</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <Lock className="h-3 w-3" /> leader
            </span>
          </div>
          <div className="mt-1.5 font-mono text-xs">sched-nataraja-01</div>
          <div className="mt-0.5 text-[10.5px] text-muted-foreground">redis lock · ttl 10s · ap-south-1</div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {INFRA.map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-2 rounded-lg border bg-background/40 px-2 py-1.5"
              title={i.detail}
            >
              <LiveDot className="scale-75" />
              <div className="min-w-0">
                <div className="truncate font-mono text-[10.5px] leading-tight">{i.name}</div>
                <div className="truncate text-[9.5px] leading-tight text-muted-foreground">{i.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-[11px] font-semibold text-white">
            HG
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-medium">harshal@tandav.dev</div>
            <div className="text-[10px] text-muted-foreground">cluster admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
