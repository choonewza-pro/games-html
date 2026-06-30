// ==========================================
// INFRASTRUCTURE: PEERJS P2P NETWORK SERVICE
// ==========================================

let lastOpponentHeartbeatTime = 0;
let heartbeatInterval = null;

// Set up WebRTC DataChannel Listeners
function setupConnectionListeners() {
  if (!networkConnection) return;

  // Initialize heartbeat state
  lastOpponentHeartbeatTime = Date.now();
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  heartbeatInterval = setInterval(() => {
    if (networkConnection && networkConnection.open) {
      try {
        networkConnection.send({ type: "ping" });
      } catch (e) {
        console.warn("Heartbeat send failed:", e);
      }
      
      // Check for timeout (6 seconds of no messages)
      if (Date.now() - lastOpponentHeartbeatTime > 6000) {
        console.warn("Heartbeat timeout. Opponent disconnected.");
        handleOpponentDisconnect();
      }
    }
  }, 2000);

  networkConnection.on("data", (data) => {
    try {
      // Update heartbeat timestamp on any message received
      lastOpponentHeartbeatTime = Date.now();

      if (data.type !== "ping" && data.type !== "pointer") {
        showTemporaryToast("[Debug] Received: " + data.type);
      }

      switch (data.type) {
        case "ping":
          // Heartbeat ping received, just update the timestamp (already done above)
          break;
        case "init":
          GAME_TITLE = data.settings.title;
          GAME_MISSION = data.settings.mission;
          CORRECT_CAT_NAME = data.settings.correctCatName;
          INCORRECT_CAT_NAME = data.settings.incorrectCatName;
          PRA_WORDS = data.settings.praWords;
          NON_PRA_WORDS = data.settings.nonPraWords;
          gameDuration = data.settings.duration;
          gameSpeed = data.settings.speed;
          randomSeed = data.seed;
          matchMode = data.matchMode || "share";
          updateGameUI();
          updateMatchModeUI();
          break;

        case "settings":
          GAME_TITLE = data.settings.title;
          GAME_MISSION = data.settings.mission;
          CORRECT_CAT_NAME = data.settings.correctCatName;
          INCORRECT_CAT_NAME = data.settings.incorrectCatName;
          PRA_WORDS = data.settings.praWords;
          NON_PRA_WORDS = data.settings.nonPraWords;
          gameDuration = data.settings.duration;
          gameSpeed = data.settings.speed;
          updateGameUI();
          break;

        case "matchModeChange":
          // Host changed match mode in lobby
          matchMode = data.mode;
          updateMatchModeUI();
          showTemporaryToast("หัวหน้าห้องเปลี่ยนกติกาการแข่งเป็น: " + (matchMode === "share" ? "แย่งกันเจาะ" : "ต่างคนต่างเจาะ"));
          break;

        case "pre_start":
          randomSeed = data.seed;
          matchMode = data.matchMode || "share";
          gameMode = data.gameMode || "ai";
          isMultiplayer = true;
          
          const myScoreLabelEl = document.getElementById("myScoreLabel");
          if (myScoreLabelEl) myScoreLabelEl.innerText = "ฉัน";
          
          const opponentScoreContainerEl = document.getElementById("opponentScoreContainer");
          if (opponentScoreContainerEl) opponentScoreContainerEl.classList.remove("hidden");
          
          localInputReady = false;
          opponentInputReady = false;

          const guestPreStartOverlayEl = document.getElementById("guestPreStartOverlay");
          if (guestPreStartOverlayEl) guestPreStartOverlayEl.classList.remove("hidden");
          
          const startScreenOverlayEl = document.getElementById("startScreenOverlay");
          if (startScreenOverlayEl) startScreenOverlayEl.classList.add("hidden");
          break;

        case "ready":
          opponentInputReady = true;
          if (localInputReady) {
            triggerCountdown();
          }
          break;

        case "pointer":
          opponentTargetPointer.x = data.x;
          opponentTargetPointer.y = data.y;
          if (!opponentPointer.active && data.active) {
            opponentPointer.x = data.x;
            opponentPointer.y = data.y;
          }
          opponentPointer.active = data.active;
          break;

        case "pop":
          // Only relevant in "share" mode
          if (matchMode === "share") {
            const poppedBalloon = balloons.find(b => b.id === data.id);
            if (poppedBalloon && !poppedBalloon.popped) {
              poppedBalloon.popped = true;
              poppedBalloon.poppedByOpponent = true;
              
              createExplosion(poppedBalloon.x, poppedBalloon.y, "#06b6d4"); 
              playSynthSound('popOpponent');
              createTextParticle(poppedBalloon.x, poppedBalloon.y, `คู่แข่งเจาะ!`, "#06b6d4", false);
            }
          }
          break;

        case "score":
          opponentScore = data.score;
          opponentCombo = data.combo;
          if (opponentCombo > opponentMaxCombo) {
            opponentMaxCombo = opponentCombo;
          }
          
          const opponentScoreDisplayEl = document.getElementById("opponentScoreDisplay");
          if (opponentScoreDisplayEl) {
            if (opponentScore < 0) {
              opponentScoreDisplayEl.innerText = "-" + Math.abs(opponentScore).toString().padStart(3, '0');
            } else {
              opponentScoreDisplayEl.innerText = opponentScore.toString().padStart(3, '0');
            }
          }
          
          const opponentHudComboEl = document.getElementById("opponentHudCombo");
          if (opponentHudComboEl) {
            if (opponentCombo >= 3) {
              opponentHudComboEl.innerText = `COMBO x${opponentCombo}`;
              opponentHudComboEl.classList.remove("hidden");
            } else {
              opponentHudComboEl.classList.add("hidden");
            }
          }
          break;

        case "restart":
          randomSeed = data.seed;
          startGameplay();
          showTemporaryToast("หัวหน้าห้องสั่งเริ่มเกมรอบใหม่!");
          break;

        case "disconnect":
          handleOpponentDisconnect();
          break;

        case "exit-to-lobby":
          exitToLobby();
          showTemporaryToast("คู่แข่งได้กดออกจากเกมกลับสู่ห้องล็อบบี้");
          break;
      }
    } catch (err) {
      console.error("[Network Error] Failed to process data message:", err);
      alert("ตรวจพบข้อผิดพลาดระบบเครือข่าย:\n" + err.name + ": " + err.message + "\n\nStack Trace:\n" + err.stack);
    }
  });

  networkConnection.on("close", () => {
    handleOpponentDisconnect();
  });
}

