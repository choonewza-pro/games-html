// ==========================================
// PRESENTATION LAYER: UI CONTROLLERS & SETUP
// ==========================================

// Pools declarations
const balloonPool = [];
const particlePool = [];
const textParticlePool = [];

// DOM Selections
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const videoElement = document.getElementById("webCamVideo");
const scoreDisplay = document.getElementById("scoreDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const comboFeedback = document.getElementById("comboFeedback");
const cameraStatus = document.getElementById("cameraStatus");
const gameHud = document.getElementById("gameHud");

// Screens Overlays
const startScreenOverlay = document.getElementById("startScreenOverlay");
const loadingOverlay = document.getElementById("loadingOverlay");
const gamePausedOverlay = document.getElementById("gamePausedOverlay");

// Buttons & Modals
const modeAiBtn = document.getElementById("modeAiBtn");
const modeTouchBtn = document.getElementById("modeTouchBtn");
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelpModalBtn = document.getElementById("closeHelpModalBtn");
const confirmHelpBtn = document.getElementById("confirmHelpBtn");
const gameOverModal = document.getElementById("gameOverModal");
const retryGameBtn = document.getElementById("retryGameBtn");
const exitGameBtn = document.getElementById("exitGameBtn");
const exitGameplayBtn = document.getElementById("exitGameplayBtn");
const resumeGameBtn = document.getElementById("resumeGameBtn");
const gameContainer = document.getElementById("gameContainer");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const quickRestartBtn = document.getElementById("quickRestartBtn");

// Lobby UI Elements
const menuView = document.getElementById("menuView");
const multiplayerSetupView = document.getElementById("multiplayerSetupView");
const roomLobbyView = document.getElementById("roomLobbyView");
const playSingleBtn = document.getElementById("playSingleBtn");
const goMultiplayerBtn = document.getElementById("goMultiplayerBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomViewBtn = document.getElementById("joinRoomViewBtn");
const joinInputArea = document.getElementById("joinInputArea");
const roomCodeInput = document.getElementById("roomCodeInput");
const submitJoinRoomBtn = document.getElementById("submitJoinRoomBtn");
const lobbyRoomCode = document.getElementById("lobbyRoomCode");
const lobbyHostName = document.getElementById("lobbyHostName");
const lobbyGuestName = document.getElementById("lobbyGuestName");
const startMultiplayerGameBtn = document.getElementById("startMultiplayerGameBtn");
const guestWaitMsg = document.getElementById("guestWaitMsg");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");

// Match Mode Buttons (v3)
const matchModeShareBtn = document.getElementById("matchModeShareBtn");
const matchModeIndividualBtn = document.getElementById("matchModeIndividualBtn");

const opponentScoreContainer = document.getElementById("opponentScoreContainer");
const opponentScoreDisplay = document.getElementById("opponentScoreDisplay");
const opponentHudCombo = document.getElementById("opponentHudCombo");
const hudCombo = document.getElementById("hudCombo");
const myScoreLabel = document.getElementById("myScoreLabel");

const roomStatusPanel = document.getElementById("roomStatusPanel");
const localRoleBadge = document.getElementById("localRoleBadge");
const localRoomIdBadge = document.getElementById("localRoomIdBadge");
const localMatchModeBadge = document.getElementById("localMatchModeBadge");

// Word Settings UI
const wordSettingsBtn = document.getElementById("wordSettingsBtn");
const wordSettingsModal = document.getElementById("wordSettingsModal");
const closeWordSettingsModalBtn = document.getElementById("closeWordSettingsModalBtn");
const saveWordSettingsBtn = document.getElementById("saveWordSettingsBtn");
const praWordsInput = document.getElementById("praWordsInput");
const nonPraWordsInput = document.getElementById("nonPraWordsInput");
const gameTitleInput = document.getElementById("gameTitleInput");
const gameMissionInput = document.getElementById("gameMissionInput");
const correctCatInput = document.getElementById("correctCatInput");
const incorrectCatInput = document.getElementById("incorrectCatInput");
const templateSelect = document.getElementById("templateSelect");
const gameDurationInput = document.getElementById("gameDurationInput");
const gameSpeedInput = document.getElementById("gameSpeedInput");

// Results Summary elements
const finalScore = document.getElementById("finalScore");
const finalCombo = document.getElementById("finalCombo");
const perfRating = document.getElementById("perfRating");
const badgeIcon = document.getElementById("badgeIcon");
const poppedListCorrect = document.getElementById("poppedListCorrect");
const poppedListIncorrect = document.getElementById("poppedListIncorrect");

// Quick Toast notifications
function showTemporaryToast(message) {
  const existing = document.getElementById("temporaryToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "temporaryToast";
  toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl text-xs font-semibold z-50 shadow-xl border border-white/10 tracking-wide transition transform translate-y-0 opacity-100 flex items-center gap-2";
  toast.innerHTML = `<span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl text-xs font-semibold z-50 shadow-xl border border-white/10 tracking-wide transition transform translate-y-5 opacity-0";
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Adjust canvas sizing
function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const rect = wrapper.getBoundingClientRect();
  
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
  
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  lastLogicWidth = rect.width;
  lastLogicHeight = rect.height;
}

window.addEventListener("resize", () => {
  if (gameActive) {
    resizeCanvas();
  }
});

// Fullscreen wrapper
function toggleFullscreen() {
  const container = document.getElementById("gameContainerWrapper");
  if (!container) return;
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.warn(`Fullscreen request failed: ${err.message}`);
    });
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Update settings UI
function updateGameUI() {
  const startSubtitle = document.getElementById("startSubtitle");
  if (startSubtitle) startSubtitle.innerText = GAME_TITLE;

  const headerSubtitle = document.getElementById("headerSubtitle");
  if (headerSubtitle) headerSubtitle.innerText = GAME_TITLE;

  const missionDescription = document.getElementById("missionDescription");
  if (missionDescription) missionDescription.innerHTML = GAME_MISSION;
  
  // Set category examples labels
  const correctLabel = document.getElementById("correctLabel");
  if (correctLabel) correctLabel.innerText = `ตัวอย่าง${CORRECT_CAT_NAME} (+10 คะแนน)`;

  const incorrectLabel = document.getElementById("incorrectLabel");
  if (incorrectLabel) incorrectLabel.innerText = `ตัวอย่าง${INCORRECT_CAT_NAME} (-5 คะแนน)`;
  
  // Update correct/incorrect examples container
  const correctContainer = document.getElementById("correctExamplesContainer");
  const incorrectContainer = document.getElementById("incorrectExamplesContainer");
  
  if (correctContainer) {
    correctContainer.innerHTML = PRA_WORDS.slice(0, 4).map(w => `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-semibold">${w}</span>`).join('');
  }
  if (incorrectContainer) {
    incorrectContainer.innerHTML = NON_PRA_WORDS.slice(0, 4).map(w => `<span class="bg-rose-50 text-rose-500 border border-rose-200 text-xs px-2.5 py-1 rounded-lg font-semibold">${w}</span>`).join('');
  }
}

// Switch control mode
async function switchPlayMode(mode) {
  gameMode = mode;
  if (mode === "ai") {
    modeAiBtn.className = "px-2.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 bg-indigo-600 text-white shadow-md";
    modeTouchBtn.className = "px-2.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200";
    
    // Initialize AI & Webcam
    await initCameraAndAI();
  } else {
    modeTouchBtn.className = "px-2.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 bg-indigo-600 text-white shadow-md";
    modeAiBtn.className = "px-2.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200";
    
    trackingActive = true; 
    
    if (cameraInstance) {
      cameraInstance.stop();
      cameraInstance = null;
    }
    cameraStatus.className = "flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500";
    cameraStatus.innerHTML = `<i class="fa-solid fa-hand"></i> <span>โหมดสัมผัสหน้าจอ</span>`;
  }
}

// Setup inputs for mouse and touch
canvas.addEventListener("mousemove", (e) => {
  if (gameMode === "touch" && gameActive) {
    const rect = canvas.getBoundingClientRect();
    targetPointer.x = e.clientX - rect.left;
    targetPointer.y = e.clientY - rect.top;
    activePointer.x = targetPointer.x;
    activePointer.y = targetPointer.y;
    trackingActive = true;
  }
});

canvas.addEventListener("mouseleave", () => {
  if (gameMode === "touch") {
    trackingActive = false;
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (gameMode === "touch" && gameActive && e.touches.length > 0) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    targetPointer.x = e.touches[0].clientX - rect.left;
    targetPointer.y = e.touches[0].clientY - rect.top;
    activePointer.x = targetPointer.x;
    activePointer.y = targetPointer.y;
    trackingActive = true;
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  if (gameMode === "touch") {
    trackingActive = false;
  }
});

// Exit to the multiplayer lobby without disconnecting
function exitToLobby() {
  gameActive = false;
  if (gameInterval) clearInterval(gameInterval);

  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }

  // Hide gameplay UI
  gameHud.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  document.getElementById("guestPreStartOverlay").classList.add("hidden");
  document.getElementById("countdownOverlay").classList.add("hidden");

  // Show Lobby UI
  menuView.classList.add("hidden");
  multiplayerSetupView.classList.add("hidden");
  roomLobbyView.classList.remove("hidden");
  startScreenOverlay.classList.remove("hidden");

  // Reset ready states for the next match
  localInputReady = false;
  opponentInputReady = false;

  // Restore camera status UI
  cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
  cameraStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>ระบบพร้อมใช้งาน</span>`;
}

// Clean and exit to main menu
function exitToMainMenu() {
  if (gameActive) {
    const confirmExit = confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากเกมในขณะนี้?");
    if (!confirmExit) return;
  }

  if (isMultiplayer) {
    // Send message to opponent to also exit to lobby
    if (networkConnection && networkConnection.open) {
      networkConnection.send({ type: "exit-to-lobby" });
    }
    exitToLobby();
    return;
  }

  gameActive = false;
  if (gameInterval) clearInterval(gameInterval);

  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }

  roomLobbyView.classList.add("hidden");
  multiplayerSetupView.classList.add("hidden");
  menuView.classList.remove("hidden");
  startScreenOverlay.classList.remove("hidden");
  gameHud.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  document.getElementById("guestPreStartOverlay").classList.add("hidden");
  document.getElementById("countdownOverlay").classList.add("hidden");

  cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
  cameraStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>ระบบพร้อมใช้งาน</span>`;
}

// -----------------------------------------------------
// UI Buttons Listeners
// -----------------------------------------------------
playSingleBtn.addEventListener("click", () => {
  isMultiplayer = false;
  myScoreLabel.innerText = "คะแนน";
  opponentScoreContainer.classList.add("hidden");

  // Request fullscreen on user gesture
  if (!document.fullscreenElement) {
    toggleFullscreen();
  }

  loadingOverlay.classList.remove("hidden");
  document.querySelector("#loadingOverlay h3").innerText = "กำลังเตรียมกล้องเว็บแคมและโหลด AI...";

  switchPlayMode(gameMode).then(() => {
    triggerCountdown();
  }).catch(() => {
    triggerCountdown();
  });
});

goMultiplayerBtn.addEventListener("click", () => {
  menuView.classList.add("hidden");
  multiplayerSetupView.classList.remove("hidden");
});

backToMenuBtn.addEventListener("click", () => {
  multiplayerSetupView.classList.add("hidden");
  menuView.classList.remove("hidden");
});

// Setup Word Settings Modal
wordSettingsBtn.addEventListener("click", () => {
  wordSettingsModal.classList.remove("hidden");
  
  // Load current values to inputs
  gameTitleInput.value = GAME_TITLE;
  gameMissionInput.value = GAME_MISSION.replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML tags
  correctCatInput.value = CORRECT_CAT_NAME;
  incorrectCatInput.value = INCORRECT_CAT_NAME;
  praWordsInput.value = PRA_WORDS.join(", ");
  nonPraWordsInput.value = NON_PRA_WORDS.join(", ");
  gameDurationInput.value = gameDuration;
  gameSpeedInput.value = gameSpeed;
});

closeWordSettingsModalBtn.addEventListener("click", () => {
  wordSettingsModal.classList.add("hidden");
});

saveWordSettingsBtn.addEventListener("click", () => {
  GAME_TITLE = gameTitleInput.value.trim();
  GAME_MISSION = gameMissionInput.value.trim();
  CORRECT_CAT_NAME = correctCatInput.value.trim();
  INCORRECT_CAT_NAME = incorrectCatInput.value.trim();
  
  const durationVal = parseInt(gameDurationInput.value);
  if (!isNaN(durationVal) && durationVal >= 10) {
    gameDuration = durationVal;
  }
  
  const speedVal = parseInt(gameSpeedInput.value);
  if (!isNaN(speedVal) && speedVal >= 1 && speedVal <= 10) {
    gameSpeed = speedVal;
  }

  PRA_WORDS = praWordsInput.value.split(",").map(w => w.trim()).filter(w => w.length > 0);
  NON_PRA_WORDS = nonPraWordsInput.value.split(",").map(w => w.trim()).filter(w => w.length > 0);

  updateGameUI();
  
  if (isMultiplayer && myPlayerRole === "host" && networkConnection && networkConnection.open) {
    networkConnection.send({
      type: "settings",
      settings: {
        title: GAME_TITLE,
        mission: GAME_MISSION,
        correctCatName: CORRECT_CAT_NAME,
        incorrectCatName: INCORRECT_CAT_NAME,
        praWords: PRA_WORDS,
        nonPraWords: NON_PRA_WORDS,
        duration: gameDuration,
        speed: gameSpeed
      }
    });
  }
  
  wordSettingsModal.classList.add("hidden");
  showTemporaryToast("บันทึกการตั้งค่าคำศัพท์และกติกาใหม่เรียบร้อย!");
});

templateSelect.addEventListener("change", (e) => {
  const val = e.target.value;
  if (val && GAME_TEMPLATES[val]) {
    const t = GAME_TEMPLATES[val];
    gameTitleInput.value = t.title;
    gameMissionInput.value = t.mission;
    correctCatInput.value = t.correctCatName;
    incorrectCatInput.value = t.incorrectCatName;
    praWordsInput.value = t.praWords.join(", ");
    nonPraWordsInput.value = t.nonPraWords.join(", ");
  }
});

// Mode buttons in HUD
modeAiBtn.addEventListener("click", () => switchPlayMode("ai"));
modeTouchBtn.addEventListener("click", () => switchPlayMode("touch"));

// Exit and restart handlers
exitGameBtn.addEventListener("click", exitToMainMenu);
exitGameplayBtn.addEventListener("click", exitToMainMenu);

retryGameBtn.addEventListener("click", () => {
  gameOverModal.classList.add("hidden");
  if (isMultiplayer) {
    if (myPlayerRole === "host") {
      randomSeed = Math.floor(Math.random() * 1000000);
      if (networkConnection && networkConnection.open) {
        networkConnection.send({
          type: "restart",
          seed: randomSeed
        });
      }
      startGameplay();
    } else {
      showTemporaryToast("ต้องรอให้หัวหน้าห้องทำการรีเซ็ตระบบท้าประลอง...");
    }
  } else {
    randomSeed = Math.floor(Math.random() * 1000000);
    startGameplay();
  }
});

quickRestartBtn.addEventListener("click", () => {
  if (isMultiplayer) {
    if (myPlayerRole === "host") {
      randomSeed = Math.floor(Math.random() * 1000000);
      if (networkConnection && networkConnection.open) {
        networkConnection.send({
          type: "restart",
          seed: randomSeed
        });
      }
      startGameplay();
    } else {
      showTemporaryToast("ต้องรอให้หัวหน้าห้องสั่งเริ่มใหม่เท่านั้น!");
    }
  } else {
    randomSeed = Math.floor(Math.random() * 1000000);
    startGameplay();
  }
});

fullscreenBtn.addEventListener("click", toggleFullscreen);

// P2P Match Rule Changes (Steal/Race)
matchModeShareBtn.addEventListener("click", () => {
  if (myPlayerRole === "host") {
    setMatchMode("share");
  } else {
    showTemporaryToast("เฉพาะหัวหน้าห้องเท่านั้นที่สามารถเปลี่ยนกติกาได้!");
  }
});

matchModeIndividualBtn.addEventListener("click", () => {
  if (myPlayerRole === "host") {
    setMatchMode("individual");
  } else {
    showTemporaryToast("เฉพาะหัวหน้าห้องเท่านั้นที่สามารถเปลี่ยนกติกาได้!");
  }
});

// Help Modal
helpBtn.addEventListener("click", () => {
  helpModal.classList.remove("hidden");
});
closeHelpModalBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
});
confirmHelpBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
});

