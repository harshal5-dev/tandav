import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Plus, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { JobsTable } from '@/components/jobs/JobsTable'
import { filtersSet, selectFilters, selectJobsFiltered, selectCountsByStatus } from '@/store/slices/jobsSlice'
import { JOB_TYPES, JOB_TYPE_LIST } from '@/data/jobTypes'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'RETRYING', label: 'Retrying' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'DEAD', label: 'Dead' },
]

export default function Jobs() {
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)
  const counts = useSelector(selectCountsByStatus)
  const filtered = useSelector(selectJobsFiltered)
  const total = useSelector((state) => state.jobs.list.length)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [filters])

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.updatedAt - a.updatedAt), [filtered])
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jobs"
        description="Every job in the cluster with its full state machine — filter, search, and drill into attempt history."
        actions={
          <Button asChild>
            <Link to="/submit">
              <Plus className="h-4 w-4" /> Submit job
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={filters.status}
              onValueChange={(v) => dispatch(filtersSet({ status: v }))}
            >
              <TabsList className="h-8 w-full justify-start overflow-x-auto scrollbar-slim">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="gap-1.5 px-2.5 text-xs"
                  >
                    {t.label}
                    <CountChip value={t.value} counts={counts} total={total} />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="ml-auto flex items-center gap-2">
              <Input
                placeholder="Search id, type, key…"
                className="h-8 w-52 text-xs"
                value={filters.q}
                onChange={(e) => dispatch(filtersSet({ q: e.target.value }))}
              />
              <Select value={filters.type} onValueChange={(v) => dispatch(filtersSet({ type: v }))}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All types</SelectItem>
                  {JOB_TYPE_LIST.map((t) => (
                    <SelectItem key={t} value={t} className="gap-2 font-mono text-xs">
                      <span className={cn('flex items-center gap-2', JOB_TYPES[t].color)}>
                        {JOB_TYPES[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            showing <span className="font-medium text-foreground">{rows.length}</span> of{' '}
            <span className="font-medium text-foreground">{sorted.length}</span> jobs
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2 pb-0">
          {rows.length > 0 ? (
            <JobsTable jobs={rows} />
          ) : (
            <EmptyState onClear={() => dispatch(filtersSet({ status: 'all', type: 'all', q: '' }))} />
          )}
        </CardContent>
        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              page {safePage} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function CountChip({ value, counts, total }) {
  const n =
    value === 'all' ? total : value === 'active'
      ? ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING'].reduce((a, s) => a + (counts[s] || 0), 0)
      : counts[value] || 0
  return <span className="font-mono text-[10px] text-muted-foreground">{n}</span>
}

function EmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground/50" />
      <div className="text-sm font-medium">No jobs match these filters</div>
      <div className="text-xs text-muted-foreground">The stream is live — new submissions will appear instantly.</div>
      <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}
