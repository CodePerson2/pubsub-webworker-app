/* eslint-disable no-restricted-globals */

addEventListener('message', async (e) => {
    const { uuid, inputs, type } = e.data;
  
    // 1. Simulate work and send progress updates
    for (let pct = 10; pct <= 100; pct += 10) {
      postMessage({ uuid, msgType: 'progress', progress: pct });
      await new Promise(r => setTimeout(r, 200));
    }
  
    // 2. Once “work” is done, send success (or failure)
    try {
      const result = `Processed: ${inputs}`;  // replace with real logic
      postMessage({ uuid, msgType: 'success', result });
    } catch (err) {
      postMessage({ uuid, msgType: 'failure', error: err.message });
    }
  
    // 3. Close the worker
    close();
  });