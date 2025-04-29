# Pub/Sub WebWorker App

A **Incomplete** minimal React application demonstrating how to use Redux middleware as a Pub/Sub dispatcher for Web Workers, with results persisted in IndexedDB for durability and a fixed 3‑worker concurrency pool.

## Features

- **Task Dispatch**: Users can start tasks with custom inputs; each task is assigned a UUID via `uuid` library.
- **Progress Updates**: Workers send progress messages back to the main thread for live UI updates.
- **Concurrency Control**: Only up to 3 Web Workers run at the same time; additional tasks queue up.
- **IndexedDB Persistence**: Task inputs, status, results, errors, and timestamps are saved in IndexedDB and rehydrated into Redux on startup.
- **Retry & Cancel**: Failed tasks can be retried; running or queued tasks can be canceled.

## Getting Started

### Installation

```bash
npx create-react-app pubsub-webworker-app
cd pubsub-webworker-app
npm install redux @reduxjs/toolkit react-redux uuid
```  

### Running Locally

```bash
npm start
```  
Open your browser at `http://localhost:3000`.

### Docker Development

```bash
docker-compose up --build
```  
The app runs on `http://localhost:3000` with source files mounted for live reload.

## Project Structure

```
src/
├── App.jsx                 # Root component & Redux Provider
├── db/
│   └── indexedDB.js        # IndexedDB helpers (read/write/rehydration)
├── middleware/
│   └── webWorkerMiddleware.js  # Core Pub/Sub + worker pool logic
├── store/
│   └── tasksSlice.js       # Redux slice for task state
├── workers/
│   └── taskWorker.js       # Web Worker script (progress & result)
└── components/
    ├── TaskList.jsx        # UI for starting & listing tasks
    └── TaskItem.jsx        # UI for individual task status
```

## License
MIT