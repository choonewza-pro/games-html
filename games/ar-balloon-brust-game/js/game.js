// ==========================================
// APPLICATION USE CASES: CORE GAME ENGINE
// ==========================================

// Deterministic Seeded Random (Mulberry32)
function seededRandom() {
  let t = randomSeed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function triggerCountdown() {
  // Hide all loading and pre-start overlays
  loadingOverlay.classList.add("hidden");
  document.getElementById("guestPreStartOverlay").classList.add("hidden");
  startScreenOverlay.classList.add("hidden");

  // Show countdown overlay
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  countdownOverlay.classList.remove("hidden");

  let count = 3;
  countdownNumber.innerText = count;
  countdownNumber.className = "text-8xl md:text-9xl font-black text-amber-400 font-sans select-none countdown-pulse";
  playSynthSound('countdownBeep');

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNumber.innerText = count;
      // Reset animation by triggering reflow
      countdownNumber.classList.remove("countdown-pulse");
      void countdownNumber.offsetWidth; // reflow
      countdownNumber.classList.add("countdown-pulse");
      playSynthSound('countdownBeep');
    } else if (count === 0) {
      countdownNumber.innerText = "เริ่มได้! 🎈";
      countdownNumber.classList.remove("countdown-pulse");
      void countdownNumber.offsetWidth; // reflow
      countdownNumber.classList.add("countdown-pulse");
      playSynthSound('countdownGo');
    } else {
      clearInterval(interval);
      countdownOverlay.classList.add("hidden");
      startGameplay();
    }
  }, 1000);
}

function startGameplay() {
  score = 0;
  timeLeft = gameDuration;
  comboCount = 0;
  maxCombo = 0;
  opponentScore = 0;
  opponentCombo = 0;
  balloonSeqId = 0;
  spawnTimer = 0;

  // Reset pointers and tracking states to prevent stale values between sessions
  trackingActive = false;
  activePointer = { x: -100, y: -100 };
  targetPointer = { x: -100, y: -100 };
  opponentPointer = { x: -100, y: -100, active: false };
  opponentTargetPointer = { x: -100, y: -100 };

  gameHud.classList.remove("hidden");

  if (hudCombo) hudCombo.classList.add("hidden");
  if (opponentHudCombo) opponentHudCombo.classList.add("hidden");
  
  scoreDisplay.innerText = "000";
  opponentScoreDisplay.innerText = "000";
  timerDisplay.innerText = timeLeft;
  
  balloons = [];
  particles = [];
  textParticles = [];
  listPoppedCorrect = [];
  listPoppedIncorrect = [];
  activeComboAnnounce = null;
  
  gameActive = true;
  
  resizeCanvas();

  if (gameInterval) clearInterval(gameInterval);

  gameInterval = setInterval(() => {
    if (gameActive) {
      timeLeft--;
      timerDisplay.innerText = timeLeft;
      playSynthSound('tick');

      if (timeLeft <= 0) {
        endGameSummary();
      }
    }
  }, 1000);

  requestAnimationFrame(gameLoop);
}

function showFeedbackMessage(text, isPositive) {
  comboFeedback.innerText = text;
  comboFeedback.className = isPositive 
    ? "absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2.5 rounded-full font-black text-sm z-10 shadow-lg tracking-wider animate-bounce block border-2 border-white"
    : "absolute top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-5 py-2.5 rounded-full font-black text-sm z-10 shadow-lg tracking-wider animate-bounce block border-2 border-white";
  
  setTimeout(() => {
    comboFeedback.className = "hidden";
  }, 1500);
}

