import { createSlice } from '@reduxjs/toolkit'
import { createThroughput } from '@/data/seed'

const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    throughput: createThroughput(),
    dispatchLatency: { p50: 42, p95: 87 },
  },
  reducers: {
    throughputTicked(state, action) {
      const { succeeded, failed } = action.payload
      const last = state.throughput.at(-1)
      const now = Date.now()
      if (last && now - last.t < 60_000) {
        last.succeeded += succeeded
        last.failed += failed
      } else {
        state.throughput.push({
          t: now,
          label: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          succeeded,
          failed,
        })
        if (state.throughput.length > 30) state.throughput.shift()
      }
      state.dispatchLatency = {
        p50: 38 + Math.round(Math.random() * 12),
        p95: 74 + Math.round(Math.random() * 26),
      }
    },
  },
})

export const { throughputTicked } = statsSlice.actions

export const selectThroughput = (state) => state.stats.throughput
export const selectDispatchLatency = (state) => state.stats.dispatchLatency

export default statsSlice.reducer