// Guest Click Confirm Start
document.getElementById("guestConfirmStartBtn").addEventListener("click", () => {
  document.getElementById("guestPreStartOverlay").classList.add("hidden");

  // Go fullscreen on user gesture
  if (!document.fullscreenElement) {
    toggleFullscreen();
  }

  loadingOverlay.classList.remove("hidden");
  document.querySelector("#loadingOverlay h3").innerText = "กำลังเตรียมกล้องเว็บแคมและโหลด AI...";

  switchPlayMode(gameMode).then(() => {
    localInputReady = true;
    if (networkConnection && networkConnection.open) {
      networkConnection.send({ type: "ready" });
    }
    if (opponentInputReady) {
      triggerCountdown();
    } else {
      // Keep loading overlay and show waiting message
      loadingOverlay.classList.remove("hidden");
      document.querySelector("#loadingOverlay h3").innerText = "กำลังรอหัวหน้าห้องพร้อมและเข้าสู่การแข่งขัน...";
    }
  }).catch(() => {
    localInputReady = true;
    if (networkConnection && networkConnection.open) {
      networkConnection.send({ type: "ready" });
    }
    if (opponentInputReady) {
      triggerCountdown();
    } else {
      // Keep loading overlay and show waiting message
      loadingOverlay.classList.remove("hidden");
      document.querySelector("#loadingOverlay h3").innerText = "กำลังรอหัวหน้าห้องพร้อมและเข้าสู่การแข่งขัน...";
    }
  });
});

