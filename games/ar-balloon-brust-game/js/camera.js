// ==========================================
// INFRASTRUCTURE: MEDIAPIPE CAMERA & AI SERVICE
// ==========================================

async function initCameraAndAI() {
  if (cameraInstance) return; 

  loadingOverlay.classList.remove("hidden");
  cameraStatus.className = "flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700";
  cameraStatus.innerHTML = `<span class="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span><span>กำลังต่อสัญญาณ AI...</span>`;

  try {
    // Prevent crashes if the CDN script failed to load or was blocked by an adblocker
    if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
      throw new Error("MediaPipe Hands or Camera library is not loaded. Please check your internet connection or disable adblockers.");
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

    let lastHandDetectionTime = 0;
    const DETECTION_THROTTLE_MS = 50; // Throttle to 20 FPS to reduce CPU/GPU load

    cameraInstance = new Camera(videoElement, {
      onFrame: async () => {
        if (gameMode === "ai" && gameActive) {
          const now = performance.now();
          if (now - lastHandDetectionTime >= DETECTION_THROTTLE_MS) {
            lastHandDetectionTime = now;
            await handsDetector.send({ image: videoElement });
          }
        }
      },
      width: 1280,
      height: 720
    });

    // Set a 5-second timeout for camera start to prevent getting stuck
    const cameraStartPromise = cameraInstance.start();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Camera start timeout")), 5000)
    );
    await Promise.race([cameraStartPromise, timeoutPromise]);
    
    loadingOverlay.classList.add("hidden");
    cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
    cameraStatus.innerHTML = `<i class="fa-solid fa-camera"></i> <span>กล้อง AI พร้อมแล้ว</span>`;
  } catch (err) {
    console.error("Camera or AI initialization failed:", err);
    loadingOverlay.classList.add("hidden");
    // Fallback to touch mode
    await switchPlayMode("touch");
    showTemporaryToast("ไม่สามารถเปิดใช้งานกล้องได้ เปลี่ยนเป็นโหมดสัมผัสให้คุณอัตโนมัติ!");
    throw err; // Re-throw to be handled by the caller
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
