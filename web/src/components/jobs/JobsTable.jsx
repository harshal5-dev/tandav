import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { JobStatusBadge } from './JobStatusBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { JOB_TYPES } from '@/data/jobTypes'
import { cn, formatDuration, shortId } from '@/lib/utils'

function ScheduleCell({ job }) {
  if (job.scheduleMode === 'cron') {
    return (
      <div className="leading-tight">
        <div className="font-mono text-xs text-violet-400">{job.cronExpr}</div>
        <div className="text-[10.5px] text-muted-foreground">recurring</div>
      </div>
    )
  }
  if (job.scheduleMode === 'delayed') {
    return (
      <div className="leading-tight">
        <div className="text-xs">in {job.runAt > Date.now() ? <TimeAgo ts={job.runAt} /> : 'past due'}</div>
        <div className="text-[10.5px] text-muted-foreground">delayed</div>
      </div>
    )
  }
  return <span className="text-xs text-muted-foreground">immediate</span>
}

function PriorityCell({ p }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              p <= 1 ? 'bg-red-500' : p <= 3 ? 'bg-amber-500' : p <= 7 ? 'bg-blue-500' : 'bg-zinc-500'
            )}
          />
          <span className="font-mono text-xs text-muted-foreground">{p}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>priority {p} {p <= 3 ? '— high' : ''}</TooltipContent>
    </Tooltip>
  )
}

export function JobsTable({ jobs, compact = false }) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-1">Job</TableHead>
          <TableHead>Status</TableHead>
          {!compact && <TableHead>Schedule</TableHead>}
          {!compact && <TableHead>Prio</TableHead>}
          <TableHead>Attempts</TableHead>
          {!compact && <TableHead>Duration</TableHead>}
          {!compact && <TableHead className="hidden xl:table-cell">Worker</TableHead>}
          <TableHead className="text-right">Updated</TableHead>
          <TableHead className="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const meta = JOB_TYPES[job.type]
          return (
            <TableRow
              key={job.id}
              className="cursor-pointer"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <TableCell className="pl-1">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', meta.bg)}>
                    <meta.icon className={cn('h-4 w-4', meta.color)} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-mono text-xs text-foreground/90">{shortId(job.id)}</div>
                    <div className="text-[11px] text-muted-foreground">{job.type}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <JobStatusBadge status={job.status} />
                  {job.status === 'RUNNING' && job.progress != null && (
                    <div className="w-24">
                      <Progress value={job.progress} indicatorClassName="bg-cyan-400" className="h-1" />
                    </div>
                  )}
                </div>
              </TableCell>
              {!compact && <TableCell><ScheduleCell job={job} /></TableCell>}
              {!compact && <TableCell><PriorityCell p={job.priority} /></TableCell>}
              <TableCell>
                <span className="font-mono text-xs">
                  {job.attempt}
                  <span className="text-muted-foreground">/{job.maxRetries}</span>
                </span>
              </TableCell>
              {!compact && (
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{formatDuration(job.durationMs)}</span>
                </TableCell>
              )}
              {!compact && (
                <TableCell className="hidden xl:table-cell">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {job.workerId ?? '—'}
                  </span>
                </TableCell>
              )}
              <TableCell className="text-right">
                <TimeAgo ts={job.updatedAt} suffix=" ago" className="text-xs text-muted-foreground" />
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