// Create Room Handler
createRoomBtn.addEventListener("click", () => {
  loadingOverlay.classList.remove("hidden");
  document.querySelector("#loadingOverlay h3").innerText = "กำลังสร้างห้องและขอรหัสเชื่อมต่อ P2P...";

  // Generate a random 4-digit room code
  const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  roomId = roomCode;

  // Use a prefix to prevent ID collisions on the public PeerJS server
  peerInstance = new Peer('AR-BALLOON-' + roomCode);

  peerInstance.on("open", (id) => {
    loadingOverlay.classList.add("hidden");
    multiplayerSetupView.classList.add("hidden");
    roomLobbyView.classList.remove("hidden");
    
    lobbyRoomCode.innerText = roomId;
    
    myPlayerRole = "host";
    lobbyHostName.innerText = "คุณ (กำลังเปิดห้อง)";
    lobbyGuestName.innerText = "รอผู้ท้าชิงเข้าร่วม...";
    
    startMultiplayerGameBtn.classList.remove("hidden");
    startMultiplayerGameBtn.disabled = true;
    startMultiplayerGameBtn.classList.add("opacity-50", "cursor-not-allowed");
    startMultiplayerGameBtn.innerText = "รอผู้ท้าชิง...";

    setMatchMode("share");
    
    // Update role status panel
    localRoleBadge.innerText = "หัวหน้าห้อง (Host)";
    localRoomIdBadge.innerText = roomId;
    roomStatusPanel.classList.remove("hidden");
  });

  peerInstance.on("connection", (conn) => {
    networkConnection = conn;
    
    lobbyGuestName.innerText = "คู่ต่อสู้ (ผู้ท้าชิง - เชื่อมต่อแล้ว)";
    lobbyGuestName.className = "text-emerald-300 font-bold animate-pulse";

    startMultiplayerGameBtn.disabled = false;
    startMultiplayerGameBtn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gradient-to-r", "from-emerald-400", "to-teal-400");
    startMultiplayerGameBtn.classList.add("bg-emerald-500", "hover:bg-emerald-600");
    startMultiplayerGameBtn.innerText = "เริ่มเกมจับคู่! ⚔️";
    networkConnection.on("open", () => {
      networkConnection.send({
        type: "init",
        settings: {
          title: GAME_TITLE,
          mission: GAME_MISSION,
          correctCatName: CORRECT_CAT_NAME,
          incorrectCatName: INCORRECT_CAT_NAME,
          praWords: PRA_WORDS,
          nonPraWords: NON_PRA_WORDS,
          duration: gameDuration,
          speed: gameSpeed
        },
        seed: randomSeed,
        matchMode: matchMode
      });
      setupConnectionListeners();
    });
  });

  peerInstance.on("error", (err) => {
    loadingOverlay.classList.add("hidden");
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย: " + err.type);
    leaveCurrentRoom();
  });
});

