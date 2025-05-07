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
import { WORKER_TYPES, MAX_WORKERS } from '../constants/workerTypes';

const getWorkerPath = (type) => {
  switch (type) {
    case WORKER_TYPES.IMAGE_TO_GREYSCALE:
      return new URL('../workers/greyScaleWorker.js', import.meta.url);
    case WORKER_TYPES.PASSWORD_HASH:
      return new URL('../workers/passwordHashWorker.js', import.meta.url);
    case WORKER_TYPES.TEXT_SUMMARIZATION:
      return new URL('../workers/textSummarizationWorker.js', import.meta.url);
    default:
      throw new Error(`Unknown worker type: ${type}`);
  }
};

const prepareWorkerData = (type, inputs, uuid) => {
  switch (type) {
    case WORKER_TYPES.IMAGE_TO_GREYSCALE:
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = new OffscreenCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get 2d context from canvas');
            }
            ctx.drawImage(img, 0, 0);
            const bitmap = canvas.transferToImageBitmap();
            resolve({ bitmap, uuid });
          } catch (error) {
            reject(new Error(`Failed to process image: ${error.message}`));
          }
        };
        img.onerror = (error) => {
          reject(new Error('Failed to load image'));
        };
        if (inputs?.base64) {
          img.src = inputs.base64;
        } else {
          reject(new Error('No base64 image data found'));
        }
      });
    case WORKER_TYPES.PASSWORD_HASH:
      console.log('Preparing password hash data:', inputs);
      return Promise.resolve({ 
        type: WORKER_TYPES.PASSWORD_HASH,
        password: inputs.password, 
        saltRounds: inputs.saltRounds, 
        uuid 
      });
    case WORKER_TYPES.TEXT_SUMMARIZATION:
      console.log('Preparing text summarization data:', inputs);
      return Promise.resolve({ type: WORKER_TYPES.TEXT_SUMMARIZATION, text: inputs, uuid });
    default:
      throw new Error(`Unknown worker type: ${type}`);
  }
};

const prepareInputs = (inputs, type) => {
  if (type === WORKER_TYPES.IMAGE_TO_GREYSCALE && inputs instanceof File) {
    return {
      name: inputs.name,
      size: inputs.size,
      type: inputs.type,
      lastModified: inputs.lastModified
    };
  }
  return inputs;
};

export default function webWorkerMiddleware(storeAPI) {
  const queue = [];
  const workers = {};

  readAllTasks().then(records => {
    records
      .filter(rec => rec.type !== WORKER_TYPES.IMAGE_TO_GREYSCALE || rec.status === 'success')
      .forEach(rec => storeAPI.dispatch(taskRehydrated(rec)));
  });

  const processQueue = () => {
    if (Object.keys(workers).length >= MAX_WORKERS) return;
    const nextTask = queue.shift();
    if (!nextTask) return;
    const { uuid, inputs, type } = nextTask;
    const worker = new Worker(getWorkerPath(type));
    workers[uuid] = worker;
    storeAPI.dispatch(taskRunning({ uuid }));
    writeTask({ uuid, inputs, type, status: 'running', result: null, error: null, timestamp: Date.now() });

    prepareWorkerData(type, inputs, uuid)
      .then(data => worker.postMessage(data, data.bitmap ? [data.bitmap] : []))
      .catch(err => {
        storeAPI.dispatch(taskFailure({ uuid, error: err.message }));
        writeTask({ uuid, inputs, type, status: 'failure', result: null, error: err.message, timestamp: Date.now() });
        delete workers[uuid];
        processQueue();
      });

    worker.onmessage = ({ data }) => {
      const { uuid: id, msgType, progress, result, error } = data;
      if (msgType === 'progress') {
        storeAPI.dispatch(taskProgress({ uuid: id, progress }));
      } else {
        const success = msgType === 'success';
        storeAPI.dispatch(success ? taskSuccess({ uuid: id, result }) : taskFailure({ uuid: id, error }));
        writeTask({
          uuid: id,
          inputs,
          type,
          status: success ? 'success' : 'failure',
          result: success ? result : null,
          error: success ? null : error,
          timestamp: Date.now()
        });
        worker.terminate();
        delete workers[id];
        processQueue();
      }
    };

    worker.onerror = e => {
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
      storeAPI.dispatch(taskQueued({ uuid, inputs, type, timestamp }));
      writeTask({ uuid, inputs, type, status: 'queued', result: null, error: null, timestamp });
      queue.push({ uuid, inputs, type });
      processQueue();
      return;
    }

    if (action.type === taskCancelled.type) {
      const { uuid } = action.payload;
      const w = workers[uuid];
      if (w) {
        w.terminate();
        delete workers[uuid];
      } else {
        const idx = queue.findIndex(item => item.uuid === uuid);
        if (idx !== -1) queue.splice(idx, 1);
      }
      const task = storeAPI.getState().tasks.byId[uuid];
      writeTask({ uuid, inputs: task.inputs, type: task.type, status: 'cancelled', result: null, error: null, timestamp: Date.now() });
      next(action);
      processQueue();
      return;
    }

    return next(action);
  };
}