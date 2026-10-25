import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Ban, RefreshCw, TriangleAlert, Timer, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge'
import { StateTimeline } from '@/components/jobs/StateTimeline'
import { JsonBlock } from '@/components/shared/JsonBlock'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { selectJobById } from '@/store/slices/jobsSlice'
import { cancelJobAction, requeueJobAction } from '@/store/realtime'
import { JOB_TYPES } from '@/data/jobTypes'
import { cn, formatDuration } from '@/lib/utils'

const ACTIVE = ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING']

export default function JobDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const job = useSelector((s) => selectJobById(s, id))
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (!job) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <div className="text-lg font-medium">Job not found</div>
        <p className="text-sm text-muted-foreground">It may have been pruned from the live window.</p>
        <Button variant="outline" asChild>
          <Link to="/jobs"><ArrowLeft className="h-4 w-4" /> Back to jobs</Link>
        </Button>
      </div>
    )
  }

  const meta = JOB_TYPES[job.type]
  const cancellable = ACTIVE.includes(job.status)
  const requeueable = job.status === 'DEAD'

  const copyId = () => {
    navigator.clipboard?.writeText(job.id)
    toast.success('Job ID copied', { description: job.id })
  }

  const doCancel = () => {
    dispatch(cancelJobAction(job.id))
    setConfirmCancel(false)
    toast('Job canceled', { description: 'context cancellation propagated to worker' })
  }

  const doRequeue = () => {
    dispatch(requeueJobAction(job.id))
    toast.success('Requeued from DLQ', { description: 'attempt counter reset — scheduling fresh run' })
  }

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" asChild>
          <Link to="/jobs"><ArrowLeft className="h-3.5 w-3.5" /> All jobs</Link>
        </Button>

        <Card className="relative overflow-hidden">
          <div className={cn('absolute inset-x-0 top-0 h-px', meta ? 'bg-gradient-to-r from-transparent via-violet-500/60 to-transparent' : '')} />
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', meta.bg)}>
              <meta.icon className={cn('h-5 w-5', meta.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium">{job.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyId}>
                  <Copy className="h-3 w-3" />
                </Button>
                <JobStatusBadge status={job.status} />
                {job.idempotencyKey && (
                  <Badge variant="secondary" className="font-mono text-[10px]">idem:{job.idempotencyKey}</Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {meta.description} · submitted <TimeAgo ts={job.createdAt} suffix=" ago" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cancellable && (
                <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)}>
                  <Ban className="h-3.5 w-3.5" /> Cancel job
                </Button>
              )}
              {requeueable && (
                <Button size="sm" onClick={doRequeue}>
                  <RefreshCw className="h-3.5 w-3.5" /> Requeue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {job.status === 'RUNNING' && job.progress != null && (
        <Card className="border-cyan-500/30">
          <CardContent className="flex items-center gap-4 p-4">
            <Timer className="h-4 w-4 shrink-0 text-cyan-400" />
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-cyan-400">Executing — progress via kafka/job.progress</span>
                <span className="font-mono tabular-nums">{job.progress}%</span>
              </div>
              <Progress value={job.progress} indicatorClassName="bg-cyan-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {job.lastError && job.status !== 'CANCELED' && (
        <Card className="border-rose-500/30 bg-rose-500/[0.03]">
          <CardContent className="flex items-start gap-3 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-rose-400">Last error — attempt {job.attempt}</div>
              <div className="mt-1 break-words font-mono text-xs text-rose-300/90">{job.lastError}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lifecycle</CardTitle>
              <CardDescription className="text-xs">state machine · postgres is source of truth</CardDescription>
            </CardHeader>
            <CardContent className="pb-6 pt-2">
              <StateTimeline job={job} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attempts</CardTitle>
              <CardDescription className="text-xs">
                job_runs audit trail — {job.runs.length} record{job.runs.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {job.runs.length ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...job.runs].reverse().map((r) => (
                      <TableRow key={r.id} className="hover:bg-transparent">
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.attempt}</TableCell>
                        <TableCell className="font-mono text-xs">{r.workerName ?? r.workerId}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(r.startedAt).toLocaleTimeString([], { hour12: false })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.status === 'RUNNING' ? <span className="text-cyan-400">in flight</span> : formatDuration(r.durationMs)}
                        </TableCell>
                        <TableCell>
                          <AttemptResult run={r} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No attempts yet — waiting for its moment in the Redis ZSET.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payload</CardTitle>
              <CardDescription className="text-xs">jsonb · handler-specific input</CardDescription>
            </CardHeader>
            <CardContent>
              <JsonBlock data={job.payload} maxHeight="max-h-80" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 text-sm">
              <Detail label="Type" value={<span className="font-mono text-xs">{job.type}</span>} />
              <Detail label="Priority" value={<PriorityValue p={job.priority} />} />
              <Detail label="Attempts" value={<span className="font-mono text-xs">{job.attempt} / {job.maxRetries} max</span>} />
              <Detail
                label="Schedule"
                value={
                  job.scheduleMode === 'cron' ? (
                    <span className="font-mono text-xs text-violet-400">{job.cronExpr}</span>
                  ) : job.scheduleMode === 'delayed' ? (
                    <span className="text-xs">{new Date(job.runAt).toLocaleString()}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">immediate</span>
                  )
                }
              />
              <Detail label="Created" value={<span className="text-xs">{new Date(job.createdAt).toLocaleString()}</span>} />
              {job.deadAt && (
                <Detail label="Dead-lettered" value={<span className="text-xs text-red-400">{new Date(job.deadAt).toLocaleString()}</span>} />
              )}
              {job.workerId && (
                <Detail label="Last worker" value={<span className="font-mono text-xs">{job.workerId}</span>} />
              )}
              {job.durationMs != null && (
                <Detail label="Duration" value={<span className="font-mono text-xs">{formatDuration(job.durationMs)}</span>} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-3.5 w-3.5 text-violet-400" /> Execution guarantees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <Guarantee label="Delivery" value="at-least-once · rabbitMQ acks" ok />
              <Guarantee label="Execution" value="effectively-once · redis exec_lock" ok />
              <Guarantee label="Idempotency" value={job.idempotencyKey ? 'dedup key armed' : 'no key — handler must tolerate'} ok={!!job.idempotencyKey} />
              <Guarantee
                label="Redelivery"
                value={job.attempt > 1 ? `recovered after crash on attempt ${job.attempt - 1}` : 'no duplicates detected'}
                ok
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this job?</DialogTitle>
            <DialogDescription>
              {job.status === 'RUNNING'
                ? 'The scheduler publishes a cancel event; the worker\u2019s context is canceled and the handler stops cooperatively.'
                : 'The job will be marked CANCELED and removed from the delayed set / ready queue.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>Keep it running</Button>
            <Button variant="destructive" onClick={doCancel}>
              <Ban className="h-3.5 w-3.5" /> Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0 last:pb-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{value}</span>
    </div>
  )
}

function PriorityValue({ p }) {
  const tone = p <= 1 ? 'text-red-400' : p <= 3 ? 'text-amber-400' : p <= 7 ? 'text-blue-400' : 'text-muted-foreground'
  return (
    <span className={cn('font-mono text-xs', tone)}>
      {p} {p <= 3 ? '· high' : p >= 8 ? '· low' : ''}
    </span>
  )
}

function Guarantee({ label, value, ok }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-background/40 p-2.5">
      <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', ok ? 'bg-emerald-500' : 'bg-amber-500')} />
      <div>
        <div className="text-[11px] font-medium text-foreground">{label}</div>
        <div className="font-mono text-[10.5px] leading-relaxed">{value}</div>
      </div>
    </div>
  )
}

function AttemptResult({ run }) {
  if (run.status === 'RUNNING') {
    return <JobStatusBadge status="RUNNING" />
  }
  if (run.status === 'SUCCEEDED') {
    return <JobStatusBadge status="SUCCEEDED" />
  }
  if (run.status === 'CANCELED') {
    return <JobStatusBadge status="CANCELED" />
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span><JobStatusBadge status="FAILED" /></span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs whitespace-normal break-all font-mono text-[10px]">
        {run.error}
      </TooltipContent>
    </Tooltip>
  )
}
