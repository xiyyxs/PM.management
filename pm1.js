const SB = supabase.createClient(
  'https://mysggcexwvsycbcpcaic.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15c2dnY2V4d3ZzeWNiY3BjYWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyOTc1NjAsImV4cCI6MjA5Mjg3MzU2MH0.l199pRC8ZyLAZmna7aou__UbkLZT40UylZkfGUaGNcU'
);

let ADMIN = null, USERS = [], SURVEYS = [], RESPS = [];

const $ = id => document.getElementById(id);
const show = el => { if (!el) return; el.classList.remove('hidden'); el.style.display = '' };
const hide = el => { if (!el) return; el.classList.add('hidden'); el.style.display = 'none' };
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function genPin() { return String(Math.floor(1000 + Math.random() * 9000)) }
function genRC()  { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r = ''; for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)]; return r }
function genPID() { const c = 'abcdefghjkmnpqrstuvwxyz23456789';  let r = ''; for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)]; return r }
function genIC()  { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r = ''; for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)]; return r }

function toast(msg, type, dur) {
  const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
  const el = document.createElement('div');
  el.className = 'toast toast-' + (type || 'info');
  el.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '" style="font-size:1rem;flex-shrink:0"></i>'
    + '<span style="flex:1">' + msg + '</span>'
    + '<span style="margin-left:8px;opacity:.5;cursor:pointer" onclick="dtst(this.parentElement)">&#x2715;</span>';
  $('toast-container').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  el._t = setTimeout(() => dtst(el), dur || 3500);
  el.onclick = () => dtst(el);
}

function dtst(el) {
  if (!el || !el.parentElement) return;
  clearTimeout(el._t);
  el.classList.remove('show');
  el.classList.add('hide');
  setTimeout(() => el.remove(), 400);
}

// ── Canvas background ──────────────────────────────────────────────────────
const cv = document.getElementById('bg');
const cx = cv.getContext('2d');
let pts = [], rf;

function iCV() {
  cv.width = innerWidth; cv.height = innerHeight; pts = [];
  const n = innerWidth < 640 ? 25 : 50;
  for (let i = 0; i < n; i++) pts.push({
    x: Math.random() * cv.width, y: Math.random() * cv.height,
    s: Math.random() * 1.5 + .5, vx: Math.random() * .6 - .3, vy: Math.random() * .6 - .3,
    c: Math.random() > .5 ? '#a855f7' : '#4f46e5'
  });
}

function aCV() {
  cx.clearRect(0, 0, cv.width, cv.height);
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > cv.width)  p.vx *= -1;
    if (p.y < 0 || p.y > cv.height) p.vy *= -1;
    cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    cx.fillStyle = p.c; cx.shadowBlur = 8; cx.shadowColor = p.c; cx.fill();
  });
  rf = requestAnimationFrame(aCV);
}

addEventListener('resize', () => { if (rf) cancelAnimationFrame(rf); iCV(); aCV() });
iCV(); aCV();

// ── Auth tabs ──────────────────────────────────────────────────────────────
function switchAuth(t) {
  const li = $('f-login'), re = $('f-reg'), tl = $('at-login'), tr = $('at-reg');
  if (t === 'login') {
    li.className = 'auth-slide vis space-y-4'; re.className = 'auth-slide out-r space-y-4';
    tl.className = 'atb on'; tr.className = 'atb';
  } else {
    li.className = 'auth-slide out-l space-y-4'; re.className = 'auth-slide vis space-y-4';
    tr.className = 'atb on'; tl.className = 'atb';
  }
}

// ── PIN input helpers ──────────────────────────────────────────────────────
function lpi(e, i) {
  const v = e.target.value.replace(/\D/, '');
  e.target.value = v;
  if (v && i < 3) $('lp-' + (i + 1)).focus();
}
function lpk(e, i) {
  if (e.key === 'Backspace' && !e.target.value && i > 0) $('lp-' + (i - 1)).focus();
}

// ── Login ──────────────────────────────────────────────────────────────────
async function doLogin() {
  const user = $('l-user').value.trim().toUpperCase();
  const pass = $('l-pass').value;
  const pin  = [0, 1, 2, 3].map(i => $('lp-' + i).value).join('');
  const err  = $('l-err');

  if (!user || !pass || pin.length < 4) { err.textContent = 'Fill in all fields'; show(err); return }

  const btn = $('l-btn'); btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  const ph = await sha(pin), pwh = await sha(pass);
  const { data, error } = await SB.from('management_admins').select('*')
    .eq('username', user).eq('pin_hash', ph).eq('pass_hash', pwh).single();
  btn.innerHTML = 'Unlock'; btn.disabled = false;

  if (error || !data) {
    err.textContent = 'Invalid credentials'; show(err);
    [0, 1, 2, 3].forEach(i => { $('lp-' + i).value = '' }); $('lp-0').focus();
    setTimeout(() => hide(err), 3000); return;
  }
  ADMIN = data; logAudit('login', 'Logged in'); enterApp();
}

