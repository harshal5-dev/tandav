import { createSlice } from '@reduxjs/toolkit'
import { createInitialEvents } from '@/data/seed'
import { createInitialJobs } from '@/data/seed'

// seed events are derived once from the same seeded dataset so feed & table agree
const seedJobs = createInitialJobs()

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    list: createInitialEvents(seedJobs),
    paused: false,
  },
  reducers: {
    eventsPushed(state, action) {
      state.list = [...action.payload, ...state.list].slice(0, 60)
    },
    liveToggled(state, action) {
      state.paused = action.payload ?? !state.paused
    },
  },
})

export const { eventsPushed, liveToggled } = eventsSlice.actions

export const selectEvents = (state) => state.events.list
export const selectLivePaused = (state) => state.events.paused

export default eventsSlice.reducer
