// State
let stream = null;
let isRunning = false;
let lastMotionTime = 0;
let isProcessing = false;
let motionCheckInterval = null;
let isCalibrating = false;

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const previousCanvas = document.getElementById('previousCanvas');
const ctx = canvas.getContext('2d');
const previousCtx = previousCanvas.getContext('2d');
const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const testBtn = document.getElementById('testBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const motionMeter = document.getElementById('motionMeter');
const motionValue = document.getElementById('motionValue');
const motionBar = document.getElementById('motionBar');
const thresholdLine = document.getElementById('thresholdLine');
const sensitivitySlider = document.getElementById('sensitivity');
const sensitivityValue = document.getElementById('sensitivityValue');
const cooldownInput = document.getElementById('cooldown');
const showVideoCheckbox = document.getElementById('showVideo');
const showDebugCheckbox = document.getElementById('showDebug');
const debugSection = document.getElementById('debugSection');
const capturedImage = document.getElementById('capturedImage');
const imageInfo = document.getElementById('imageInfo');
const logDiv = document.getElementById('log');
const arduinoPortSelect = document.getElementById('arduinoPort');
const refreshPortsBtn = document.getElementById('refreshPorts');
const connectArduinoBtn = document.getElementById('connectArduino');
const brightnessSlider = document.getElementById('brightness');
const brightnessValue = document.getElementById('brightnessValue');
const contrastSlider = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');
const brightenVideoCheckbox = document.getElementById('brightenVideo');
const lowLightModeCheckbox = document.getElementById('lowLightMode');

// Settings
let motionThreshold = 20;
let cooldownSeconds = 10;
let showDebug = false;
let imageBrightness = 40;
let imageContrast = 30;
let lowLightMode = false;

// Update sensitivity display
sensitivitySlider.addEventListener('input', (e) => {
  motionThreshold = parseInt(e.target.value);
  sensitivityValue.textContent = motionThreshold;
  // Update threshold line position
  thresholdLine.style.left = motionThreshold + '%';
});

cooldownInput.addEventListener('input', (e) => {
  cooldownSeconds = parseInt(e.target.value);
});

showVideoCheckbox.addEventListener('change', (e) => {
  video.style.display = e.target.checked ? 'block' : 'none';
});

showDebugCheckbox.addEventListener('change', (e) => {
  showDebug = e.target.checked;
  debugSection.style.display = showDebug ? 'block' : 'none';
});

brightnessSlider.addEventListener('input', (e) => {
  imageBrightness = parseInt(e.target.value);
  brightnessValue.textContent = imageBrightness;
});

contrastSlider.addEventListener('input', (e) => {
  imageContrast = parseInt(e.target.value);
  contrastValue.textContent = imageContrast;
});

brightenVideoCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    video.classList.add('brightened');
  } else {
    video.classList.remove('brightened');
  }
});

lowLightModeCheckbox.addEventListener('change', (e) => {
  lowLightMode = e.target.checked;
  if (lowLightMode) {
    log('Low Light Mode enabled - using enhanced detection for dark conditions');
  } else {
    log('Low Light Mode disabled - using standard detection');
  }
});

// Arduino port management
async function loadAvailablePorts() {
  try {
    const response = await fetch('/api/arduino/ports');
    const data = await response.json();
    
    // Clear existing options except first
    arduinoPortSelect.innerHTML = '<option value="">No Arduino (LED disabled)</option>';
    
    // Add available ports
    data.ports.forEach(port => {
      const option = document.createElement('option');
      option.value = port.path;
      option.textContent = `${port.path}${port.manufacturer ? ' - ' + port.manufacturer : ''}`;
      arduinoPortSelect.appendChild(option);
    });
    
    // Select current port if connected
    if (data.currentPort) {
      arduinoPortSelect.value = data.currentPort;
      log(`Arduino connected on ${data.currentPort}`);
    }
    
    log(`Found ${data.ports.length} serial port(s)`);
  } catch (error) {
    log(`Error loading ports: ${error.message}`);
  }
}

