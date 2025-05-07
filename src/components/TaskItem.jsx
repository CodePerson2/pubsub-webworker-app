import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { taskCancelled, startTask } from '../store/tasksSlice';
import { WORKER_TYPES } from '../constants/workerTypes';

const TaskItem = ({ task }) => {
  const dispatch = useDispatch();
  const { uuid, status, progress, result, error, inputs, type } = task;

  const handleCancel = () => {
    console.log('Cancel button clicked for task:', uuid);
    dispatch(taskCancelled({ uuid }));
  };

  const displayInput = () => {
    switch (type) {
      case WORKER_TYPES.IMAGE_TO_GREYSCALE:
        return inputs instanceof File ? inputs.name : 'Image file';
      case WORKER_TYPES.PASSWORD_HASH:
        return 'Hash Password';
      case WORKER_TYPES.TEXT_SUMMARIZATION:
        return 'Summarize Text';
      default:
        return String(inputs);
    }
  };

  return (
    <li>
      <strong>{displayInput()}</strong> — {status}
      {status === 'running' && <span> ({Math.round(progress)}%)</span>}
      {status === 'failure' && <button onClick={() => dispatch(startTask({ inputs, type }))}>Retry</button>}
      {(status === 'running' || status === 'queued') && <button onClick={handleCancel}>Cancel</button>}
      {status === 'success' && <div>Result: {result}</div>}
      {error && <div>Error: {error}</div>}
    </li>
  );
};

export default TaskItem;