// ── Register ───────────────────────────────────────────────────────────────
async function doRegister() {
  const user   = $('r-user').value.trim().toUpperCase();
  const pass   = $('r-pass').value;
  const pass2  = $('r-pass2').value;
  const invite = $('r-invite').value.trim().toUpperCase();
  const err    = $('r-err');

  if (!user || !pass || !pass2 || !invite) { err.textContent = 'Fill in all fields'; show(err); return }
  if (user.length < 2)  { err.textContent = 'Username min 2 chars';   show(err); return }
  if (pass.length < 6)  { err.textContent = 'Password min 6 chars';   show(err); return }
  if (pass !== pass2)   { err.textContent = 'Passwords do not match'; show(err); return }

  const btn = $('r-btn'); btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;

  // Validate invite code
  const { data: ic, error: ice } = await SB.from('invite_codes')
    .select('*').eq('code', invite).eq('used', false).single();
  if (ice || !ic) {
    err.textContent = 'Invalid or already used invite code'; show(err);
    btn.innerHTML = 'Create Account'; btn.disabled = false; return;
  }

  // Check username availability
  const { data: ex } = await SB.from('management_admins').select('id').eq('username', user).single();
  if (ex) {
    err.textContent = 'Username taken'; show(err);
    btn.innerHTML = 'Create Account'; btn.disabled = false; return;
  }

  const pin = genPin(), rc = genRC();
  const ph = await sha(pin), rch = await sha(rc), pwh = await sha(pass);
  const { data, error } = await SB.from('management_admins')
    .insert({ username: user, pin_hash: ph, recovery_code_hash: rch, pass_hash: pwh })
    .select().single();
  btn.innerHTML = 'Create Account'; btn.disabled = false;

  if (error) { err.textContent = 'Error: ' + error.message; show(err); return }

  // Mark invite code as used
  await SB.from('invite_codes').update({ used: true, used_by: data.id }).eq('id', ic.id);

  // Audit log (ADMIN not set yet, use data directly)
  await SB.from('audit_logs').insert({ admin_id: data.id, admin_username: data.username, action: 'register', details: 'Account registered' }).catch(() => {});

  $('show-pin').textContent = pin; $('show-rc').textContent = rc;
  $('welcome-modal').classList.add('is-open'); ADMIN = data;
}

// ── PIN Reset ──────────────────────────────────────────────────────────────
function closeWelcome() { $('welcome-modal').classList.remove('is-open'); enterApp() }
function showReset()    { $('rs-result').classList.add('hidden'); $('reset-modal').classList.add('is-open') }
function closeReset()   { $('reset-modal').classList.remove('is-open') }

async function doReset() {
  const user = $('rs-user').value.trim().toUpperCase();
  const pass = $('rs-pass').value;
  const code = $('rs-code').value.trim().toUpperCase();
  const err  = $('rs-err');

  if (!user || !pass || code.length < 8) { err.textContent = 'Fill in all fields'; show(err); return }

  const btn = $('rs-btn'); btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  const pwh = await sha(pass), ch = await sha(code);
  const { data, error } = await SB.from('management_admins').select('*')
    .eq('username', user).eq('pass_hash', pwh).eq('recovery_code_hash', ch).single();

  if (error || !data) {
    err.textContent = 'Invalid credentials or recovery code'; show(err);
    btn.innerHTML = 'Reset & Show New PIN'; btn.disabled = false;
    setTimeout(() => hide(err), 3000); return;
  }

  const np = genPin(), nph = await sha(np);
  await SB.from('management_admins').update({ pin_hash: nph }).eq('id', data.id);
  btn.innerHTML = 'Reset & Show New PIN'; btn.disabled = false; hide(err);
  $('rs-new-pin').textContent = np; show($('rs-result')); toast('PIN reset!', 'success');
}

// ── App navigation ─────────────────────────────────────────────────────────
function enterApp() {
  localStorage.setItem('pm_admin', JSON.stringify(ADMIN));
  const as = $('auth-screen'); if (as) as.style.display = 'none';
  const ap = $('app');        if (ap) ap.style.display = 'block';
  $('nav-name').textContent = ADMIN.username;
  $('nav-name').style.display = ''; $('nav-name').classList.remove('hidden');
  $('nav-out').style.display  = ''; $('nav-out').classList.remove('hidden');
  goTo('dashboard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function signOut() {
  localStorage.removeItem('pm_admin');
  ADMIN = null;
  $('app').style.display         = 'none';
  $('auth-screen').style.display = '';
  $('nav-name').style.display    = 'none';
  $('nav-out').style.display     = 'none';
  $('l-user').value = ''; $('l-pass').value = '';
  [0, 1, 2, 3].forEach(i => $('lp-' + i).value = '');
  switchAuth('login'); toast('Signed out', 'info');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goTo(sec) {
  ['dashboard', 'surveys', 'detail', 'users', 'sites', 'audit'].forEach(s => {
    const el = $('s-' + s), tb = $('t-' + s);
    if (s === sec) { if (el) el.style.display = 'block'; if (tb) tb.classList.add('active') }
    else           { if (el) el.style.display = 'none';  if (tb) tb.classList.remove('active') }
  });
  if (sec === 'dashboard') loadDashboard();
  else if (sec === 'surveys') loadSurveys();
  else if (sec === 'users')   loadUsers();
  else if (sec === 'sites')   loadSites();
  else if (sec === 'audit')   loadAudit();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
