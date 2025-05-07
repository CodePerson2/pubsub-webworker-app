# WebWorker Pub/Sub Architecture Example

This project is an educational exercise in how to best implement a modern web application using Web Workers, with a centralized publish/subscribe (pub/sub) system to manage task creation, worker pooling, and result collection. The app demonstrates scalable, maintainable patterns for offloading heavy computation from the UI using a Redux-powered pub/sub middleware.

## Why Pub/Sub for Web Workers?

- **Centralized Control:** All background tasks are dispatched, queued, and managed from a single place, making it easy to scale and debug.
- **Loose Coupling:** UI components don’t talk directly to workers—instead, they "publish" tasks and "subscribe" to results, following best practices for separation of concerns.
- **Concurrency Management:** The pub/sub system can enforce worker pool limits, queue overflow, and cancellation in a predictable way.

## How It Works

1. **Task Creation:**
   - UI components dispatch actions ("publish" tasks) to the Redux store, describing what work to do (e.g., summarize text, hash a password, process an image).
   - Each task is given a unique ID and tracked in the global state.

2. **Middleware as Pub/Sub Dispatcher:**
   - Custom Redux middleware acts as the broker. It intercepts task-related actions, manages a queue, and spins up Web Workers as needed (up to a concurrency limit).
   - Results, progress, and errors from workers are "published" back as Redux actions, updating the store and UI.

3. **Worker Pool & Queue:**
   - Only a fixed number of workers run at once. Extra tasks are queued.
   - Tasks can be cancelled or retried; cancellation is handled gracefully whether a task is queued or running.

4. **Result Handling:**
   - As workers complete, results are stored in Redux and persisted (e.g., in IndexedDB).
   - UI components "subscribe" to updates by selecting state from the Redux store.

## Example Web Workers

This app includes three example workers to demonstrate different types of background tasks:

- **Text Summarization Worker:**
  - Takes a block of text and produces a summary, along with metrics (word count, compression ratio, etc.).
- **Image Processing Worker:**
  - Accepts an image and performs transformations or analysis (e.g., resizing, filtering).
- **Password Hashing Worker:**
  - Hashes passwords securely using a salt and multiple rounds, simulating real-world authentication scenarios.

Each worker is fully isolated from the UI, communicates only via messages, and is managed by the central pub/sub system.

## Project Structure

```
src/
├── App.jsx                      # Root component & Redux Provider
├── middleware/
│   └── webWorkerMiddleware.js   # Pub/Sub dispatcher & worker pool logic
├── store/
│   └── tasksSlice.js            # Redux slice for task state
├── workers/
│   ├── textSummarizationWorker.js
│   ├── imageWorker.js
│   └── passwordHashWorker.js
├── components/                  # UI components for tasks & results
└── db/
    └── indexedDB.js             # Persistence helpers
```

## Running the App

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Educational Value

- Learn how to architect a scalable, maintainable background processing system in a React/Redux app.
- See real-world pub/sub patterns applied to web worker management.
- Understand best practices for concurrency, cancellation, and result handling.

---

Feel free to explore or adapt this architecture for your own advanced web worker use cases!
    ├── TaskList.jsx        # UI for starting & listing tasks
    └── TaskItem.jsx        # UI for individual task status
```

## License
MIT