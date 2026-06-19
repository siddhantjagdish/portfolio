/* ================================================
   MAIN JAVASCRIPT — Siddhant Jagdish Portfolio
   ================================================ */

/* ---------- GSAP Registration ---------- */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ================================================
   LOADER
   ================================================ */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('gone');
    document.body.classList.remove('page-loading');
    initAll();
  }, 1700);
});

/* ================================================
   CUSTOM CURSOR
   ================================================ */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');

if (cursor && follower) {
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let fx = mx, fy = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  (function animFollower() {
    fx += (mx - fx) * 0.11;
    fy += (my - fy) * 0.11;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animFollower);
  })();

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    follower.style.opacity = '1';
  });

  function attachHovers() {
    document.querySelectorAll('a, button, .skill-tags span, .trait, .work-card, .blog-card, .filter-btn, .tl-card, .skill-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor-hover');
        follower.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor-hover');
        follower.classList.remove('cursor-hover');
      });
    });
  }
  attachHovers();
}

/* ================================================
   NAVIGATION
   ================================================ */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const drawer    = document.getElementById('nav-drawer');

window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 50);
  highlightActiveLink();
});

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  drawer?.classList.toggle('open');
});

drawer?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    drawer.classList.remove('open');
  });
});

function highlightActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 220) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', href === '#' + current || href.includes('#' + current));
  });
}

/* ================================================
   HERO ENTRANCE ANIMATIONS (GSAP)
   ================================================ */
function initHeroEntrance() {
  const badge   = document.getElementById('h-badge');
  const title   = document.querySelectorAll('#h-title .hl');
  const role    = document.getElementById('h-role');
  const desc    = document.getElementById('h-desc');
  const actions = document.getElementById('h-actions');
  const stats   = document.getElementById('h-stats');

  if (!badge || !title.length) return;

  const tl = gsap.timeline({ delay: 0.1 });

  tl.to(badge, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  })
  .to(title, {
    opacity: 1, y: '0%', duration: 1.0,
    ease: 'power4.out', stagger: 0.14
  }, '-=0.35')
  .to(role, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, '-=0.5')
  .to(desc, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, '-=0.45')
  .to(actions, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, '-=0.45')
  .to(stats, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, '-=0.4');

  setTimeout(startTypewriter, 900);
  setTimeout(runCounters, 1600);
}

/* Journey / Blog hero entrance */
function initPageHeroEntrance() {
  const lines = document.querySelectorAll('.journey-hero-title .hl, .blog-hero-title .hl');
  if (!lines.length) return;
  gsap.to(lines, {
    opacity: 1, y: '0%', duration: 1.0,
    ease: 'power4.out', stagger: 0.14, delay: 0.3
  });
}

/* ================================================
   TYPEWRITER
   ================================================ */
const PHRASES = [
  'Associate Product Manager',
  'AI & Automation Builder',
  'Entrepreneur',
  '0→1 Product Builder',
  'CS Grad · PES University',
];
let pIdx = 0, cIdx = 0, deleting = false, tDelay = 120;

function startTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  (function tick() {
    const phrase = PHRASES[pIdx];
    if (deleting) {
      el.textContent = phrase.slice(0, cIdx - 1);
      cIdx--; tDelay = 55;
    } else {
      el.textContent = phrase.slice(0, cIdx + 1);
      cIdx++; tDelay = 115;
    }
    if (!deleting && cIdx === phrase.length) { deleting = true; tDelay = 2000; }
    else if (deleting && cIdx === 0) {
      deleting = false;
      pIdx = (pIdx + 1) % PHRASES.length;
      tDelay = 380;
    }
    setTimeout(tick, tDelay);
  })();
}

/* ================================================
   COUNTER ANIMATION
   ================================================ */
function runCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = +el.dataset.target;
    const dur = 1800;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  });
}

/* ================================================
   HERO CANVAS — PARTICLE NETWORK
   ================================================ */
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLS = { line: 'rgba(99,102,241,', dot: 'rgba(129,140,248,' };
  let W, H, particles = [];
  const COUNT = 110, DIST = 150;
  let mx = -999, my = -999;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  document.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * (W || 1200),
      y: Math.random() * (H || 800),
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 1.8 + 0.7,
      a: Math.random() * 0.55 + 0.20,
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      const dx = p.x - mx, dy = p.y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) { p.x += dx * 0.015; p.y += dy * 0.015; }

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = COLS.dot + p.a + ')';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const ox = particles[j].x - p.x, oy = particles[j].y - p.y;
        const dist = Math.sqrt(ox * ox + oy * oy);
        if (dist < DIST) {
          const op = (1 - dist / DIST) * 0.20;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = COLS.line + op + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  })();
}

/* Sparser ambient canvas for sub-page heroes and sections */
function initSubCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLS = { line: 'rgba(99,102,241,', dot: 'rgba(129,140,248,' };
  let W, H, particles = [];
  const COUNT = 55, DIST = 120;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * (W || 900),
      y: Math.random() * (H || 400),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.5,
      a: Math.random() * 0.4 + 0.15,
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = COLS.dot + p.a + ')';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const ox = particles[j].x - p.x, oy = particles[j].y - p.y;
        const dist = Math.sqrt(ox * ox + oy * oy);
        if (dist < DIST) {
          const op = (1 - dist / DIST) * 0.13;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = COLS.line + op + ')';
          ctx.lineWidth = 0.55;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  })();
}

/* ================================================
   SCROLL REVEAL (INTERSECTION OBSERVER)
   ================================================ */
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = +(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => io.observe(el));
}

