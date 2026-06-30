// ==========================================
// DOMAIN ENTITIES: BALLOON, PARTICLE & POOLS
// ==========================================

// Balloon Class Object
class Balloon {
  constructor(canvasWidth, canvasHeight) {
    if (canvasWidth !== undefined) {
      this.init(canvasWidth, canvasHeight);
    }
  }

  init(canvasWidth, canvasHeight) {
    this.logicWidth = canvasWidth / (window.devicePixelRatio || 1);
    this.logicHeight = canvasHeight / (window.devicePixelRatio || 1);
    
    const scale = this.logicHeight / 540;
    
    this.radius = (Math.floor(seededRandom() * 15) + 50) * scale; 
    this.baseX = seededRandom() * (this.logicWidth - this.radius * 2) + this.radius; 
    this.x = this.baseX;
    this.y = this.logicHeight + this.radius + seededRandom() * 80 * scale; 
    
    this.speedY = (seededRandom() * 0.4 + 0.15 + (Math.pow(gameSpeed, 1.4) * 0.12)) * scale; 
    this.color = BALLOON_COLORS[Math.floor(seededRandom() * BALLOON_COLORS.length)];
    
    this.wobbleSpeed = seededRandom() * 0.015 + 0.005; 
    this.wobbleRange = (seededRandom() * 12 + 4) * scale; 
    this.wobbleAngle = seededRandom() * Math.PI * 2;

    this.isPra = seededRandom() < 0.6;
    if (this.isPra) {
      this.word = PRA_WORDS[Math.floor(seededRandom() * PRA_WORDS.length)];
    } else {
      this.word = NON_PRA_WORDS[Math.floor(seededRandom() * NON_PRA_WORDS.length)];
    }

    this.popped = false;
    this.poppedByOpponent = false;
    this.id = balloonSeqId++; 
  }

  update(dt) {
    this.y -= this.speedY * dt;
    this.wobbleAngle += this.wobbleSpeed * dt;
    this.x = this.baseX + Math.sin(this.wobbleAngle) * this.wobbleRange;
  }

  draw(ctx) {
    ctx.save();
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 10 * (this.radius / 58);
    ctx.shadowOffsetY = 6 * (this.radius / 58);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius * 0.85, this.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.4, this.radius * 0.15, this.radius * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.radius - 2);
    ctx.lineTo(this.x - (10 * (this.radius / 58)), this.y + this.radius + (10 * (this.radius / 58)));
    ctx.lineTo(this.x + (10 * (this.radius / 58)), this.y + this.radius + (10 * (this.radius / 58)));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(100, 100, 100, 0.4)";
    ctx.lineWidth = 2.5 * (this.radius / 58);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.radius + (10 * (this.radius / 58)));
    ctx.bezierCurveTo(
      this.x - (10 * (this.radius / 58)), this.y + this.radius + (25 * (this.radius / 58)), 
      this.x + (10 * (this.radius / 58)), this.y + this.radius + (40 * (this.radius / 58)), 
      this.x, this.y + this.radius + (60 * (this.radius / 58))
    );
    ctx.stroke();

    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4 * (this.radius / 58);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(this.radius * 0.32)}px 'Kanit', sans-serif`;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = this.radius * 0.08;
    ctx.strokeText(this.word, this.x, this.y);
    ctx.fillText(this.word, this.x, this.y);

    ctx.restore();
  }

  checkCollision(px, py) {
    const dx = this.x - px;
    const dy = this.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.radius + 20 * (this.radius / 58));
  }
}

// Pop Particle Effect System
class Particle {
  constructor(x, y, color) {
    if (x !== undefined) {
      this.init(x, y, color);
    }
  }

  init(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  update(dt) {
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.speedY += 0.1 * dt; 
    this.alpha -= this.decay * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createExplosion(x, y, color) {
  for (let i = 0; i < 18; i++) {
    let p;
    if (particlePool.length > 0) {
      p = particlePool.pop();
      p.init(x, y, color);
    } else {
      p = new Particle(x, y, color);
    }
    particles.push(p);
  }
}

// Text Particle Class
class TextParticle {
  constructor(x, y, text, color, isBig = false) {
    if (x !== undefined) {
      this.init(x, y, text, color, isBig);
    }
  }
  
  init(x, y, text, color, isBig = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.speedY = -2.5 - Math.random() * 1.5;
    this.speedX = (Math.random() - 0.5) * 2;
    this.scale = isBig ? 1.5 : 1.0;
    this.decay = 0.02;
  }
  
  update(dt) {
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.alpha -= this.decay * dt;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4 * this.scale;
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(20 * this.scale)}px 'Kanit', sans-serif`;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

function createTextParticle(x, y, text, color, isBig) {
  let tp;
  if (textParticlePool.length > 0) {
    tp = textParticlePool.pop();
    tp.init(x, y, text, color, isBig);
  } else {
    tp = new TextParticle(x, y, text, color, isBig);
  }
  textParticles.push(tp);
}