// Show Join Room Input area
joinRoomViewBtn.addEventListener("click", () => {
  joinInputArea.classList.toggle("hidden");
  if (!joinInputArea.classList.contains("hidden")) {
    roomCodeInput.focus();
  }
});

// Clean and validate room code input to only allow 4 digits
roomCodeInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
});

// Join Room Handler
submitJoinRoomBtn.addEventListener("click", () => {
  const targetId = roomCodeInput.value.trim().toUpperCase();
  if (!targetId) {
    alert("กรุณากรอกรหัสห้องก่อนเชื่อมต่อ!");
    return;
  }

  loadingOverlay.classList.remove("hidden");
  document.querySelector("#loadingOverlay h3").innerText = "กำลังทำการเชื่อมต่อ P2P เข้าสู่ห้อง...";

  // Create Peer Instance using the target room code (needs to match or connect)
  peerInstance = new Peer();

  peerInstance.on("open", () => {
    // Connect to the host using the prefixed room code
    networkConnection = peerInstance.connect('AR-BALLOON-' + targetId);
    myPlayerRole = "guest";

    networkConnection.on("open", () => {
      try {
        loadingOverlay.classList.add("hidden");
        multiplayerSetupView.classList.add("hidden");
        roomLobbyView.classList.remove("hidden");
        
        lobbyRoomCode.innerText = targetId;
        startMultiplayerGameBtn.classList.add("hidden"); 
        guestWaitMsg.classList.remove("hidden");
        
        lobbyHostName.innerText = "หัวหน้าห้อง (เชื่อมต่อแล้ว)";
        lobbyGuestName.innerText = "คุณ (ผู้ท้าชิง)";
        lobbyGuestName.className = "text-sky-300 font-bold";

        wordSettingsBtn.classList.add("opacity-50", "cursor-not-allowed");
        wordSettingsBtn.disabled = true;

        localRoleBadge.innerText = "ผู้ท้าชิง (Guest)";
        localRoomIdBadge.innerText = targetId;
        roomStatusPanel.classList.remove("hidden");
        
        setupConnectionListeners();
      } catch (err) {
        console.error("Error in guest network connection open handler:", err);
        alert("Guest Connection Open Error: " + err.message + "\nStack: " + err.stack);
      }
    });
  });

  peerInstance.on("error", (err) => {
    loadingOverlay.classList.add("hidden");
    alert("ไม่พบห้องนี้ หรือเชื่อมต่อล้มเหลว! (รหัสห้องต้องตรงกับ Peer ID ของโฮสต์)");
    leaveCurrentRoom();
  });
});

