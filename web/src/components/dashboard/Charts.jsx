import { useSelector } from 'react-redux'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { selectThroughput } from '@/store/slices/statsSlice'
import { selectCountsByStatus } from '@/store/slices/jobsSlice'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-mono text-[10px] text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="capitalize text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-mono font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ThroughputChart() {
  const data = useSelector(selectThroughput)
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="gSucc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
          <ReTooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="succeeded"
            name="succeeded"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gSucc)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="failed"
            stroke="#f43f5e"
            strokeWidth={1.6}
            fill="url(#gFail)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const STATUS_COLORS = {
  SUCCEEDED: '#10b981',
  RUNNING: '#22d3ee',
  QUEUED: '#3b82f6',
  PENDING: '#f59e0b',
  RETRYING: '#fb923c',
  FAILED: '#f43f5e',
  DEAD: '#ef4444',
  CANCELED: '#a1a1aa',
}

export function StatusDonut() {
  const counts = useSelector(selectCountsByStatus)
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div className="relative h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={86}
            paddingAngle={3}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? '#a1a1aa'} />
            ))}
          </Pie>
          <ReTooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold tabular-nums">{data.reduce((a, d) => a + d.value, 0)}</div>
        <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">jobs</div>
      </div>
    </div>
  )
}

export function StatusLegend() {
  const counts = useSelector(selectCountsByStatus)
  const order = ['SUCCEEDED', 'RUNNING', 'QUEUED', 'PENDING', 'RETRYING', 'FAILED', 'DEAD', 'CANCELED']
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {order
        .filter((s) => counts[s])
        .map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_COLORS[s] }} />
            <span className="text-muted-foreground">{s.toLowerCase()}</span>
            <span className="ml-auto font-mono tabular-nums">{counts[s]}</span>
          </div>
        ))}
    </div>
  )
}
