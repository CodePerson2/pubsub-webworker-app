import React from 'react';
import { useDispatch } from 'react-redux';
import { taskCancelled, startTask } from '../store/tasksSlice';

const TaskItem = ({ task }) => {
  const dispatch = useDispatch();
  const { uuid, status, progress, result, error, inputs } = task;

  return (
    <li>
      <strong>{inputs}</strong> — {status}
      {status === 'running' && <span> ({progress}%)</span>}
      {status === 'failure' && <button onClick={() => dispatch(startTask({ inputs, type: task.type }))}>Retry</button>}
      {(status === 'running' || status === 'queued') && <button onClick={() => dispatch(taskCancelled({ uuid }))}>Cancel</button>}
      {status === 'success' && <div>Result: {result}</div>}
      {error && <div>Error: {error}</div>}
    </li>
  );
};

export default TaskItem;