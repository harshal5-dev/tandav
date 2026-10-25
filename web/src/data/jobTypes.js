import {
  Mail,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Webhook,
  Dices,
  Hourglass,
} from 'lucide-react'

/**
 * The 7 demo handlers from the system design — each with realistic payloads,
 * durations, and failure behaviour so the dashboard tells a believable story.
 */
export const JOB_TYPES = {
  send_email: {
    label: 'send_email',
    section: 'Messaging',
    description: 'Transactional email via SMTP → MailHog',
    icon: Mail,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    avgMs: [900, 2600],
    successRate: 0.97,
    payload: () => ({
      to: pick([
        'priya@zencode.io',
        'marcus@acme.dev',
        'ling@northwind.co',
        'ada@fintechly.com',
        'jonas@metricly.eu',
      ]),
      subject: pick([
        'Your invoice for August is ready',
        'Welcome to Tandav 🥁',
        'Password reset requested',
        'Weekly digest — 47 updates',
        'Payment received: ₹12,499',
      ]),
      template: pick(['invoice_v2', 'welcome_flow', 'reset_password', 'weekly_digest']),
      vars: { locale: 'en-IN', batch: 'aug-2026' },
    }),
  },
  generate_report: {
    label: 'generate_report',
    section: 'Analytics',
    description: 'Postgres query → CSV artifact',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    avgMs: [4000, 11000],
    successRate: 0.94,
    payload: () => ({
      report: pick(['monthly_revenue', 'churn_cohorts', 'active_users', 'top_products']),
      month: '2026-08',
      format: 'csv',
      rows: 1000 + Math.floor(Math.random() * 9000),
      notify: ['analytics@tandav.dev'],
    }),
  },
  process_image: {
    label: 'process_image',
    section: 'Media',
    description: 'Resize + thumbnail pipeline',
    icon: ImageIcon,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    avgMs: [1500, 5000],
    successRate: 0.96,
    payload: () => ({
      url: `s3://uploads/${randId()}/original.jpg`,
      operations: ['resize', 'thumbnail', 'watermark'],
      sizes: [320, 640, 1280, 2048],
      quality: 82,
    }),
  },
  cleanup_expired: {
    label: 'cleanup_expired',
    section: 'Maintenance',
    description: 'Cron purge of stale rows',
    icon: Trash2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    avgMs: [2000, 6000],
    successRate: 0.99,
    payload: () => ({
      table: pick(['sessions', 'audit_logs', 'webhook_deliveries', 'otp_codes']),
      older_than_days: pick([7, 30, 90]),
      batch_size: 500,
      dry_run: false,
    }),
  },
  http_callback: {
    label: 'http_callback',
    section: 'Integrations',
    description: 'Signed webhook to customer endpoint',
    icon: Webhook,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    avgMs: [800, 3000],
    successRate: 0.78,
    payload: () => ({
      url: `https://${pick(['api.acme.dev', 'hooks.northwind.co', 'svc.fintechly.com'])}/tandav`,
      method: 'POST',
      headers: { 'X-Tandav-Signature': `sha256=${randId()}${randId()}` },
      timeout_ms: 10000,
    }),
  },
  flaky_job: {
    label: 'flaky_job',
    section: 'Chaos',
    description: 'Fails ~50% — live retry demo',
    icon: Dices,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    avgMs: [500, 1400],
    successRate: 0.5,
    payload: () => ({
      failure_rate: 0.5,
      chaos: ['timeout', 'panic', 'refused'][Math.floor(Math.random() * 3)],
      note: 'demo handler for retry/backoff',
    }),
  },
  long_task: {
    label: 'long_task',
    section: 'Compute',
    description: '60s chunked work with progress %',
    icon: Hourglass,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    avgMs: [55000, 70000],
    successRate: 0.9,
    payload: () => ({
      total_units: 1000,
      chunk_size: 50,
      checkpoint: true,
      note: 'reports progress over Kafka',
    }),
  },
}

export const JOB_TYPE_LIST = Object.keys(JOB_TYPES)

export const ERROR_POOL = [
  'dial tcp 34.201.11.9:587: connect: connection refused',
  'context deadline exceeded after 30s',
  'panic: runtime error: index out of range [7] with length 5',
  'upstream 503: payments-api returned Service Unavailable',
  'websocket: close 1006 (abnormal closure): unexpected EOF',
  'write /tmp/report.csv: disk quota exceeded',
  'handler timeout: exceeded max execution window of 120s',
  'redis: exec_lock acquire timeout — duplicate redelivery skipped',
  'S3 PutObject: 400 SlowDownReduceYourRequestRate',
]

export const STATUSES = {
  PENDING: { label: 'Pending', tone: 'amber' },
  QUEUED: { label: 'Queued', tone: 'blue' },
  RUNNING: { label: 'Running', tone: 'cyan' },
  RETRYING: { label: 'Retrying', tone: 'orange' },
  SUCCEEDED: { label: 'Succeeded', tone: 'emerald' },
  FAILED: { label: 'Failed', tone: 'rose' },
  DEAD: { label: 'Dead', tone: 'red' },
  CANCELED: { label: 'Canceled', tone: 'zinc' },
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randId() {
  return Math.random().toString(36).slice(2, 10)
}

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
