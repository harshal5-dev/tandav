import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './slices/jobsSlice'
import workersReducer from './slices/workersSlice'
import eventsReducer from './slices/eventsSlice'
import statsReducer from './slices/statsSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    workers: workersReducer,
    events: eventsReducer,
    stats: statsReducer,
  },
})