// Leave Room
leaveRoomBtn.addEventListener("click", () => {
  leaveCurrentRoom();
});

// Host click start game
startMultiplayerGameBtn.addEventListener("click", () => {
  try {
    showTemporaryToast("[Debug] Host clicked Start Button");
    
    if (!networkConnection) {
      alert("[Debug] Clicked, but networkConnection is null!");
      return;
    }
    if (!networkConnection.open) {
      alert("[Debug] Clicked, but networkConnection.open is false! Connection status is not open.");
      return;
    }
    if (myPlayerRole !== "host") {
      alert("[Debug] Clicked, but myPlayerRole is " + myPlayerRole);
      return;
    }

    randomSeed = Math.floor(Math.random() * 1000000);
    isMultiplayer = true;

    const myScoreLabelEl = document.getElementById("myScoreLabel");
    if (myScoreLabelEl) myScoreLabelEl.innerText = "ฉัน";

    const opponentScoreContainerEl = document.getElementById("opponentScoreContainer");
    if (opponentScoreContainerEl) opponentScoreContainerEl.classList.remove("hidden");

    // Reset ready states for the new match
    localInputReady = false;
    opponentInputReady = false;

    showTemporaryToast("[Debug] Host sending pre_start...");
    networkConnection.send({
      type: "pre_start",
      seed: randomSeed,
      matchMode: matchMode,
      gameMode: gameMode
    });

    // Request fullscreen on user gesture
    if (!document.fullscreenElement) {
      toggleFullscreen();
    }

    const loadingOverlayEl = document.getElementById("loadingOverlay");
    if (loadingOverlayEl) {
      loadingOverlayEl.classList.remove("hidden");
      const loadingText = loadingOverlayEl.querySelector("h3");
      if (loadingText) loadingText.innerText = "กำลังเตรียมกล้องเว็บแคมและโหลด AI...";
    }

    switchPlayMode(gameMode).then(() => {
      localInputReady = true;
      // Send ready signal to the guest
      if (networkConnection && networkConnection.open) {
        networkConnection.send({ type: "ready" });
      }
      if (opponentInputReady) {
        triggerCountdown();
      } else {
        const loadingOverlayEl2 = document.getElementById("loadingOverlay");
        if (loadingOverlayEl2) {
          loadingOverlayEl2.classList.remove("hidden");
          const loadingText2 = loadingOverlayEl2.querySelector("h3");
          if (loadingText2) loadingText2.innerText = "กำลังรอคู่แข่งพร้อมและเข้าสู่การแข่งขัน...";
        }
      }
    }).catch(() => {
      localInputReady = true;
      // Send ready signal even if camera fails (falls back to touch)
      if (networkConnection && networkConnection.open) {
        networkConnection.send({ type: "ready" });
      }
      if (opponentInputReady) {
        triggerCountdown();
      } else {
        const loadingOverlayEl2 = document.getElementById("loadingOverlay");
        if (loadingOverlayEl2) {
          loadingOverlayEl2.classList.remove("hidden");
          const loadingText2 = loadingOverlayEl2.querySelector("h3");
          if (loadingText2) loadingText2.innerText = "กำลังรอคู่แข่งพร้อมและเข้าสู่การแข่งขัน...";
        }
      }
    });
  } catch (err) {
    console.error("Error in host start button click handler:", err);
    alert("Host Click Error: " + err.message + "\nStack: " + err.stack);
  }
});