async function connectToArduino() {
  const selectedPort = arduinoPortSelect.value;
  
  if (!selectedPort) {
    log('No port selected - Arduino LED control disabled');
    return;
  }
  
  try {
    const response = await fetch('/api/arduino/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: selectedPort })
    });
    
    const data = await response.json();
    
    if (data.success) {
      log(`✅ Connected to Arduino on ${selectedPort}`);
      updateStatus('Arduino connected!');
    } else {
      log(`❌ Failed to connect: ${data.message}`);
      updateStatus(`Arduino connection failed: ${data.message}`, true);
    }
  } catch (error) {
    log(`Error connecting to Arduino: ${error.message}`);
    updateStatus(`Arduino error: ${error.message}`, true);
  }
}

refreshPortsBtn.addEventListener('click', loadAvailablePorts);
connectArduinoBtn.addEventListener('click', connectToArduino);

// Logging
function log(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  logDiv.insertBefore(entry, logDiv.firstChild);

  // Keep only last 20 entries
  while (logDiv.children.length > 20) {
    logDiv.removeChild(logDiv.lastChild);
  }
}

// Update status
function updateStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.borderColor = isError ? '#ff0000' : '#ff6600';
  log(message);
}

// Start webcam
async function startWebcam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        // Request camera settings optimized for low light
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        focusMode: 'continuous'
      }
    });

    video.srcObject = stream;
    
    // Try to apply advanced camera settings for better low-light performance
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    try {
      const constraints = {};
      
      // Increase exposure if supported
      if (capabilities.exposureTime) {
        constraints.exposureTime = capabilities.exposureTime.max;
      }
      
      // Increase ISO/gain if supported (makes image brighter in low light)
      if (capabilities.iso) {
        constraints.iso = capabilities.iso.max;
      }
      
      // Disable auto exposure to keep it bright
      if (capabilities.exposureMode && capabilities.exposureMode.includes('manual')) {
        constraints.exposureMode = 'manual';
      }
      
      if (Object.keys(constraints).length > 0) {
        await videoTrack.applyConstraints({ advanced: [constraints] });
        log('Applied low-light camera settings');
      }
    } catch (err) {
      log('Could not apply advanced camera settings (this is normal for most webcams)');
    }

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        previousCanvas.width = video.videoWidth;
        previousCanvas.height = video.videoHeight;
        resolve();
      };
    });

    log('Webcam started successfully');
    
    // Apply brightness filter if checkbox is checked
    if (brightenVideoCheckbox.checked) {
      video.classList.add('brightened');
    }
    
    return true;
  } catch (error) {
    updateStatus(`Error accessing webcam: ${error.message}`, true);
    return false;
  }
}

// Stop webcam
function stopWebcam() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// Detect motion by comparing frames
function detectMotion() {
  if (!video.videoWidth) return 0;

  // Draw current frame
  ctx.drawImage(video, 0, 0);
  const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Get previous frame
  const previousImageData = previousCtx.getImageData(0, 0, canvas.width, canvas.height);

  // Calculate difference
  let diffCount = 0;
  const pixelStep = 4; // Sample every 4th pixel for performance

  if (lowLightMode) {
    // Low light mode: More sensitive, focuses on any channel change
    for (let i = 0; i < currentImageData.data.length; i += pixelStep * 4) {
      const rDiff = Math.abs(currentImageData.data[i] - previousImageData.data[i]);
      const gDiff = Math.abs(currentImageData.data[i + 1] - previousImageData.data[i + 1]);
      const bDiff = Math.abs(currentImageData.data[i + 2] - previousImageData.data[i + 2]);

      // Use max difference to catch subtle changes in any color channel
      // Especially useful for green-tinted night vision scenarios
      const diff = Math.max(rDiff, gDiff, bDiff);

      // Lower threshold for dark/monochrome conditions
      if (diff > 12) {
        diffCount++;
      }
    }
  } else {
    // Standard mode: Balanced for normal lighting
    for (let i = 0; i < currentImageData.data.length; i += pixelStep * 4) {
      const rDiff = Math.abs(currentImageData.data[i] - previousImageData.data[i]);
      const gDiff = Math.abs(currentImageData.data[i + 1] - previousImageData.data[i + 1]);
      const bDiff = Math.abs(currentImageData.data[i + 2] - previousImageData.data[i + 2]);

      // Average the differences for stable detection
      const diff = (rDiff + gDiff + bDiff) / 3;

      // Reasonable threshold that works in most conditions
      if (diff > 25) {
        diffCount++;
      }
    }
  }

  // Save current frame as previous
  previousCtx.drawImage(video, 0, 0);

  // Calculate motion percentage
  const totalPixels = (canvas.width * canvas.height) / pixelStep;
  const motionPercentage = (diffCount / totalPixels) * 100;

  return motionPercentage;
}

