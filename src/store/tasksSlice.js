import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  byId: {},       // { [uuid]: { inputs, type, status, progress, result, error, timestamp } }
  queue: [],      // UUIDs waiting to run
  running: []     // UUIDs currently running (max 3)
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    startTask: (state, action) => {}, // handled by middleware
    taskRehydrated: (state, action) => {
      const rec = action.payload;
      state.byId[rec.uuid] = rec;
    },
    taskQueued: (state, action) => {
      const { uuid, inputs, type, timestamp } = action.payload;
      state.byId[uuid] = { inputs, type, status: 'queued', progress: 0, result: null, error: null, timestamp };
      state.queue.push(uuid);
    },
    taskRunning: (state, action) => {
      const { uuid } = action.payload;
      state.byId[uuid].status = 'running';
      state.byId[uuid].progress = 0;
      state.queue = state.queue.filter(id => id !== uuid);
      state.running.push(uuid);
    },
    taskProgress: (state, action) => {
      const { uuid, progress } = action.payload;
      state.byId[uuid].progress = progress;
    },
    taskSuccess: (state, action) => {
      const { uuid, result } = action.payload;
      state.byId[uuid].status = 'success';
      state.byId[uuid].result = result;
      state.byId[uuid].progress = 100;
      state.running = state.running.filter(id => id !== uuid);
    },
    taskFailure: (state, action) => {
      const { uuid, error } = action.payload;
      state.byId[uuid].status = 'failure';
      state.byId[uuid].error = error;
      state.running = state.running.filter(id => id !== uuid);
    },
    taskCancelled: (state, action) => {
      const { uuid } = action.payload;
      state.byId[uuid].status = 'cancelled';
      state.running = state.running.filter(id => id !== uuid);
    }
  }
});

export const {
  startTask,
  taskRehydrated,
  taskQueued,
  taskRunning,
  taskProgress,
  taskSuccess,
  taskFailure,
  taskCancelled
} = tasksSlice.actions;

export default tasksSlice.reducer;