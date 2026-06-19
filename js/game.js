/* ================================================
   KPI RESTORE — Portfolio Game Mode
   ================================================ */

(function () {
  /* ── Constants ─────────────────────────────── */
  const ORB_COUNT   = 6;
  const GRAVITY     = 0.55;
  const JUMP_FORCE  = -13.5;
  const MOVE_SPEED  = 4.2;
  const PLATFORM_H  = 10;

  const ORB_MESSAGES = [
    { text: "Ran 12 user interviews.",       kpi: [8,  0,  3]  },
    { text: "Cut onboarding steps 7→3.",     kpi: [5,  0,  12] },
    { text: "Killed a feature nobody used.", kpi: [0,  9,  10] },
    { text: "Fixed the silent crash.",       kpi: [6,  11, 0]  },
    { text: "Reprioritised the roadmap.",    kpi: [4,  0,  8]  },
    { text: "Shipped the thing. Finally.",   kpi: [7,  9,  7]  },
  ];

  /* ── State ──────────────────────────────────── */
  let active       = false;
  let animFrame    = null;
  let keys         = {};
  let orbsCollected = 0;
  let toastQueue   = [];
  let toastShowing = false;

  /* KPI values 0-100 */
  let kpi = { retention: 0, nps: 0, velocity: 0 };

  /* Player physics */
  let player = { x:0, y:0, vx:0, vy:0, w:18, h:22, onGround:false, facing:1 };

  /* World objects */
  let platforms = [];
  let orbs      = [];

  /* ── DOM references (created on activate) ─── */
  let overlay, canvas, ctx, gameBtn;
  let kpiPanel, retBar, npsBar, velBar;
  let toastEl;

  /* ── Pixel-art character (drawn on canvas) ── */
  /* 9×11 pixel grid, 1=body, 2=skin, 3=hair, 4=detail */
  const SPRITE = [
    [0,0,3,3,3,3,3,0,0],
    [0,3,3,3,3,3,3,3,0],
    [0,2,2,2,2,2,2,2,0],
    [0,2,4,2,2,2,4,2,0],
    [0,2,2,2,4,2,2,2,0],
    [0,2,2,2,2,2,2,2,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [0,0,1,0,0,0,1,0,0],
    [0,0,1,0,0,0,1,0,0],
    [0,0,3,0,0,0,3,0,0],
  ];
  const SPRITE_COLORS = {
    1: '#6366f1', // body
    2: '#fde68a', // skin
    3: '#1e1b4b', // hair/shoes
    4: '#7c3aed', // eyes
  };
  const PIXEL = 2;

  /* ── Entry point ────────────────────────────── */
  function init() {
    gameBtn = document.getElementById('game-mode-btn');
    if (!gameBtn) return;
    gameBtn.addEventListener('click', toggle);

    /* ESC to exit */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && active) deactivate();
    });
  }

  function toggle() {
    active ? deactivate() : activate();
  }

  /* ── Activate ───────────────────────────────── */
  function activate() {
    active = true;
    gameBtn.textContent = '✕ EXIT';
    gameBtn.classList.add('active');

    /* Build overlay canvas */
    overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    document.body.appendChild(overlay);

    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    overlay.appendChild(canvas);
    ctx = canvas.getContext('2d');

    /* KPI panel */
    kpiPanel = document.createElement('div');
    kpiPanel.id = 'game-kpi';
    kpiPanel.innerHTML = `
      <div class="kpi-title">⚠ DASHBOARD OFFLINE</div>
      <div class="kpi-row"><span>Retention</span><div class="kpi-track"><div class="kpi-bar" id="ret-bar"></div></div><span class="kpi-val" id="ret-val">0%</span></div>
      <div class="kpi-row"><span>NPS</span><div class="kpi-track"><div class="kpi-bar" id="nps-bar"></div></div><span class="kpi-val" id="nps-val">0%</span></div>
      <div class="kpi-row"><span>Velocity</span><div class="kpi-track"><div class="kpi-bar" id="vel-bar"></div></div><span class="kpi-val" id="vel-val">0%</span></div>
      <div class="kpi-orbs" id="kpi-orbs">✦ 0 / ${ORB_COUNT}</div>
    `;
    document.body.appendChild(kpiPanel);
    retBar = document.getElementById('ret-bar');
    npsBar = document.getElementById('nps-bar');
    velBar = document.getElementById('vel-bar');

    /* Toast */
    toastEl = document.createElement('div');
    toastEl.id = 'game-toast';
    document.body.appendChild(toastEl);

    /* Instruction hint */
    const hint = document.createElement('div');
    hint.id = 'game-hint';
    hint.innerHTML = 'Arrow keys / WASD to move &nbsp;·&nbsp; Space to jump &nbsp;·&nbsp; ESC to exit';
    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add('fade-out'), 3200);
    setTimeout(() => hint.remove(), 4000);

    /* Input */
    document.addEventListener('keydown',  onKeyDown);
    document.addEventListener('keyup',    onKeyUp);

    /* Resize */
    window.addEventListener('resize', onResize);
    onResize();

    resetGame();
    loop();
  }

  /* ── Deactivate ─────────────────────────────── */
  function deactivate() {
    active = false;
    cancelAnimationFrame(animFrame);
    gameBtn.textContent = '▶ GAME MODE';
    gameBtn.classList.remove('active');

    overlay?.remove();
    kpiPanel?.remove();
    toastEl?.remove();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    window.removeEventListener('resize', onResize);

    overlay = canvas = ctx = kpiPanel = toastEl = null;
    keys = {}; toastQueue = []; toastShowing = false;
    orbsCollected = 0;
    kpi = { retention: 0, nps: 0, velocity: 0 };
  }

  /* ── Reset / build level ────────────────────── */
  function resetGame() {
    orbsCollected = 0;
    kpi = { retention: 0, nps: 0, velocity: 0 };
    keys = {};
    toastQueue = []; toastShowing = false;
    updateKpiUI();

    const W = canvas.width, H = canvas.height;

    /* ── Platforms ── */
    /* Ground floor */
    platforms = [
      { x: 0,         y: H - 24,   w: W,    h: PLATFORM_H, isGround: true },
    ];

    /* Distribute platforms across the width in a playable pattern */
    const cols  = 5;
    const colW  = W / cols;
    const rows  = [0.72, 0.58, 0.44, 0.30, 0.72, 0.58, 0.44];
    const rawPlatforms = [];
    for (let c = 0; c < cols; c++) {
      const yFrac  = rows[c % rows.length];
      const pw     = 80 + Math.random() * 60;
      const px     = colW * c + (colW - pw) / 2 + (Math.random() - 0.5) * 40;
      const py     = H * yFrac;
      rawPlatforms.push({ x: px, y: py, w: pw, h: PLATFORM_H, isGround: false });
    }

    /* Extra mid platforms to avoid dead zones */
    for (let i = 0; i < 4; i++) {
      const px = (W / 5) * (i + 0.5) + (Math.random() - 0.5) * 60;
      const py = H * (0.50 + Math.random() * 0.12);
      rawPlatforms.push({ x: px, y: py, w: 70 + Math.random() * 40, h: PLATFORM_H, isGround: false });
    }

    platforms.push(...rawPlatforms);

    /* ── Orbs: one per platform (non-ground), first 6 ── */
    orbs = [];
    const orbPlatforms = rawPlatforms.slice(0, ORB_COUNT);
    orbPlatforms.forEach((p, i) => {
      orbs.push({
        x:        p.x + p.w / 2,
        y:        p.y - 16,
        r:        7,
        collected: false,
        msg:      ORB_MESSAGES[i],
        pulse:    Math.random() * Math.PI * 2,
      });
    });

    /* ── Player spawn ── */
    player = {
      x:       W * 0.08,
      y:       H - 24 - 30,
      vx:      0,
      vy:      0,
      w:       18,
      h:       22,
      onGround:false,
      facing:  1,
      frame:   0,
      walkTick:0,
    };
  }

  /* ── Resize ─────────────────────────────────── */
  function onResize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (active) resetGame();
  }

  /* ── Input ──────────────────────────────────── */
  function onKeyDown(e) {
    if (!active) return;
    keys[e.code] = true;
    /* Jump */
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      e.preventDefault();
    }
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }

  /* ── Game loop ──────────────────────────────── */
  function loop() {
    if (!active) return;
    update();
    render();
    animFrame = requestAnimationFrame(loop);
  }

  function update() {
    const W = canvas.width, H = canvas.height;

    /* Horizontal movement */
    player.vx = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) { player.vx = -MOVE_SPEED; player.facing = -1; }
    if (keys['ArrowRight'] || keys['KeyD']) { player.vx =  MOVE_SPEED; player.facing =  1; }

    /* Gravity */
    player.vy += GRAVITY;
    player.x  += player.vx;
    player.y  += player.vy;

    /* Walk animation */
    if (player.vx !== 0 && player.onGround) {
      player.walkTick++;
      if (player.walkTick % 8 === 0) player.frame = (player.frame + 1) % 2;
    } else {
      player.frame = 0;
    }

    /* Wrap horizontally */
    if (player.x + player.w < 0)  player.x = W;
    if (player.x > W)              player.x = -player.w;

    /* Platform collision */
    player.onGround = false;
    for (const p of platforms) {
      const prevBottom = player.y + player.h - player.vy;
      const curBottom  = player.y + player.h;
      const inX = player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
      if (inX && player.vy >= 0 && prevBottom <= p.y + 2 && curBottom >= p.y) {
        player.y  = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    /* Ceiling bounce */
    if (player.y < 60) { player.y = 60; player.vy = Math.abs(player.vy) * 0.4; }

    /* Fall off bottom → lose */
    if (player.y > H + 60) {
      triggerLose();
      return;
    }

    /* Orb collection */
    for (const orb of orbs) {
      if (orb.collected) continue;
      orb.pulse += 0.07;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const dist = Math.hypot(cx - orb.x, cy - orb.y);
      if (dist < orb.r + 14) {
        collectOrb(orb);
      }
    }
  }

  /* ── Render ─────────────────────────────────── */
  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* Platforms */
    for (const p of platforms) {
      if (p.isGround) {
        const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
        grad.addColorStop(0, 'rgba(99,102,241,0.35)');
        grad.addColorStop(1, 'rgba(99,102,241,0.08)');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.y, p.w, p.h + 2);
        /* Top edge glow */
        ctx.fillStyle = 'rgba(129,140,248,0.7)';
        ctx.fillRect(p.x, p.y, p.w, 2);
      } else {
        ctx.fillStyle = 'rgba(99,102,241,0.22)';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(129,140,248,0.55)';
        ctx.fillRect(p.x, p.y, p.w, 2);
      }
    }

    /* Orbs */
    for (const orb of orbs) {
      if (orb.collected) continue;
      const pulse = Math.sin(orb.pulse) * 2;
      const r     = orb.r + pulse;

      /* Outer glow */
      const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2.8);
      glow.addColorStop(0,   'rgba(192,132,252,0.45)');
      glow.addColorStop(0.5, 'rgba(168,85,247,0.18)');
      glow.addColorStop(1,   'rgba(168,85,247,0)');
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      /* Core */
      const core = ctx.createRadialGradient(orb.x - r*0.3, orb.y - r*0.3, 0, orb.x, orb.y, r);
      core.addColorStop(0,   'rgba(233,213,255,0.95)');
      core.addColorStop(0.5, 'rgba(192,132,252,0.9)');
      core.addColorStop(1,   'rgba(139,92,246,0.85)');
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      /* Sparkle cross */
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(orb.x - r, orb.y); ctx.lineTo(orb.x + r, orb.y);
      ctx.moveTo(orb.x, orb.y - r); ctx.lineTo(orb.x, orb.y + r);
      ctx.stroke();
    }

    /* Player */
    drawSprite(player.x, player.y, player.facing, player.frame);
  }

  function drawSprite(x, y, facing, frame) {
    const px = PIXEL;
    ctx.save();
    if (facing === -1) {
      ctx.translate(x + player.w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    /* Slight walk bob */
    const bob = (frame === 1 && player.onGround) ? 1 : 0;

    SPRITE.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (!cell) return;
        ctx.fillStyle = SPRITE_COLORS[cell];
        ctx.fillRect(
          Math.round(x + ci * px),
          Math.round(y + ri * px + bob),
          px, px
        );
      });
    });
    ctx.restore();
  }

  /* ── Collect orb ────────────────────────────── */
  function collectOrb(orb) {
    orb.collected = true;
    orbsCollected++;

    /* Update KPIs */
    kpi.retention = Math.min(100, kpi.retention + orb.msg.kpi[0]);
    kpi.nps       = Math.min(100, kpi.nps       + orb.msg.kpi[1]);
    kpi.velocity  = Math.min(100, kpi.velocity  + orb.msg.kpi[2]);
    updateKpiUI();

    /* Toast */
    const gains = orb.msg.kpi.map((v, i) => {
      const labels = ['Ret', 'NPS', 'Vel'];
      return v > 0 ? `+${v}% ${labels[i]}` : null;
    }).filter(Boolean).join(' · ');
    queueToast(`${orb.msg.text} ${gains}`);

    if (orbsCollected === ORB_COUNT) {
      setTimeout(triggerWin, 600);
    }
  }

  /* ── KPI UI update ──────────────────────────── */
  function updateKpiUI() {
    if (!kpiPanel) return;
    const clamp = v => Math.min(100, Math.round(v));

    const ret = clamp(kpi.retention);
    const nps = clamp(kpi.nps);
    const vel = clamp(kpi.velocity);

    retBar.style.width = ret + '%';
    npsBar.style.width = nps + '%';
    velBar.style.width = vel + '%';
    document.getElementById('ret-val').textContent = ret + '%';
    document.getElementById('nps-val').textContent = nps + '%';
    document.getElementById('vel-val').textContent = vel + '%';
    document.getElementById('kpi-orbs').textContent = `✦ ${orbsCollected} / ${ORB_COUNT}`;

    /* Bar color shifts from red → amber → green */
    [retBar, npsBar, velBar].forEach((bar, i) => {
      const v = [ret, nps, vel][i];
      bar.style.background = v >= 70
        ? 'linear-gradient(90deg,#34d399,#10b981)'
        : v >= 35
        ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
        : 'linear-gradient(90deg,#f87171,#ef4444)';
    });

    /* Title update */
    const titleEl = kpiPanel.querySelector('.kpi-title');
    const allGreen = ret >= 70 && nps >= 70 && vel >= 70;
    titleEl.textContent  = orbsCollected === ORB_COUNT ? '✅ DASHBOARD RESTORED' : '⚠ DASHBOARD OFFLINE';
    titleEl.style.color  = orbsCollected === ORB_COUNT ? '#34d399' : '#f87171';
  }

  /* ── Toast queue ─────────────────────────────── */
  function queueToast(msg) {
    toastQueue.push(msg);
    if (!toastShowing) showNextToast();
  }

  function showNextToast() {
    if (!toastEl || toastQueue.length === 0) { toastShowing = false; return; }
    toastShowing = true;
    const msg = toastQueue.shift();
    toastEl.textContent = msg;
    toastEl.classList.remove('out');
    toastEl.classList.add('in');
    setTimeout(() => {
      toastEl?.classList.replace('in', 'out');
      setTimeout(showNextToast, 420);
    }, 2600);
  }

  /* ── Win / Lose overlays ────────────────────── */
  function triggerWin() {
    cancelAnimationFrame(animFrame);
    showEndScreen(
      '✅ KPIs Restored.',
      'Good sprint. Stakeholders appeased.',
      '#34d399',
      true
    );
  }

  function triggerLose() {
    cancelAnimationFrame(animFrame);
    showEndScreen(
      '💀 Fell into the backlog.',
      'The metrics are still down.',
      '#f87171',
      false
    );
  }

  function showEndScreen(title, sub, color, isWin) {
    const el = document.createElement('div');
    el.id = 'game-endscreen';
    el.innerHTML = `
      <div class="game-end-inner">
        <div class="game-end-title" style="color:${color}">${title}</div>
        <div class="game-end-sub">${sub}</div>
        <div class="game-end-kpi">
          Retention ${Math.round(kpi.retention)}% &nbsp;·&nbsp;
          NPS ${Math.round(kpi.nps)}% &nbsp;·&nbsp;
          Velocity ${Math.round(kpi.velocity)}%
        </div>
        <button class="game-end-btn" id="game-restart">↺ Try Again</button>
        ${isWin ? '' : '<p class="game-end-hint">Collect all ✦ orbs without falling.</p>'}
      </div>
    `;
    overlay.appendChild(el);
    document.getElementById('game-restart').addEventListener('click', () => {
      el.remove();
      resetGame();
      loop();
    });
  }

  /* ── Boot ───────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