function gameLoop(timestamp) {
  if (!gameActive) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const logicWidth = canvas.width / (window.devicePixelRatio || 1);
  const logicHeight = canvas.height / (window.devicePixelRatio || 1);

  // Calculate Delta Time (dt)
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 16.667; 
  lastTime = timestamp;

  if (dt > 10) dt = 1.0;

  // Lerp pointer smoothing (Frame-rate independent)
  if (trackingActive) {
    const lerpFactor = 1 - Math.pow(1 - 0.25, dt);
    activePointer.x += (targetPointer.x - activePointer.x) * lerpFactor;
    activePointer.y += (targetPointer.y - activePointer.y) * lerpFactor;
  }

  // Lerp opponent pointer smoothing (Frame-rate independent)
  if (isMultiplayer && opponentPointer && opponentPointer.active) {
    const lerpFactor = 1 - Math.pow(1 - 0.20, dt); // slightly slower (0.20) for network jitter smoothing
    opponentPointer.x += (opponentTargetPointer.x - opponentPointer.x) * lerpFactor;
    opponentPointer.y += (opponentTargetPointer.y - opponentPointer.y) * lerpFactor;
  }

  ctx.save();

  // Apply Screen Shake
  if (shakeIntensity > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeIntensity *= Math.pow(0.9, dt);
    if (shakeIntensity < 0.5) shakeIntensity = 0;
  }

  if (gameMode === "ai" && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    const vWidth = videoElement.videoWidth || 1280;
    const vHeight = videoElement.videoHeight || 720;
    
    const videoRatio = vWidth / vHeight;
    const canvasRatio = logicWidth / logicHeight;
    
    let sx, sy, sWidth, sHeight;
    if (canvasRatio > videoRatio) {
      sWidth = vWidth;
      sHeight = vWidth / canvasRatio;
      sx = 0;
      sy = (vHeight - sHeight) / 2;
    } else {
      sWidth = vHeight * canvasRatio;
      sHeight = vHeight;
      sx = (vWidth - sWidth) / 2;
      sy = 0;
    }

    ctx.translate(logicWidth, 0);
    ctx.scale(-1, 1);
    ctx.globalAlpha = 0.45;
    ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, logicWidth, logicHeight);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, logicHeight);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, logicWidth, logicHeight);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(100, 120, 50, 0, Math.PI * 2);
    ctx.arc(150, 100, 60, 0, Math.PI * 2);
    ctx.arc(200, 120, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(logicWidth - 150, 180, 40, 0, Math.PI * 2);
    ctx.arc(logicWidth - 100, 160, 50, 0, Math.PI * 2);
    ctx.arc(logicWidth - 60, 180, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Deterministic Time-Based Spawning (Using Balloon Pool)
  spawnTimer += dt * 16.667;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    if (balloons.length < 5) {
      let b;
      if (balloonPool.length > 0) {
        b = balloonPool.pop();
        b.init(canvas.width, canvas.height);
      } else {
        b = new Balloon(canvas.width, canvas.height);
      }
      balloons.push(b);
    }
  }

  // Update & Render floating balloons
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.update(dt);
    b.draw(ctx);

    // Check if pointer bounds collides inside the balloon
    if (trackingActive && !b.popped && b.checkCollision(activePointer.x, activePointer.y)) {
      b.popped = true;
      createExplosion(b.x, b.y, b.color);

      if (b.isPra) {
        comboCount++;
        if (comboCount > maxCombo) maxCombo = comboCount;
        
        const comboBonus = Math.min(5, Math.floor((comboCount - 1) / 3)) * 2;
        const pointsGained = 10 + comboBonus;
        score += pointsGained;
        
        playSynthSound('popCorrect');
        
        let feedbackMsg = `เก่งมาก! "${b.word}" เป็น${CORRECT_CAT_NAME} +${pointsGained}`;
        if (comboCount >= 3) {
          feedbackMsg = `🔥 COMBO x${comboCount}! ${feedbackMsg}`;
          triggerScreenShake(6);
          activeComboAnnounce = {
            text: `🔥 COMBO x${comboCount}!`,
            life: 60,
            alpha: 1,
            scale: 0.5
          };
        }
        showFeedbackMessage(feedbackMsg, true);
        createTextParticle(b.x, b.y, `+${pointsGained}`, "#10b981", comboCount >= 3);
        
        if (!listPoppedCorrect.includes(b.word)) listPoppedCorrect.push(b.word);
      } else {
        comboCount = 0;
        score = Math.max(0, score - 5);
        playSynthSound('popIncorrect');
        showFeedbackMessage(`พลาดแล้ว! "${b.word}" ไม่ใช่${CORRECT_CAT_NAME} -5`, false);
        createTextParticle(b.x, b.y, "-5", "#ef4444", false);
        
        triggerScreenShake(12);
        
        if (!listPoppedIncorrect.includes(b.word)) listPoppedIncorrect.push(b.word);
      }
      
      scoreDisplay.innerText = score.toString().padStart(3, '0');
      updateComboHUD();

      // Sync POP and Score (POP is only sent in "share" mode)
      if (isMultiplayer && networkConnection && networkConnection.open) {
        if (matchMode === "share") {
          networkConnection.send({
            type: "pop",
            id: b.id
          });
        }
        networkConnection.send({
          type: "score",
          score: score,
          combo: comboCount
        });
      }
    }

    // Object pooling release & swap-with-last removal
    if (b.y < -b.radius || b.popped) {
      balloonPool.push(b);
      balloons[i] = balloons[balloons.length - 1];
      balloons.pop();
    }
  }

  // Handle Particle explosions
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(dt);
    p.draw(ctx);
    if (p.alpha <= 0) {
      particlePool.push(p);
      particles[i] = particles[particles.length - 1];
      particles.pop();
    }
  }

  // Handle Text Particles
  for (let i = textParticles.length - 1; i >= 0; i--) {
    const tp = textParticles[i];
    tp.update(dt);
    tp.draw(ctx);
    if (tp.alpha <= 0) {
      textParticlePool.push(tp);
      textParticles[i] = textParticles[textParticles.length - 1];
      textParticles.pop();
    }
  }

  // Render Big Combo Announcement
  if (activeComboAnnounce) {
    activeComboAnnounce.life -= dt;
    
    if (activeComboAnnounce.life > 45) {
      activeComboAnnounce.scale = 0.5 + (1.5 - 0.5) * ((60 - activeComboAnnounce.life) / 15);
    } else {
      activeComboAnnounce.alpha = Math.max(0, activeComboAnnounce.life / 45);
      activeComboAnnounce.scale = 1.5 * Math.max(0, activeComboAnnounce.life / 45);
    }
    
    ctx.save();
    ctx.translate(logicWidth / 2, logicHeight / 2 - 40);
    ctx.scale(activeComboAnnounce.scale, activeComboAnnounce.scale);
    ctx.globalAlpha = activeComboAnnounce.alpha;
    
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 25;
    
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 10;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 48px 'Kanit', sans-serif";
    
    const text = activeComboAnnounce.text;
    ctx.strokeText(text, 0, 0);
    
    const grad = ctx.createLinearGradient(0, -25, 0, 25);
    grad.addColorStop(0, "#fde047");
    grad.addColorStop(0.5, "#f97316");
    grad.addColorStop(1, "#ef4444");
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
    
    if (activeComboAnnounce.life <= 0) {
      activeComboAnnounce = null;
    }
  }

  // Render Big Countdown in the last 10 seconds (Pulsing Red)
  if (gameActive && timeLeft <= 10 && timeLeft > 0) {
    const timeFrac = (Date.now() % 1000) / 1000;
    const scale = 2.0 - timeFrac * 0.7;
    const alpha = 1.0 - timeFrac * 0.4;
    
    ctx.save();
    ctx.translate(logicWidth / 2, logicHeight * 0.25);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 15;
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 36px 'Kanit', sans-serif";
    
    const countdownText = `⏱️ ${timeLeft}`;
    ctx.strokeText(countdownText, 0, 0);
    ctx.fillStyle = "#ef4444";
    ctx.fillText(countdownText, 0, 0);
    
    ctx.restore();
  }

  // Render local pointer
  if (trackingActive) {
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    
    const currentHeight = canvas.height / (window.devicePixelRatio || 1);
    const pointerScale = currentHeight / 540;
    
    ctx.shadowBlur = 15 * pointerScale;
    
    ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
    ctx.beginPath();
    ctx.arc(activePointer.x, activePointer.y, 8 * pointerScale, 0, Math.PI * 2);
    ctx.fill();

    const timeScale = (Date.now() % 1000) / 1000;
    ctx.strokeStyle = "rgba(251, 191, 36, " + (1 - timeScale) + ")";
    ctx.lineWidth = 3 * pointerScale;
    ctx.beginPath();
    ctx.arc(activePointer.x, activePointer.y, (10 + timeScale * 25) * pointerScale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Render Opponent Ghost Pointer (Cyan Ring)
  if (isMultiplayer && matchMode === "share" && opponentPointer && opponentPointer.active) {
    ctx.save();
    
    const currentHeight = canvas.height / (window.devicePixelRatio || 1);
    const pointerScale = currentHeight / 540;
    
    const oppX = opponentPointer.x * logicWidth;
    const oppY = opponentPointer.y * logicHeight;

    ctx.shadowColor = '#06b6d4'; 
    ctx.shadowBlur = 15 * pointerScale;
    
    ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
    ctx.beginPath();
    ctx.arc(oppX, oppY, 8 * pointerScale, 0, Math.PI * 2);
    ctx.fill();

    const timeScale = ((Date.now() + 500) % 1000) / 1000; 
    ctx.strokeStyle = "rgba(6, 182, 212, " + (1 - timeScale) + ")";
    ctx.lineWidth = 3 * pointerScale;
    ctx.beginPath();
    ctx.arc(oppX, oppY, (10 + timeScale * 25) * pointerScale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Throttle pointer sync to 50ms intervals
  const nowTime = Date.now();
  if (isMultiplayer && networkConnection && networkConnection.open && nowTime - lastTimePointerSent > 50) {
    lastTimePointerSent = nowTime;
    networkConnection.send({
      type: "pointer",
      x: activePointer.x / logicWidth,
      y: activePointer.y / logicHeight,
      active: trackingActive
    });
  }

  requestAnimationFrame(gameLoop);
}

function updateComboHUD() {
  if (comboCount >= 3) {
    hudCombo.innerText = `COMBO x${comboCount}`;
    hudCombo.classList.remove("hidden");
  } else {
    hudCombo.classList.add("hidden");
  }
}

function triggerScreenShake(intensity) {
  shakeIntensity = intensity;
}

// Complete Match, reveal detailed educational evaluations
function endGameSummary() {
  gameActive = false;
  if (gameInterval) clearInterval(gameInterval);
  if (hudCombo) hudCombo.classList.add("hidden");
  if (opponentHudCombo) opponentHudCombo.classList.add("hidden");
  
  gameHud.classList.add("hidden");
  
  playSynthSound('gameover');

  finalScore.innerText = score;
  finalCombo.innerText = maxCombo;
  
  let rank = "ระดับทองแดง (Bronze)";
  let badge = "🥉";
  let rankColor = "text-amber-700";
  
  if (isMultiplayer) {
    if (score > opponentScore) {
      rank = "ชนะการแข่งขัน! 🏆";
      badge = "👑";
      rankColor = "text-emerald-500";
    } else if (score < opponentScore) {
      rank = "แพ้การแข่งขัน (พยายามใหม่นะ)";
      badge = "⚔️";
      rankColor = "text-rose-500";
    } else {
      rank = "เสมอกันอย่างสมศักดิ์ศรี!";
      badge = "🤝";
      rankColor = "text-indigo-500";
    }
  } else {
    if (score >= 120) {
      rank = "อัจฉริยะภาษาไทย! (Diamond)";
      badge = "💎";
      rankColor = "text-cyan-500";
    } else if (score >= 80) {
      rank = "ยอดเยี่ยมมาก! (Gold)";
      badge = "🏆";
      rankColor = "text-yellow-500";
    } else if (score >= 40) {
      rank = "ผ่านเกณฑ์เรียนรู้ (Silver)";
      badge = "🥈";
      rankColor = "text-slate-400";
    }
  }

  perfRating.innerText = rank;
  perfRating.className = `text-lg font-black ${rankColor} leading-tight`;
  badgeIcon.innerText = badge;

  poppedListCorrect.innerHTML = listPoppedCorrect.length > 0 
    ? listPoppedCorrect.map(w => `<button onclick="speakWord('${w}')" class="bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-semibold border border-emerald-200 flex items-center gap-1 cursor-pointer"><i class="fa-solid fa-volume-high text-[10px]"></i> ${w}</button>`).join('')
    : `<span class="text-xs text-slate-400 italic">ยังไม่มีคำศัพท์ที่ตอบถูก</span>`;

  poppedListIncorrect.innerHTML = listPoppedIncorrect.length > 0
    ? listPoppedIncorrect.map(w => `<button onclick="speakWord('${w}')" class="bg-rose-50 hover:bg-rose-100 active:scale-95 transition text-rose-800 text-xs px-2.5 py-1 rounded-lg font-semibold border border-rose-200 flex items-center gap-1 cursor-pointer"><i class="fa-solid fa-volume-high text-[10px]"></i> ${w}</button>`).join('')
    : `<span class="text-xs text-emerald-600 italic font-semibold"><i class="fa-solid fa-circle-check"></i> เยี่ยมมาก! คุณไม่ได้เจาะผิดประเภทเลย</span>`;

  gameOverModal.classList.remove("hidden");
}
