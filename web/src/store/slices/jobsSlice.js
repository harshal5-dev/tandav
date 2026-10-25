import { createSlice } from '@reduxjs/toolkit'
import { createInitialJobs } from '@/data/seed'

const initialState = {
  list: createInitialJobs(),
  filters: {
    status: 'all',
    type: 'all',
    q: '',
  },
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    /** Merge full job objects produced by the realtime simulation / user actions. */
    jobsPatched(state, action) {
      const byId = new Map(action.payload.map((j) => [j.id, j]))
      state.list = state.list.map((j) => byId.get(j.id) ?? j)
      const newJobs = action.payload.filter((j) => !state.list.some((e) => e.id === j.id))
      if (newJobs.length) state.list.push(...newJobs)
    },
    jobsPruned(state, action) {
      const drop = new Set(action.payload)
      state.list = state.list.filter((j) => !drop.has(j.id))
    },
    filtersSet(state, action) {
      Object.assign(state.filters, action.payload)
    },
  },
})

export const { jobsPatched, jobsPruned, filtersSet } = jobsSlice.actions

export const selectAllJobs = (state) => state.jobs.list
export const selectFilters = (state) => state.jobs.filters

export const ACTIVE_STATUSES = ['PENDING', 'QUEUED', 'RUNNING', 'RETRYING']

export function selectJobById(state, id) {
  return state.jobs.list.find((j) => j.id === id)
}

export function selectJobsFiltered(state) {
  const { status, type, q } = state.jobs.filters
  const query = q.trim().toLowerCase()
  return state.jobs.list.filter((j) => {
    if (status === 'active' && !ACTIVE_STATUSES.includes(j.status)) return false
    if (status !== 'all' && status !== 'active' && j.status !== status) return false
    if (type !== 'all' && j.type !== type) return false
    if (query) {
      const hay = `${j.id} ${j.type} ${j.idempotencyKey ?? ''} ${JSON.stringify(j.payload)}`.toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })
}

export function selectCountsByStatus(state) {
  const counts = {}
  for (const j of state.jobs.list) counts[j.status] = (counts[j.status] || 0) + 1
  return counts
}

export default jobsSlice.reducer