// Load external templates from JS file (completely bypasses CORS)
function loadExternalTemplates() {
  if (typeof EXTERNAL_GAME_TEMPLATES !== 'undefined' && EXTERNAL_GAME_TEMPLATES) {
    try {
      // Merge fetched templates into GAME_TEMPLATES
      Object.assign(GAME_TEMPLATES, EXTERNAL_GAME_TEMPLATES);
      
      // Update default arrays to match loaded data
      if (GAME_TEMPLATES.thai_visanjanee) {
        PRA_WORDS = [...GAME_TEMPLATES.thai_visanjanee.praWords];
        NON_PRA_WORDS = [...GAME_TEMPLATES.thai_visanjanee.nonPraWords];
      }
      updateGameUI();
      console.log("Successfully loaded external word templates from JS file.");
    } catch (err) {
      console.error("Error merging templates from JS file:", err);
    }
  } else {
    console.warn("EXTERNAL_GAME_TEMPLATES is not defined. Using local fallback.");
  }
  
  // Populate select box with templates
  templateSelect.innerHTML = `<option value="">-- เลือกเทมเพลตชุดคำศัพท์ --</option>` + 
    Object.keys(GAME_TEMPLATES).map(key => `<option value="${key}">${GAME_TEMPLATES[key].title}</option>`).join('');
}

// Initial Calls
updateGameUI();
loadExternalTemplates();
