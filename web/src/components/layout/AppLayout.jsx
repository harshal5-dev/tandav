import { Outlet } from 'react-router-dom'
import { useRealtimeSimulation } from '@/hooks/useRealtimeSimulation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export default function AppLayout() {
  useRealtimeSimulation()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-4 pb-10 pt-4 md:px-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
