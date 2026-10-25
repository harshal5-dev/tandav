import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { tickRealtime } from '@/store/realtime'
import { selectLivePaused } from '@/store/slices/eventsSlice'

/**
 * Drives the mock realtime feed (stands in for the WebSocket connection
 * from the design). Pausing stops all state transitions — like the
 * dashboard losing its ws connection while jobs keep running server-side.
 */
export function useRealtimeSimulation(intervalMs = 2400) {
  const dispatch = useDispatch()
  const paused = useSelector(selectLivePaused)

  useEffect(() => {
    if (paused) return undefined
    const id = setInterval(() => dispatch(tickRealtime()), intervalMs)
    return () => clearInterval(id)
  }, [dispatch, paused, intervalMs])
}
