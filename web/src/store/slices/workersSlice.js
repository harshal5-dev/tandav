import { createSlice } from '@reduxjs/toolkit'
import { createWorkers } from '@/data/seed'

const workersSlice = createSlice({
  name: 'workers',
  initialState: { list: createWorkers() },
  reducers: {
    workersPatched(state, action) {
      const byId = new Map(action.payload.map((w) => [w.id, w]))
      state.list = state.list.map((w) => byId.get(w.id) ?? w)
    },
  },
})

export const { workersPatched } = workersSlice.actions

export const selectWorkers = (state) => state.workers.list
export const selectOnlineWorkers = (state) => state.workers.list.filter((w) => w.status === 'online')

export default workersSlice.reducer
