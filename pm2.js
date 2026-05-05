// ── Dashboard ──────────────────────────────────────────────────────────────
async function loadDashboard() {
  const [{ count: sc }, { count: rc }, { count: uc }] = await Promise.all([
    SB.from('surveys').select('*', { count: 'exact', head: true }),
    SB.from('survey_responses').select('*', { count: 'exact', head: true }),
    SB.from('users').select('*', { count: 'exact', head: true })
  ]);
  $('d-sv').textContent = sc || 0;
  $('d-rs').textContent = rc || 0;
  $('d-us').textContent = uc || 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count: nc } = await SB.from('survey_responses')
    .select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
  $('d-nw').textContent = nc || 0;

  const { data: rs } = await SB.from('survey_responses')
    .select('*,surveys(title)').order('created_at', { ascending: false }).limit(6);
  const el = $('d-recent'); el.innerHTML = '';
  if (!rs?.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">No responses yet.</p>'; return }

  const statusColors = { new: '#4ade80', reviewed: '#fbbf24', promoted: '#a855f7' };
  rs.forEach(r => {
    const d = document.createElement('div'); d.className = 'rrow';
    const nm = r.respondent_name || 'Anonymous';
    d.innerHTML = '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.8rem;flex-shrink:0">' + esc(nm.charAt(0).toUpperCase()) + '</div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:900;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(nm) + '</div>'
      + '<div style="font-size:.58rem;color:#64748b;margin-top:2px">' + esc(r.surveys?.title || '') + '</div></div>'
      + '<span style="font-size:.5rem;font-weight:900;text-transform:uppercase;color:' + (statusColors[r.status] || '#4ade80') + '">' + esc(r.status || 'new') + '</span>';
    el.appendChild(d);
  });
}

