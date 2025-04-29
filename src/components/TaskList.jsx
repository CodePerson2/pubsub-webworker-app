import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { startTask } from '../store/tasksSlice';
import TaskItem from './TaskItem';

const TaskList = () => {
  const [inputVal, setInputVal] = useState('');
  const tasks = useSelector(s => s.tasks.byId);
  const order = useSelector(s => [...s.tasks.queue, ...s.tasks.running]);
  const dispatch = useDispatch();

  const handleStart = () => {
    dispatch(startTask({ inputs: inputVal, type: 'example' }));
    setInputVal('');
  };

  return (
    <div>
      <h1>Task Runner</h1>
      <input value={inputVal} onChange={e => setInputVal(e.target.value)} />
      <button onClick={handleStart}>Start Task</button>
      <ul>
        {order.map(id => <TaskItem key={id} task={tasks[id]} />)}
      </ul>
    </div>
  );
};

export default TaskList;