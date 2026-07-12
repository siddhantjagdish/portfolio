/* ================================================
   GAME MODE — simple left-side descent platformer
   --------------------------------------------------
   Platforms are generated down the LEFT side of the page,
   independent of the site content. The player rests on a
   platform and STAYS there while you scroll. Scrolling down
   reveals more platforms; steer the pixel PM (← →, jump) onto
   them and grab the 5 Action orbs to restore the KPI dashboard.
   Fall off the bottom of the screen → game over.
   ================================================ */

(function () {
  /* ── Tunables ──────────────────────────────── */
  const ORB_COUNT  = 5;
  const GRAVITY    = 0.5;
  const JUMP_FORCE = -12.5;
  const MOVE_SPEED = 4.2;
  const PLATFORM_H = 8;

  /* Each orb is a PM "action" that restores some KPIs.
     Gains are tuned so collecting all 5 lands each KPI at 100. */
  const ORB_MESSAGES = [
    { text: "Ran 12 user interviews.",       kpi: [25, 10,  5] },
    { text: "Cut onboarding 7 → 3 steps.",   kpi: [20, 15, 15] },
    { text: "Killed a feature nobody used.", kpi: [10, 20, 25] },
    { text: "Fixed the silent crash.",       kpi: [25, 30, 20] },
    { text: "Shipped it. Finally.",          kpi: [20, 25, 35] },
  ];

  /* ── State ─────────────────────────────────── */
  let active     = false;
  let running    = false;   // gates the rAF loop so game-over actually stops it
  let animFrame  = null;
  let keys       = {};
  let orbsCollected = 0;
  let toastQueue = [];
  let toastShowing = false;
  let kpi    = { retention: 0, nps: 0, velocity: 0 };
  let player = { x:0, y:0, vx:0, vy:0, w:18, h:22, onGround:false, facing:1, frame:0, walkTick:0 };
  let platforms = [];   // {x, y(doc), w, h}
  let orbs      = [];   // {x, y(doc), r, collected, msg, pulse}
  let pops      = [];   // {x, y(doc), t} — satisfying burst when a gem is grabbed

  /* ── DOM refs (built on activate) ──────────── */
  let overlay, canvas, ctx, gameBtn;
  let kpiPanel, retBar, npsBar, velBar, toastEl;

  /* ── Pixel-art sprite (1 body,2 skin,3 hair/shoe,4 eye) ── */
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
  const SPRITE_COLORS = { 1:'#6366f1', 2:'#fde68a', 3:'#1e1b4b', 4:'#7c3aed' };
  const PIXEL = 2;

  /* ── Init: build launcher UI + wire toggle ─── */
  function init() {
    buildLauncher();
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && active) deactivate();
    });
  }

  function buildLauncher() {
    if (document.getElementById('game-launcher')) return;
    const wrap = document.createElement('div');
    wrap.id = 'game-launcher';
    wrap.innerHTML = `
      <button id="game-mode-btn" class="game-mode-btn">▶ GAME MODE</button>
      <button id="game-info-btn" class="game-info-btn" aria-label="How to play">i</button>
      <div id="game-info-tip" class="game-info-tip">
        <strong>Save the Dashboard</strong><br>
        Your product's dashboard just flatlined! <b>Retention, NPS &amp;
        Velocity</b> are all at zero. Scattered across the page are
        <b>5 Action orbs</b>, each representing a real PM decision. Collect them all to
        restore Retention, NPS, and Velocity, and <b>bring the dashboard
        back online</b>.
        <br><br>
        <b>Scroll</b> to reveal platforms &nbsp;·&nbsp; steer
        <b>← →</b> (or <b>A&nbsp;D</b>) &nbsp;·&nbsp; <b>↑ / Space</b> to
        jump &nbsp;·&nbsp; don't fall off the bottom &nbsp;·&nbsp;
        <b>Esc</b> exits.
      </div>`;
    document.body.appendChild(wrap);
    gameBtn = document.getElementById('game-mode-btn');
    gameBtn.addEventListener('click', toggle);
  }

  function toggle() { active ? deactivate() : activate(); }

  /* ── Activate ──────────────────────────────── */
  function activate() {
    active = true;
    gameBtn.textContent = '✕ EXIT';
    gameBtn.classList.add('active');

    overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    document.body.appendChild(overlay);

    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    overlay.appendChild(canvas);
    ctx = canvas.getContext('2d');

    kpiPanel = document.createElement('div');
    kpiPanel.id = 'game-kpi';
    kpiPanel.innerHTML = `
      <div class="kpi-title">⚠ DASHBOARD OFFLINE</div>
      <div class="kpi-row"><span>Retention</span><div class="kpi-track"><div class="kpi-bar" id="ret-bar"></div></div><span class="kpi-val" id="ret-val">0%</span></div>
      <div class="kpi-row"><span>NPS</span><div class="kpi-track"><div class="kpi-bar" id="nps-bar"></div></div><span class="kpi-val" id="nps-val">0%</span></div>
      <div class="kpi-row"><span>Velocity</span><div class="kpi-track"><div class="kpi-bar" id="vel-bar"></div></div><span class="kpi-val" id="vel-val">0%</span></div>
      <div class="kpi-orbs" id="kpi-orbs">✦ 0 / ${ORB_COUNT}</div>`;
    document.body.appendChild(kpiPanel);
    retBar = document.getElementById('ret-bar');
    npsBar = document.getElementById('nps-bar');
    velBar = document.getElementById('vel-bar');

    toastEl = document.createElement('div');
    toastEl.id = 'game-toast';
    document.body.appendChild(toastEl);

    const hint = document.createElement('div');
    hint.id = 'game-hint';
    hint.innerHTML = 'Scroll to reveal platforms &nbsp;·&nbsp; ← → move &nbsp;·&nbsp; ↑ / Space jump &nbsp;·&nbsp; don\'t fall off &nbsp;·&nbsp; Esc exit';
    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add('fade-out'), 4600);
    setTimeout(() => hint.remove(), 5400);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    window.addEventListener('resize', onResize);

    onResize();
    resetGame();
    running = true;
    loop();
  }

  /* ── Deactivate ────────────────────────────── */
  function deactivate() {
    active = false;
    running = false;
    cancelAnimationFrame(animFrame);
    gameBtn.textContent = '▶ GAME MODE';
    gameBtn.classList.remove('active');

    overlay?.remove();
    kpiPanel?.remove();
    toastEl?.remove();
    document.getElementById('game-hint')?.remove();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    window.removeEventListener('resize', onResize);

    overlay = canvas = ctx = kpiPanel = toastEl = null;
    keys = {}; toastQueue = []; toastShowing = false;
    pops = [];
    orbsCollected = 0;
    kpi = { retention: 0, nps: 0, velocity: 0 };
  }

  /* ── Generate a left-side platform course (doc space) ── */
  function buildPlatforms() {
    const W    = window.innerWidth;
    const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight * 3);
    const minX = 40;
    const maxX = Math.min(W * 0.6, 720);     // platforms can reach toward the middle
    const endY = docH - 260;
    const rand = (a, b) => a + Math.random() * (b - a);
    const REACH = 120;                        // how far the PM can travel between platforms

    const list = [];
    let y = 280, prev = null;
    while (y <= endY) {
      const w = rand(92, 150);
      let x;
      if (!prev) {
        x = rand(minX, Math.max(minX, maxX - w));
      } else {
        /* Constrain the next platform to stay within reach of the previous
           one, so a randomly-generated course is always descendable. */
        const lo = Math.max(minX,     prev.x - w - REACH + 24);
        const hi = Math.min(maxX - w, prev.x + prev.w + REACH - 24);
        x = hi > lo ? rand(lo, hi) : Math.max(minX, Math.min(maxX - w, prev.x));
      }
      const p = { x, y, w, h: PLATFORM_H };
      list.push(p);
      prev = p;
      y += rand(118, 188);                    // random vertical spacing
    }
    return list;
  }

  /* ── Reset / (re)build ─────────────────────── */
  function resetGame() {
    orbsCollected = 0;
    kpi = { retention: 0, nps: 0, velocity: 0 };
    keys = {};
    toastQueue = []; toastShowing = false;
    pops = [];
    updateKpiUI();

    platforms = buildPlatforms();

    /* Place each orb on a RANDOM platform within its segment of the course,
       so they stay spread out across the descent but aren't predictable. */
    orbs = [];
    const n = platforms.length;
    if (n) {
      const seg = n / ORB_COUNT;
      for (let i = 0; i < ORB_COUNT; i++) {
        const lo  = Math.floor(i * seg);
        const hi  = Math.max(lo, Math.floor((i + 1) * seg) - 1);
        const idx = Math.min(n - 1, lo + Math.floor(Math.random() * (hi - lo + 1)));
        const p   = platforms[idx];
        orbs.push({
          x: p.x + p.w / 2, y: p.y - 18, r: 8,
          collected: false, msg: ORB_MESSAGES[i],
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    /* Start at the top of the page. The PM drops in from the sky and lands
       on the first platform — gravity does the rest for a bit of soul. */
    window.scrollTo({ top: 0, behavior: 'instant' });
    const p0 = platforms[0];
    player = {
      x: p0 ? p0.x + p0.w / 2 - 9 : 80,
      y: p0 ? Math.max(0, p0.y - 22 - 230) : 60,   // spawn well above the ledge
      vx: 0, vy: 0, w: 18, h: 22,
      onGround: false, facing: 1, frame: 0, walkTick: 0,
    };
  }

  function onResize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    /* Course is generated once per round (in resetGame) so a resize can't
       reshuffle the random platforms out from under the player. */
  }

  /* ── Input ─────────────────────────────────── */
  function onKeyDown(e) {
    if (!active) return;
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }
    /* Arrows + space drive the player; wheel/trackpad scrolls the page. */
    if (['Space','ArrowUp','ArrowLeft','ArrowRight','KeyA','KeyD','KeyW'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }

  /* ── Loop ──────────────────────────────────── */
  function loop() {
    if (!active || !running) return;
    update();
    render();
    if (running) animFrame = requestAnimationFrame(loop);
  }

  function update() {
    const W = canvas.width, H = canvas.height;
    const scrollY = window.pageYOffset;

    /* Horizontal */
    player.vx = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) { player.vx = -MOVE_SPEED; player.facing = -1; }
    if (keys['ArrowRight'] || keys['KeyD']) { player.vx =  MOVE_SPEED; player.facing =  1; }

    /* Gravity — everything in DOCUMENT space, so the player rests on
       its platform and is unaffected by scrolling. */
    player.vy += GRAVITY;
    player.x  += player.vx;
    player.y  += player.vy;

    /* Walk anim */
    if (player.vx !== 0 && player.onGround) {
      if (++player.walkTick % 8 === 0) player.frame = (player.frame + 1) % 2;
    } else player.frame = 0;

    /* Keep within the horizontal bounds of the screen */
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;

    /* Platform collision (document space) */
    player.onGround = false;
    for (const p of platforms) {
      const prevBottom = player.y + player.h - player.vy;
      const curBottom  = player.y + player.h;
      const inX = player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
      if (inX && player.vy >= 0 && prevBottom <= p.y + 2 && curBottom >= p.y) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    /* Can't drift above the very top of the page */
    if (player.y < 0) { player.y = 0; if (player.vy < 0) player.vy = 0; }

    /* Fell off the bottom of the screen while airborne → game over.
       (Resting on a platform is always safe, even off-screen.) */
    const screenY = player.y - scrollY;
    if (!player.onGround && player.vy > 0 && screenY > H + 60) { triggerLose(); return; }

    /* Orb collection (document space) */
    const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
    for (const orb of orbs) {
      if (orb.collected) continue;
      orb.pulse += 0.035;
      if (Math.hypot(cx - orb.x, cy - orb.y) < orb.r + 14) collectOrb(orb);
    }

    /* Advance + retire collection bursts */
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t += 0.055;
      if (pops[i].t >= 1) pops.splice(i, 1);
    }
  }

  /* ── Render (doc → screen via scrollY) ─────── */
  function render() {
    const W = canvas.width, H = canvas.height;
    const scrollY = window.pageYOffset;
    ctx.clearRect(0, 0, W, H);

    /* Platforms (teal pixel ledges) */
    for (const p of platforms) {
      const sy = p.y - scrollY;
      if (sy < -20 || sy > H + 20) continue;
      ctx.fillStyle = 'rgba(45,212,191,0.18)';
      ctx.fillRect(p.x, sy, p.w, p.h);
      ctx.fillStyle = 'rgba(94,234,212,0.9)';
      ctx.fillRect(p.x, sy, p.w, 2);
    }

    /* Orbs — faceted "Action" gems (solid, artifact-like, gentle bob) */
    for (const orb of orbs) {
      if (orb.collected) continue;
      const bob = Math.sin(orb.pulse) * 1.5;          // subtle vertical drift
      const oy  = orb.y - scrollY + bob;
      if (oy < -30 || oy > H + 30) continue;
      const x  = orb.x;
      const rx = orb.r * 0.92, ry = orb.r * 1.3;      // tall cut-gem proportions

      /* restrained outer glow */
      const glow = ctx.createRadialGradient(x, oy, 0, x, oy, orb.r * 1.9);
      glow.addColorStop(0, 'rgba(168,85,247,0.30)');
      glow.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, oy, orb.r * 1.9, 0, Math.PI * 2); ctx.fill();

      /* solid gem body: vertical gradient reads as a faceted crystal */
      const body = ctx.createLinearGradient(x, oy - ry, x, oy + ry);
      body.addColorStop(0,    '#f1e3ff');
      body.addColorStop(0.45, '#c084fc');
      body.addColorStop(1,    '#6d28d9');
      ctx.beginPath();
      ctx.moveTo(x,      oy - ry);
      ctx.lineTo(x + rx, oy);
      ctx.lineTo(x,      oy + ry);
      ctx.lineTo(x - rx, oy);
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.fill();

      /* dark cut edge → solid, stone-like */
      ctx.strokeStyle = 'rgba(76,29,149,0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* facets: girdle + crown table + crown ridges */
      ctx.strokeStyle = 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - rx, oy);                    ctx.lineTo(x + rx, oy);                    // girdle
      ctx.moveTo(x - rx * 0.5, oy - ry * 0.5);   ctx.lineTo(x + rx * 0.5, oy - ry * 0.5);   // table
      ctx.moveTo(x - rx * 0.5, oy - ry * 0.5);   ctx.lineTo(x - rx, oy);                    // left crown ridge
      ctx.moveTo(x + rx * 0.5, oy - ry * 0.5);   ctx.lineTo(x + rx, oy);                    // right crown ridge
      ctx.moveTo(x, oy - ry);                    ctx.lineTo(x - rx * 0.5, oy - ry * 0.5);   // top-left ridge
      ctx.moveTo(x, oy - ry);                    ctx.lineTo(x + rx * 0.5, oy - ry * 0.5);   // top-right ridge
      ctx.stroke();

      /* small specular glint on one facet */
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.16, oy - ry * 0.44);
      ctx.lineTo(x - rx * 0.46, oy - ry * 0.04);
      ctx.lineTo(x - rx * 0.10, oy - ry * 0.12);
      ctx.closePath();
      ctx.fill();
    }

    /* Collection bursts — gem doesn't just vanish, it pops */
    for (const pop of pops) {
      const py = pop.y - scrollY;
      if (py < -40 || py > H + 40) continue;
      const t    = pop.t;
      const ease = 1 - Math.pow(1 - t, 2);     // fast-out

      /* soft flash core fading away */
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.fillStyle = 'rgba(241,227,255,1)';
      ctx.beginPath(); ctx.arc(pop.x, py, 5 + ease * 6, 0, Math.PI * 2); ctx.fill();

      /* expanding ring */
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = 'rgba(192,132,252,1)';
      ctx.lineWidth = (1 - t) * 2 + 0.4;
      ctx.beginPath(); ctx.arc(pop.x, py, 6 + ease * 17, 0, Math.PI * 2); ctx.stroke();

      /* little sparkle shards flung outward */
      const N = 6;
      for (let k = 0; k < N; k++) {
        const ang  = (k / N) * Math.PI * 2 + 0.5;
        const dist = ease * 19;
        const sx = pop.x + Math.cos(ang) * dist;
        const sy = py    + Math.sin(ang) * dist;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = k % 2 ? 'rgba(241,227,255,1)' : 'rgba(192,132,252,1)';
        ctx.beginPath(); ctx.arc(sx, sy, (1 - t) * 2.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    drawSprite(player.x, player.y - scrollY, player.facing, player.frame);
  }

  function drawSprite(x, y, facing, frame) {
    const px = PIXEL;
    ctx.save();
    if (facing === -1) {
      ctx.translate(x + player.w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }
    const bob = (frame === 1 && player.onGround) ? 1 : 0;
    SPRITE.forEach((row, ri) => row.forEach((cell, ci) => {
      if (!cell) return;
      ctx.fillStyle = SPRITE_COLORS[cell];
      ctx.fillRect(Math.round(x + ci * px), Math.round(y + ri * px + bob), px, px);
    }));
    ctx.restore();
  }

  /* ── Collect ───────────────────────────────── */
  function collectOrb(orb) {
    orb.collected = true;
    pops.push({ x: orb.x, y: orb.y, t: 0 });   // trigger the pop burst
    orbsCollected++;
    kpi.retention = Math.min(100, kpi.retention + orb.msg.kpi[0]);
    kpi.nps       = Math.min(100, kpi.nps       + orb.msg.kpi[1]);
    kpi.velocity  = Math.min(100, kpi.velocity  + orb.msg.kpi[2]);
    updateKpiUI();

    const labels = ['Ret','NPS','Vel'];
    const gains = orb.msg.kpi.map((v,i) => v>0 ? `+${v}% ${labels[i]}` : null).filter(Boolean).join(' · ');
    queueToast(`${orb.msg.text}  ${gains}`);

    if (orbsCollected === ORB_COUNT) setTimeout(triggerWin, 650);
  }

  /* ── KPI UI ────────────────────────────────── */
  function updateKpiUI() {
    if (!kpiPanel) return;
    const clamp = v => Math.min(100, Math.round(v));
    const ret = clamp(kpi.retention), nps = clamp(kpi.nps), vel = clamp(kpi.velocity);

    retBar.style.width = ret + '%';
    npsBar.style.width = nps + '%';
    velBar.style.width = vel + '%';
    document.getElementById('ret-val').textContent = ret + '%';
    document.getElementById('nps-val').textContent = nps + '%';
    document.getElementById('vel-val').textContent = vel + '%';
    document.getElementById('kpi-orbs').textContent = `✦ ${orbsCollected} / ${ORB_COUNT}`;

    [retBar, npsBar, velBar].forEach((bar, i) => {
      const v = [ret, nps, vel][i];
      bar.style.background = v >= 70
        ? 'linear-gradient(90deg,#34d399,#10b981)'
        : v >= 35
        ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
        : 'linear-gradient(90deg,#f87171,#ef4444)';
    });

    const titleEl = kpiPanel.querySelector('.kpi-title');
    const done = orbsCollected === ORB_COUNT;
    titleEl.textContent = done ? '✅ DASHBOARD RESTORED' : '⚠ DASHBOARD OFFLINE';
    titleEl.style.color = done ? '#34d399' : '#f87171';
    titleEl.classList.toggle('restored', done);   // stop the breathing once it's back
  }

  /* ── Toasts ────────────────────────────────── */
  function queueToast(msg) { toastQueue.push(msg); if (!toastShowing) showNextToast(); }
  function showNextToast() {
    if (!toastEl || toastQueue.length === 0) { toastShowing = false; return; }
    toastShowing = true;
    toastEl.textContent = toastQueue.shift();
    toastEl.classList.remove('out'); toastEl.classList.add('in');
    setTimeout(() => { toastEl?.classList.replace('in','out'); setTimeout(showNextToast, 420); }, 2600);
  }

  /* ── Win / Lose ────────────────────────────── */
  function triggerWin() {
    running = false;
    cancelAnimationFrame(animFrame);
    showEndScreen('✅ Dashboard restored.', 'Every metric back in the green. Good sprint.', '#34d399', true);
  }
  function triggerLose() {
    running = false;
    cancelAnimationFrame(animFrame);
    showEndScreen('💀 Fell into the backlog.', 'Off the bottom of the board. Run it back?', '#f87171', false);
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
        <button class="game-end-btn" id="game-restart">↺ ${isWin ? 'Play again' : 'Try again'}</button>
        ${isWin
          ? '<p class="game-end-foot">You’ve reached the Potential Product.</p>'
          : '<p class="game-end-hint">Land on the platforms — don’t fall off the bottom.</p>'}
      </div>`;
    overlay.appendChild(el);
    document.getElementById('game-restart').addEventListener('click', () => {
      el.remove(); resetGame(); running = true; loop();
    });
  }

  /* ── Boot ──────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
