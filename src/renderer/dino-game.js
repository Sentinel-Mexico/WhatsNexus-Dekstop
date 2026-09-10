/**
 * WhatsNexus - Retro T-Rex Runner Canvas Engine
 * Modularized easter egg minigame for offline reconnection screens.
 */

class DinoGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = this.canvas.parentElement;
    this.hintEl = document.getElementById('dino-hint-text');

    this.isRunning = false;
    this.isGameOver = false;
    this.animationFrameId = null;

    this.groundY = 260;
    this.gravity = 0.65;
    this.jumpForce = -13.5;

    this.dino = {
      x: 50,
      y: this.groundY - 40,
      width: 40,
      height: 40,
      vy: 0,
      isJumping: false,
      isDucking: false,
      legFrame: 0,
      legTimer: 0
    };

    this.obstacles = [];
    this.clouds = [
      { x: 140, y: 35, speed: 0.5, width: 44 },
      { x: 480, y: 65, speed: 0.35, width: 38 },
      { x: 820, y: 40, speed: 0.45, width: 50 }
    ];
    this.groundDashes = [];
    this.initGround();

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('whatsnexus_dino_hi') || '0', 10);
    this.speed = 5.5;
    this.minSpawnDist = 280;
    this.nextSpawnDist = 320;
    this.distanceSinceSpawn = 0;

    this.audioCtx = null;

    // Bound handlers for clean removal in destruir()
    this._boundKeydown = (e) => this.handleKeydown(e);
    this._boundKeyup = (e) => this.handleKeyup(e);
    this._boundClick = (e) => this.handleClick(e);
    this._boundResize = () => this.resize();
    this._boundVisibility = () => {
      if (document.hidden) {
        this.pausar();
      }
    };

    this.resize();
    window.addEventListener('resize', this._boundResize);
    window.addEventListener('keydown', this._boundKeydown);
    window.addEventListener('keyup', this._boundKeyup);
    window.addEventListener('blur', this._boundVisibility);
    document.addEventListener('visibilitychange', this._boundVisibility);
    this.canvas.addEventListener('click', this._boundClick);

    // Dynamic theme reactivity: redraw on theme mutation
    this.themeObserver = new MutationObserver(() => {
      if (!this.isRunning) {
        this.draw();
      }
    });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playBeep(type) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      const now = this.audioCtx.currentTime;

      if (type === 'jump') {
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.18);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'score') {
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (_) {}
  }

  initGround() {
    this.groundDashes = [];
    for (let x = 0; x < 1800; x += 18) {
      if (Math.random() > 0.45) {
        this.groundDashes.push({
          x: x,
          width: Math.floor(Math.random() * 8) + 4,
          yOffset: Math.floor(Math.random() * 4)
        });
      }
    }
  }

  resize() {
    if (!this.canvas) return;
    const parentWidth = this.wrapper ? this.wrapper.clientWidth : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 800);
    const targetWidth = Math.max(parentWidth || 800, 300);
    const targetHeight = 300;
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    this.groundY = 260;

    if (!this.dino.isJumping) {
      this.dino.height = this.dino.isDucking ? 24 : 40;
      this.dino.y = this.groundY - this.dino.height;
    }

    if (!this.isRunning && !this.isGameOver) {
      this.draw();
    }
  }

  handleKeydown(e) {
    const overlay = document.getElementById('network-offline-overlay');
    if (!overlay || overlay.classList.contains('hidden') || overlay.style.display === 'none') return;

    if (e.code === 'ArrowUp') {
      e.preventDefault();
      this.handleAction();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (this.isRunning && !this.isGameOver) {
        if (this.dino.isJumping) {
          this.dino.vy += 6;
        } else {
          this.dino.isDucking = true;
        }
      }
    }
  }

  handleKeyup(e) {
    const overlay = document.getElementById('network-offline-overlay');
    if (!overlay || overlay.classList.contains('hidden') || overlay.style.display === 'none') return;

    if (e.code === 'ArrowDown') {
      e.preventDefault();
      this.dino.isDucking = false;
    }
  }

  handleClick(e) {
    e.stopPropagation();
    this.handleAction();
  }

  handleAction() {
    if (this.isGameOver) {
      this.reiniciar();
    } else if (!this.isRunning) {
      this.iniciar();
      this.jump();
    } else {
      this.jump();
    }
  }

  jump() {
    if (!this.dino.isJumping && !this.dino.isDucking) {
      this.dino.isJumping = true;
      this.dino.vy = this.jumpForce;
      this.playBeep('jump');
    }
  }

  iniciar() {
    this.resize();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isRunning = true;
    this.isGameOver = false;
    this.updateHint();
    this.loop();
  }

  start() {
    this.iniciar();
  }

  pausar() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop() {
    this.pausar();
  }

  reiniciar() {
    this.score = 0;
    this.speed = 5.5;
    this.obstacles = [];
    this.distanceSinceSpawn = 0;
    this.nextSpawnDist = 320;
    this.dino.height = 40;
    this.dino.width = 40;
    this.dino.y = this.groundY - this.dino.height;
    this.dino.vy = 0;
    this.dino.isJumping = false;
    this.dino.isDucking = false;
    this.isGameOver = false;
    this.isRunning = true;
    this.updateHint();
    this.loop();
  }

  destruir() {
    this.pausar();
    window.removeEventListener('resize', this._boundResize);
    window.removeEventListener('keydown', this._boundKeydown);
    window.removeEventListener('keyup', this._boundKeyup);
    window.removeEventListener('blur', this._boundVisibility);
    document.removeEventListener('visibilitychange', this._boundVisibility);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this._boundClick);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy() {
    this.destruir();
  }

  updateHint() {
    if (!this.hintEl) return;
    const getStr = (key, fallback) => {
      if (typeof currentTranslations !== 'undefined' && currentTranslations && currentTranslations[key]) {
        return currentTranslations[key];
      }
      return fallback;
    };
    if (this.isGameOver) {
      this.hintEl.textContent = getStr('dino_restart_hint', 'Presiona ↑ o haz clic para reiniciar');
    } else {
      this.hintEl.textContent = getStr('dino_jump_hint', 'Presiona ↑ para saltar, ↓ para agacharte');
    }
  }

  getThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      textPrimary: cs.getPropertyValue('--text-primary').trim() || '#e9edef',
      textSecondary: cs.getPropertyValue('--text-secondary').trim() || '#8696a0',
      accent: cs.getPropertyValue('--accent-color').trim() || '#4C9E5F',
      border: cs.getPropertyValue('--border-color').trim() || '#2a3942',
      bg: cs.getPropertyValue('--whatsapp-bg').trim() || '#0c1317'
    };
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    if (!this.isGameOver) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  update() {
    if (this.speed < 11.5) {
      this.speed += 0.0012;
    }

    const prevScore = Math.floor(this.score);
    this.score += this.speed * 0.025;
    const curScore = Math.floor(this.score);
    if (curScore > 0 && curScore % 100 === 0 && Math.floor(prevScore / 100) !== Math.floor(curScore / 100)) {
      this.playBeep('score');
    }

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('whatsnexus_dino_hi', this.highScore.toString());
    }

    // Dino Physics & Ducking State
    if (this.dino.isDucking && !this.dino.isJumping) {
      this.dino.height = 24;
      this.dino.width = 54;
      this.dino.y = this.groundY - 24;
    } else {
      this.dino.height = 40;
      this.dino.width = 40;
      if (!this.dino.isJumping) {
        this.dino.y = this.groundY - 40;
      }
    }

    if (this.dino.isJumping) {
      this.dino.y += this.dino.vy;
      this.dino.vy += this.gravity;
      if (this.dino.y >= this.groundY - this.dino.height) {
        this.dino.y = this.groundY - this.dino.height;
        this.dino.vy = 0;
        this.dino.isJumping = false;
      }
    } else {
      this.dino.legTimer++;
      if (this.dino.legTimer > 5) {
        this.dino.legFrame = this.dino.legFrame === 0 ? 1 : 0;
        this.dino.legTimer = 0;
      }
    }

    // Ground scroll
    this.groundDashes.forEach(d => {
      d.x -= this.speed;
      if (d.x < -20) {
        d.x = this.canvas.width + Math.random() * 40;
      }
    });

    // Clouds scroll
    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.width < -10) {
        c.x = this.canvas.width + Math.random() * 120;
        c.y = 20 + Math.random() * 55;
      }
    });

    // Obstacles spawn
    this.distanceSinceSpawn += this.speed;
    if (this.distanceSinceSpawn >= this.nextSpawnDist) {
      this.spawnObstacle();
      this.distanceSinceSpawn = 0;
      this.nextSpawnDist = this.minSpawnDist + Math.random() * 260 + (11.5 - this.speed) * 15;
    }

    // Update obstacles & collision
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed;

      if (obs.isPtero) {
        obs.wingTimer = (obs.wingTimer || 0) + 1;
        if (obs.wingTimer > 7) {
          obs.wingFrame = obs.wingFrame === 0 ? 1 : 0;
          obs.wingTimer = 0;
        }
      }

      // Hitboxes
      const dinoBox = {
        left: this.dino.x + 5,
        right: this.dino.x + this.dino.width - 5,
        top: this.dino.y + 4,
        bottom: this.dino.y + this.dino.height
      };
      const obsBox = {
        left: obs.x + 4,
        right: obs.x + obs.width - 4,
        top: obs.y + 3,
        bottom: obs.y + obs.height - 2
      };

      if (
        dinoBox.left < obsBox.right &&
        dinoBox.right > obsBox.left &&
        dinoBox.top < obsBox.bottom &&
        dinoBox.bottom > obsBox.top
      ) {
        this.triggerGameOver();
        break;
      }

      if (obs.x + obs.width < -20) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle() {
    let types = ['small', 'double', 'tall'];
    if (this.score > 35) {
      types = ['small', 'double', 'tall', 'ptero-low', 'ptero-mid', 'ptero-high'];
    }
    const chosen = types[Math.floor(Math.random() * types.length)];
    let width = 18;
    let height = 36;
    let y = this.groundY - height;
    let isPtero = false;

    if (chosen === 'double') {
      width = 36;
      height = 34;
      y = this.groundY - height;
    } else if (chosen === 'tall') {
      width = 24;
      height = 48;
      y = this.groundY - height;
    } else if (chosen === 'ptero-low') {
      isPtero = true;
      width = 44;
      height = 28;
      y = this.groundY - 32;
    } else if (chosen === 'ptero-mid') {
      isPtero = true;
      width = 44;
      height = 28;
      y = this.groundY - 56;
    } else if (chosen === 'ptero-high') {
      isPtero = true;
      width = 44;
      height = 28;
      y = this.groundY - 96;
    }

    this.obstacles.push({
      x: this.canvas.width + 10,
      y,
      width,
      height,
      type: chosen,
      isPtero,
      wingFrame: 0,
      wingTimer: 0
    });
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.playBeep('hit');
    this.updateHint();
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const colors = this.getThemeColors();

    ctx.clearRect(0, 0, w, h);

    // Clouds
    ctx.fillStyle = colors.border;
    this.clouds.forEach(c => {
      this.drawCloud(ctx, c.x, c.y);
    });

    // Ground line
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(w, this.groundY);
    ctx.stroke();

    // Ground dashes
    ctx.fillStyle = colors.textSecondary;
    this.groundDashes.forEach(d => {
      if (d.x >= 0 && d.x <= w) {
        ctx.fillRect(d.x, this.groundY + 4 + d.yOffset, d.width, 1.5);
      }
    });

    // Obstacles
    this.obstacles.forEach(obs => {
      if (obs.isPtero) {
        this.drawPterodactyl(ctx, obs, colors);
      } else {
        this.drawCactus(ctx, obs, colors.textPrimary, colors.accent);
      }
    });

    // Dino (Standing or Ducking)
    if (this.dino.isDucking && !this.dino.isJumping) {
      this.drawDuckingDino(ctx, this.dino.x, this.dino.y, colors);
    } else {
      this.drawStandingDino(ctx, this.dino.x, this.dino.y, colors);
    }

    // Score
    this.drawScore(ctx, w, colors);

    // Game Over Banner
    if (this.isGameOver) {
      this.drawGameOverBanner(ctx, w, colors);
    }
  }

  drawCloud(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x + 12, y + 10, 9, 0, Math.PI * 2);
    ctx.arc(x + 22, y + 6, 12, 0, Math.PI * 2);
    ctx.arc(x + 34, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCactus(ctx, obs, primaryColor, accentColor) {
    ctx.fillStyle = accentColor;
    const x = obs.x;
    const y = obs.y;
    const h = obs.height;

    if (obs.type === 'double') {
      ctx.fillRect(x + 4, y, 6, h);
      ctx.fillRect(x, y + 8, 4, 10);
      ctx.fillRect(x, y + 16, 5, 4);
      ctx.fillRect(x + 18, y + 4, 6, h - 4);
      ctx.fillRect(x + 24, y + 12, 4, 8);
      ctx.fillRect(x + 22, y + 18, 4, 4);
    } else if (obs.type === 'tall') {
      ctx.fillRect(x + 7, y, 8, h);
      ctx.fillRect(x + 1, y + 12, 6, 4);
      ctx.fillRect(x + 1, y + 8, 4, 8);
      ctx.fillRect(x + 15, y + 16, 6, 4);
      ctx.fillRect(x + 17, y + 10, 4, 10);
    } else {
      ctx.fillRect(x + 5, y, 6, h);
      ctx.fillRect(x, y + 8, 5, 4);
      ctx.fillRect(x, y + 6, 4, 6);
      ctx.fillRect(x + 11, y + 12, 5, 4);
      ctx.fillRect(x + 12, y + 9, 4, 6);
    }
  }

  drawPterodactyl(ctx, obs, colors) {
    const x = obs.x;
    const y = obs.y;
    const accent = colors.accent;
    const eyeBg = colors.bg;

    ctx.fillStyle = accent;

    // Body
    ctx.fillRect(x + 12, y + 10, 22, 9);
    // Tail
    ctx.fillRect(x + 34, y + 12, 8, 4);
    ctx.fillRect(x + 40, y + 13, 4, 2);
    // Neck & Head
    ctx.fillRect(x + 6, y + 7, 8, 8);
    // Beak
    ctx.fillRect(x, y + 9, 7, 4);
    // Crest (back of head)
    ctx.fillRect(x + 12, y + 4, 6, 4);

    // Eye
    ctx.fillStyle = eyeBg;
    ctx.fillRect(x + 5, y + 8, 2, 2);
    ctx.fillStyle = accent;

    // Wings Flapping Animation
    if (obs.wingFrame === 0) {
      // Wings UP
      ctx.fillRect(x + 16, y - 2, 8, 12);
      ctx.fillRect(x + 18, y - 8, 6, 7);
      ctx.fillRect(x + 20, y - 12, 4, 5);
    } else {
      // Wings DOWN
      ctx.fillRect(x + 16, y + 15, 8, 8);
      ctx.fillRect(x + 18, y + 21, 6, 6);
      ctx.fillRect(x + 20, y + 25, 4, 4);
    }
  }

  drawDuckingDino(ctx, x, y, colors) {
    ctx.fillStyle = colors.accent;
    const p = 2;

    // Body & Tail (elongated posture)
    ctx.fillRect(x + 8 * p, y + 2 * p, 14 * p, 6 * p);
    ctx.fillRect(x + 2 * p, y + 3 * p, 6 * p, 4 * p);
    ctx.fillRect(x + 0 * p, y + 4 * p, 2 * p, 2 * p);

    // Extended neck & head
    ctx.fillRect(x + 20 * p, y + 0 * p, 7 * p, 6 * p);
    ctx.fillRect(x + 25 * p, y + 1 * p, 2 * p, 4 * p);

    // Eye
    if (this.isGameOver) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x + 22 * p, y + 1 * p, 2 * p, 2 * p);
      ctx.strokeStyle = colors.textPrimary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 22 * p, y + 1 * p);
      ctx.lineTo(x + 24 * p, y + 3 * p);
      ctx.moveTo(x + 24 * p, y + 1 * p);
      ctx.lineTo(x + 22 * p, y + 3 * p);
      ctx.stroke();
      ctx.fillStyle = colors.accent;
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x + 22 * p, y + 1 * p, 2 * p, 2 * p);
      ctx.fillStyle = colors.accent;
    }

    // Legs (crawling/running frames)
    if (this.dino.legFrame === 0) {
      ctx.fillRect(x + 10 * p, y + 8 * p, 3 * p, 4 * p);
      ctx.fillRect(x + 18 * p, y + 8 * p, 3 * p, 2 * p);
    } else {
      ctx.fillRect(x + 10 * p, y + 8 * p, 3 * p, 2 * p);
      ctx.fillRect(x + 18 * p, y + 8 * p, 3 * p, 4 * p);
    }
  }

  drawStandingDino(ctx, x, y, colors) {
    ctx.fillStyle = colors.accent;
    const p = 2;

    // Head & Snout
    ctx.fillRect(x + 14 * p, y + 0 * p, 8 * p, 2 * p);
    ctx.fillRect(x + 12 * p, y + 2 * p, 10 * p, 4 * p);
    ctx.fillRect(x + 12 * p, y + 6 * p, 6 * p, 2 * p);
    ctx.fillRect(x + 12 * p, y + 7 * p, 9 * p, 2 * p);

    // Eye
    if (this.isGameOver) {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x + 15 * p, y + 2 * p, 3 * p, 3 * p);
      ctx.strokeStyle = colors.textPrimary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 15 * p, y + 2 * p);
      ctx.lineTo(x + 18 * p, y + 5 * p);
      ctx.moveTo(x + 18 * p, y + 2 * p);
      ctx.lineTo(x + 15 * p, y + 5 * p);
      ctx.stroke();
      ctx.fillStyle = colors.accent;
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x + 15 * p, y + 2 * p, 2 * p, 2 * p);
      ctx.fillStyle = colors.accent;
    }

    // Body & Tail
    ctx.fillRect(x + 8 * p, y + 8 * p, 6 * p, 8 * p);
    ctx.fillRect(x + 6 * p, y + 9 * p, 4 * p, 6 * p);
    ctx.fillRect(x + 4 * p, y + 10 * p, 3 * p, 4 * p);
    ctx.fillRect(x + 2 * p, y + 11 * p, 3 * p, 2 * p);

    // Arms
    ctx.fillRect(x + 14 * p, y + 10 * p, 3 * p, 2 * p);
    ctx.fillRect(x + 16 * p, y + 11 * p, 1 * p, 2 * p);

    // Legs
    if (this.dino.isJumping) {
      ctx.fillRect(x + 8 * p, y + 16 * p, 2 * p, 4 * p);
      ctx.fillRect(x + 12 * p, y + 16 * p, 2 * p, 4 * p);
    } else if (this.isGameOver) {
      ctx.fillRect(x + 8 * p, y + 16 * p, 2 * p, 4 * p);
      ctx.fillRect(x + 8 * p, y + 19 * p, 3 * p, 1 * p);
      ctx.fillRect(x + 12 * p, y + 16 * p, 2 * p, 4 * p);
      ctx.fillRect(x + 12 * p, y + 19 * p, 3 * p, 1 * p);
    } else if (this.dino.legFrame === 0) {
      ctx.fillRect(x + 8 * p, y + 16 * p, 2 * p, 4 * p);
      ctx.fillRect(x + 8 * p, y + 19 * p, 3 * p, 1 * p);
      ctx.fillRect(x + 12 * p, y + 16 * p, 2 * p, 2 * p);
    } else {
      ctx.fillRect(x + 8 * p, y + 16 * p, 2 * p, 2 * p);
      ctx.fillRect(x + 12 * p, y + 16 * p, 2 * p, 4 * p);
      ctx.fillRect(x + 12 * p, y + 19 * p, 3 * p, 1 * p);
    }
  }

  drawScore(ctx, w, colors) {
    const sStr = Math.floor(this.score).toString().padStart(5, '0');
    const hiStr = this.highScore.toString().padStart(5, '0');

    ctx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'right';

    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(`HI ${hiStr}  `, w - 75, 24);

    ctx.fillStyle = colors.textPrimary;
    ctx.fillText(sStr, w - 16, 24);
  }

  drawGameOverBanner(ctx, w, colors) {
    const getStr = (key, fallback) => {
      if (typeof currentTranslations !== 'undefined' && currentTranslations && currentTranslations[key]) {
        return currentTranslations[key];
      }
      return fallback;
    };
    const text = getStr('dino_game_over', 'GAME OVER');
    ctx.fillStyle = colors.textPrimary;
    ctx.font = '800 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 60);

    const cx = w / 2;
    const cy = 92;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0.4 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - 13);
    ctx.lineTo(cx + 14, cy - 7);
    ctx.lineTo(cx + 6, cy - 3);
    ctx.fill();
  }
}

if (typeof window !== 'undefined') {
  window.DinoGame = DinoGame;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DinoGame;
}
