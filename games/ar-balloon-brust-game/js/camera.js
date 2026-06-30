// ==========================================
// INFRASTRUCTURE: MEDIAPIPE CAMERA & AI SERVICE
// ==========================================

function initCameraAndAI() {
  if (cameraInstance) return Promise.resolve(); 

  loadingOverlay.classList.remove("hidden");
  cameraStatus.className = "flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700";
  cameraStatus.innerHTML = `<span class="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span><span>กำลังต่อสัญญาณ AI...</span>`;

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

  return cameraInstance.start()
    .then(() => {
      loadingOverlay.classList.add("hidden");
      cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
      cameraStatus.innerHTML = `<i class="fa-solid fa-camera"></i> <span>กล้อง AI พร้อมแล้ว</span>`;
    })
    .catch(err => {
      console.error("Camera access failed or rejected:", err);
      loadingOverlay.classList.add("hidden");
      switchPlayMode("touch");
      showTemporaryToast("ไม่สามารถเปิดใช้งานกล้องได้ เปลี่ยนเป็นโหมดควบคุมด้วยการสัมผัสหรือเมาส์ให้คุณอัตโนมัติ!");
      throw err;
    });
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
