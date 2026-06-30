// ==========================================
// INFRASTRUCTURE: MEDIAPIPE CAMERA & AI SERVICE
// ==========================================

let cameraStream = null;
let previewStream = null;

// Populate camera dropdown
async function updateCameraList() {
  const cameraSelect = document.getElementById("cameraSelect");
  if (!cameraSelect) return;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    // Keep the default option
    cameraSelect.innerHTML = '<option value="">-- กล้องเริ่มต้นของระบบ (Default) --</option>';

    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `กล้องตัวที่ ${index + 1} (Camera ${index + 1})`;
      cameraSelect.appendChild(option);
    });

    // Auto-select preferred camera if saved
    const preferredId = localStorage.getItem("preferredCameraId");
    if (preferredId && videoDevices.some(d => d.deviceId === preferredId)) {
      cameraSelect.value = preferredId;
    }
  } catch (err) {
    console.warn("Failed to enumerate camera devices:", err);
  }
}

// Start camera stream for preview modal
async function startPreviewStream() {
  const cameraSelect = document.getElementById("cameraSelect");
  const cameraPreviewVideo = document.getElementById("cameraPreviewVideo");
  const previewLoadingText = document.getElementById("previewLoadingText");
  
  if (!cameraPreviewVideo) return;

  // Stop old preview stream if running
  if (previewStream) {
    previewStream.getTracks().forEach(track => track.stop());
    previewStream = null;
  }

  if (previewLoadingText) {
    previewLoadingText.innerText = "กำลังเชื่อมต่อกล้อง...";
    previewLoadingText.classList.remove("hidden");
  }

  try {
    const selectedDeviceId = cameraSelect ? cameraSelect.value : localStorage.getItem("preferredCameraId");
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 360 },
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      },
      audio: false
    };

    previewStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraPreviewVideo.srcObject = previewStream;
    
    cameraPreviewVideo.onloadedmetadata = () => {
      cameraPreviewVideo.play().then(() => {
        if (previewLoadingText) previewLoadingText.classList.add("hidden");
      }).catch(err => {
        console.warn("Preview video play failed:", err);
      });
    };

    // Refresh the camera list to get labels if we just got permission
    await updateCameraList();
  } catch (err) {
    console.warn("Failed to start camera preview:", err);
    if (previewLoadingText) {
      previewLoadingText.innerText = "ไม่สามารถเชื่อมต่อกล้องนี้ได้";
      previewLoadingText.classList.remove("hidden");
    }
  }
}

// Stop preview stream
function stopPreviewStream() {
  const cameraPreviewVideo = document.getElementById("cameraPreviewVideo");
  if (previewStream) {
    previewStream.getTracks().forEach(track => track.stop());
    previewStream = null;
  }
  if (cameraPreviewVideo) {
    cameraPreviewVideo.srcObject = null;
  }
}

// Listen to camera settings modal and selection changes
document.addEventListener("DOMContentLoaded", () => {
  const cameraSelect = document.getElementById("cameraSelect");
  const cameraSettingsBtn = document.getElementById("cameraSettingsBtn");
  const closeCameraSettingsModalBtn = document.getElementById("closeCameraSettingsModalBtn");
  const saveCameraSettingsBtn = document.getElementById("saveCameraSettingsBtn");
  const cameraSettingsModal = document.getElementById("cameraSettingsModal");

  if (cameraSettingsBtn && cameraSettingsModal) {
    cameraSettingsBtn.addEventListener("click", () => {
      cameraSettingsModal.classList.remove("hidden");
      updateCameraList().then(() => {
        startPreviewStream();
      });
    });
  }

  if (closeCameraSettingsModalBtn && cameraSettingsModal) {
    closeCameraSettingsModalBtn.addEventListener("click", () => {
      cameraSettingsModal.classList.add("hidden");
      stopPreviewStream();
    });
  }

  if (saveCameraSettingsBtn && cameraSettingsModal) {
    saveCameraSettingsBtn.addEventListener("click", () => {
      if (cameraSelect) {
        localStorage.setItem("preferredCameraId", cameraSelect.value);
      }
      cameraSettingsModal.classList.add("hidden");
      stopPreviewStream();
      showTemporaryToast("บันทึกการตั้งค่ากล้องเว็บแคมสำเร็จ!");
    });
  }

  if (cameraSelect) {
    cameraSelect.addEventListener("change", () => {
      if (cameraSelect.value) {
        localStorage.setItem("preferredCameraId", cameraSelect.value);
      } else {
        localStorage.removeItem("preferredCameraId");
      }
      startPreviewStream();
    });
  }

  // Try to load cameras on start (might not have labels yet until permission is granted)
  updateCameraList();
});

