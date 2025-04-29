import { writeTask, readAllTasks } from '../db/indexedDB';
import {
  startTask as startTaskAction,
  taskRehydrated,
  taskQueued,
  taskRunning,
  taskProgress,
  taskSuccess,
  taskFailure,
  taskCancelled
} from '../store/tasksSlice';
import { v4 as uuidv4 } from 'uuid';

const MAX_WORKERS = 3;

export default function webWorkerMiddleware(storeAPI) {
  const queue = [];
  const workers = {};

  // Rehydrate on startup
  readAllTasks().then(records => {
    records.forEach(rec => storeAPI.dispatch(taskRehydrated(rec)));
  });

  const processQueue = () => {
    if (Object.keys(workers).length >= MAX_WORKERS) return;
    const next = queue.shift();
    if (!next) return;

    const { uuid, inputs, type } = next;
    const worker = new Worker(new URL('../workers/taskWorker.js', import.meta.url));
    workers[uuid] = worker;

    // mark running
    storeAPI.dispatch(taskRunning({ uuid }));
    writeTask({ uuid, inputs, type, status: 'running', result: null, error: null, timestamp: Date.now() });

    worker.postMessage({ uuid, inputs, type });

    worker.onmessage = ({ data }) => {
      const { uuid: id, msgType, progress, result, error } = data;

      if (msgType === 'progress') {
        storeAPI.dispatch(taskProgress({ uuid: id, progress }));
      }

      if (msgType === 'success' || msgType === 'failure') {
        if (msgType === 'success') {
          storeAPI.dispatch(taskSuccess({ uuid: id, result }));
          writeTask({ uuid: id, inputs, type, status: 'success', result, error: null, timestamp: Date.now() });
        } else {
          storeAPI.dispatch(taskFailure({ uuid: id, error }));
          writeTask({ uuid: id, inputs, type, status: 'failure', result: null, error, timestamp: Date.now() });
        }

        // cleanup
        worker.terminate();
        delete workers[id];
        processQueue();
      }
    };

    worker.onerror = (e) => {
      storeAPI.dispatch(taskFailure({ uuid, error: e.message }));
      writeTask({ uuid, inputs, type, status: 'failure', result: null, error: e.message, timestamp: Date.now() });
      worker.terminate();
      delete workers[uuid];
      processQueue();
    };
  };

  return next => action => {
    if (action.type === startTaskAction.type) {
        const { inputs, type } = action.payload;
        const uuid = uuidv4();
        const timestamp = Date.now();
      
        // 1) dispatch queued synchronously so state.byId[uuid] exists
        storeAPI.dispatch(taskQueued({ uuid, inputs, type, timestamp }));
      
        // 2) persist in the background (no need to await)
        writeTask({ uuid, inputs, type, status: 'queued', result: null, error: null, timestamp })
          .catch(err => console.error('IDB write failed', err));
      
        // 3) enqueue & maybe spawn immediately
        queue.push({ uuid, inputs, type });
        processQueue();
      
        return;
    }

    if (action.type === taskCancelled.type) {
      const { uuid } = action.payload;
      const w = workers[uuid];
      if (w) w.terminate();
      delete workers[uuid];
      writeTask({ ...storeAPI.getState().tasks.byId[uuid] });
      processQueue();
      return;
    }

    return next(action);
  };
}