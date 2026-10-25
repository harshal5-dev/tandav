import { cn } from '@/lib/utils'

export function LiveDot({ className, color = 'bg-emerald-500' }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full', color)} />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', color)} />
    </span>
  )
}
