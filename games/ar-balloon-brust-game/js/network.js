// ==========================================
// INFRASTRUCTURE: PEERJS P2P NETWORK SERVICE
// ==========================================

// Set up WebRTC DataChannel Listeners
function setupConnectionListeners() {
  if (!networkConnection) return;

  networkConnection.on("data", (data) => {
    switch (data.type) {
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
        isMultiplayer = true;
        myScoreLabel.innerText = "ฉัน";
        opponentScoreContainer.classList.remove("hidden");
        
        localInputReady = false;
        opponentInputReady = false;

        document.getElementById("guestPreStartOverlay").classList.remove("hidden");
        startScreenOverlay.classList.add("hidden");
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
        
        if (opponentScore < 0) {
          opponentScoreDisplay.innerText = "-" + Math.abs(opponentScore).toString().padStart(3, '0');
        } else {
          opponentScoreDisplay.innerText = opponentScore.toString().padStart(3, '0');
        }
        
        if (opponentCombo >= 3) {
          opponentHudCombo.innerText = `COMBO x${opponentCombo}`;
          opponentHudCombo.classList.remove("hidden");
        } else {
          opponentHudCombo.classList.add("hidden");
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

  leaveCurrentRoom();

  // Ensure we go back to the very first main menu
  roomLobbyView.classList.add("hidden");
  multiplayerSetupView.classList.add("hidden");
  menuView.classList.remove("hidden");
  startScreenOverlay.classList.remove("hidden");
  gameHud.classList.add("hidden");

  // Hide any active game overlays
  document.getElementById("guestPreStartOverlay").classList.add("hidden");
  document.getElementById("countdownOverlay").classList.add("hidden");
  gameOverModal.classList.add("hidden");

  // Reset camera status UI
  cameraStatus.className = "flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700";
  cameraStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>ระบบพร้อมใช้งาน</span>`;
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

  isMultiplayer = false;
  roomId = null;
  opponentScoreContainer.classList.add("hidden");
  roomStatusPanel.classList.add("hidden");
  
  roomLobbyView.classList.add("hidden");
  multiplayerSetupView.classList.remove("hidden");
  
  wordSettingsBtn.classList.remove("opacity-50", "cursor-not-allowed");
  wordSettingsBtn.disabled = false;

  gameHud.classList.add("hidden");
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