// ── Surveys list ───────────────────────────────────────────────────────────
async function loadSurveys() {
  const { data } = await SB.from('surveys').select('*').order('created_at', { ascending: false });
  SURVEYS = data || [];
  const el = $('sv-list'); el.innerHTML = '';
  if (!SURVEYS.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">No surveys yet.</p>'; return }

  for (const s of SURVEYS) {
    const { count: rc } = await SB.from('survey_responses')
      .select('*', { count: 'exact', head: true }).eq('survey_id', s.id);
    const c = document.createElement('div'); c.className = 'sv-card'; c.onclick = () => openDetail(s.id);
    const activeStyle = s.is_active
      ? 'background:rgba(5,150,105,.15);border:1px solid rgba(5,150,105,.3);color:#6ee7b7'
      : 'background:rgba(100,100,100,.15);border:1px solid rgba(100,100,100,.3);color:#aaa';
    c.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">'
      + '<div style="flex:1;min-width:0"><h3 style="font-size:.9rem;font-weight:900;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.title) + '</h3>'
      + '<p style="font-size:.65rem;color:#64748b;margin-top:4px">' + esc(s.description || 'No description') + '</p></div>'
      + '<div style="display:flex;gap:10px;align-items:center;flex-shrink:0">'
      + '<div style="text-align:center"><div style="font-size:1.1rem;font-weight:900;color:#a855f7">' + (rc || 0) + '</div><div style="font-size:.5rem;font-weight:700;opacity:.4;text-transform:uppercase">Resp</div></div>'
      + '<div style="text-align:center"><div style="font-size:1.1rem;font-weight:900;color:#64748b">' + (s.fields || []).length + '</div><div style="font-size:.5rem;font-weight:700;opacity:.4;text-transform:uppercase">Fields</div></div>'
      + '<span style="font-size:.5rem;font-weight:900;padding:4px 10px;border-radius:20px;text-transform:uppercase;' + activeStyle + '">' + (s.is_active ? 'Active' : 'Closed') + '</span>'
      + '</div></div>';
    el.appendChild(c);
  }
}

// ── Survey builder ─────────────────────────────────────────────────────────
let SVF = [];

function openCSV() { SVF = []; renderFlds(); $('csv-t').value = ''; $('csv-d').value = ''; $('csv-modal').classList.add('is-open') }
function closeCSV() { $('csv-modal').classList.remove('is-open') }

function addField() {
  SVF.push({ id: 'f' + Date.now(), type: 'text', label: '', required: false, placeholder: '', options: [] });
  renderFlds();
}

function renderFlds() {
  const el = $('flds'); el.innerHTML = '';
  if (!SVF.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.75rem;text-align:center;padding:8px">No fields. Click Add Field.</p>'; return }
  SVF.forEach((f, i) => {
    const d = document.createElement('div'); d.className = 'fb';
    const typeOptions = ['text', 'textarea', 'select', 'radio', 'checkbox']
      .map(t => '<option value="' + t + '"' + (f.type === t ? ' selected' : '') + '>' + t + '</option>').join('');
    d.innerHTML = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">'
      + '<input type="text" value="' + esc(f.label) + '" placeholder="Field label" style="flex:1;min-width:120px;padding:8px 12px;border-radius:10px;font-size:.75rem" onchange="SVF[' + i + '].label=this.value">'
      + '<select style="padding:8px 12px;border-radius:10px;font-size:.75rem;width:auto" onchange="SVF[' + i + '].type=this.value;renderFlds()">' + typeOptions + '</select>'
      + '<label style="font-size:.6rem;font-weight:700;display:flex;align-items:center;gap:4px;opacity:.7;cursor:pointer"><input type="checkbox" ' + (f.required ? 'checked' : '') + ' onchange="SVF[' + i + '].required=this.checked" style="width:auto;padding:0;margin:0;border:none!important"> Req</label>'
      + '<button onclick="SVF.splice(' + i + ',1);renderFlds()" style="color:#f87171;font-size:.8rem;opacity:.6;background:none;border:none;padding:4px 8px;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6"><i class="fas fa-trash"></i></button>'
      + '</div>';
    if (f.type === 'text' || f.type === 'textarea')
      d.innerHTML += '<input type="text" value="' + esc(f.placeholder || '') + '" placeholder="Placeholder text (optional)" style="width:100%;padding:8px 12px;border-radius:10px;font-size:.75rem" onchange="SVF[' + i + '].placeholder=this.value">';
    if (f.type === 'select' || f.type === 'radio')
      d.innerHTML += '<input type="text" value="' + esc((f.options || []).join(', ')) + '" placeholder="Options comma-separated e.g. Option 1, Option 2" style="width:100%;padding:8px 12px;border-radius:10px;font-size:.75rem" onchange="SVF[' + i + '].options=this.value.split(\',\').map(s=>s.trim()).filter(Boolean)">';
    el.appendChild(d);
  });
}

async function submitSV() {
  const t = $('csv-t').value.trim(), d = $('csv-d').value.trim();
  if (!t) { toast('Title required', 'warning'); return }
  if (!SVF.length) { toast('Add at least one field', 'warning'); return }
  for (const f of SVF) if (!f.label.trim()) { toast('All fields need labels', 'warning'); return }

  const btn = $('csv-btn'); btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  const pid = genPID();
  const { data, error } = await SB.from('surveys')
    .insert({ title: t, description: d, fields: SVF, public_id: pid, is_active: true, created_by: ADMIN?.id || null })
    .select().single();
  btn.innerHTML = 'Create & Get Link'; btn.disabled = false;

  if (error) { toast('Error: ' + error.message, 'error'); return }
  closeCSV();
  const lnk = location.origin + location.pathname + '?survey=' + pid;
  $('sv-link').textContent = lnk; $('link-modal').classList.add('is-open');
  logAudit('survey', 'Created survey: ' + t);
  toast('Survey created!', 'success'); loadSurveys();
}

function closeLink() { $('link-modal').classList.remove('is-open') }
function cpLink()    { navigator.clipboard.writeText($('sv-link').textContent); toast('Copied!', 'success', 1500) }

// ── Survey detail ──────────────────────────────────────────────────────────
async function openDetail(id) {
  goTo('detail');
  const { data: sv } = await SB.from('surveys').select('*').eq('id', id).single();
  if (!sv) { toast('Not found', 'error'); return }
  const { data: rs } = await SB.from('survey_responses').select('*').eq('survey_id', id).order('created_at', { ascending: false });
  RESPS = rs || [];

  const lnk = location.origin + location.pathname + '?survey=' + sv.public_id;
  const statusColors = { new: '#4ade80', reviewed: '#fbbf24', promoted: '#a855f7' };

  let h = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">'
    + '<h2 style="font-size:1.3rem;font-weight:900;text-transform:uppercase;background:linear-gradient(45deg,#fff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">' + esc(sv.title) + '</h2>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button onclick="navigator.clipboard.writeText(\'' + lnk + '\');toast(\'Copied!\',\'success\',1500)" style="padding:7px 14px;border-radius:10px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.25);color:#d8b4fe;font-size:.65rem;font-weight:900;text-transform:uppercase;cursor:pointer;font-family:inherit"><i class="fas fa-link mr-1"></i>Copy Link</button>'
    + '<button onclick="tglSV(\'' + sv.id + '\',' + (!sv.is_active) + ')" style="padding:7px 14px;border-radius:10px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);color:#fbbf24;font-size:.65rem;font-weight:900;text-transform:uppercase;cursor:pointer;font-family:inherit">' + (sv.is_active ? '<i class="fas fa-pause mr-1"></i>Close' : '<i class="fas fa-play mr-1"></i>Open') + '</button>'
    + '<button onclick="if(confirm(\'Delete survey?\'))delSV(\'' + sv.id + '\')" style="padding:7px 14px;border-radius:10px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);color:#fca5a5;font-size:.65rem;font-weight:900;text-transform:uppercase;cursor:pointer;font-family:inherit"><i class="fas fa-trash mr-1"></i>Delete</button>'
    + '</div></div>';

  if (sv.description) h += '<p style="font-size:.7rem;color:#64748b;margin-bottom:20px">' + esc(sv.description) + '</p>';
  h += '<h3 style="font-size:.75rem;font-weight:900;text-transform:uppercase;opacity:.4;margin-bottom:12px">Responses (' + RESPS.length + ')</h3>';

  if (!RESPS.length) {
    h += '<p style="color:#64748b;font-style:italic;font-size:.85rem">No responses yet.</p>';
  } else {
    h += '<div class="space-y-3">' + RESPS.map(r => {
      const nm  = r.respondent_name || 'Anonymous';
      const tm  = new Date(r.created_at).toLocaleString();
      const ans = r.answers || {};
      return '<div class="glass" style="padding:18px;border-radius:14px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">'
        + '<div><span style="font-size:.8rem;font-weight:900;text-transform:uppercase">' + esc(nm) + '</span>'
        + (r.respondent_contact ? '<span style="font-size:.6rem;color:#64748b;margin-left:8px">' + esc(r.respondent_contact) + '</span>' : '')
        + '<div style="font-size:.55rem;color:#64748b;margin-top:3px">' + tm + '</div></div>'
        + '<div style="display:flex;gap:6px;align-items:center">'
        + '<span style="font-size:.5rem;font-weight:900;padding:4px 10px;border-radius:20px;text-transform:uppercase;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);color:' + (statusColors[r.status] || '#4ade80') + '">' + esc(r.status || 'new') + '</span>'
        + '<button onclick="markR(\'' + r.id + '\',\'' + sv.id + '\')" title="Reviewed" style="padding:5px 10px;border-radius:8px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);color:#fbbf24;font-size:.65rem;cursor:pointer;font-family:inherit"><i class="fas fa-eye"></i></button>'
        + '<button onclick="promR(\'' + r.id + '\',\'' + sv.id + '\')" title="Promote to Developer" style="padding:5px 10px;border-radius:8px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.25);color:#c084fc;font-size:.65rem;cursor:pointer;font-family:inherit"><i class="fas fa-arrow-up"></i> Dev</button>'
        + '</div></div>'
        + '<div style="display:grid;gap:5px">'
        + (sv.fields || []).map(f => '<div style="font-size:.65rem"><span style="font-weight:900;text-transform:uppercase;opacity:.4">' + esc(f.label) + ': </span>'
          + '<span style="color:#d8b4fe">' + esc(typeof ans[f.id] === 'boolean' ? (ans[f.id] ? 'Yes' : 'No') : (ans[f.id] || '—')) + '</span></div>').join('')
        + '</div></div>';
    }).join('') + '</div>';
  }
  $('det-content').innerHTML = h;
}

async function tglSV(id, active) {
  await SB.from('surveys').update({ is_active: active }).eq('id', id);
  toast(active ? 'Survey opened' : 'Survey closed', 'success');
  logAudit('survey', (active ? 'Opened' : 'Closed') + ' survey id:' + id);
  openDetail(id);
}

async function delSV(id) {
  await SB.from('survey_responses').delete().eq('survey_id', id);
  await SB.from('surveys').delete().eq('id', id);
  logAudit('survey', 'Deleted survey id:' + id);
  toast('Deleted', 'info'); goTo('surveys');
}

async function markR(rid, sid) {
  await SB.from('survey_responses').update({ status: 'reviewed' }).eq('id', rid);
  toast('Marked reviewed', 'success', 1500); openDetail(sid);
}

async function promR(rid, sid) {
  const r = RESPS.find(x => x.id === rid); if (!r) return;
  const ct = r.respondent_contact || r.respondent_name || '';
  if (!ct) { toast('No contact info to find user', 'warning'); return }
  const { data: u } = await SB.from('users').select('*').or('email.ilike.%' + ct + '%,username.ilike.%' + ct + '%').single();
  if (!u) { toast('User not found in PM.tools. Contact: ' + ct, 'warning', 5000); return }
  if (u.role === 'developer' || u.role === 'admin') { toast(u.username + ' is already ' + u.role, 'info'); return }
  if (!confirm('Promote ' + u.username + ' to Developer on PM.tools?')) return;
  const { error } = await SB.from('users').update({ role: 'developer' }).eq('id', u.id);
  if (error) { toast('Error: ' + error.message, 'error'); return }
  await SB.from('survey_responses').update({ status: 'promoted' }).eq('id', rid);
  logAudit('role_change', 'Promoted ' + u.username + ' to developer via survey');
  toast(u.username + ' → Developer!', 'success', 4000); openDetail(sid);
}

// ── Users ──────────────────────────────────────────────────────────────────
async function loadUsers() {
  const { data } = await SB.from('users').select('*').order('created_at', { ascending: false });
  USERS = data || []; renderUsers();
  loadInviteCodes();
}

function renderUsers() {
  const q  = ($('u-search')?.value || '').toLowerCase();
  const el = $('u-list'); el.innerHTML = '';
  const fl = USERS.filter(u => !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  if (!fl.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">No users found.</p>'; return }

  const roleColors = { member: '#9ca3af', developer: '#c084fc', admin: '#f87171' };
  fl.forEach(u => {
    const d = document.createElement('div'); d.className = 'rrow';
    const isBanned = !!u.banned;
    const roleOpts = ['member', 'developer', 'admin']
      .map(r => '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + ' style="background:#1a1a2e">' + r.charAt(0).toUpperCase() + r.slice(1) + '</option>').join('');
    const banBtn = isBanned
      ? '<button onclick="toggleBan(\'' + u.id + '\',false)" title="Unban" style="padding:5px 10px;border-radius:8px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ade80;font-size:.6rem;cursor:pointer;font-family:inherit"><i class="fas fa-unlock"></i></button>'
      : '<button onclick="toggleBan(\'' + u.id + '\',true)" title="Ban" style="padding:5px 10px;border-radius:8px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);color:#fca5a5;font-size:.6rem;cursor:pointer;font-family:inherit"><i class="fas fa-ban"></i></button>';
    const histBtn = '<button onclick="openUserHist(\'' + u.id + '\')" title="History" style="padding:5px 10px;border-radius:8px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);color:#c084fc;font-size:.6rem;cursor:pointer;font-family:inherit"><i class="fas fa-history"></i></button>';
    d.innerHTML = '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,' + (isBanned ? '#7f1d1d,#991b1b' : '#7c3aed,#4f46e5') + ');display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0">' + (u.username || 'U').charAt(0).toUpperCase() + '</div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.78rem;font-weight:900;text-transform:uppercase' + (isBanned ? ';opacity:.45;text-decoration:line-through' : '') + '">' + esc((u.username || '').toUpperCase()) + (isBanned ? ' <span style="font-size:.5rem;color:#f87171;font-weight:900;text-decoration:none">[BANNED]</span>' : '') + '</div>'
      + '<div style="font-size:.58rem;color:#64748b;margin-top:2px">' + esc(u.email || '') + '</div></div>'
      + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
      + '<select onchange="chRole(\'' + u.id + '\',this.value)" style="background:rgba(255,255,255,.05);border:1px solid rgba(168,85,247,.2);color:' + (roleColors[u.role] || '#fff') + ';padding:7px 12px;border-radius:10px;font-size:.62rem;font-weight:900;text-transform:uppercase;cursor:pointer;font-family:inherit">' + roleOpts + '</select>'
      + banBtn + histBtn
      + '</div>';
    el.appendChild(d);
  });
}

async function chRole(id, role) {
  const u = USERS.find(x => x.id === id);
  const oldRole = u?.role || '?';
  const { error } = await SB.from('users').update({ role }).eq('id', id);
  if (error) { toast('Error: ' + error.message, 'error'); return }
  if (u) u.role = role;
  renderUsers(); toast('Role → ' + role, 'success', 2000);
  logAudit('role_change', 'Changed ' + (u?.username || id) + ' role: ' + oldRole + ' → ' + role);
}

// ── Invite Codes ───────────────────────────────────────────────────────────
let INVITE_CODES = [];

async function loadInviteCodes() {
  const { data } = await SB.from('invite_codes').select('*').order('created_at', { ascending: false });
  INVITE_CODES = data || []; renderIC();
}

function renderIC() {
  const el = $('ic-list'); if (!el) return;
  el.innerHTML = '';
  if (!INVITE_CODES.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.8rem">No invite codes. Generate one above.</p>'; return }
  INVITE_CODES.forEach(ic => {
    const d = document.createElement('div'); d.className = 'rrow';
    const usedBadge = ic.used
      ? '<span style="font-size:.55rem;font-weight:900;text-transform:uppercase;padding:3px 8px;border-radius:20px;background:rgba(100,100,100,.15);color:#9ca3af">Used</span>'
      : '<span style="font-size:.55rem;font-weight:900;text-transform:uppercase;padding:3px 8px;border-radius:20px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.2);color:#4ade80">Active</span>';
    d.innerHTML = '<span class="code-badge" style="letter-spacing:.15em">' + esc(ic.code) + '</span>'
      + '<div style="flex:1;text-align:right;padding-right:8px">' + usedBadge + '</div>'
      + '<button onclick="navigator.clipboard.writeText(\'' + esc(ic.code) + '\');toast(\'Copied!\',\'success\',1500)" style="padding:5px 8px;border-radius:8px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);color:#d8b4fe;font-size:.6rem;cursor:pointer;font-family:inherit;margin-right:4px"><i class="fas fa-copy"></i></button>'
      + (!ic.used ? '<button onclick="delIC(\'' + ic.id + '\')" style="padding:5px 8px;border-radius:8px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);color:#fca5a5;font-size:.6rem;cursor:pointer;font-family:inherit"><i class="fas fa-trash"></i></button>' : '');
    el.appendChild(d);
  });
}

async function createIC() {
  const code = genIC();
  const { error } = await SB.from('invite_codes').insert({ code, created_by: ADMIN?.id || null });
  if (error) { toast('Error: ' + error.message, 'error'); return }
  toast('Code: ' + code, 'success', 6000);
  logAudit('invite', 'Generated invite code: ' + code);
  loadInviteCodes();
}

async function delIC(id) {
  if (!confirm('Delete this invite code?')) return;
  const ic = INVITE_CODES.find(x => x.id === id);
  await SB.from('invite_codes').delete().eq('id', id);
  logAudit('invite', 'Deleted invite code: ' + (ic?.code || id));
  loadInviteCodes();
}

// ── Public survey form ─────────────────────────────────────────────────────
async function loadPubSurvey(pid) {
  const { data: sv, error } = await SB.from('surveys').select('*').eq('public_id', pid).eq('is_active', true).single();
  const el = $('pub-content');
  if (error || !sv) {
    el.innerHTML = '<div class="glass" style="padding:40px 28px;border-radius:20px;text-align:center">'
      + '<i class="fas fa-times-circle text-4xl text-red-400 mb-4" style="display:block"></i>'
      + '<h2 style="font-size:1.3rem;font-weight:900;text-transform:uppercase;margin-bottom:8px">Survey Not Found</h2>'
      + '<p style="font-size:.75rem;color:#64748b">This survey may be closed or does not exist.</p></div>';
    return;
  }
  const fs = sv.fields || [];
  let h = '<div class="glass" style="padding:32px 28px;border-radius:20px">'
    + '<div style="text-align:center;margin-bottom:28px"><span style="font-size:1.3rem;font-weight:900;text-transform:uppercase">PM<span style="color:#a855f7" class="lowercase">.management</span></span></div>'
    + '<h2 style="font-size:1.2rem;font-weight:900;text-transform:uppercase;text-align:center;margin-bottom:8px">' + esc(sv.title) + '</h2>'
    + (sv.description ? '<p style="font-size:.7rem;color:#64748b;text-align:center;margin-bottom:28px;font-weight:700">' + esc(sv.description) + '</p>' : '<div style="margin-bottom:24px"></div>')
    + '<div class="space-y-5">'
    + '<div><label style="font-size:.65rem;font-weight:900;text-transform:uppercase;opacity:.5;display:block;margin-bottom:8px">Your Name</label><input type="text" id="pn" style="width:100%;padding:14px 18px;border-radius:14px;font-size:.8rem" placeholder="Enter your name"></div>'
    + '<div><label style="font-size:.65rem;font-weight:900;text-transform:uppercase;opacity:.5;display:block;margin-bottom:8px">Contact (email or username)</label><input type="text" id="pc" style="width:100%;padding:14px 18px;border-radius:14px;font-size:.8rem" placeholder="So we can identify you"></div>';

  fs.forEach(f => {
    h += '<div><label style="font-size:.65rem;font-weight:900;text-transform:uppercase;opacity:.5;display:block;margin-bottom:8px">' + esc(f.label) + (f.required ? ' <span style="color:#f87171">*</span>' : '') + '</label>';
    if (f.type === 'text')
      h += '<input type="text" id="pf-' + f.id + '" style="width:100%;padding:14px 18px;border-radius:14px;font-size:.8rem" placeholder="' + esc(f.placeholder || '') + '">';
    else if (f.type === 'textarea')
      h += '<textarea id="pf-' + f.id + '" style="width:100%;padding:14px 18px;border-radius:14px;font-size:.8rem;height:100px" placeholder="' + esc(f.placeholder || '') + '"></textarea>';
    else if (f.type === 'select')
      h += '<select id="pf-' + f.id + '" style="width:100%;padding:14px 18px;border-radius:14px;font-size:.8rem;appearance:none;cursor:pointer"><option value="">Select an option...</option>' + (f.options || []).map(o => '<option>' + esc(o) + '</option>').join('') + '</select>';
    else if (f.type === 'radio') {
      h += '<div style="display:flex;flex-direction:column;gap:8px">';
      (f.options || []).forEach(o => {
        h += '<label style="font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;background:rgba(168,85,247,.05);border:1px solid rgba(168,85,247,.15);cursor:pointer;transition:border-color .2s" onmouseover="this.style.borderColor=\'rgba(168,85,247,.4)\'" onmouseout="this.style.borderColor=\'rgba(168,85,247,.15)\'"><input type="radio" name="pf-' + f.id + '" value="' + esc(o) + '" style="width:auto;padding:0;margin:0;border:none!important;background:none!important"> ' + esc(o) + '</label>';
      });
      h += '</div>';
    } else if (f.type === 'checkbox') {
      h += '<label style="font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;background:rgba(168,85,247,.05);border:1px solid rgba(168,85,247,.15);cursor:pointer"><input type="checkbox" id="pf-' + f.id + '" style="width:auto;padding:0;margin:0;border:none!important;background:none!important"> I agree / Yes</label>';
    }
    h += '</div>';
  });

  h += '</div><button onclick="subPub(\'' + sv.id + '\')" id="pub-btn" class="glow-btn" style="width:100%;padding:16px;border-radius:18px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;font-size:.85rem;margin-top:28px">Submit</button></div>';
  el.innerHTML = h;
}

async function subPub(svId) {
  const { data: sv } = await SB.from('surveys').select('fields').eq('id', svId).single(); if (!sv) return;
  const nm = $('pn')?.value.trim() || '', ct = $('pc')?.value.trim() || '';
  const fs = sv.fields || [], ans = {};

  for (const f of fs) {
    if (f.type === 'checkbox')     ans[f.id] = document.getElementById('pf-' + f.id)?.checked || false;
    else if (f.type === 'radio') { const c = document.querySelector('input[name="pf-' + f.id + '"]:checked'); ans[f.id] = c ? c.value : '' }
    else                           ans[f.id] = document.getElementById('pf-' + f.id)?.value || '';
    if (f.required && !ans[f.id] && ans[f.id] !== true) { toast(f.label + ' is required', 'warning'); return }
  }

  const btn = $('pub-btn'); btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  const { error } = await SB.from('survey_responses')
    .insert({ survey_id: svId, answers: ans, respondent_name: nm, respondent_contact: ct, status: 'new' });
  if (error) { toast('Error: ' + error.message, 'error'); btn.innerHTML = 'Submit'; btn.disabled = false; return }
  hide($('pub-screen'));
  const ty = $('pub-thanks'); ty.style.display = 'flex';
}

// ── Init ───────────────────────────────────────────────────────────────────
function checkPub() {
  const sid = new URLSearchParams(location.search).get('survey');
  if (!sid) return false;
  hide($('auth-screen')); show($('pub-screen')); loadPubSurvey(sid); return true;
}

function init() {
  if (checkPub()) return;
  try {
    const saved = localStorage.getItem('pm_admin');
    if (saved) { ADMIN = JSON.parse(saved); enterApp(); }
  } catch (e) {
    localStorage.removeItem('pm_admin');
  }
}

init();
