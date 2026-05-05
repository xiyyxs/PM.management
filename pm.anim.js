(function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
  @keyframes pmFadeSlideIn   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pmFadeSlideLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pmScaleIn       { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
  @keyframes pmSpin          { to { transform: rotate(360deg); } }
  @keyframes pmPulse         { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes pmGlowPulse     { 0%,100% { box-shadow: 0 0 18px rgba(168,85,247,0.35); } 50% { box-shadow: 0 0 36px rgba(168,85,247,0.65); } }
  @keyframes pmFloat         { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes pmCountUp       { from { opacity: 0; transform: translateY(8px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes pmRipple        { from { transform: scale(0); opacity: 0.5; } to { transform: scale(4); opacity: 0; } }
  @keyframes pmShimmer       { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  
  .pm-section-animate { animation: pmFadeSlideIn 0.42s cubic-bezier(0.4,0,0.2,1) forwards; }
  .pm-slide-left      { animation: pmFadeSlideLeft 0.38s cubic-bezier(0.4,0,0.2,1) forwards; }
  .pm-scale-in        { animation: pmScaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  
  .sv-card, .rrow, .fb {
    transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  }
  .sv-card:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(168,85,247,0.5) !important;
    box-shadow: 0 8px 32px rgba(168,85,247,0.18), 0 0 0 1px rgba(168,85,247,0.12);
  }
  .rrow { transition: background 0.25s, border-color 0.25s, transform 0.25s; }
  .rrow:hover {
    background: rgba(168,85,247,0.06) !important;
    border-color: rgba(168,85,247,0.3) !important;
    transform: translateX(4px);
  }
  .fb:hover {
    border-color: rgba(168,85,247,0.35) !important;
    box-shadow: 0 0 20px rgba(168,85,247,0.08);
  }
  
  .pm-card-animate {
    opacity: 0;
    transform: translateY(18px);
    animation: pmFadeSlideIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  
  .d-stat {
    transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .d-stat:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 10px 40px rgba(168,85,247,0.2);
    border-color: rgba(168,85,247,0.45) !important;
  }
  .d-stat .stat-val, [id^="d-"] { animation: pmCountUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  
  .glow-btn {
    background: #a855f7;
    box-shadow: 0 0 20px rgba(168,85,247,0.4);
    transition: box-shadow 0.3s, transform 0.25s, background 0.3s;
  }
  .glow-btn:hover  { box-shadow: 0 0 42px rgba(168,85,247,0.7); transform: translateY(-2px); }
  .glow-btn:active { transform: translateY(0) scale(0.97); box-shadow: 0 0 14px rgba(168,85,247,0.4); }
  
  .atb {
    padding: 8px 22px;
    border-radius: 30px;
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: background 0.35s, box-shadow 0.35s, transform 0.3s, color 0.3s;
    cursor: pointer;
  }
  .atb.on       { background: #a855f7; box-shadow: 0 0 24px rgba(168,85,247,0.5); transform: scale(1.04); color: #fff; }
  .atb:not(.on) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
  
  .auth-slide { transition: opacity 0.32s cubic-bezier(0.4,0,0.2,1), transform 0.32s cubic-bezier(0.4,0,0.2,1); }
  .auth-slide.vis   { opacity: 1; transform: translateX(0);    pointer-events: auto; position: relative; }
  .auth-slide.out-l { opacity: 0; transform: translateX(-28px); pointer-events: none; position: absolute; top:0;left:0;right:0; }
  .auth-slide.out-r { opacity: 0; transform: translateX(28px);  pointer-events: none; position: absolute; top:0;left:0;right:0; }
  
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 1000;
    backdrop-filter: blur(10px);
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 16px;
    display: flex; align-items: flex-start; justify-content: center;
    opacity: 0; pointer-events: none;
    transition: opacity 0.35s ease;
  }
  .modal-overlay.is-open { opacity: 1; pointer-events: auto; }
  .modal-overlay .modal-content {
    transform: translateY(30px) scale(0.96);
    transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
    width: 100%; max-width: 640px; margin: auto; position: relative;
  }
  .modal-overlay.is-open .modal-content { transform: translateY(0) scale(1); }
  
  #toast-container {
    position: fixed; top: 80px; right: 20px;
    z-index: 9999;
    display: flex; flex-direction: column; gap: 10px;
    pointer-events: none;
  }
  .toast {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-radius: 16px;
    font-size: 0.72rem; font-weight: 700;
    max-width: 320px;
    backdrop-filter: blur(16px);
    pointer-events: auto;
    transform: translateX(360px); opacity: 0;
    transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease;
    cursor: pointer;
  }
  .toast.show { transform: translateX(0); opacity: 1; }
  .toast.hide { transform: translateX(360px); opacity: 0; }
  .toast-success { background: rgba(5,150,105,0.15);  border: 1px solid rgba(5,150,105,0.4);  color: #6ee7b7; }
  .toast-error   { background: rgba(220,38,38,0.15);  border: 1px solid rgba(220,38,38,0.4);  color: #fca5a5; }
  .toast-info    { background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.4); color: #d8b4fe; }
  .toast-warning { background: rgba(217,119,6,0.15);  border: 1px solid rgba(217,119,6,0.4);  color: #fcd34d; }
  
  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: pmSpin 0.7s linear infinite;
    vertical-align: middle;
  }
  
  .pm-skeleton {
    background: linear-gradient(90deg, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0.14) 50%, rgba(168,85,247,0.06) 100%);
    background-size: 400px 100%;
    animation: pmShimmer 1.6s ease-in-out infinite;
    border-radius: 10px;
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: #a855f7 !important;
    box-shadow: 0 0 0 3px rgba(168,85,247,0.12) !important;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  [id^="lp-"] {
    text-align: center !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    caret-color: #a855f7;
  }
  [id^="lp-"]:focus {
    box-shadow: 0 0 20px rgba(168,85,247,0.28), 0 0 0 2px rgba(168,85,247,0.35) !important;
    transform: scale(1.06);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .glass {
    background: rgba(168,85,247,0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(168,85,247,0.2);
    border-radius: 20px;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .glass:hover {
    border-color: rgba(168,85,247,0.35);
    box-shadow: 0 0 28px rgba(168,85,247,0.1);
  }
  
  #nav-name { transition: color 0.3s; }
  #nav-name:hover { color: #a855f7; }
  #nav-out  { transition: opacity 0.3s, border-color 0.3s, color 0.3s; }
  #nav-out:hover { border-color: #a855f7 !important; opacity: 1; }
  
  *::-webkit-scrollbar { width: 4px; }
  *::-webkit-scrollbar-track { background: rgba(168,85,247,0.05); border-radius: 10px; }
  *::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 10px; }
  
  .pm-ripple { position: relative; overflow: hidden; }
  .pm-ripple-wave {
    position: absolute;
    border-radius: 50%;
    background: rgba(168,85,247,0.3);
    width: 20px; height: 20px;
    margin-top: -10px; margin-left: -10px;
    animation: pmRipple 0.6s ease-out forwards;
    pointer-events: none;
  }
  
  .pm-copy-btn { transition: background 0.25s, transform 0.2s; }
  .pm-copy-btn:hover { background: rgba(168,85,247,0.22) !important; transform: scale(1.05); }
  .pm-copy-btn:active { transform: scale(0.96); }
  
  .code-badge {
    font-family: monospace;
    background: rgba(168,85,247,0.1);
    border: 1px solid rgba(168,85,247,0.25);
    color: #d8b4fe;
    padding: 3px 8px; border-radius: 6px;
    font-size: 0.85rem; letter-spacing: 0.1em;
    transition: background 0.2s, border-color 0.2s;
  }
  .code-badge:hover { background: rgba(168,85,247,0.2); border-color: #a855f7; }
  
  .gradient-text {
    background: linear-gradient(45deg, #fff, #a855f7);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .pm-glow-pulse { animation: pmGlowPulse 2.5s ease-in-out infinite; }
  .pm-float      { animation: pmFloat 3s ease-in-out infinite; }
  
  #t-dashboard, #t-surveys, #t-detail, #t-users {
    transition: background 0.25s, color 0.25s, box-shadow 0.25s;
  }
  #t-dashboard.active, #t-surveys.active, #t-detail.active, #t-users.active {
    box-shadow: 0 0 16px rgba(168,85,247,0.35);
  }
    `;
    document.head.appendChild(style);
  })();
  
  (function initCanvas() {
    let cv = document.getElementById('bg');
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'bg';
      cv.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;opacity:0.6;pointer-events:none;';
      document.body.insertBefore(cv, document.body.firstChild);
    }
    const cx = cv.getContext('2d');
    let pts = [], rf;
    function init() {
      cv.width = innerWidth; cv.height = innerHeight; pts = [];
      const n = innerWidth < 640 ? 25 : 50;
      for (let i = 0; i < n; i++) pts.push({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        s: Math.random() * 1.5 + 0.5,
        vx: Math.random() * 0.6 - 0.3, vy: Math.random() * 0.6 - 0.3,
        c: Math.random() > 0.5 ? '#a855f7' : '#4f46e5'
      });
    }
    function draw() {
      cx.clearRect(0, 0, cv.width, cv.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cv.width)  p.vx *= -1;
        if (p.y < 0 || p.y > cv.height) p.vy *= -1;
        cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        cx.fillStyle = p.c; cx.shadowBlur = 8; cx.shadowColor = p.c; cx.fill();
      });
      rf = requestAnimationFrame(draw);
    }
    addEventListener('resize', () => { if (rf) cancelAnimationFrame(rf); init(); draw(); });
    init(); draw();
  })();
  
  (function ensureToastContainer() {
    if (!document.getElementById('toast-container')) {
      const tc = document.createElement('div');
      tc.id = 'toast-container';
      document.body.appendChild(tc);
    }
  })();
  
  (function observeEntrance() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        setTimeout(() => {
          el.style.opacity = '';
          el.style.transform = '';
          el.classList.add('pm-section-animate');
        }, Number(el.dataset.delay || 0));
        io.unobserve(el);
      });
    }, { threshold: 0.08 });
  
    function observeVisible() {
      document.querySelectorAll('#s-dashboard, #s-surveys, #s-detail, #s-users, .glass, .sv-card, .rrow, .d-stat, .fb').forEach((el, i) => {
        if (el.dataset.observed) return;
        el.dataset.observed = '1';
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
        el.dataset.delay = String(i * 40);
        io.observe(el);
      });
    }
  
    const mo = new MutationObserver(() => observeVisible());
    mo.observe(document.body, { childList: true, subtree: true });
    observeVisible();
  })();
  
  (function staggerCards() {
    const mo = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains('sv-card') || node.classList.contains('rrow') || node.classList.contains('fb') || node.classList.contains('d-stat')) {
            node.style.opacity = '0';
            node.style.animation = 'none';
            const i = [...(node.parentElement?.children || [])].indexOf(node);
            setTimeout(() => {
              node.style.opacity = '';
              node.style.animation = '';
              node.classList.add('pm-card-animate');
              node.style.animationDelay = (i * 55) + 'ms';
            }, 10);
          }
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();
  
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    btn.classList.add('pm-ripple');
    const wave = document.createElement('span');
    wave.className = 'pm-ripple-wave';
    const r = btn.getBoundingClientRect();
    wave.style.left = (e.clientX - r.left) + 'px';
    wave.style.top  = (e.clientY - r.top)  + 'px';
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 700);
  }, true);
  
  (function patchGoTo() {
    if (typeof goTo !== 'function') return;
    const _orig = goTo;
    window.goTo = function(sec) {
      _orig(sec);
      requestAnimationFrame(() => {
        const el = document.getElementById('s-' + sec);
        if (!el) return;
        el.classList.remove('pm-section-animate');
        void el.offsetWidth;
        el.classList.add('pm-section-animate');
      });
    };
  })();
  
  function pmAnimateCounter(el, target, duration) {
    if (!el) return;
    const start = performance.now();
    const from = parseInt(el.textContent) || 0;
    target = parseInt(target) || 0;
    function step(now) {
      const t = Math.min((now - start) / (duration || 700), 1);
      const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      el.textContent = Math.round(from + (target - from) * ease);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  
  (function patchDashboard() {
    if (typeof loadDashboard !== 'function') return;
    const _orig = loadDashboard;
    window.loadDashboard = async function() {
      await _orig();
      ['d-sv','d-rs','d-us','d-nw'].forEach(id => {
        const el = document.getElementById(id);
        if (el) pmAnimateCounter(el, el.textContent, 800);
      });
    };
  })();
  
  document.documentElement.style.scrollBehavior = 'smooth';
  
  (function tiltCards() {
    function applyTilt(el) {
      if (el.dataset.tilt) return;
      el.dataset.tilt = '1';
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 10;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * -10;
        el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-3px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.4s ease';
        el.style.transform = '';
      });
      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.12s ease';
      });
    }
    const mo = new MutationObserver(() => document.querySelectorAll('.d-stat, .glass').forEach(applyTilt));
    mo.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.d-stat, .glass').forEach(applyTilt);
  })();
  
  (function authEntrance() {
    const auth = document.getElementById('auth-screen');
    if (!auth) return;
    const panel = auth.querySelector('.glass, [class*="glass"]');
    if (!panel) return;
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(30px) scale(0.96)';
    setTimeout(() => {
      panel.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0) scale(1)';
    }, 100);
  })();