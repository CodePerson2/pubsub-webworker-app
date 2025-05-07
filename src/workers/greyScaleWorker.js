/* eslint-disable no-restricted-globals */

let isCancelled = false;
let currentTaskUuid = null;

self.onmessage = async (event) => {
  const { type, bitmap, uuid } = event.data;
  
  if (type === 'cancel') {
    isCancelled = true;
    if (currentTaskUuid === uuid) {
      currentTaskUuid = null;
      postMessage({ uuid, msgType: 'failure', error: 'Task was cancelled' });
      close();
    }
    return;
  }

  currentTaskUuid = uuid;
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const result = await applyGrayscale(canvas, uuid);
    postMessage({ uuid, msgType: 'success', result });
  } catch (error) {
    postMessage({ uuid, msgType: 'failure', error: error.message });
  }
  currentTaskUuid = null;
  close();
};

async function applyGrayscale(canvas, uuid) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Apply heavy filter to simulate long-running task
  for (let i = 0; i < data.length; i += 4) {
    // Check for cancellation every iteration
    if (isCancelled) {
      throw new Error('Task was cancelled');
    }

    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // red
    data[i + 1] = avg; // green
    data[i + 2] = avg; // blue

    // Send progress updates
    if (i % 1000 === 0) {
      const progress = (i / data.length) * 100;
      postMessage({ uuid, msgType: 'progress', progress });
      
      // Check for cancellation after sending progress
      if (isCancelled) {
        throw new Error('Task was cancelled');
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  
  // Convert canvas to blob
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
  
  // Convert blob to base64
  const base64Result = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(`Failed to convert blob to base64: ${error.message}`));
    reader.readAsDataURL(blob);
  });
  
  return base64Result;
}
