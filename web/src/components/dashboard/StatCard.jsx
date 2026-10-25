import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ label, value, sub, icon: Icon, iconClass, trend, alert = false }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 transition-colors', alert && 'border-red-500/40 bg-red-500/[0.04]')}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums leading-none">{value}</div>
          {(sub || trend != null) && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {trend != null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
              {sub && <span className="truncate">{sub}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', iconClass)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
