import { useEffect, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

export function TimeAgo({ ts, className, suffix = '' }) {
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 10_000)
    return () => clearInterval(id)
  }, [])
  if (ts == null) return <span className={className}>—</span>
  return (
    <span className={className} suppressHydrationWarning>
      {formatDistanceToNowStrict(new Date(ts), { addSuffix: false })}
      {suffix}
    </span>
  )
}

export function TimeShort({ ts, className }) {
  if (ts == null) return <span className={className}>—</span>
  return (
    <span className={className}>
      {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  )
}