// Capture image from video with brightness enhancement
function captureImage() {
  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = video.videoWidth;
  captureCanvas.height = video.videoHeight;
  const captureCtx = captureCanvas.getContext('2d');
  
  // Draw video frame
  captureCtx.drawImage(video, 0, 0);
  
  // Enhance brightness and contrast for low light
  const imageData = captureCtx.getImageData(0, 0, captureCanvas.width, captureCanvas.height);
  const data = imageData.data;
  
  const brightness = imageBrightness;  // Use slider value
  const contrast = imageContrast;      // Use slider value
  
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness
    data[i] += brightness;     // Red
    data[i + 1] += brightness; // Green
    data[i + 2] += brightness; // Blue
    
    // Apply contrast
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
    
    // Clamp values to 0-255
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }
  
  captureCtx.putImageData(imageData, 0, 0);
  return captureCanvas.toDataURL('image/jpeg', 0.8);
}

// Capture multiple images with delays
async function captureMultipleImages() {
  const images = [];
  const numImages = 3; // Capture 3 images
  const delayMs = 800; // 800ms between captures (total ~1.6 seconds)

  log(`Capturing ${numImages} images...`);
  
  for (let i = 0; i < numImages; i++) {
    const image = captureImage();
    images.push(image);
    log(`Captured image ${i + 1}/${numImages}`);
    
    // Wait before next capture (except for last image)
    if (i < numImages - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return images;
}

// Send greeting request
async function sendGreeting() {
  if (isProcessing) {
    log('Already processing a greeting, skipping...');
    return;
  }

  isProcessing = true;
  updateStatus('Motion detected! Capturing images...');

  try {
    // Capture multiple images
    const images = await captureMultipleImages();
    
    updateStatus('Analyzing costume...');

    // Show first captured image in debug mode
    if (showDebug) {
      capturedImage.src = images[0];
      capturedImage.style.display = 'block';

      // Calculate total size
      const totalSize = images.reduce((sum, img) => sum + img.length, 0);
      const totalSizeKB = ((totalSize * 3) / 4 / 1024).toFixed(1);
      imageInfo.textContent = `${images.length} images | Total size: ${totalSizeKB} KB | Resolution: ${video.videoWidth}x${video.videoHeight}`;
      log(`Sending ${images.length} images (${totalSizeKB} KB total)`);
    }

    const response = await fetch('/api/greet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ images: images })
    });

    const data = await response.json();

    if (!data.success) {
      log(data.message || 'Failed to generate greeting');
      return;
    }

    log(`AI Response: "${data.text}"`);
    updateStatus(`Speaking: "${data.text}"`);

    // Play audio
    const audio = new Audio('data:audio/mp3;base64,' + data.audio);
    audio.play();

    audio.onended = async () => {
      // Notify server that audio finished (to stop LED pulse)
      try {
        await fetch('/api/audio-done', { method: 'POST' });
      } catch (err) {
        console.error('Failed to notify audio done:', err);
      }
      
      if (isRunning) {
        updateStatus('Watching for trick-or-treaters...');
      }
    };

    audio.onerror = (error) => {
      updateStatus('Error playing audio', true);
      log(`Audio error: ${error}`);
      
      // Stop LED pulse on error too
      fetch('/api/audio-done', { method: 'POST' }).catch(() => {});
    };

  } catch (error) {
    updateStatus(`Error: ${error.message}`, true);
  } finally {
    isProcessing = false;
  }
}

// Motion detection loop
function checkForMotion() {
  if (!isRunning && !isCalibrating) return;

  const motion = detectMotion();

  // Update motion meter if calibrating
  if (isCalibrating) {
    motionValue.textContent = motion.toFixed(1) + '%';
    motionBar.style.width = Math.min(100, motion) + '%';
    
    // Change color based on whether it would trigger
    if (motion > motionThreshold) {
      motionValue.style.color = '#ff0000'; // Red when above threshold
    } else {
      motionValue.style.color = '#00ff00'; // Green when below
    }
    return; // Don't trigger greetings during calibration
  }

  // Normal operation - check if motion exceeds threshold and cooldown has passed
  const now = Date.now();
  const timeSinceLastMotion = (now - lastMotionTime) / 1000;

  if (motion > motionThreshold && timeSinceLastMotion > cooldownSeconds && !isProcessing) {
    log(`Motion detected: ${motion.toFixed(1)}%`);
    lastMotionTime = now;

    // Capture multiple images and send
    sendGreeting();
  }
}

// Start monitoring
async function start() {
  if (isRunning) return;

  updateStatus('Starting up...');

  const success = await startWebcam();
  if (!success) return;

  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  testBtn.disabled = true;

  // Start checking for motion every 500ms
  motionCheckInterval = setInterval(checkForMotion, 500);

  updateStatus('Watching for trick-or-treaters...');
}

// Stop monitoring
function stop() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(motionCheckInterval);
  stopWebcam();

  startBtn.disabled = false;
  stopBtn.disabled = true;
  testBtn.disabled = false;

  updateStatus('Stopped. Click START to resume.');
}

