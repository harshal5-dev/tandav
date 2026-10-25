import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Drum } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-violet-500/25">
        <Drum className="h-7 w-7 text-white" />
      </div>
      <div className="font-mono text-4xl font-semibold tracking-tight">404</div>
      <p className="max-w-sm text-sm text-muted-foreground">
        This beat doesn&apos;t exist. The dance continues elsewhere.
      </p>
      <Button asChild>
        <Link to="/">Back to the rhythm</Link>
      </Button>
    </div>
  )
}
