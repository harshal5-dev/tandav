import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Skull, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { selectAllJobs } from '@/store/slices/jobsSlice'
import { requeueJobAction } from '@/store/realtime'
import { JOB_TYPES } from '@/data/jobTypes'
import { cn, shortId } from '@/lib/utils'

export default function DeadLetterQueue() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const dead = useSelector(selectAllJobs)
    .filter((j) => j.status === 'DEAD')
    .sort((a, b) => (b.deadAt ?? b.updatedAt) - (a.deadAt ?? a.updatedAt))

  const requeue = (id) => {
    dispatch(requeueJobAction(id))
    toast.success('Job requeued', { description: 'pulled out of jobs.dead — fresh attempt counter' })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Poison quarantine"
        title="Dead Letter Queue"
        description="Jobs that exhausted every retry with exponential backoff. Quarantined here so workers stay healthy — investigate, then requeue or drop."
      />

      {dead.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-20 text-center">
            <ShieldCheck className="h-9 w-9 text-emerald-500/70" />
            <div className="text-sm font-medium">The DLQ is empty</div>
            <div className="text-xs text-muted-foreground">
              Every job either succeeded or still has retries left. That\u2019s the dance working.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-500/25">
          <CardContent className="p-2 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-1">Job</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="min-w-[280px]">Last error</TableHead>
                  <TableHead>Dead since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dead.map((job) => {
                  const meta = JOB_TYPES[job.type]
                  return (
                    <TableRow key={job.id} className="cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <TableCell className="pl-1">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', meta.bg)}>
                            <meta.icon className={cn('h-4 w-4', meta.color)} />
                          </div>
                          <div className="leading-tight">
                            <div className="font-mono text-xs">{shortId(job.id)}</div>
                            <div className="text-[11px] text-muted-foreground">{job.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <Skull className="h-3.5 w-3.5 text-red-500" />
                          {job.attempt}/{job.maxRetries}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-md truncate font-mono text-[11px] text-rose-300/90" title={job.lastError}>
                          {job.lastError}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TimeAgo ts={job.deadAt ?? job.updatedAt} suffix=" ago" className="text-xs text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => requeue(job.id)}>
                            <RefreshCw className="h-3 w-3" /> Requeue
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate(`/jobs/${job.id}`)}>
                            Inspect <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
