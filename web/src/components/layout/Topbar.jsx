import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Plus, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/hooks/useTheme'
import { liveToggled, selectLivePaused } from '@/store/slices/eventsSlice'
import { filtersSet } from '@/store/slices/jobsSlice'
import { cn } from '@/lib/utils'

const TITLES = {
  '/': 'Overview',
  '/jobs': 'Jobs',
  '/dlq': 'Dead Letter Queue',
  '/workers': 'Workers',
  '/submit': 'Submit Job',
}

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const paused = useSelector(selectLivePaused)

  const title = location.pathname.startsWith('/jobs/') ? 'Job Detail' : (TITLES[location.pathname] ?? 'Tandav')

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">tandav</span>
          <span className="hidden sm:inline text-muted-foreground/50">/</span>
          <span className="truncate font-medium text-foreground">{title}</span>
        </div>
      </div>

      <div className="relative ml-auto hidden w-64 lg:block">
        <Input
          placeholder="Search jobs, types, keys…"
          className="h-8 pl-8 text-xs"
          onChange={(e) => {
            dispatch(filtersSet({ q: e.target.value }))
            if (location.pathname !== '/jobs') navigate('/jobs')
          }}
        />
        <svg
          className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <div className="ml-auto flex items-center gap-3 lg:ml-0">
        <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1">
          <Radio
            className={cn('h-3.5 w-3.5 transition-colors', paused ? 'text-muted-foreground' : 'text-emerald-500')}
          />
          <Label htmlFor="live-switch" className="cursor-pointer text-xs font-medium text-muted-foreground">
            {paused ? 'Paused' : 'Live'}
          </Label>
          <Switch id="live-switch" checked={!paused} onCheckedChange={(v) => dispatch(liveToggled(!v))} />
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button size="sm" className="h-8 gap-1.5" onClick={() => navigate('/submit')}>
          <Plus className="h-3.5 w-3.5" /> Submit
        </Button>
      </div>
    </header>
  )
}
