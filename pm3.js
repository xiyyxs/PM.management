// ── Audit Logging ──────────────────────────────────────────────────────────
async function logAudit(action, details) {
    if (!ADMIN) return;
    try {
      await SB.from('audit_logs').insert({
        admin_id: ADMIN.id,
        admin_username: ADMIN.username,
        action,
        details
      });
    } catch (e) { /* silently fail if table doesn't exist yet */ }
  }
  
  // ── Audit Logs Section ─────────────────────────────────────────────────────
  let AUDIT_ADMINS_LOADED = false;

  function auditDateStart(value) {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  function auditDateEnd(value) {
    if (!value) return '';
    const d = new Date(value + 'T23:59:59.999');
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  function auditDetailsText(details, fallback) {
    if (details == null || details === '') return fallback || '';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') return details.message || details.text || JSON.stringify(details);
    return String(details);
  }

  async function loadAuditAdmins(force) {
    const sel = $('audit-admin-filter');
    if (!sel || (AUDIT_ADMINS_LOADED && !force)) return;
    const selected = sel.value;
    const { data, error } = await SB.from('audit_logs')
      .select('admin_username')
      .not('admin_username', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return;
    const admins = [...new Set((data || []).map(r => r.admin_username).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">All Admins</option>' + admins
      .map(name => '<option value="' + esc(name) + '">' + esc(name) + '</option>')
      .join('');
    sel.value = admins.includes(selected) ? selected : '';
    AUDIT_ADMINS_LOADED = true;
  }

  function resetAuditFilters() {
    if ($('audit-filter')) $('audit-filter').value = '';
    if ($('audit-admin-filter')) $('audit-admin-filter').value = '';
    if ($('audit-from-filter')) $('audit-from-filter').value = '';
    if ($('audit-to-filter')) $('audit-to-filter').value = '';
    loadAudit();
  }

  async function loadAudit() {
    const el = $('audit-list');
    if (!el) return;
    el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.8rem">Loading...</p>';
    await loadAuditAdmins();
    const filter = $('audit-filter')?.value || '';
    const admin = $('audit-admin-filter')?.value || '';
    const from = auditDateStart($('audit-from-filter')?.value || '');
    const to = auditDateEnd($('audit-to-filter')?.value || '');
    let query = SB.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter) query = query.eq('action', filter);
    if (admin) query = query.eq('admin_username', admin);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    const { data, error } = await query;
    el.innerHTML = '';
    if (error) {
      el.innerHTML = '<p style="color:#f87171;font-size:.8rem">Error loading logs. Make sure the <code style="background:rgba(168,85,247,.1);padding:2px 6px;border-radius:4px">audit_logs</code> table exists in Supabase.</p>';
      return;
    }
    if (!data?.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">No audit logs found.</p>'; return }
  
    const actionIcons = {
      login:       { icon: 'sign-in-alt',      color: '#4ade80' },
      register:    { icon: 'user-plus',         color: '#60a5fa' },
      role_change: { icon: 'user-shield',       color: '#c084fc' },
      ban:         { icon: 'ban',               color: '#f87171' },
      survey:      { icon: 'poll',              color: '#fbbf24' },
      invite:      { icon: 'ticket-alt',        color: '#34d399' },
      site:        { icon: 'globe',             color: '#38bdf8' }
    };
  
    data.forEach(log => {
      const d = document.createElement('div'); d.className = 'rrow';
      const meta = actionIcons[log.action] || { icon: 'circle', color: '#9ca3af' };
      const time = new Date(log.created_at).toLocaleString();
      const details = auditDetailsText(log.details, log.action);
      d.innerHTML =
        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">'
        + '<i class="fas fa-' + meta.icon + '" style="color:' + meta.color + ';font-size:.75rem"></i></div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:.72rem;font-weight:900;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(details) + '</div>'
        + '<div style="font-size:.55rem;color:#64748b;margin-top:2px">' + esc(log.admin_username || '') + ' · ' + time + '</div>'
        + '</div>'
        + '<span style="font-size:.48rem;font-weight:900;text-transform:uppercase;padding:3px 9px;border-radius:20px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.15);color:' + meta.color + ';flex-shrink:0">' + esc(log.action || '') + '</span>';
      el.appendChild(d);
    });
  }
  
  // ── Ban / Unban User ───────────────────────────────────────────────────────
  async function toggleBan(userId, ban) {
    const u = USERS.find(x => x.id === userId);
    if (!u) return;
    const action = ban ? 'ban' : 'unban';
    if (!confirm((ban ? 'Ban' : 'Unban') + ' user ' + (u.username || userId) + '?')) return;
    const { error } = await SB.from('users').update({ banned: ban }).eq('id', userId);
    if (error) { toast('Error: ' + error.message, 'error'); return }
    u.banned = ban;
    renderUsers();
    toast((ban ? '🚫 Banned' : '✅ Unbanned') + ' ' + (u.username || userId), ban ? 'warning' : 'success');
    logAudit('ban', (ban ? 'Banned' : 'Unbanned') + ' user: ' + (u.username || userId));
  }
  
  // ── User History Modal ─────────────────────────────────────────────────────
  async function openUserHist(userId) {
    const u = USERS.find(x => x.id === userId);
    if (!u) return;
  
    $('uhm-avatar').textContent = (u.username || 'U').charAt(0).toUpperCase();
    $('uhm-name').textContent   = (u.username || '').toUpperCase();
    $('uhm-email').textContent  = u.email || '';
  
    const roleColors = { member: '#9ca3af', developer: '#c084fc', admin: '#f87171' };
    const rb = $('uhm-role-badge');
    rb.textContent = u.role || 'member';
    rb.style.cssText = 'margin-left:auto;font-size:.55rem;font-weight:900;text-transform:uppercase;padding:4px 12px;border-radius:20px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);color:' + (roleColors[u.role] || '#9ca3af');
  
    $('user-hist-modal').classList.add('is-open');
  
    const el = $('uhm-list');
    el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.8rem">Loading...</p>';
  
    // Load audit logs that mention this user
    const { data: logs } = await SB.from('audit_logs')
      .select('*')
      .ilike('details', '%' + (u.username || userId) + '%')
      .order('created_at', { ascending: false })
      .limit(50);
  
    // Load survey responses
    const { data: resps } = await SB.from('survey_responses')
      .select('*,surveys(title)')
      .or('respondent_contact.ilike.%' + (u.email || '') + '%,respondent_contact.ilike.%' + (u.username || '') + '%')
      .order('created_at', { ascending: false })
      .limit(20);
  
    el.innerHTML = '';
  
    const allItems = [];
    (logs || []).forEach(l => allItems.push({ type: 'audit', date: new Date(l.created_at), data: l }));
    (resps || []).forEach(r => allItems.push({ type: 'resp', date: new Date(r.created_at), data: r }));
    allItems.sort((a, b) => b.date - a.date);
  
    if (!allItems.length) {
      el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.8rem">No history found for this user.</p>';
      return;
    }
  
    allItems.forEach(item => {
      const d = document.createElement('div');
      d.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:rgba(255,255,255,.025);border:1px solid rgba(168,85,247,.08);border-radius:10px';
  
      if (item.type === 'audit') {
        const l = item.data;
        d.innerHTML = '<i class="fas fa-shield-alt" style="color:#c084fc;font-size:.7rem;margin-top:2px;flex-shrink:0"></i>'
          + '<div style="flex:1"><div style="font-size:.68rem;font-weight:900">' + esc(l.details) + '</div>'
          + '<div style="font-size:.53rem;color:#64748b;margin-top:2px">By ' + esc(l.admin_username) + ' · ' + item.date.toLocaleString() + '</div></div>';
      } else {
        const r = item.data;
        d.innerHTML = '<i class="fas fa-poll" style="color:#fbbf24;font-size:.7rem;margin-top:2px;flex-shrink:0"></i>'
          + '<div style="flex:1"><div style="font-size:.68rem;font-weight:900">Survey response: ' + esc(r.surveys?.title || 'Unknown') + '</div>'
          + '<div style="font-size:.53rem;color:#64748b;margin-top:2px">' + item.date.toLocaleString() + '</div></div>'
          + '<span style="font-size:.48rem;font-weight:900;text-transform:uppercase;color:' + statusColor(r.status || 'new') + '">' + esc(statusLabel(r.status || 'new')) + '</span>';
      }
      el.appendChild(d);
    });
  }
  
  // ── Sites Section ──────────────────────────────────────────────────────────
  const PMTOOLS_URL = 'https://pm.tools'; // Change if different
  
  async function loadSites() {
    refreshSiteStatus();
    loadUpgradeURL();
    loadDeployLog();
  }
  
  async function refreshSiteStatus() {
    const dot   = $('site-status-dot');
    const txt   = $('site-status-txt');
    const badge = $('site-status-badge');
    if (!dot) return;
  
    dot.style.background   = '#fbbf24';
    dot.style.boxShadow    = '0 0 10px rgba(251,191,36,.5)';
    badge.textContent      = 'Checking...';
    txt.textContent        = 'Pinging ' + PMTOOLS_URL + '...';
  
    const start = Date.now();
    try {
      const res = await fetch(PMTOOLS_URL, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' });
      const ms  = Date.now() - start;
      dot.style.background  = '#4ade80';
      dot.style.boxShadow   = '0 0 10px rgba(74,222,128,.5)';
      badge.textContent     = 'Online';
      badge.style.color     = '#4ade80';
      badge.style.borderColor = 'rgba(74,222,128,.3)';
      txt.textContent       = 'Responded in ' + ms + 'ms';
    } catch (e) {
      dot.style.background  = '#f87171';
      dot.style.boxShadow   = '0 0 10px rgba(248,113,113,.5)';
      badge.textContent     = 'Offline';
      badge.style.color     = '#f87171';
      badge.style.borderColor = 'rgba(248,113,113,.3)';
      txt.textContent       = 'Could not reach ' + PMTOOLS_URL;
    }
  }
  
  async function loadUpgradeURL() {
    const { data } = await SB.from('site_config').select('value').eq('key', 'upgrade_survey_url').single().catch(() => ({ data: null }));
    if ($('upgrade-url-input')) $('upgrade-url-input').value = data?.value || '';
  }
  
  async function saveUpgradeURL() {
    const url = $('upgrade-url-input')?.value.trim();
    if (!url) { toast('Enter a URL first', 'warning'); return }
    const { error } = await SB.from('site_config').upsert({ key: 'upgrade_survey_url', value: url }, { onConflict: 'key' });
    if (error) { toast('Error: ' + error.message, 'error'); return }
    toast('Upgrade URL saved!', 'success');
    logAudit('site', 'Updated UPGRADE_SURVEY_URL → ' + url);
    addDeployEntry('Updated UPGRADE_SURVEY_URL');
    loadDeployLog();
  }
  
  async function loadDeployLog() {
    const el = $('deploy-log');
    if (!el) return;
    const { data } = await SB.from('audit_logs')
      .select('*')
      .eq('action', 'site')
      .order('created_at', { ascending: false })
      .limit(20);
  
    el.innerHTML = '';
    if (!data?.length) { el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.8rem">No changes logged yet.</p>'; return }
    data.forEach(log => {
      const d = document.createElement('div'); d.className = 'rrow';
      const time = new Date(log.created_at).toLocaleString();
      const details = auditDetailsText(log.details, log.action);
      d.innerHTML = '<i class="fas fa-code-branch" style="color:#38bdf8;font-size:.75rem;flex-shrink:0"></i>'
        + '<div style="flex:1;min-width:0"><div style="font-size:.7rem;font-weight:900">' + esc(details) + '</div>'
        + '<div style="font-size:.53rem;color:#64748b;margin-top:2px">' + esc(log.admin_username) + ' · ' + time + '</div></div>';
      el.appendChild(d);
    });
  }
  
  async function addManualChangeLog() {
    const site = $('change-site')?.value || 'PM.tools';
    const type = $('change-type')?.value || 'deploy';
    const details = $('change-details')?.value.trim();
    if (!details) { toast('Describe the change first', 'warning'); return }

    const { error } = await SB.rpc('pm_add_change_log', {
      p_admin_id: String(ADMIN?.id || ''),
      p_admin_username: ADMIN?.username || 'UNKNOWN',
      p_site: site,
      p_change_type: type,
      p_details: details
    });
    if (error) { toast('RPC error: ' + error.message, 'error', 6000); return }
    $('change-details').value = '';
    toast('Change log added', 'success');
    loadDeployLog();
    AUDIT_ADMINS_LOADED = false;
  }

  async function loadDbTools() {
    loadDbStatus();
  }

  function renderDbStatusRow(item) {
    const missing = item.missing_columns || [];
    const ok = !!item.exists && missing.length === 0;
    const d = document.createElement('div');
    d.className = 'rrow';
    d.innerHTML =
      '<div style="width:34px;height:34px;border-radius:10px;background:' + (ok ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)') + ';border:1px solid ' + (ok ? 'rgba(74,222,128,.25)' : 'rgba(248,113,113,.25)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + '<i class="fas fa-' + (ok ? 'check' : 'times') + '" style="color:' + (ok ? '#4ade80' : '#f87171') + ';font-size:.7rem"></i></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:900;text-transform:uppercase">' + esc(item.table) + '</div>'
      + '<div style="font-size:.55rem;color:#64748b;margin-top:2px">' + (ok ? 'Ready' : (item.exists ? 'Missing columns: ' + esc(missing.join(', ')) : 'Table does not exist')) + '</div></div>'
      + '<span style="font-size:.5rem;font-weight:900;text-transform:uppercase;padding:4px 10px;border-radius:20px;background:' + (ok ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)') + ';color:' + (ok ? '#4ade80' : '#f87171') + '">' + (ok ? 'OK' : 'Fix') + '</span>';
    return d;
  }

  async function loadDbStatus() {
    const el = $('db-status-list');
    if (!el) return;
    el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">Checking...</p>';
    const { data, error } = await SB.rpc('pm_check_management_schema');
    el.innerHTML = '';
    if (error) {
      el.innerHTML = '<p style="color:#f87171;font-size:.8rem">RPC not ready: run <code style="background:rgba(168,85,247,.1);padding:2px 6px;border-radius:4px">supabase-management-rpc.sql</code> in Supabase SQL Editor.</p>';
      return;
    }
    const rows = Array.isArray(data) ? data : (data?.tables || []);
    if (!rows.length) {
      el.innerHTML = '<p style="color:#64748b;font-style:italic;font-size:.85rem">No schema status returned.</p>';
      return;
    }
    rows.forEach(item => el.appendChild(renderDbStatusRow(item)));
  }

  async function runDbTool(fn, okMsg, dangerous) {
    if (dangerous && !confirm('Clear all SYSTEM test logs?')) return;
    const { error } = await SB.rpc(fn);
    if (error) { toast('RPC error: ' + error.message, 'error', 6000); return }
    toast(okMsg, 'success');
    AUDIT_ADMINS_LOADED = false;
    loadDbStatus();
    loadDeployLog();
  }

  async function addDeployEntry(msg) {
    // Just an alias — logAudit('site', msg) handles it
  }
