import { cn } from '@/lib/utils'

/** Lightweight JSON syntax tinting for payload viewers. */
function tint(value, key) {
  const keyHtml = key ? `<span class="text-sky-400">"${key}"</span>: ` : ''
  if (value === null) return `${keyHtml}<span class="text-zinc-500">null</span>`
  if (typeof value === 'number') return `${keyHtml}<span class="text-amber-400">${value}</span>`
  if (typeof value === 'boolean') return `${keyHtml}<span class="text-fuchsia-400">${value}</span>`
  if (typeof value === 'string') return `${keyHtml}<span class="text-emerald-400">"${value}"</span>`
  return keyHtml
}

function render(value, indent) {
  const pad = '  '.repeat(indent)
  const padEnd = '  '.repeat(indent - 1)
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    const items = value.map((v) => `${pad}  ${render(v, indent + 1)}`).join(',\n')
    return `[\n${items}\n${padEnd}]`
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (!entries.length) return '{}'
    const items = entries.map(([k, v]) => `${pad}  ${tint(v, k)}${render(v, indent + 1)}`).join(',\n')
    return `{\n${items}\n${padEnd}}`
  }
  return tint(value)
}

export function JsonBlock({ data, className, maxHeight = 'max-h-96' }) {
  const html = render(data, 1)
  return (
    <pre
      className={cn(
        'scrollbar-slim overflow-auto rounded-lg border bg-zinc-950/60 p-4 font-mono text-xs leading-relaxed text-zinc-300',
        maxHeight,
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