async function initCameraAndAI() {
  if (cameraInstance) return; 

  loadingOverlay.classList.remove("hidden");
  cameraStatus.className = "flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700";
  cameraStatus.innerHTML = `<span class="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span><span>กำลังต่อสัญญาณ AI...</span>`;

  try {
    // Prevent crashes if the CDN script failed to load or was blocked by an adblocker
    if (typeof Hands === 'undefined') {
      throw new Error("MediaPipe Hands library is not loaded. Please check your internet connection or disable adblockers.");
    }

    handsDetector = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsDetector.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    handsDetector.onResults(onHandResults);

    // Get camera constraints
    const cameraSelect = document.getElementById("cameraSelect");
    const selectedDeviceId = cameraSelect ? cameraSelect.value : localStorage.getItem("preferredCameraId");
    
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      },
      audio: false
    };

    // Start camera stream manually
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = cameraStream;
    
    // Play video element
    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(resolve).catch(reject);
      };
      // Timeout fallback
      setTimeout(() => resolve(), 3000);
    });

    // Refresh camera list now that permission is granted (so labels are visible)
    await updateCameraList();

    let isPlaying = true;
    let lastHandDetectionTime = 0;
    const DETECTION_THROTTLE_MS = 50; // 20 FPS

    async function cameraFrameLoop() {
      if (!isPlaying) return;
      if (gameMode === "ai" && gameActive && videoElement.readyState === 4) {
        const now = performance.now();
        if (now - lastHandDetectionTime >= DETECTION_THROTTLE_MS) {
          lastHandDetectionTime = now;
          try {
            await handsDetector.send({ image: videoElement });
          } catch (e) {
            console.warn("AI detection frame send failed:", e);
          }
        }
      }
      requestAnimationFrame(cameraFrameLoop);
    }

    // Start processing frames
    cameraFrameLoop();

    // Create cameraInstance interface to match the rest of the game code
    cameraInstance = {
      stop: () => {
        isPlaying = false;
        if (cameraStream) {
          const tracks = cameraStream.getTracks();
          tracks.forEach(track => track.stop());
          cameraStream = null;
        }
        videoElement.srcObject = null;
        cameraInstance = null;
      }
    };
    
    loadingOverlay.classList.add("hidden");
    cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
    cameraStatus.innerHTML = `<i class="fa-solid fa-camera"></i> <span>กล้อง AI พร้อมแล้ว</span>`;
  } catch (err) {
    console.error("Camera or AI initialization failed:", err);
    loadingOverlay.classList.add("hidden");
    
    // Cleanup if stream was partially started
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    videoElement.srcObject = null;
    cameraInstance = null;

    // Fallback to touch mode
    await switchPlayMode("touch");
    showTemporaryToast("ไม่สามารถเปิดใช้งานกล้องได้ เปลี่ยนเป็นโหมดสัมผัสให้คุณอัตโนมัติ!");
    throw err;
  }
}

function onHandResults(results) {
  if (!gameActive) return;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const hand = results.multiHandLandmarks[0];
    const indexTip = hand[8];
    
    const logicWidth = canvas.width / (window.devicePixelRatio || 1);
    const logicHeight = canvas.height / (window.devicePixelRatio || 1);

    targetPointer.x = (1 - indexTip.x) * logicWidth;
    targetPointer.y = indexTip.y * logicHeight;
    
    if (!trackingActive) {
      activePointer.x = targetPointer.x;
      activePointer.y = targetPointer.y;
    }
    trackingActive = true;
  } else {
    trackingActive = false; 
  }
}
