import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock3, Repeat, Send, Wand2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { submitJobAction } from '@/store/realtime'
import { JOB_TYPES, JOB_TYPE_LIST } from '@/data/jobTypes'
import { JsonBlock } from '@/components/shared/JsonBlock'
import { cn } from '@/lib/utils'

const NEXT_CRON_FIRE = {
  '*/5 * * * *': 'every 5 minutes',
  '0 */2 * * *': 'every 2 hours',
  '30 3 * * *': 'daily at 03:30',
  '0 9 * * mon': 'Mondays at 09:00',
  '0 0 1 * *': 'first of the month',
}

export default function SubmitJob() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [type, setType] = useState('send_email')
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(JOB_TYPES.send_email.payload(), null, 2))
  const [scheduleMode, setScheduleMode] = useState('immediate')
  const [runAt, setRunAt] = useState('')
  const [cronExpr, setCronExpr] = useState('0 */2 * * *')
  const [priority, setPriority] = useState('5')
  const [maxRetries, setMaxRetries] = useState('5')
  const [idemKey, setIdemKey] = useState('')
  const [errors, setErrors] = useState({})

  const payloadError = useMemo(() => {
    if (!payloadText.trim()) return 'payload is required'
    try {
      const v = JSON.parse(payloadText)
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return 'payload must be a JSON object'
      return null
    } catch {
      return 'invalid JSON'
    }
  }, [payloadText])

  const pickType = (t) => {
    setType(t)
    setPayloadText(JSON.stringify(JOB_TYPES[t].payload(), null, 2))
  }

  const submit = () => {
    const next = {}
    if (payloadError) next.payload = payloadError
    if (scheduleMode === 'delayed' && !runAt) next.runAt = 'pick a run-at time'
    if (scheduleMode === 'cron' && !cronExpr.trim()) next.cron = 'cron expression required'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Fix the highlighted fields')
      return
    }

    const job = dispatch(
      submitJobAction({
        type,
        payload: JSON.parse(payloadText),
        scheduleMode: scheduleMode === 'immediate' ? 'immediate' : scheduleMode,
        runAt: scheduleMode === 'delayed' ? new Date(runAt).getTime() : Date.now(),
        cronExpr: scheduleMode === 'cron' ? cronExpr : null,
        priority: Number(priority),
        maxRetries: Number(maxRetries),
        idempotencyKey: idemKey.trim() || null,
      })
    )
    toast.success('Job submitted', {
      description: `${type} · ${scheduleMode === 'cron' ? cronExpr : scheduleMode === 'delayed' ? 'delayed' : 'runs immediately'} · watch it dance`,
    })
    navigate(`/jobs/${job.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Submit a job"
        description="POST /api/v1/jobs — validated at the gateway, persisted as PENDING, armed in the Redis ZSET or cron engine."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {/* handler */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Handler</CardTitle>
              <CardDescription className="text-xs">registered worker handler for this payload</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {JOB_TYPE_LIST.map((t) => {
                const meta = JOB_TYPES[t]
                const active = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      active
                        ? 'border-violet-500/50 bg-violet-500/[0.07] shadow-sm'
                        : 'hover:border-border hover:bg-accent/50'
                    )}
                  >
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', meta.bg)}>
                      <meta.icon className={cn('h-4 w-4', meta.color)} />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="font-mono text-xs font-medium">{meta.label}</div>
                      <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{meta.description}</div>
                    </div>
                    {active && <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-violet-400" />}
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* payload */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Payload</CardTitle>
              <CardDescription className="text-xs">jsonb — handler-specific input</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                spellCheck={false}
                className={cn(
                  'min-h-[160px] font-mono text-xs leading-relaxed',
                  payloadError && 'border-rose-500/60 focus-visible:ring-rose-500/40'
                )}
              />
              <div className="flex items-center justify-between">
                {payloadError ? (
                  <span className="text-xs text-rose-400">{payloadError}</span>
                ) : (
                  <span className="text-xs text-emerald-500">valid JSON</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setPayloadText(JSON.stringify(JOB_TYPES[type].payload(), null, 2))}
                >
                  <Wand2 className="h-3 w-3" /> Regenerate example
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={scheduleMode} onValueChange={setScheduleMode}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="immediate" className="gap-1 text-xs">
                    <Zap className="h-3 w-3" /> Now
                  </TabsTrigger>
                  <TabsTrigger value="delayed" className="gap-1 text-xs">
                    <Clock3 className="h-3 w-3" /> Delayed
                  </TabsTrigger>
                  <TabsTrigger value="cron" className="gap-1 text-xs">
                    <Repeat className="h-3 w-3" /> Cron
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {scheduleMode === 'delayed' && (
                <div className="space-y-1.5">
                  <Label htmlFor="runAt" className="text-xs">Run at</Label>
                  <Input
                    id="runAt"
                    type="datetime-local"
                    value={runAt}
                    onChange={(e) => setRunAt(e.target.value)}
                    className={cn(errors.runAt && 'border-rose-500/60')}
                  />
                  {errors.runAt && <p className="text-xs text-rose-400">{errors.runAt}</p>}
                  <p className="text-[10.5px] text-muted-foreground">armed in redis ZSET · dispatched within 1s of due time</p>
                </div>
              )}

              {scheduleMode === 'cron' && (
                <div className="space-y-1.5">
                  <Label htmlFor="cron" className="text-xs">Cron expression</Label>
                  <Input
                    id="cron"
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="0 */2 * * *"
                    className={cn('font-mono', errors.cron && 'border-rose-500/60')}
                  />
                  <p className="text-[10.5px] text-emerald-500">
                    next fire: {NEXT_CRON_FIRE[cronExpr] ?? 'computed by the cron engine'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority (1 = highest)</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 7, 9].map((p) => (
                        <SelectItem key={p} value={String(p)} className="text-xs">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max retries</Label>
                  <Select value={maxRetries} onValueChange={setMaxRetries}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 3, 5, 8].map((r) => (
                        <SelectItem key={r} value={String(r)} className="text-xs">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="idem" className="text-xs">Idempotency key <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="idem"
                  value={idemKey}
                  onChange={(e) => setIdemKey(e.target.value)}
                  placeholder="report-august-2026"
                  className="font-mono text-xs"
                />
                <p className="text-[10.5px] text-muted-foreground">
                  SET NX guard — redeliveries ACK instead of double-executing
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request preview</CardTitle>
              <CardDescription className="text-xs font-mono">POST /api/v1/jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <JsonBlock
                data={{
                  type,
                  payload: payloadError ? '{ … }' : JSON.parse(payloadText),
                  schedule: { mode: scheduleMode, ...(scheduleMode === 'cron' ? { cron: cronExpr } : {}) },
                  priority: Number(priority),
                  max_retries: Number(maxRetries),
                  ...(idemKey.trim() ? { idempotency_key: idemKey.trim() } : {}),
                }}
                maxHeight="max-h-56"
              />
            </CardContent>
          </Card>

          <Button size="lg" className="w-full gap-2" onClick={submit}>
            <Send className="h-4 w-4" /> Submit job
          </Button>
        </div>
      </div>
    </div>
  )
}
