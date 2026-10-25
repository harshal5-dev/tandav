import { Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import DeadLetterQueue from '@/pages/DeadLetterQueue'
import Workers from '@/pages/Workers'
import SubmitJob from '@/pages/SubmitJob'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/dlq" element={<DeadLetterQueue />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/submit" element={<SubmitJob />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </TooltipProvider>
  )
}
