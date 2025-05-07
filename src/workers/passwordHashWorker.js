/* eslint-disable no-restricted-globals */

let isCancelled = false;
let currentTaskUuid = null;

// Helper function to convert string to ArrayBuffer
function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}

// Helper function to convert ArrayBuffer to hex string
function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (event) => {
  const { type, password, saltRounds, uuid } = event.data;
  
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
    const hashedPassword = await hashPassword(password, saltRounds, uuid);
    postMessage({ uuid, msgType: 'success', result: hashedPassword });
  } catch (error) {
    postMessage({ uuid, msgType: 'failure', error: error.message });
  }
  currentTaskUuid = null;
  close();
};

async function hashPassword(password, saltRounds, uuid) {
  // Simulate progress by breaking down the hashing into steps
  const steps = 10;
  const delay = 100; // ms between progress updates
  
  for (let i = 0; i < steps; i++) {
    // Check for cancellation
    if (isCancelled) {
      throw new Error('Task was cancelled');
    }

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Send progress update
    const progress = ((i + 1) / steps) * 100;
    postMessage({ uuid, msgType: 'progress', progress });
  }

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = arrayBufferToHex(salt);

  // Hash password with salt using SHA-256
  const passwordBuffer = stringToArrayBuffer(password);
  const saltBuffer = salt;
  const combined = new Uint8Array([...passwordBuffer, ...saltBuffer]);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashHex = arrayBufferToHex(hashBuffer);

  return {
    hash: hashHex,
    salt: saltHex,
    saltRounds: saltRounds
  };
}
