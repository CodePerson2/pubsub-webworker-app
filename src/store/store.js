import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './tasksSlice';
import webWorkerMiddleware from '../middleware/webWorkerMiddleware';

const store = configureStore({
  reducer: { tasks: tasksReducer },
  middleware: (getDefault) => getDefault().concat(webWorkerMiddleware)
});

export default store;