function handleOpponentDisconnect() {
  if (gameActive) {
    gameActive = false;
    if (gameInterval) clearInterval(gameInterval);
    alert("คู่ต่อสู้ออกจากห้องเล่นเกมหรือขาดการเชื่อมต่อ!");
  }

  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  // Clear heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  leaveCurrentRoom();

  // Ensure we go back to the very first main menu
  const roomLobbyViewEl = document.getElementById("roomLobbyView");
  if (roomLobbyViewEl) roomLobbyViewEl.classList.add("hidden");
  
  const multiplayerSetupViewEl = document.getElementById("multiplayerSetupView");
  if (multiplayerSetupViewEl) multiplayerSetupViewEl.classList.add("hidden");
  
  const menuViewEl = document.getElementById("menuView");
  if (menuViewEl) menuViewEl.classList.remove("hidden");
  
  const startScreenOverlayEl = document.getElementById("startScreenOverlay");
  if (startScreenOverlayEl) startScreenOverlayEl.classList.remove("hidden");
  
  const gameHudEl = document.getElementById("gameHud");
  if (gameHudEl) gameHudEl.classList.add("hidden");

  // Hide any active game overlays
  const guestPreStartOverlayEl = document.getElementById("guestPreStartOverlay");
  if (guestPreStartOverlayEl) guestPreStartOverlayEl.classList.add("hidden");
  
  const countdownOverlayEl = document.getElementById("countdownOverlay");
  if (countdownOverlayEl) countdownOverlayEl.classList.add("hidden");
  
  const gameOverModalEl = document.getElementById("gameOverModal");
  if (gameOverModalEl) gameOverModalEl.classList.add("hidden");

  // Reset camera status UI
  const cameraStatusEl = document.getElementById("cameraStatus");
  if (cameraStatusEl) {
    cameraStatusEl.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
    cameraStatusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>ระบบพร้อมใช้งาน</span>`;
  }
}

function leaveCurrentRoom() {
  if (networkConnection) {
    if (networkConnection.open) {
      try {
        networkConnection.send({ type: "disconnect" });
      } catch (err) {
        console.warn("Failed to send disconnect message:", err);
      }
    }
    networkConnection.close();
    networkConnection = null;
  }
  if (peerInstance) {
    peerInstance.destroy();
    peerInstance = null;
  }

  // Clear heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  isMultiplayer = false;
  roomId = null;
  
  const opponentScoreContainerEl = document.getElementById("opponentScoreContainer");
  if (opponentScoreContainerEl) opponentScoreContainerEl.classList.add("hidden");
  
  const roomStatusPanelEl = document.getElementById("roomStatusPanel");
  if (roomStatusPanelEl) roomStatusPanelEl.classList.add("hidden");
  
  const roomLobbyViewEl = document.getElementById("roomLobbyView");
  if (roomLobbyViewEl) roomLobbyViewEl.classList.add("hidden");
  
  const multiplayerSetupViewEl = document.getElementById("multiplayerSetupView");
  if (multiplayerSetupViewEl) multiplayerSetupViewEl.classList.remove("hidden");
  
  const wordSettingsBtnEl = document.getElementById("wordSettingsBtn");
  if (wordSettingsBtnEl) {
    wordSettingsBtnEl.classList.remove("opacity-50", "cursor-not-allowed");
    wordSettingsBtnEl.disabled = false;
  }

  const gameHudEl = document.getElementById("gameHud");
  if (gameHudEl) gameHudEl.classList.add("hidden");
}

function setMatchMode(mode) {
  matchMode = mode;
  updateMatchModeUI();
  if (networkConnection && networkConnection.open) {
    networkConnection.send({
      type: "matchModeChange",
      mode: matchMode
    });
  }
}

function updateMatchModeUI() {
  localMatchModeBadge.innerText = matchMode === "share" ? "แย่งกันเจาะ (Steal)" : "ต่างคนต่างเจาะ (Race)";
  
  if (matchMode === "share") {
    matchModeShareBtn.className = "flex-grow py-2 px-3 rounded-xl text-xs font-bold transition bg-emerald-500 text-white shadow-md";
    matchModeIndividualBtn.className = "flex-grow py-2 px-3 rounded-xl text-xs font-bold transition bg-white/10 text-white hover:bg-white/20 border border-white/10";
  } else {
    matchModeIndividualBtn.className = "flex-grow py-2 px-3 rounded-xl text-xs font-bold transition bg-emerald-500 text-white shadow-md";
    matchModeShareBtn.className = "flex-grow py-2 px-3 rounded-xl text-xs font-bold transition bg-white/10 text-white hover:bg-white/20 border border-white/10";
  }
}