/* ================================================
   GSAP SCROLL TRIGGERS (index only)
   ================================================ */
function initScrollTriggers() {
  if (typeof ScrollTrigger === 'undefined') return;

  /* Parallax on hero background orbs */
  gsap.to('.hero .orb-1', {
    yPercent: -30,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero .orb-2', {
    yPercent: -20,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ================================================
   CONTACT FORM
   ================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>Sent! 🎉</span> <i class="fas fa-check"></i>';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3500);
  });
}

/* ================================================
   BACK TO TOP
   ================================================ */
function initBackToTop() {
  document.querySelectorAll('.back-top').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ================================================
   BLOG FILTER
   ================================================ */
function initBlogFilter() {
  const btns   = document.querySelectorAll('.filter-btn');
  const cards  = document.querySelectorAll('[data-category]');
  const empty  = document.getElementById('blog-empty');
  const total  = document.getElementById('total-count');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('filter-active'));
      btn.classList.add('filter-active');
      const f = btn.dataset.filter;

      let visible = 0;
      cards.forEach(card => {
        const match = f === 'all' || card.dataset.category === f;
        card.classList.toggle('hidden', !match);
        if (match) {
          visible++;
          /* Re-trigger reveal animation */
          card.classList.remove('visible');
          setTimeout(() => card.classList.add('visible'), 50);
        }
      });

      if (total) total.textContent = visible;
      if (empty) empty.style.display = visible === 0 ? 'flex' : 'none';
    });
  });
}

window.resetFilter = function() {
  document.querySelector('[data-filter="all"]')?.click();
};

/* ================================================
   SKILL TAG STAGGER ON HOVER (category card)
   ================================================ */
function initSkillTagEffects() {
  document.querySelectorAll('.skill-card').forEach(card => {
    const tags = card.querySelectorAll('.skill-tags span');
    card.addEventListener('mouseenter', () => {
      tags.forEach((t, i) => {
        setTimeout(() => t.style.transitionDelay = i * 25 + 'ms', 0);
      });
    });
    card.addEventListener('mouseleave', () => {
      tags.forEach(t => t.style.transitionDelay = '0ms');
    });
  });
}

/* ================================================
   SMOOTH ANCHOR SCROLL
   ================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });
}

/* ================================================
   IMPACT STAT COUNTERS (journey page)
   ================================================ */
function initImpactCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.counter').forEach(el => {
          const target = +el.dataset.target;
          if (!target) return;
          const dur = 1600, start = performance.now();
          (function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
            if (p < 1) requestAnimationFrame(tick);
          })(start);
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.hero-stats, .impact-row').forEach(el => io.observe(el));
}

/* ================================================
   CHAPTER TIMELINE — sticky number highlight
   ================================================ */
function initChapterHighlight() {
  const chapters = document.querySelectorAll('.chapter');
  if (!chapters.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const num = e.target.querySelector('.chapter-num');
      if (!num) return;
      if (e.isIntersecting) {
        num.style.color = 'rgba(99,102,241,0.35)';
        num.style.transform = 'scale(1.08)';
        num.style.transition = 'all 0.5s ease';
      } else {
        num.style.color = 'rgba(255,255,255,0.05)';
        num.style.transform = 'scale(1)';
      }
    });
  }, { threshold: 0.4 });
  chapters.forEach(c => io.observe(c));
}

/* ================================================
   NAV ACTIVE INDICATOR — thin underline
   ================================================ */
function initNavIndicator() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => {
    l.style.position = 'relative';
  });
}

/* ================================================
   THEME TOGGLE
   ================================================ */
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const themes   = ['dark', 'purple-light', 'light'];
  const completes = { 'dark': 0, 'purple-light': 50, 'light': 100 };

  /* Restore saved preference */
  const saved = localStorage.getItem('sj-theme') || 'dark';
  applyTheme(saved, btn, false);

  btn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || 'dark';
    const idx  = themes.indexOf(cur);
    const next = themes[(idx + 1) % themes.length];
    applyTheme(next, btn, true);
    localStorage.setItem('sj-theme', next);
  });
}

function applyTheme(theme, btn, animate) {
  const completes = { 'dark': 0, 'purple-light': 50, 'light': 100 };
  const targetComplete = completes[theme] ?? 0;
  btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');

  const apply = () => { document.documentElement.dataset.theme = theme; };

  if (animate) {
    gsap.to(btn, {
      '--complete': targetComplete,
      duration: 0.58,
      ease: 'elastic.out(1, 0.72)',
      overwrite: true
    });
    if (document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  } else {
    apply();
    btn.style.setProperty('--complete', targetComplete);
  }
}

/* ================================================
   INIT ALL
   ================================================ */
function initAll() {
  initThemeToggle();
  initCanvas();
  initSubCanvas('journey-canvas');
  initSubCanvas('blog-canvas');
  initScrollReveal();
  initContactForm();
  initBackToTop();
  initSmoothScroll();
  initSkillTagEffects();
  initBlogFilter();
  initImpactCounters();
  initChapterHighlight();
  initNavIndicator();

  /* Page-specific hero animations */
  if (document.getElementById('hero')) {
    initHeroEntrance();
    initScrollTriggers();
  } else {
    initPageHeroEntrance();
  }
}

/* If loader never fires (e.g., assets already cached), still init */
if (document.readyState === 'complete') {
  const loader = document.getElementById('loader');
  if (!loader?.classList.contains('gone')) {
    setTimeout(() => {
      loader?.classList.add('gone');
      document.body.classList.remove('page-loading');
      initAll();
    }, 200);
  }
}