// Test greeting with current frame
async function testGreeting() {
  updateStatus('Testing greeting...');

  const success = await startWebcam();
  if (!success) return;

  // Wait a moment for camera to adjust
  setTimeout(() => {
    sendGreeting().then(() => {
      stopWebcam();
    });
  }, 1000);
}

// Calibrate motion detection
async function calibrateMotion() {
  if (isCalibrating) {
    // Stop calibration
    isCalibrating = false;
    clearInterval(motionCheckInterval);
    stopWebcam();
    
    motionMeter.style.display = 'none';
    calibrateBtn.textContent = 'CALIBRATE MOTION';
    startBtn.disabled = false;
    testBtn.disabled = false;
    
    updateStatus('Calibration complete. Adjust threshold as needed.');
    log('Calibration stopped');
    return;
  }

  // Start calibration
  updateStatus('Starting calibration...');
  
  const success = await startWebcam();
  if (!success) return;

  isCalibrating = true;
  motionMeter.style.display = 'block';
  thresholdLine.style.left = motionThreshold + '%';
  calibrateBtn.textContent = 'STOP CALIBRATION';
  startBtn.disabled = true;
  testBtn.disabled = true;
  
  // Start checking for motion every 200ms for smoother updates
  motionCheckInterval = setInterval(checkForMotion, 200);
  
  updateStatus('Calibrating... Move around to see motion levels. Adjust threshold slider.');
  log('Calibration mode active - watching motion levels');
}

// Event listeners
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
testBtn.addEventListener('click', testGreeting);
calibrateBtn.addEventListener('click', calibrateMotion);

// Initialize
log('HalloWeenie initialized. Ready to spook!');
loadAvailablePorts(); // Load available ports on startup
