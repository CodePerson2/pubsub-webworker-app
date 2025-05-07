import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { startTask, taskCancelled } from '../store/tasksSlice';
import TaskItem from './TaskItem';
import { WORKER_TYPES, WORKER_TYPE_LABELS } from '../constants/workerTypes';
import ImageResult from './ImageResult';
import PasswordHashResult from './PasswordHashResult';
import TextSummarizationResult from './TextSummarizationResult';
import './PasswordHashResult.css';
import { clearDB } from '../db/indexedDB';
import './TaskList.css';

// Helper function to prepare inputs for Redux store
const prepareInputs = (inputs, type) => {
  if (type === WORKER_TYPES.IMAGE_TO_GREYSCALE && inputs instanceof File) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: inputs.name,
          size: inputs.size,
          type: inputs.type,
          lastModified: inputs.lastModified,
          base64: e.target.result
        });
      };
      reader.readAsDataURL(inputs);
    });
  }
  return Promise.resolve(inputs);
};

const TaskList = () => {
  const [inputVal, setInputVal] = useState('');
  const [selectedWorkerType, setSelectedWorkerType] = useState(WORKER_TYPES.IMAGE_TO_GREYSCALE);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileCache = useRef(new Map()); // Cache for File objects
  const tasks = useSelector(s => s.tasks.byId);
  const order = useSelector(s => [...s.tasks.queue, ...s.tasks.running]);
  const dispatch = useDispatch();

  // Expose file cache to window for worker access
  React.useEffect(() => {
    window.fileCache = fileCache.current;
    return () => {
      delete window.fileCache;
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleStart = async () => {
    if (selectedWorkerType === WORKER_TYPES.IMAGE_TO_GREYSCALE && selectedFile) {
      const preparedInputs = await prepareInputs(selectedFile, selectedWorkerType);
      dispatch(startTask({ 
        inputs: preparedInputs,
        type: selectedWorkerType
      }));
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    } else if (selectedWorkerType === WORKER_TYPES.PASSWORD_HASH) {
      const password = inputVal;
      if (password) {
        dispatch(startTask({ 
          inputs: {
            password,
            saltRounds: 10
          },
          type: selectedWorkerType 
        }));
        setInputVal('');
      }
    } else if (selectedWorkerType === WORKER_TYPES.TEXT_SUMMARIZATION) {
      const text = inputVal;
      if (text && text.trim().split(/\s+/).length >= 20) {
        console.log('Starting text summarization with:', text);
        dispatch(startTask({ 
          inputs: text,
          type: selectedWorkerType 
        }));
        setInputVal('');
      }
    }
  };

  const handleDelete = (uuid) => {
    dispatch(taskCancelled({ uuid }));
  };

  const handleClearDB = async () => {
    try {
      // First clear the IndexedDB
      await clearDB();
      console.log('IndexedDB cleared successfully');
    } catch (error) {
      console.error('Failed to clear database:', error);
    }
  };

  const renderResult = (task) => {
    if (task.status !== 'success') return null;

    switch (task.type) {
      case WORKER_TYPES.IMAGE_TO_GREYSCALE:
        return (
          <ImageResult
            key={task.uuid}
            result={task.result}
            uuid={task.uuid}
            onDelete={() => handleDelete(task.uuid)}
          />
        );

      case WORKER_TYPES.PASSWORD_HASH:
        return (
          <PasswordHashResult
            key={task.uuid}
            result={task.result}
            uuid={task.uuid}
            onDelete={() => handleDelete(task.uuid)}
          />
        );
      case WORKER_TYPES.TEXT_SUMMARIZATION:
        return (
          <TextSummarizationResult
            key={task.uuid}
            result={task.result}
            uuid={task.uuid}
            onDelete={() => handleDelete(task.uuid)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="task-list-container">
      <div className="header-controls">
        <h1>Task Runner</h1>
        <button className="clear-db-button" onClick={handleClearDB}>
          Clear All Results
        </button>
      </div>
      <div className="task-controls">
        <select 
          value={selectedWorkerType} 
          onChange={(e) => {
            setSelectedWorkerType(e.target.value);
            setInputVal('');
            setSelectedFile(null);
            // Reset the file input when switching types
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
              fileInput.value = '';
            }
          }}
        >
          {Object.entries(WORKER_TYPES).map(([key, value]) => (
            <option key={value} value={value}>
              {WORKER_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
        
        {selectedWorkerType === WORKER_TYPES.IMAGE_TO_GREYSCALE ? (
          <div>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              key={selectedWorkerType} // Add key to force re-render when type changes
            />
          </div>
        ) : (
          <div>
            <textarea 
              rows="4"
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)} 
              placeholder={selectedWorkerType === WORKER_TYPES.PASSWORD_HASH ? 
                "Enter password to hash" : 
                "Enter text to summarize (minimum 20 words)"}
            />
          </div>
        )}
        
        <button 
          onClick={handleStart}
          disabled={
            (selectedWorkerType === WORKER_TYPES.IMAGE_TO_GREYSCALE && !selectedFile) ||
            (selectedWorkerType === WORKER_TYPES.PASSWORD_HASH && !inputVal) ||
            (selectedWorkerType === WORKER_TYPES.TEXT_SUMMARIZATION && (!inputVal || inputVal.trim().split(/\s+/).length < 20))
          }
        >
          Start Task
        </button>
      </div>
      
      <div className="active-tasks">
        <h2>Active Tasks</h2>
        <ul>
          {order.map(id => <TaskItem key={id} task={tasks[id]} />)}
        </ul>
      </div>

      <div className="results">
        <h2>Results</h2>
        <div className="results-grid">
          {Object.values(tasks)
            .filter(task => task.status === 'success')
            .map(task => renderResult(task))}
        </div>
      </div>
    </div>
  );
};

export default TaskList;