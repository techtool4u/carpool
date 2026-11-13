// Carpool app: screens, storage, reminders and sharing. Rules (rotation, seat plan, balances) live in logic.js.
(function () {
  'use strict';
  const L = window.Logic;
  const KEY = 'carpool.v1';
  const COLORS = ['#e07a5f', '#3d85c6', '#c2185b', '#7c5cff', '#2a9d8f', '#f4a261', '#264653', '#8d6e63', '#6a994e', '#d62828'];
  const KID_EMOJI = ['👧', '👦', '🧒', '👶', '👧🏽', '👦🏽', '👧🏻', '👦🏻', '👧🏿', '👦🏿'];
  const KID_BG = ['#ffe1d6', '#dbeafe', '#fef3c7', '#fce7f3', '#e0f2fe', '#dcfce7', '#ede9fe'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const GROUP_TYPES = { school: '🏫 School', sports: '⚽ Sports', swim: '🏊 Swimming', music: '🎵 Music', tuition: '📚 Tuition', friends: '🎈 Friends', other: '📍 Other' };
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = name => native && ((Cap.Plugins && Cap.Plugins[name]) || (Cap.registerPlugin && Cap.registerPlugin(name)));

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const fmtTime = t => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const fmtDate = (d, long) => L.parse(d).toLocaleDateString(undefined, long ? { weekday: 'long', day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short' });
  const dayLabel = d => d === L.today() ? 'Today' : d === L.addDays(L.today(), 1) ? 'Tomorrow' : fmtDate(d);
  const nowHM = () => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; };
  const money = n => (S.settings.currency || '₹') + (Math.round(n * 100) / 100).toLocaleString();
  const initial = s => (String(s || '?').trim()[0] || '?').toUpperCase();

  // ---------- storage ----------
  let S = load();
  function blank() { return { v: 1, me: null, families: [], groups: [], assignments: {}, outings: [], rides: [], ledger: [], settings: { reminders: true, currency: '₹' } }; }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return { ...blank(), ...s, settings: { ...blank().settings, ...(s.settings || {}) } }; } catch (e) { /* private mode or bad data */ }
    return blank();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save on this device'); }
    scheduleReminders();
  }
  const fam = id => L.byId(S.families, id);
  const me = () => fam(S.me);
  const famName = id => { const f = fam(id); return f ? (id === S.me ? 'You' : f.adults[0]?.name || f.name) : 'Nobody'; };
  const famColor = id => (fam(id) || {}).color || '#9aa5b1';
  const allKids = () => S.families.flatMap(f => f.kids.map(k => ({ ...k, familyId: f.id })));
  const kidById = id => allKids().find(k => k.id === id);
  const groupsOfMe = () => S.groups.filter(g => g.familyIds.includes(S.me));
  const avatar = (id, sm) => { const f = fam(id); return `<span class="av${sm ? ' sm' : ''}" style="background:${famColor(id)}">${esc(initial(f ? f.adults[0]?.name || f.name : '?'))}</span>`; };
  const kidAv = k => `<span class="kid" style="background:${k.bg || KID_BG[0]}">${k.emoji || '🧒'}</span>`;
  const carText = c => c ? `${esc(c.label)}${c.plate ? ' · ' + esc(c.plate) : ''}` : 'No car';

  // ---------- demo data ----------
  function demo() {
    const s = blank();
    const F = (id, name, adult, phone, color, kids, cars, extra) => ({ id, name, color, adults: [{ id: id + 'a', name: adult, phone }], kids, cars, unavailable: {}, ...extra });
    const K = (id, name, emoji, bg, seat, extra) => ({ id, name, emoji, bg, seat, grade: '', medical: '', contacts: [], ...extra });
    s.families = [
      F('fP', 'Sharma family', 'Priya', '+91 98450 00001', COLORS[0], [K('kMia', 'Mia', '👧', KID_BG[0], 'none', { grade: 'Grade 3', contacts: [{ name: 'Vikram (dad)', phone: '+91 98450 00011' }] })], [{ id: 'cP', label: 'White Honda City', plate: 'KA 03 MN 4521', seats: 4, boosters: 1, carSeats: 0 }]),
      F('fR', 'Kumar family', 'Rahul', '+91 98450 00002', COLORS[1], [K('kAarav', 'Aarav', '👦', KID_BG[1], 'booster', { grade: 'Grade 3' })], [{ id: 'cR', label: 'Grey Hyundai Creta', plate: 'KA 05 AB 1200', seats: 4, boosters: 2, carSeats: 0 }]),
      F('fA', 'Desai family', 'Anita', '+91 98450 00003', COLORS[2], [K('kZara', 'Zara', '👧🏽', KID_BG[3], 'none', { grade: 'Grade 3' })], [{ id: 'cA', label: 'Red Maruti Swift', plate: 'KA 01 CD 7788', seats: 4, boosters: 1, carSeats: 0 }]),
      F('fS', 'Iyer family', 'Sam', '+91 98450 00004', COLORS[3], [K('kLeo', 'Leo', '👦🏽', KID_BG[2], 'none', { grade: 'Grade 3', medical: 'Nut allergy. EpiPen in school bag.', contacts: [{ name: 'Meera (mum)', phone: '+91 98450 00014' }] })], [{ id: 'cS', label: 'Blue Kia Seltos', plate: 'KA 04 EF 3321', seats: 4, boosters: 1, carSeats: 0 }]),
      F('fD', 'Dev & Kavya', 'Dev', '+91 98450 00005', COLORS[4], [K('kKabir', 'Kabir', '👦', KID_BG[5], 'none'), K('kAnanya', 'Ananya', '👧', KID_BG[4], 'booster')], [{ id: 'cD', label: 'Silver Toyota Innova', plate: 'KA 02 GH 9001', seats: 6, boosters: 1, carSeats: 0 }], { friend: true }),
    ];
    s.families[2].unavailable = { gSchool: ['*:4'] };
    s.me = 'fP';
    const mon = L.mondayOf(L.today());
    s.groups = [
      { id: 'gSchool', name: 'Greenwood Gr. 3', type: 'school', place: 'Greenwood High School', familyIds: ['fP', 'fR', 'fA', 'fS'], kidIds: ['kMia', 'kAarav', 'kZara', 'kLeo'], mode: 'round', skipDates: [L.addDays(mon, 11)],
        trips: [{ id: 't1', label: 'To school', time: '07:45', days: [1, 2, 3, 4, 5] }, { id: 't2', label: 'Back home', time: '15:15', days: [1, 2, 3, 4, 5] }] },
      { id: 'gSwim', name: 'Swimming', type: 'swim', place: 'Aqua Club, HSR Layout', familyIds: ['fP', 'fA', 'fD'], kidIds: ['kMia', 'kZara', 'kKabir'], mode: 'round', skipDates: [],
        trips: [{ id: 't1', label: 'There & back', time: '17:00', days: [2, 4] }] },
    ];
    for (const g of s.groups) L.generateRotation(s, g, { from: mon, weeks: 4 });
    // Past trips this week are done; one cover request is open.
    for (const [k, a] of Object.entries(s.assignments)) {
      const { date } = L.parseKey(k);
      if (date < L.today()) { a.status = 'done'; a.confirmed = true; }
    }
    // Make it your turn on the next school morning so the sample shows the driver's view.
    const mine = Object.keys(s.assignments).filter(k => { const p = L.parseKey(k); return p.groupId === 'gSchool' && p.tripId === 't1' && p.date >= L.today(); }).sort()[0];
    if (mine) { s.assignments[mine].driverId = 'fP'; s.assignments[mine].locked = true; s.assignments[mine].confirmed = true; L.generateRotation(s, s.groups[0], { from: L.addDays(mine.split('|')[2], 1), weeks: 4 }); }
    const open = Object.keys(s.assignments).find(k => { const p = L.parseKey(k); return p.groupId === 'gSchool' && p.date > L.addDays(L.today(), 1) && s.assignments[k].driverId !== 'fP'; });
    if (open) L.requestCover(s, open, 'Work meeting ran over');
    const sat = L.addDays(mon, L.weekday(L.today()) === 6 || L.weekday(L.today()) === 0 ? 12 : 5);
    s.outings = [{ id: 'o1', name: "Riya's birthday party", emoji: '🎂', place: 'FunZone, Mall Rd', date: sat, goTime: '15:40', backTime: '19:00',
      kidIds: ['kMia', 'kAarav', 'kZara', 'kLeo', 'kKabir', 'kAnanya'], drivers: { go: ['fP', 'fD'], back: ['fR', 'fS'] }, rsvp: { fP: 'yes', fR: 'yes', fA: 'pending', fS: 'yes', fD: 'yes' }, plan: null }];
    s.rides = [
      { id: 'r1', kind: 'offer', ownerId: 'fD', from: 'Oakwood Society', to: 'Tech Park', time: '08:50', days: [1, 2, 3, 4, 5], date: '', seats: 2, price: 60, riders: ['fP'], note: 'Neighbours' },
      { id: 'r2', kind: 'need', ownerId: 'fS', from: 'Home', to: 'Airport', time: '05:30', days: [], date: L.addDays(L.today(), 3), seats: 1, price: 0, riders: [], note: '' },
    ];
    s.ledger = [1, 2, 3, 4, 5].map(i => ({ id: 'l' + i, from: 'fP', to: 'fD', amount: 60, note: 'Office ride', date: L.addDays(mon, i - 8), settled: false }));
    s.settings.demo = true;
    return s;
  }

  // ---------- reminders (Android notifications) ----------
  let remTimer = null;
  function scheduleReminders() { clearTimeout(remTimer); remTimer = setTimeout(doSchedule, 800); }
  async function doSchedule() {
    const LN = plugin('LocalNotifications');
    if (!LN || !S.me) return;
    try {
      const pending = await LN.getPending();
      if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
      if (!S.settings.reminders) return;
      const perm = await LN.checkPermissions();
      if (perm.display !== 'granted') { const r = await LN.requestPermissions(); if (r.display !== 'granted') return; }
      const list = []; const now = Date.now(); let id = 1;
      for (const s of mySlots(L.today(), L.addDays(L.today(), 14))) {
        if (s.a.driverId !== S.me) continue;
        const [h, m] = s.trip.time.split(':').map(Number);
        const at = L.parse(s.date); at.setHours(h, m, 0, 0);
        const kids = L.tripKids(S, s.group, s.trip).filter(k => (s.a.riders || {})[k.id] !== 'absent').map(k => k.name).join(', ');
        const eve = new Date(at); eve.setDate(eve.getDate() - 1); eve.setHours(19, 30, 0, 0);
        const before = new Date(at.getTime() - 30 * 60000);
        if (eve > now) list.push({ id: id++, title: `You're driving tomorrow, ${fmtTime(s.trip.time)}`, body: `${s.group.name} · ${s.trip.label}: ${kids}. Open to confirm.`, schedule: { at: eve, allowWhileIdle: true }, extra: { key: s.key } });
        if (before > now) list.push({ id: id++, title: `Drive in 30 min: ${s.group.name}`, body: `${s.trip.label} at ${fmtTime(s.trip.time)} · ${kids}`, schedule: { at: before, allowWhileIdle: true }, extra: { key: s.key } });
        if (list.length > 50) break;
      }
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn('reminders: ' + e.message); }
  }

  // ---------- sharing ----------
  async function share(text, title) {
    const Sh = plugin('Share');
    try {
      if (Sh) return await Sh.share({ title: title || 'Carpool', text, dialogTitle: 'Share with parents' });
      if (navigator.share) return await navigator.share({ title: title || 'Carpool', text });
    } catch (e) { if (/cancel/i.test(e.message || '')) return; }
    try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in your group chat.'); } catch (e) { prompt('Copy this message:', text); }
  }
  function openUrl(url) { window.open(url, '_blank'); }

  // ---------- slots ----------
  function slotInfo(key) {
    const p = L.parseKey(key); const group = L.byId(S.groups, p.groupId); if (!group) return null;
    const trip = L.byId(group.trips, p.tripId); if (!trip) return null;
    const a = S.assignments[key] || (S.assignments[key] = { driverId: null, riders: {}, status: 'scheduled' });
    a.riders = a.riders || {};
    return { key, date: p.date, group, trip, a };
  }
  // Trips in my groups between two dates where I drive or one of my kids rides.
  function mySlots(from, to) {
    const mine = new Set((me() || { kids: [] }).kids.map(k => k.id));
    const out = [];
    for (const g of groupsOfMe()) for (const sl of L.tripSlots(g, from, to)) {
      const info = slotInfo(sl.key); if (!info) continue;
      const kids = L.tripKids(S, g, sl.trip);
      if (info.a.driverId === S.me || kids.some(k => mine.has(k.id))) out.push(info);
    }
    return out.sort((x, y) => (x.date + x.trip.time).localeCompare(y.date + y.trip.time));
  }
  const openCovers = () => groupsOfMe().flatMap(g => L.tripSlots(g, L.today(), L.addDays(L.today(), 21)).map(s => slotInfo(s.key)))
    .filter(s => s && s.a.cover && s.a.cover.requested);

  // ---------- routing & rendering ----------
  const views = {};
  let route = [];
  function go(h) { location.hash = h; }
  function render() {
    route = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean).map(decodeURIComponent);
    if (!S.me && route[0] !== 'welcome' && route[0] !== 'setup') { route = ['welcome']; }
    if (S.me && (!route[0] || route[0] === 'welcome')) route = ['today'];
    const v = views[route[0]] || views.today;
    $('#app').innerHTML = v(...route.slice(1));
    const tab = { today: 'today', calendar: 'calendar', groups: 'groups', group: 'groups', friends: 'friends' }[route[0]];
    $('#tabs').hidden = !S.me || ['welcome', 'setup', 'trip'].includes(route[0]);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  const top = (title, sub, right) => `<div class="top"><a class="back" href="javascript:history.back()" data-act="back"><svg class="ic"><use href="#i-back"/></svg></a><div class="grow"><h2>${title}</h2>${sub ? `<div class="mut">${sub}</div>` : ''}</div>${right || ''}</div>`;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600); }
  function openSheet(html) { $('#sheet').innerHTML = html; $('#sheetWrap').hidden = false; }
  function closeSheet() { $('#sheetWrap').hidden = true; $('#sheet').innerHTML = ''; }

  // ---------- Welcome & setup ----------
  views.welcome = () => `
    <div class="hero"><div class="logo">🚗</div><h1>Carpool</h1>
      <p class="mut" style="font-size:15px;margin-top:8px">Share school runs, classes and outings with the parents and friends you trust. Fair turns, no confusion.</p></div>
    <div class="card"><h3>Set up your family</h3>
      <form data-form="setup">
        <label>Your name</label><input name="adult" required placeholder="e.g. Priya" autocomplete="given-name">
        <label>Phone (shared only with your groups)</label><input name="phone" type="tel" placeholder="+91 …" autocomplete="tel">
        <label>Family name</label><input name="name" placeholder="e.g. Sharma family">
        <button class="btn" style="margin-top:16px">Continue</button>
      </form></div>
    <button class="btn o" data-act="demo">Explore with sample families</button>
    <p class="note">Everything is saved on this phone only. Share updates with other parents through WhatsApp or any chat app.</p>`;
  views.setup = () => { const f = me(); return f ? views.family(S.me, true) : views.welcome(); };

  // ---------- Today ----------
  views.today = () => {
    const f = me(); const t = L.today(); const tm = L.addDays(t, 1);
    const todays = mySlots(t, t); const tomorrow = mySlots(tm, tm).filter(s => s.a.driverId === S.me);
    const covers = openCovers().filter(s => s.a.cover.from !== S.me);
    const myCovers = openCovers().filter(s => s.a.cover.from === S.me);
    const outs = S.outings.filter(o => o.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
    let h = `<div class="row sp" style="margin:6px 0 16px"><div><div class="mut">${fmtDate(t, true)}</div><h1>Today</h1></div>
      <a href="#/family/${S.me}" class="row" aria-label="My family">${avatar(S.me)}</a></div>`;
    if (!S.groups.length) h += `<div class="card empty"><div class="big">🚸</div><h3>No carpool groups yet</h3><p class="mut" style="margin:6px 0 14px">Create a group for school or a class, add the families, and the app plans fair driving turns.</p><a class="btn" href="#/group-new">Create a carpool group</a></div>`;
    if (S.groups.length && !todays.length) h += `<div class="card empty"><div class="big">☀️</div><h3>No trips today</h3><p class="mut">Enjoy the free day.</p></div>`;
    for (const s of todays) h += slotCard(s);
    for (const s of covers) h += `<a class="card amber row" href="#/slot/${encodeURIComponent(s.key)}"><span style="font-size:24px">🙋</span><div class="grow"><b>${esc(famName(s.a.cover.from))} needs cover</b><div class="mut">${dayLabel(s.date)} · ${fmtTime(s.trip.time)} · ${esc(s.group.name)}</div></div><b style="color:var(--am)">›</b></a>`;
    for (const s of myCovers) h += `<a class="card amber row" href="#/slot/${encodeURIComponent(s.key)}"><span style="font-size:24px">⏳</span><div class="grow"><b>Waiting for someone to cover</b><div class="mut">${dayLabel(s.date)} · ${fmtTime(s.trip.time)} · ${esc(s.group.name)}</div></div></a>`;
    if (tomorrow.length) { h += `<div class="sec">Tomorrow you drive</div>`; for (const s of tomorrow) h += slotCard(s); }
    if (outs.length) { h += `<div class="sec">Coming up</div>`; for (const o of outs) h += `<a class="card row" href="#/outing/${o.id}" style="background:var(--aml);box-shadow:none"><span style="font-size:24px">${o.emoji || '🎈'}</span><div class="grow"><b>${esc(o.name)}</b><div class="mut">${dayLabel(o.date)} · ${fmtTime(o.goTime)} · ${esc(o.place)}</div></div><b style="color:var(--am)">›</b></a>`; }
    if (S.settings.demo) h += `<p class="note">You're exploring sample families. Reset in <a href="#/family/${S.me}" style="text-decoration:underline">your family › Settings</a> to start with your own.</p>`;
    return h;
  };
  function slotCard(s) {
    const kids = L.tripKids(S, s.group, s.trip);
    const mine = kids.filter(k => k.familyId === S.me);
    const driving = s.a.driverId === S.me;
    const df = fam(s.a.driverId); const car = df && L.carThatFits(df, kids.filter(k => s.a.riders[k.id] !== 'absent'));
    const st = s.a.status;
    const tag = st === 'done' ? `<span class="tag gr">✓ Done</span>` : st === 'active' ? `<span class="tag">● In progress</span>` : s.a.cover && s.a.cover.requested ? `<span class="tag am">Needs cover</span>` : s.a.confirmed ? `<span class="tag bl">✓ Confirmed</span>` : driving ? `<span class="tag am">Not confirmed</span>` : '';
    const ride = kids.filter(k => s.a.riders[k.id] !== 'absent');
    if (driving) return `<div class="card hl">
      <div class="row sp"><span class="tag">YOU'RE DRIVING · ${fmtTime(s.trip.time)}</span>${tag}</div>
      <a href="#/slot/${encodeURIComponent(s.key)}"><div style="font-weight:700;font-size:17px;margin:10px 0 2px">${esc(s.trip.label)} · ${esc(s.group.place || s.group.name)}</div>
      <div class="mut">${esc(s.group.name)} · ${ride.length} kid${ride.length === 1 ? '' : 's'}${car ? ' · ' + esc(car.label) : ''}</div></a>
      <div class="row sp" style="margin-top:12px"><div class="stack">${ride.map(kidAv).join('')}</div>
      ${st === 'done' ? '' : s.date === L.today() ? `<a class="btn s" href="#/trip/${encodeURIComponent(s.key)}">${st === 'active' ? 'Continue trip' : 'Start trip'}</a>` : !s.a.confirmed ? `<button class="btn s" data-act="confirm" data-key="${esc(s.key)}">Confirm</button>` : ''}</div></div>`;
    return `<a class="card" style="display:block" href="#/slot/${encodeURIComponent(s.key)}">
      <div class="row sp"><span class="tag ${s.trip.label.match(/back|home/i) ? 'am' : 'bl'}">${fmtTime(s.trip.time)} · ${esc(s.trip.label.toUpperCase())}</span>${tag || `<span class="mut">Driver: ${esc(famName(s.a.driverId))}</span>`}</div>
      ${mine.map(k => `<div class="row" style="margin-top:10px">${kidAv(k)}<div class="grow"><b>${esc(k.name)}</b> · ${esc(s.group.name)}${s.a.riders[k.id] === 'absent' ? ' <span class="tag gr">Absent</span>' : s.a.riders[k.id] === 'in' ? ' <span class="tag">In the car</span>' : s.a.riders[k.id] === 'out' ? ' <span class="tag">✓ Dropped off</span>' : ''}
        <div class="mut">${s.a.driverId ? esc(famName(s.a.driverId)) + ' · ' + carText(car) : '⚠️ No driver yet'}</div></div></div>`).join('')}</a>`;
  }

  // ---------- Calendar ----------
  views.calendar = () => {
    const t = L.today(); const list = mySlots(t, L.addDays(t, 20));
    const outs = S.outings.filter(o => o.date >= t);
    let h = `<div class="row sp" style="margin:6px 0 14px"><h1>Calendar</h1><button class="btn o s" data-act="shareMyWeek"><svg class="ic" style="width:16px;height:16px;vertical-align:-3px"><use href="#i-share"/></svg> My week</button></div>`;
    if (!list.length && !outs.length) return h + `<div class="card empty"><div class="big">📅</div>Nothing planned in the next 3 weeks.</div>`;
    const days = {};
    for (const s of list) (days[s.date] = days[s.date] || []).push(`<a class="item" href="#/slot/${encodeURIComponent(s.key)}"><b style="width:66px">${fmtTime(s.trip.time)}</b><div class="grow"><b>${esc(s.group.name)}</b> · ${esc(s.trip.label)}<div class="mut">${s.a.driverId === S.me ? '🚗 You drive' : 'Driver: ' + esc(famName(s.a.driverId))}${s.a.cover && s.a.cover.requested ? ' · needs cover' : ''}</div></div>${s.a.driverId === S.me ? '<span class="tag">You</span>' : avatar(s.a.driverId, true)}</a>`);
    for (const o of outs) (days[o.date] = days[o.date] || []).push(`<a class="item" href="#/outing/${o.id}"><b style="width:66px">${fmtTime(o.goTime)}</b><div class="grow"><b>${o.emoji || '🎈'} ${esc(o.name)}</b><div class="mut">${esc(o.place)}</div></div></a>`);
    for (const d of Object.keys(days).sort()) h += `<div class="sec">${dayLabel(d)}${d === L.today() || d === L.addDays(L.today(), 1) ? ' · ' + fmtDate(d) : ''}</div><div class="card list" style="padding:4px 16px">${days[d].join('')}</div>`;
    return h;
  };

  // ---------- Groups ----------
  views.groups = () => {
    let h = `<div class="row sp" style="margin:6px 0 14px"><h1>Groups</h1><a class="btn s" href="#/group-new">+ New group</a></div>`;
    if (!S.groups.length) return h + `<div class="card empty"><div class="big">🏫</div><h3>No groups yet</h3><p class="mut">A group is one carpool, e.g. "School mornings" or "Swimming Tue & Thu".</p></div>`;
    for (const g of S.groups) {
      const kids = g.kidIds.length;
      h += `<a class="card" style="display:block" href="#/group/${g.id}"><div class="row sp"><div class="grow"><b style="font-size:16px">${esc(g.name)}</b><div class="mut">${esc(GROUP_TYPES[g.type] || '')} · ${g.familyIds.length} families · ${kids} kids</div><div class="mut">${g.trips.map(t => `${esc(t.label)} ${fmtTime(t.time)} (${t.days.map(d => WD[d]).join(' ')})`).join(' · ')}</div></div>
        <div class="stack">${g.familyIds.slice(0, 5).map(id => avatar(id, true)).join('')}</div></div></a>`;
    }
    return h;
  };

  views.group = (id, tab = 'rotation', wk) => {
    const g = L.byId(S.groups, id); if (!g) return views.groups();
    const tabs = [['rotation', 'Rotation'], ['families', 'Families'], ['trips', 'Settings']];
    let h = top(esc(g.name), [GROUP_TYPES[g.type], g.place].filter(Boolean).map(esc).join(' · ')) +
      `<div class="seg">${tabs.map(([k, n]) => `<a href="#/group/${g.id}/${k}" class="${tab === k ? 'on' : ''}">${n}</a>`).join('')}</div>`;
    if (tab === 'rotation') h += groupRotation(g, wk || L.mondayOf(L.today()));
    if (tab === 'families') h += groupFamilies(g);
    if (tab === 'trips') h += groupTrips(g);
    return h;
  };

  function groupRotation(g, mon) {
    const days = [...new Set(g.trips.flatMap(t => t.days))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const dates = days.map(d => L.addDays(mon, (d + 6) % 7));
    let h = `<div class="card"><div class="row sp" style="margin-bottom:12px"><a class="chip" href="#/group/${g.id}/rotation/${L.addDays(mon, -7)}">‹</a><b>Week of ${fmtDate(mon)}</b><a class="chip" href="#/group/${g.id}/rotation/${L.addDays(mon, 7)}">›</a></div>
      <div class="wk" style="grid-template-columns:56px repeat(${days.length},1fr)"><span></span>${dates.map(d => `<span class="h"${d === L.today() ? ' style="color:var(--g)"' : ''}>${WD[L.weekday(d)]}<br>${L.parse(d).getDate()}</span>`).join('')}`;
    for (const t of g.trips) {
      h += `<span class="mut small">${esc(t.label)}<br>${fmtTime(t.time)}</span>`;
      for (const d of dates) {
        if (!t.days.includes(L.weekday(d))) { h += `<span></span>`; continue; }
        if ((g.skipDates || []).includes(d)) { h += `<div class="cell skip">No trip</div>`; continue; }
        const key = L.slotKey(g.id, t.id, d); const a = S.assignments[key];
        if (!a && d < L.today()) { h += `<div class="cell skip">–</div>`; continue; }
        const cls = ['cell', !a || !a.driverId ? 'none' : '', a && a.cover && a.cover.requested ? 'cover' : '', a && a.confirmed ? 'ok' : '', d < L.today() ? 'past' : ''].join(' ');
        h += `<a class="${cls}" href="#/slot/${encodeURIComponent(key)}" style="background:${a && a.driverId ? famColor(a.driverId) : ''}">${a && a.driverId ? esc(initial(famName(a.driverId) === 'You' ? me().adults[0].name : famName(a.driverId))) : '?'}</a>`;
      }
    }
    h += `</div><div class="row wrap" style="gap:12px;margin-top:12px">${g.familyIds.map(fid => `<span class="row mut small" style="gap:5px">${avatar(fid, true)}${esc(famName(fid))}</span>`).join('')}</div>
      <div class="btns"><button class="btn o s" data-act="replan" data-id="${g.id}">↻ Re-plan</button><button class="btn s" data-act="shareWeek" data-id="${g.id}" data-mon="${mon}">Share week</button></div></div>`;
    const fair = L.fairness(S, g); const max = Math.max(1, ...Object.values(fair).map(c => c.driven + c.planned));
    const vals = Object.values(fair).map(c => c.driven + c.planned);
    h += `<div class="sec">Fairness · driven so far + planned</div><div class="card">`;
    for (const fid of g.familyIds) {
      const c = fair[fid]; const tot = c.driven + c.planned;
      h += `<div class="row" style="margin-bottom:10px">${avatar(fid, true)}<span style="width:74px;font-size:14px">${esc(famName(fid))}</span><div class="bar"><i style="width:${(c.driven / max) * 100}%;background:${famColor(fid)}"></i><i style="left:${(c.driven / max) * 100}%;width:${(c.planned / max) * 100}%;background:${famColor(fid)};opacity:.35"></i></div><b style="width:52px;text-align:right">${c.driven}<span class="mut"> +${c.planned}</span></b></div>`;
    }
    const spread = vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
    h += `<div class="mut">${spread <= 2 ? '✓ Balanced: everyone within ' + Math.max(spread, 1) + ' trip' + (spread > 1 ? 's' : '') : `⚠️ ${spread} trips apart. Re-plan to rebalance, or check "can't drive" days and car seats.`}</div></div>`;
    return h;
  }

  function groupFamilies(g) {
    let h = '';
    for (const fid of g.familyIds) {
      const f = fam(fid); if (!f) continue;
      const off = (f.unavailable && f.unavailable[g.id]) || [];
      const days = [...new Set(g.trips.flatMap(t => t.days))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      h += `<div class="card"><div class="row">${avatar(fid)}<div class="grow"><b>${esc(f.name)}</b><div class="mut">${esc(f.adults.map(a => a.name).join(' & '))} · ${(f.cars || []).map(c => esc(c.label) + ' (' + c.seats + ' seats' + (c.boosters ? ', ' + c.boosters + ' booster' : '') + ')').join(', ') || 'No car'}</div></div><a class="chip" href="#/family/${fid}">Edit</a></div>
        <div class="sec" style="margin-top:12px">Kids in this group</div><div class="chips">${f.kids.map(k => `<button class="chip ${g.kidIds.includes(k.id) ? 'on' : ''}" data-act="toggleKid" data-g="${g.id}" data-k="${k.id}">${k.emoji || '🧒'} ${esc(k.name)}</button>`).join('') || '<span class="mut">No kids added</span>'}</div>
        <div class="sec">Can't drive on</div><div class="days">${days.map(d => `<button class="day ${off.includes('*:' + d) ? 'off' : ''}" data-act="toggleOff" data-g="${g.id}" data-f="${fid}" data-d="${d}">${WD[d][0]}</button>`).join('')}</div>
        ${fid !== S.me ? `<button class="btn ghost s" style="margin-top:12px" data-act="removeFam" data-g="${g.id}" data-f="${fid}">Remove from group</button>` : ''}</div>`;
    }
    const others = S.families.filter(f => !g.familyIds.includes(f.id));
    h += `<div class="sec">Add a family</div><div class="card list" style="padding:4px 16px">${others.map(f => `<button class="item" style="width:100%;text-align:left" data-act="addFam" data-g="${g.id}" data-f="${f.id}">${avatar(f.id, true)}<span class="grow"><b>${esc(f.name)}</b> <span class="mut">${f.kids.map(k => esc(k.name)).join(', ')}</span></span><span class="tag">+ Add</span></button>`).join('')}
      <a class="item" href="#/family-new/${g.id}"><span class="av sm" style="background:var(--gl);color:var(--g)">+</span><b class="grow">New family</b></a></div>`;
    return h;
  }

  function groupTrips(g) {
    let h = `<div class="card list" style="padding:4px 16px">${g.trips.map(t => `<button class="item" style="width:100%;text-align:left" data-act="editTrip" data-g="${g.id}" data-t="${t.id}"><b style="width:70px">${fmtTime(t.time)}</b><span class="grow"><b>${esc(t.label)}</b><div class="mut">${t.days.map(d => WD[d]).join(', ')}</div></span><span class="mut">Edit</span></button>`).join('')}
      <button class="item" style="width:100%;text-align:left" data-act="editTrip" data-g="${g.id}" data-t=""><span class="av sm" style="background:var(--gl);color:var(--g)">+</span><b class="grow">Add a trip</b></button></div>`;
    h += `<div class="sec">No-trip days (holidays, exams)</div><div class="card"><div class="chips">${(g.skipDates || []).filter(d => d >= L.addDays(L.today(), -30)).sort().map(d => `<button class="chip" data-act="unskip" data-g="${g.id}" data-d="${d}">${fmtDate(d)} ✕</button>`).join('') || '<span class="mut">None</span>'}</div>
      <form data-form="skip" data-g="${g.id}" class="row" style="margin-top:12px"><input type="date" name="d" required><button class="btn s">Add</button></form></div>`;
    h += `<div class="sec">Group</div><div class="card"><form data-form="groupEdit" data-g="${g.id}">
      <label>Name</label><input name="name" value="${esc(g.name)}" required>
      <label>Place (school or class address)</label><input name="place" value="${esc(g.place || '')}">
      <label>Type</label><select name="type">${Object.entries(GROUP_TYPES).map(([k, v]) => `<option value="${k}" ${g.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <button class="btn" style="margin-top:14px">Save</button></form></div>
      <button class="btn ghost" data-act="deleteGroup" data-g="${g.id}">Delete group</button>`;
    return h;
  }

  views['group-new'] = () => `${top('New carpool group')}
    <form data-form="groupNew">
      <div class="card"><label style="margin-top:0">Group name</label><input name="name" required placeholder="e.g. Greenwood Gr. 3 mornings">
        <label>Type</label><select name="type">${Object.entries(GROUP_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <label>Place</label><input name="place" placeholder="School or class address"></div>
      <div class="sec">Trips</div>
      <div class="card"><div class="row"><input type="checkbox" name="to" checked style="width:auto"><input name="toLabel" value="To school" style="flex:2"><input type="time" name="toTime" value="07:45" style="flex:1.3"></div>
        <div class="row" style="margin-top:10px"><input type="checkbox" name="back" checked style="width:auto"><input name="backLabel" value="Back home" style="flex:2"><input type="time" name="backTime" value="15:15" style="flex:1.3"></div>
        <label>Days</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label style="margin:0"><input type="checkbox" name="day" value="${d}" ${d >= 1 && d <= 5 ? 'checked' : ''} hidden><span class="day ${d >= 1 && d <= 5 ? 'on' : ''}" data-act="dayBox">${WD[d][0]}</span></label>`).join('')}</div></div>
      <div class="sec">Families</div>
      <div class="card list" style="padding:4px 16px">${S.families.map(f => `<label class="item" style="margin:0;color:var(--ink);font-size:15px;font-weight:400"><input type="checkbox" name="fam" value="${f.id}" ${f.id === S.me ? 'checked disabled' : ''} style="width:auto">${avatar(f.id, true)}<span class="grow"><b>${esc(f.id === S.me ? 'Your family' : f.name)}</b> <span class="mut">${f.kids.map(k => esc(k.name)).join(', ')}</span></span></label>`).join('')}</div>
      <p class="mut" style="margin:-4px 0 12px">You can add more families later.</p>
      <button class="btn">Create group & plan turns</button>
    </form>`;

  // ---------- Slot (one trip) ----------
  views.slot = key => {
    const s = slotInfo(key); if (!s) return views.today();
    const kids = L.tripKids(S, s.group, s.trip);
    const df = fam(s.a.driverId); const car = df && L.carThatFits(df, kids.filter(k => s.a.riders[k.id] !== 'absent'));
    const cover = s.a.cover && s.a.cover.requested;
    let h = top(`${esc(s.trip.label)} · ${fmtTime(s.trip.time)}`, `${dayLabel(s.date)} · ${esc(s.group.name)}`);
    h += `<div class="card"><div class="row">${s.a.driverId ? avatar(s.a.driverId) : '<span class="av" style="background:var(--warn)">!</span>'}<div class="grow"><b>${s.a.driverId ? (s.a.driverId === S.me ? 'You drive' : esc(famName(s.a.driverId)) + ' drives') : 'No driver yet'}</b><div class="mut">${carText(car)}</div></div>
      ${df && df.id !== S.me && df.adults[0].phone ? `<a class="chip" href="tel:${esc(df.adults[0].phone.replace(/\s/g, ''))}">📞 Call</a>` : ''}</div>
      ${cover ? `<div class="note" style="background:var(--aml);color:var(--am)">🙋 ${esc(famName(s.a.cover.from))} asked for cover${s.a.cover.reason ? ': “' + esc(s.a.cover.reason) + '”' : ''}</div>` : ''}
      ${s.a.status === 'done' ? `<div class="note">✓ Trip done</div>` : ''}</div>`;
    h += `<div class="sec">Kids</div><div class="card list" style="padding:4px 16px">${kids.map(k => `<div class="item">${kidAv(k)}<div class="grow"><b>${esc(k.name)}</b> ${k.seat === 'booster' ? '<span class="tag am">Booster</span>' : k.seat === 'car' ? '<span class="tag am">Car seat</span>' : ''} ${k.medical ? '<span class="tag rd">Medical</span>' : ''}<div class="mut">${esc(famName(k.familyId))}${s.a.riders[k.id] === 'absent' ? ' · absent' : ''}</div></div>
      ${(k.familyId === S.me || s.a.driverId === S.me) && s.a.status !== 'done' ? `<button class="chip ${s.a.riders[k.id] === 'absent' ? 'on' : ''}" data-act="absent" data-key="${esc(key)}" data-k="${k.id}">${s.a.riders[k.id] === 'absent' ? 'Absent' : 'Mark absent'}</button>` : ''}</div>`).join('')}</div>`;
    if (s.a.status === 'done') return h;
    if (s.a.driverId === S.me) {
      if (s.date === L.today()) h += `<a class="btn" href="#/trip/${encodeURIComponent(key)}">${s.a.status === 'active' ? 'Continue trip' : 'Start trip'}</a>`;
      else if (!s.a.confirmed) h += `<button class="btn" data-act="confirm" data-key="${esc(key)}">Confirm I'm driving</button>`;
      h += `<div class="btns">${cover ? `<button class="btn o" data-act="cancelCover" data-key="${esc(key)}">I can drive after all</button>` : `<button class="btn o" data-act="needCover" data-key="${esc(key)}">I can't drive</button>`}<button class="btn o" data-act="swapPick" data-key="${esc(key)}">Swap a day</button></div>`;
    } else {
      const can = s.a.driverId !== S.me && L.canDrive(S, s.group, s.trip, S.me, s.date);
      if (cover) h += `<button class="btn" data-act="takeCover" data-key="${esc(key)}" ${can.ok ? '' : 'disabled'}>I'll cover it</button>${can.ok ? '' : `<p class="mut" style="margin-top:6px">${esc(can.why)}</p>`}
        <button class="btn o" style="margin-top:10px" data-act="swapPick" data-key="${esc(key)}">Swap: they take one of my days</button>`;
    }
    h += `<div class="sec">Organiser</div><div class="card"><label style="margin-top:0">Change driver</label><select data-act-change="setDriver" data-key="${esc(key)}"><option value="">Nobody</option>${s.group.familyIds.map(fid => { const c = L.canDrive(S, s.group, s.trip, fid, s.date); return `<option value="${fid}" ${s.a.driverId === fid ? 'selected' : ''}>${esc(famName(fid))}${c.ok ? '' : ' (' + esc(c.why) + ')'}</option>`; }).join('')}</select>
      <button class="btn o s" style="margin-top:12px" data-act="skipSlot" data-key="${esc(key)}">No trip this day</button></div>`;
    return h;
  };

  // ---------- Trip in progress (check-ins) ----------
  views.trip = key => {
    const s = slotInfo(key); if (!s) return views.today();
    const kids = L.tripKids(S, s.group, s.trip);
    const going = kids.filter(k => s.a.riders[k.id] !== 'absent');
    const inCar = going.filter(k => s.a.riders[k.id] === 'in').length;
    const out = going.filter(k => s.a.riders[k.id] === 'out').length;
    const homeward = /back|home/i.test(s.trip.label);
    let h = top(esc(s.trip.label), `${esc(s.group.name)} · ${fmtTime(s.trip.time)}`,
      `<a class="chip" href="#" data-act="navigate" data-place="${esc(homeward ? '' : s.group.place || '')}"><svg class="ic" style="width:14px;height:14px;vertical-align:-2px"><use href="#i-nav"/></svg> Maps</a>`);
    h += `<div class="card soft row"><span style="font-size:24px">${out === going.length && going.length ? '🏁' : '🚗'}</span><div class="grow"><b>${out === going.length && going.length ? 'Everyone dropped off' : s.a.status === 'active' ? 'Trip in progress' : 'Ready to go'}</b><div class="mut">${inCar} in the car · ${out} dropped off · ${going.length} kids</div></div></div>`;
    h += `<div class="sec">Check in each child</div><div class="card list" style="padding:4px 16px">`;
    for (const k of kids) {
      const st = s.a.riders[k.id]; const tm = (s.a.times || {})[k.id] || {};
      h += `<div class="item" style="${st === 'absent' ? 'opacity:.45' : ''}">${kidAv(k)}<div class="grow"><b>${esc(k.name)}</b> ${k.seat === 'booster' ? '<span class="tag am">Booster</span>' : k.seat === 'car' ? '<span class="tag am">Car seat</span>' : ''} ${k.medical ? `<button class="tag rd" data-act="kidInfo" data-k="${k.id}">${esc(k.medical.split(/[.,]/)[0].slice(0, 22))}</button>` : `<button class="tag gr" data-act="kidInfo" data-k="${k.id}">Info</button>`}
        <div class="mut">${st === 'absent' ? 'Absent today' : st === 'in' ? `Picked up ${fmtTime(tm.in)}` : st === 'out' ? `Dropped off ${fmtTime(tm.out)}` : 'Waiting · ' + esc(famName(k.familyId))}</div></div>
        ${st === 'absent' ? '' : `<button class="check ${st === 'in' || st === 'out' ? 'y' : ''}" data-act="checkKid" data-key="${esc(key)}" data-k="${k.id}" aria-label="Check in ${esc(k.name)}">${st === 'out' ? '🏁' : '✓'}</button>`}</div>`;
    }
    h += `</div><p class="mut" style="margin:-4px 0 12px">Tap ✓ when a child gets in, tap again when you drop them off.</p>`;
    h += inCar ? `<button class="btn" data-act="dropAll" data-key="${esc(key)}">Arrived · drop off everyone in the car</button>` : '';
    h += `<div class="btns"><button class="btn o" data-act="shareStatus" data-key="${esc(key)}">Send update</button><button class="btn o" data-act="late" data-key="${esc(key)}">⏱ Running late</button></div>
      <div class="btns"><button class="btn red" data-act="emergency" data-key="${esc(key)}">Emergency</button>${out === going.length && going.length ? `<button class="btn" data-act="finish" data-key="${esc(key)}">Finish trip</button>` : ''}</div>`;
    return h;
  };

  // ---------- Family (mine or another household) ----------
  views.family = (id, setup) => {
    const f = fam(id); if (!f) return views.today();
    const mine = id === S.me;
    let h = mine && setup ? `<div style="margin:10px 0 14px"><h1>Your family</h1><p class="mut">Add your kids and car so the app can plan turns.</p></div>` : top(mine ? 'Your family' : esc(f.name), mine ? '' : (f.friend ? 'Friend' : 'Family in your groups'));
    h += `<div class="card"><form data-form="famEdit" data-f="${f.id}"><label style="margin-top:0">Family name</label><input name="name" value="${esc(f.name)}">
      ${f.adults.map((a, i) => `<div class="row"><div class="grow"><label>Adult ${i + 1}</label><input name="an${i}" value="${esc(a.name)}" ${i === 0 ? 'required' : ''}></div><div class="grow"><label>Phone</label><input name="ap${i}" type="tel" value="${esc(a.phone || '')}"></div></div>`).join('')}
      <div class="row"><div class="grow"><label>Adult ${f.adults.length + 1} (optional)</label><input name="an${f.adults.length}" placeholder="Co-parent or approved driver"></div><div class="grow"><label>Phone</label><input name="ap${f.adults.length}" type="tel"></div></div>
      ${!mine ? `<label class="row" style="color:var(--ink);font-weight:400;font-size:14px;margin-top:12px"><input type="checkbox" name="friend" ${f.friend ? 'checked' : ''} style="width:auto">Friend (show in Friends)</label>` : ''}
      <button class="btn o s" style="margin-top:12px">Save</button></form></div>`;
    h += `<div class="sec">Kids</div><div class="card list" style="padding:4px 16px">${f.kids.map(k => `<button class="item" style="width:100%;text-align:left" data-act="editKid" data-f="${f.id}" data-k="${k.id}">${kidAv(k)}<span class="grow"><b>${esc(k.name)}</b> ${k.seat !== 'none' ? `<span class="tag am">${k.seat === 'booster' ? 'Booster' : 'Car seat'}</span>` : ''}<div class="mut">${esc(k.grade || '')}${k.medical ? ' · has medical notes' : ''}</div></span><span class="mut">Edit</span></button>`).join('')}
      <button class="item" style="width:100%;text-align:left" data-act="editKid" data-f="${f.id}" data-k=""><span class="av sm" style="background:var(--gl);color:var(--g)">+</span><b class="grow">Add a child</b></button></div>`;
    h += `<div class="sec">Cars</div><div class="card list" style="padding:4px 16px">${(f.cars || []).map(c => `<button class="item" style="width:100%;text-align:left" data-act="editCar" data-f="${f.id}" data-c="${c.id}"><span style="font-size:22px">🚗</span><span class="grow"><b>${esc(c.label)}</b><div class="mut">${c.seats} seats for kids${c.boosters ? ' · ' + c.boosters + ' booster' : ''}${c.carSeats ? ' · ' + c.carSeats + ' car seat' : ''}${c.plate ? ' · ' + esc(c.plate) : ''}</div></span><span class="mut">Edit</span></button>`).join('')}
      <button class="item" style="width:100%;text-align:left" data-act="editCar" data-f="${f.id}" data-c=""><span class="av sm" style="background:var(--gl);color:var(--g)">+</span><b class="grow">Add a car</b></button></div>`;
    if (setup) return h + `<a class="btn" href="#/today" data-act="finishSetup">Done</a>`;
    if (mine) {
      h += `<div class="sec">Settings</div><div class="card">
        <label class="row sp" style="color:var(--ink);font-size:15px;font-weight:600;margin:0"><span>Driving reminders<div class="mut" style="font-weight:400">Evening before and 30 min before your turn</div></span><input type="checkbox" data-act-change="reminders" ${S.settings.reminders ? 'checked' : ''} style="width:22px;height:22px"></label>
        <label>Currency symbol</label><input data-act-change="currency" value="${esc(S.settings.currency)}" maxlength="3" style="width:90px">
        <div class="btns"><button class="btn o s" data-act="backup">Back up data</button><button class="btn o s" data-act="restore">Restore</button></div>
        <button class="btn ghost s" style="margin-top:12px;width:100%" data-act="reset">${S.settings.demo ? 'Clear sample data & start fresh' : 'Erase all data'}</button></div>
        <p class="note">Your data stays on this phone. Use “Back up data” to keep a copy or move to a new phone.</p>`;
    } else {
      h += `<button class="btn ghost" data-act="deleteFam" data-f="${f.id}">Delete this family</button>`;
    }
    return h;
  };
  views['family-new'] = groupId => `${top('New family')}<div class="card"><form data-form="famNew" data-g="${esc(groupId || '')}" data-friend="${groupId === 'friend' ? 1 : ''}">
    <label style="margin-top:0">Parent or friend's name</label><input name="adult" required><label>Phone</label><input name="phone" type="tel"><label>Family name</label><input name="name" placeholder="e.g. Kumar family">
    <button class="btn" style="margin-top:14px">Next: kids & car</button></form></div>`;

  // ---------- Friends: people, rides, money ----------
  views.friends = (tab = 'rides') => {
    const tabs = [['rides', 'Rides'], ['people', 'People'], ['money', 'Money']];
    let h = `<h1 style="margin:6px 0 10px">Friends</h1><div class="seg">${tabs.map(([k, n]) => `<a href="#/friends/${k}" class="${tab === k ? 'on' : ''}">${n}</a>`).join('')}</div>`;
    if (tab === 'people') {
      h += `<div class="card list" style="padding:4px 16px">${S.families.filter(f => f.id !== S.me).map(f => `<a class="item" href="#/family/${f.id}">${avatar(f.id)}<div class="grow"><b>${esc(f.adults[0]?.name || f.name)}</b> ${f.friend ? '<span class="tag bl">friend</span>' : ''}<div class="mut">${esc(f.name)}${f.kids.length ? ' · ' + f.kids.map(k => esc(k.name)).join(', ') : ''}</div></div>${f.adults[0]?.phone ? `<span class="chip">›</span>` : ''}</a>`).join('') || '<div class="empty">No one yet</div>'}</div>
        <a class="btn" href="#/family-new/friend">+ Add a friend or family</a>`;
    }
    if (tab === 'rides') {
      const rides = S.rides.filter(r => !r.date || r.date >= L.today());
      h += `<div class="btns" style="margin:0 0 12px"><a class="btn s" href="#/ride-new/offer">Offer a ride</a><a class="btn o s" href="#/ride-new/need">Need a ride</a></div>`;
      if (!rides.length) h += `<div class="card empty"><div class="big">🚙</div>Share rides with friends: office commute, a wedding, the airport.</div>`;
      for (const r of rides) {
        const mineR = r.ownerId === S.me; const joined = r.riders.includes(S.me);
        const when = r.days.length ? `${r.days.map(d => WD[d]).join(' ')} · ${fmtTime(r.time)}` : `${dayLabel(r.date)} · ${fmtTime(r.time)}`;
        h += `<div class="card"><div class="row sp"><span class="tag ${r.kind === 'offer' ? 'bl' : ''}">${r.kind === 'offer' ? 'OFFERED BY ' : 'NEEDS A RIDE · '}${esc(famName(r.ownerId).toUpperCase())}${r.note ? ' · ' + esc(r.note) : ''}</span><span class="mut">${r.kind === 'offer' ? (r.seats - r.riders.length) + ' of ' + r.seats + ' seats' : r.seats + ' seat'}</span></div>
          <div style="font-weight:700;margin:10px 0 2px">${esc(r.from)} → ${esc(r.to)}</div><div class="mut">${when}${r.price ? ' · ' + money(r.price) + ' per ride' : ''}</div>
          ${r.riders.length ? `<div class="row" style="margin-top:8px"><div class="stack">${r.riders.map(id => avatar(id, true)).join('')}</div><span class="mut">${r.riders.map(famName).map(esc).join(', ')}</span></div>` : ''}
          <div class="btns">${mineR ? `<button class="btn o s" data-act="shareRide" data-id="${r.id}">Share</button>${r.kind === 'offer' && r.price && r.riders.length ? `<button class="btn s" data-act="logRide" data-id="${r.id}">Log a trip</button>` : ''}<button class="btn ghost s" data-act="deleteRide" data-id="${r.id}">Delete</button>`
            : r.kind === 'offer' ? `<button class="btn s ${joined ? 'o' : ''}" data-act="joinRide" data-id="${r.id}">${joined ? 'Leave ride' : 'Join ride'}</button>${r.price && joined ? `<button class="btn o s" data-act="logRide" data-id="${r.id}">Log a trip</button>` : ''}` : `<button class="btn o s" data-act="driveRide" data-id="${r.id}">${joined ? 'You drive ✓' : 'I can drive'}</button>`}</div></div>`;
      }
    }
    if (tab === 'money') {
      const bal = L.balances(S.ledger).filter(b => b.from === S.me || b.to === S.me);
      const owed = bal.filter(b => b.to === S.me).reduce((a, b) => a + b.amount, 0), owe = bal.filter(b => b.from === S.me).reduce((a, b) => a + b.amount, 0);
      h += `<div class="card" style="background:var(--g);color:#fff"><div style="font-size:13px;opacity:.85">Net balance with friends</div><div style="font-size:32px;font-weight:700;margin:4px 0">${owed - owe >= 0 ? '+ ' : '− '}${money(Math.abs(owed - owe))}</div><div style="font-size:13px;opacity:.85">You're owed ${money(owed)} · You owe ${money(owe)}</div></div>`;
      h += `<div class="card list" style="padding:4px 16px">${bal.map(b => { const other = b.from === S.me ? b.to : b.from; return `<div class="item">${avatar(other, true)}<div class="grow"><b>${b.from === S.me ? 'You owe ' + esc(famName(b.to)) : esc(famName(b.from)) + ' owes you'}</b><div class="mut">${S.ledger.filter(e => !e.settled && ((e.from === b.from && e.to === b.to) || (e.from === b.to && e.to === b.from))).length} unsettled</div></div><b style="color:${b.to === S.me ? 'var(--g)' : 'var(--ink)'}">${money(b.amount)}</b><button class="chip" data-act="settle" data-a="${b.from}" data-b="${b.to}">Settle</button></div>`; }).join('') || '<div class="empty">All settled 🎉</div>'}</div>
        <button class="btn o" data-act="addExpense">+ Add a shared cost</button>`;
    }
    return h;
  };
  views['ride-new'] = kind => `${top(kind === 'need' ? 'Ask friends for a ride' : 'Offer a ride to friends')}
    <form data-form="rideNew" data-kind="${kind === 'need' ? 'need' : 'offer'}"><div class="card">
      <label style="margin-top:0">From</label><input name="from" required placeholder="e.g. Oakwood Society"><label>To</label><input name="to" required placeholder="e.g. Tech Park">
      <div class="row"><div class="grow"><label>Date (one-off)</label><input type="date" name="date"></div><div class="grow"><label>Time</label><input type="time" name="time" value="09:00" required></div></div>
      <label>Or repeat on</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label style="margin:0"><input type="checkbox" name="day" value="${d}" hidden><span class="day" data-act="dayBox">${WD[d][0]}</span></label>`).join('')}</div>
      <div class="row"><div class="grow"><label>Seats</label><input type="number" name="seats" min="1" max="8" value="${kind === 'need' ? 1 : 2}"></div>${kind === 'need' ? '' : `<div class="grow"><label>Cost share per ride (${esc(S.settings.currency)})</label><input type="number" name="price" min="0" step="any" value="0"></div>`}</div>
      <label>Who is it for? (circle, optional)</label><input name="note" placeholder="e.g. Neighbours, Office, College friends"></div>
      <button class="btn">${kind === 'need' ? 'Post request' : 'Post ride'}</button></form>`;

  // ---------- Outings ----------
  views['outing-new'] = () => outingForm({ id: '', name: '', emoji: '🎈', place: '', date: L.addDays(L.today(), 2), goTime: '16:00', backTime: '19:00', kidIds: (me()?.kids || []).map(k => k.id), drivers: { go: [S.me], back: [] }, rsvp: {} });
  function outingForm(o) {
    const fams = S.families.filter(f => f.kids.length);
    return `${top(o.id ? 'Edit outing' : 'New outing', 'Birthday party, playdate, movie…')}<form data-form="outing" data-id="${o.id}"><div class="card">
      <div class="row"><div style="width:70px"><label style="margin-top:0">Icon</label><select name="emoji">${['🎈', '🎂', '🎬', '🏖️', '⚽', '🎡', '🏊', '🎨', '🏕️'].map(e => `<option ${o.emoji === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div><div class="grow"><label style="margin-top:0">Name</label><input name="name" required value="${esc(o.name)}" placeholder="e.g. Riya's birthday party"></div></div>
      <label>Place</label><input name="place" value="${esc(o.place)}" placeholder="Address">
      <label>Date</label><input type="date" name="date" value="${o.date}" required><div class="row"><div class="grow"><label>Leave at</label><input type="time" name="goTime" value="${o.goTime}"></div><div class="grow"><label>Return at</label><input type="time" name="backTime" value="${o.backTime}"></div></div></div>
      <div class="sec">Kids going</div><div class="card">${fams.map(f => `<div class="row wrap" style="margin-bottom:8px">${avatar(f.id, true)}${f.kids.map(k => `<label class="chip" style="margin:0;color:var(--ink);font-weight:500"><input type="checkbox" name="kid" value="${k.id}" ${o.kidIds.includes(k.id) ? 'checked' : ''} style="width:auto;margin-right:4px">${k.emoji} ${esc(k.name)}</label>`).join('')}</div>`).join('')}</div>
      <div class="sec">Who drives</div><div class="card"><div class="row sp mut small" style="font-weight:700"><span>Family</span><span>There · Back</span></div>${S.families.filter(f => (f.cars || []).length).map(f => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">${avatar(f.id, true)}<span class="grow">${esc(famName(f.id))} <span class="mut">${f.cars[0].seats} seats</span></span><input type="checkbox" name="go" value="${f.id}" ${o.drivers.go.includes(f.id) ? 'checked' : ''} style="width:22px;height:22px"><input type="checkbox" name="back" value="${f.id}" ${o.drivers.back.includes(f.id) ? 'checked' : ''} style="width:22px;height:22px;margin-left:18px"></div>`).join('')}</div>
      <button class="btn">${o.id ? 'Save & re-plan seats' : 'Create & plan seats'}</button></form>`;
  }
  function outingCars(o, dir) {
    return o.drivers[dir].map(fid => { const f = fam(fid); const c = f && (f.cars || [])[0]; return c ? { key: fid, familyId: fid, seats: c.seats, boosters: c.boosters || 0, carSeats: c.carSeats || 0, label: c.label } : null; }).filter(Boolean);
  }
  function planOuting(o) {
    const kids = o.kidIds.map(kidById).filter(Boolean).filter(k => o.rsvp[k.familyId] !== 'no');
    o.plan = { go: L.seatPlan(outingCars(o, 'go'), kids), back: L.seatPlan(outingCars(o, 'back'), kids) };
  }
  views.outing = (id, edit, dir = 'go') => {
    const o = L.byId(S.outings, id); if (!o) return views.today();
    if (edit === 'edit') return outingForm(o);
    if (!o.plan) planOuting(o);
    const fams = [...new Set(o.kidIds.map(kidById).filter(Boolean).map(k => k.familyId))];
    let h = top(`${o.emoji || '🎈'} ${esc(o.name)}`, `${fmtDate(o.date)} · ${fmtTime(o.goTime)}–${fmtTime(o.backTime)} · ${esc(o.place)}`, `<a class="chip" href="#/outing/${o.id}/edit">Edit</a>`);
    const yes = fams.filter(f => o.rsvp[f] === 'yes').length;
    h += `<div class="seg"><a href="#/outing/${o.id}/view/rsvp" class="${dir === 'rsvp' ? 'on' : ''}">RSVPs ${yes}/${fams.length}</a><a href="#/outing/${o.id}/view/go" class="${dir === 'go' ? 'on' : ''}">Seats · there</a><a href="#/outing/${o.id}/view/back" class="${dir === 'back' ? 'on' : ''}">Seats · back</a></div>`;
    if (dir === 'rsvp') {
      h += `<div class="card list" style="padding:4px 16px">${fams.map(fid => { const r = o.rsvp[fid] || 'pending'; return `<div class="item">${avatar(fid, true)}<div class="grow"><b>${esc(famName(fid))}</b><div class="mut">${o.kidIds.map(kidById).filter(k => k && k.familyId === fid).map(k => esc(k.name)).join(', ')}</div></div><div class="chips">${['yes', 'pending', 'no'].map(v => `<button class="chip ${r === v ? 'on' : ''}" data-act="rsvp" data-o="${o.id}" data-f="${fid}" data-v="${v}">${v === 'yes' ? 'Going' : v === 'no' ? 'No' : '?'}</button>`).join('')}</div></div>`; }).join('')}</div>`;
      return h + `<button class="btn o" data-act="shareOuting" data-o="${o.id}">Share invite & plan</button>`;
    }
    const p = o.plan[dir];
    h += `<div class="card soft row" style="padding:12px"><span>✨</span><span style="font-size:14px" class="grow"><b>Seat plan</b> · ${Object.values(p.plan).flat().length} kids in ${Object.keys(p.plan).length} car${Object.keys(p.plan).length === 1 ? '' : 's'}${p.unseated.length ? ` · <b style="color:var(--warn)">${p.unseated.length} without a seat</b>` : ''}</span><button class="chip" data-act="replanOuting" data-o="${o.id}">↻</button></div>`;
    for (const c of outingCars(o, dir)) {
      const ids = p.plan[c.key] || [];
      h += `<div class="card"><div class="row sp" style="margin-bottom:10px"><div class="row">${avatar(c.familyId, true)}<div><b>${esc(famName(c.familyId))}</b> ${fam(c.familyId).friend ? '<span class="tag bl">friend</span>' : ''}<div class="mut">${esc(c.label)} · leaves ${fmtTime(dir === 'go' ? o.goTime : o.backTime)}</div></div></div><span class="tag ${ids.length >= c.seats ? '' : 'am'}">${ids.length}/${c.seats} seats</span></div>
        <div class="row wrap" style="gap:8px">${ids.map(id => { const k = kidById(id); return `<button class="seat f" data-act="moveKid" data-o="${o.id}" data-dir="${dir}" data-k="${id}" title="${esc(k?.name)}">${k?.emoji || '🧒'}</button>`; }).join('')}${Array.from({ length: Math.max(0, c.seats - ids.length) }, () => '<span class="seat"></span>').join('')}</div>
        <div class="mut" style="margin-top:6px">${ids.map(id => esc(kidById(id)?.name)).join(' · ') || 'Empty'}</div></div>`;
    }
    if (p.unseated.length) h += `<div class="card" style="border:2px solid var(--warn)"><b>No seat yet</b><div class="row wrap" style="gap:8px;margin-top:8px">${p.unseated.map(id => `<button class="seat" data-act="moveKid" data-o="${o.id}" data-dir="${dir}" data-k="${id}">${kidById(id)?.emoji || '🧒'}</button>`).join('')}</div><p class="mut" style="margin-top:6px">Add another driver in Edit, or tap a child to move them.</p></div>`;
    if (!outingCars(o, dir).length) h += `<div class="card empty">No drivers picked for this way yet. Tap Edit.</div>`;
    return h + `<p class="mut" style="margin-bottom:12px">Tap a child to move them to another car.</p><div class="btns"><button class="btn o" data-act="shareOuting" data-o="${o.id}">Share plan</button><button class="btn ghost" data-act="deleteOuting" data-o="${o.id}">Delete</button></div>`;
  };

  // ---------- actions ----------
  const A = {};
  A.back = (d, el, e) => { e.preventDefault(); history.back(); };
  A.demo = () => { S = demo(); save(); go('#/today'); render(); toast('Sample families loaded'); };
  A.closeSheet = () => closeSheet();
  A.newMenu = (d, el, e) => {
    e.preventDefault();
    openSheet(`<h2 style="margin-bottom:6px">Create</h2><div class="menu">
      <a href="#/group-new"><span class="em">🏫</span><span class="grow">Carpool group<div class="mut">School or class with fair driving turns</div></span></a>
      <a href="#/outing-new"><span class="em">🎂</span><span class="grow">Kids' outing<div class="mut">Party, playdate, movie: one-off seats</div></span></a>
      <a href="#/ride-new/offer"><span class="em">🚙</span><span class="grow">Ride with friends<div class="mut">Offer seats to friends</div></span></a>
      <a href="#/family-new/friend"><span class="em">👋</span><span class="grow">Friend or family<div class="mut">Add people you carpool with</div></span></a></div>`);
  };
  A.confirm = d => { const s = slotInfo(d.key); s.a.confirmed = true; save(); render(); toast("Confirmed. Others will see you're driving."); };
  A.needCover = d => openSheet(`<h2>Ask for cover</h2><form data-form="cover" data-key="${esc(d.key)}"><label>Reason (optional)</label><input name="reason" placeholder="e.g. Work meeting"><button class="btn" style="margin-top:14px">Ask the group</button></form><p class="note">You'll get a message to send to the group chat.</p>`);
  A.cancelCover = d => { const s = slotInfo(d.key); s.a.cover.requested = false; s.a.confirmed = true; save(); render(); };
  A.takeCover = d => {
    const s = slotInfo(d.key); const from = s.a.cover && s.a.cover.from;
    L.takeCover(S, d.key, S.me); save(); render();
    share(`✅ I'll cover ${s.group.name} · ${s.trip.label} on ${fmtDate(s.date)} at ${fmtTime(s.trip.time)}${from ? ' for ' + famName(from) : ''}.`);
  };
  A.swapPick = d => {
    const s = slotInfo(d.key); const iDrive = s.a.driverId === S.me;
    const other = iDrive ? null : S.me; // when covering via swap, I give one of my days to the requester
    const cands = L.tripSlots(s.group, L.today(), L.addDays(L.today(), 28)).map(x => slotInfo(x.key))
      .filter(x => x.key !== d.key && x.a.status !== 'done' && x.a.driverId && (iDrive ? x.a.driverId !== S.me : x.a.driverId === other));
    openSheet(`<h2>Swap with…</h2><p class="mut" style="margin-bottom:8px">${iDrive ? 'Pick a trip someone else drives. You take theirs, they take yours.' : 'Pick one of your trips for them to take.'}</p><div class="menu">${cands.map(x => `<button data-act="doSwap" data-a="${esc(d.key)}" data-b="${esc(x.key)}">${avatar(x.a.driverId, true)}<span class="grow">${dayLabel(x.date)} · ${fmtTime(x.trip.time)}<div class="mut">${esc(x.trip.label)} · ${esc(famName(x.a.driverId))}</div></span></button>`).join('') || '<div class="empty">No trips to swap with</div>'}</div>`);
  };
  A.doSwap = d => {
    const a = slotInfo(d.a), b = slotInfo(d.b);
    L.swap(S, d.a, d.b); save(); closeSheet(); render();
    share(`🔁 Carpool swap (${a.group.name}): ${famName(a.a.driverId)} now drives ${fmtDate(a.date)} ${fmtTime(a.trip.time)}, ${famName(b.a.driverId)} drives ${fmtDate(b.date)} ${fmtTime(b.trip.time)}.`);
  };
  A.absent = d => {
    const s = slotInfo(d.key); const k = kidById(d.k);
    const now = s.a.riders[d.k] === 'absent'; if (now) delete s.a.riders[d.k]; else s.a.riders[d.k] = 'absent';
    save(); render();
    if (!now && s.a.driverId !== S.me) share(`🤒 ${k.name} won't need the ${s.trip.label.toLowerCase()} ride on ${fmtDate(s.date)} (${s.group.name}). Thanks ${famName(s.a.driverId)}!`);
  };
  A.setDriverChange = (d, el) => { const s = slotInfo(d.key); s.a.driverId = el.value || null; s.a.locked = true; s.a.confirmed = false; if (s.a.cover) s.a.cover.requested = false; save(); render(); toast('Driver changed'); };
  A.skipSlot = d => { const s = slotInfo(d.key); s.group.skipDates = [...new Set([...(s.group.skipDates || []), s.date])]; L.generateRotation(S, s.group); save(); history.back(); toast('Marked as no trip; turns re-planned'); };
  A.checkKid = d => {
    const s = slotInfo(d.key); s.a.times = s.a.times || {}; const t = s.a.times[d.k] = s.a.times[d.k] || {};
    const st = s.a.riders[d.k];
    if (!st || st === 'scheduled') { s.a.riders[d.k] = 'in'; t.in = nowHM(); }
    else if (st === 'in') { s.a.riders[d.k] = 'out'; t.out = nowHM(); }
    else { s.a.riders[d.k] = 'in'; delete t.out; }
    s.a.status = 'active'; save(); render();
  };
  A.dropAll = d => { const s = slotInfo(d.key); s.a.times = s.a.times || {}; for (const [k, v] of Object.entries(s.a.riders)) if (v === 'in') { s.a.riders[k] = 'out'; (s.a.times[k] = s.a.times[k] || {}).out = nowHM(); } save(); render(); A.shareStatus(d); };
  A.finish = d => { const s = slotInfo(d.key); s.a.status = 'done'; s.a.confirmed = true; save(); go('#/today'); toast('Trip done. Thank you!'); };
  A.shareStatus = d => {
    const s = slotInfo(d.key); const kids = L.tripKids(S, s.group, s.trip); const df = fam(s.a.driverId); const car = df && L.carThatFits(df, kids);
    const lines = kids.map(k => { const st = s.a.riders[k.id]; const t = (s.a.times || {})[k.id] || {}; return st === 'out' ? `✅ ${k.name} dropped off at ${fmtTime(t.out)}` : st === 'in' ? `🚗 ${k.name} picked up at ${fmtTime(t.in)}` : st === 'absent' ? `➖ ${k.name} absent` : `⏳ ${k.name} not picked up yet`; });
    share(`${s.group.name} · ${s.trip.label} (${fmtTime(s.trip.time)})\nDriver: ${df ? df.adults[0].name : '?'}${car ? ' · ' + car.label : ''}\n${lines.join('\n')}`);
  };
  A.late = d => openSheet(`<h2>Running late</h2><p class="mut">How late?</p><div class="chips" style="margin-top:10px">${[5, 10, 15, 20, 30].map(m => `<button class="chip" data-act="lateSend" data-key="${esc(d.key)}" data-m="${m}">${m} min</button>`).join('')}</div>`);
  A.lateSend = d => { const s = slotInfo(d.key); closeSheet(); share(`⏱ Running about ${d.m} min late for ${s.group.name} · ${s.trip.label}. Sorry! — ${me().adults[0].name}`); };
  A.emergency = d => {
    const s = slotInfo(d.key); const kids = L.tripKids(S, s.group, s.trip);
    const parents = [...new Set(kids.map(k => k.familyId))].filter(f => f !== S.me).map(fam).filter(Boolean);
    openSheet(`<h2 style="color:var(--warn)">Emergency</h2><div class="menu">
      <a href="tel:112"><span class="em">🚑</span><span class="grow">Call emergency services<div class="mut">112</div></span></a>
      ${parents.map(f => f.adults[0].phone ? `<a href="tel:${esc(f.adults[0].phone.replace(/\s/g, ''))}"><span class="em">📞</span><span class="grow">Call ${esc(f.adults[0].name)}<div class="mut">${esc(f.adults[0].phone)}</div></span></a>` : '').join('')}
      <button data-act="emergencyShare" data-key="${esc(d.key)}"><span class="em">📣</span><span class="grow">Alert all parents<div class="mut">Send a message to the group chat</div></span></button></div>`);
  };
  A.emergencyShare = d => { const s = slotInfo(d.key); share(`🚨 URGENT from ${me().adults[0].name} (${s.group.name} · ${s.trip.label}). Please call me now${me().adults[0].phone ? ': ' + me().adults[0].phone : ''}.`); };
  A.navigate = (d, el, e) => { e.preventDefault(); openUrl(d.place ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.place)}` : 'https://www.google.com/maps'); };
  A.kidInfo = d => {
    const k = kidById(d.k);
    openSheet(`<div class="row">${kidAv(k)}<h2>${esc(k.name)}</h2></div>
      <div class="sec">Medical & care notes</div><div class="card">${k.medical ? esc(k.medical) : '<span class="mut">None</span>'}</div>
      <div class="sec">Emergency contacts</div><div class="card list" style="padding:4px 16px">${(k.contacts || []).concat(fam(k.familyId).adults.map(a => ({ name: a.name + ' (parent)', phone: a.phone }))).filter(c => c.phone).map(c => `<a class="item" href="tel:${esc(c.phone.replace(/\s/g, ''))}"><span class="grow"><b>${esc(c.name)}</b><div class="mut">${esc(c.phone)}</div></span><span class="chip">📞 Call</span></a>`).join('') || '<div class="empty">No contacts</div>'}</div>`);
  };
  A.replan = d => { const g = L.byId(S.groups, d.id); const r = L.generateRotation(S, g); save(); render(); toast(r.problems.length ? `${r.problems.length} trips have no driver who fits. Check cars and days.` : 'Turns re-planned fairly'); };
  A.shareWeek = d => {
    const g = L.byId(S.groups, d.id); const slots = L.tripSlots(g, d.mon, L.addDays(d.mon, 6));
    const lines = slots.map(s => { const a = S.assignments[s.key] || {}; return `${WD[L.weekday(s.date)]} ${L.parse(s.date).getDate()} · ${s.trip.label} ${fmtTime(s.trip.time)}: ${a.driverId ? (fam(a.driverId).adults[0].name) : '❓ no driver'}`; });
    share(`🚗 ${g.name}: drivers for the week of ${fmtDate(d.mon)}\n${lines.join('\n')}`);
  };
  A.shareMyWeek = () => {
    const list = mySlots(L.today(), L.addDays(L.today(), 6)).filter(s => s.a.driverId === S.me);
    share(list.length ? `My carpool turns this week:\n${list.map(s => `${dayLabel(s.date)} ${fmtTime(s.trip.time)} · ${s.group.name} (${s.trip.label})`).join('\n')}` : 'No driving turns for me this week.');
  };
  A.toggleKid = d => { const g = L.byId(S.groups, d.g); g.kidIds = g.kidIds.includes(d.k) ? g.kidIds.filter(x => x !== d.k) : [...g.kidIds, d.k]; L.generateRotation(S, g); save(); render(); };
  A.toggleOff = d => {
    const f = fam(d.f); f.unavailable = f.unavailable || {}; const list = f.unavailable[d.g] = f.unavailable[d.g] || []; const v = '*:' + d.d;
    f.unavailable[d.g] = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
    L.generateRotation(S, L.byId(S.groups, d.g)); save(); render();
  };
  A.addFam = d => { const g = L.byId(S.groups, d.g); const f = fam(d.f); g.familyIds.push(d.f); g.kidIds.push(...f.kids.map(k => k.id)); L.generateRotation(S, g); save(); render(); toast(`${f.name} added; turns re-planned`); };
  A.removeFam = d => {
    const g = L.byId(S.groups, d.g); const f = fam(d.f); if (!confirm(`Remove ${f.name} from ${g.name}?`)) return;
    g.familyIds = g.familyIds.filter(x => x !== d.f); g.kidIds = g.kidIds.filter(k => !f.kids.some(x => x.id === k));
    for (const [k, a] of Object.entries(S.assignments)) { const p = L.parseKey(k); if (p.groupId === g.id && a.driverId === d.f && p.date >= L.today()) { a.driverId = null; a.locked = false; a.confirmed = false; } }
    L.generateRotation(S, g); save(); render();
  };
  A.editTrip = d => {
    const g = L.byId(S.groups, d.g); const t = L.byId(g.trips, d.t) || { id: '', label: '', time: '08:00', days: [1, 2, 3, 4, 5] };
    openSheet(`<h2>${t.id ? 'Edit trip' : 'Add a trip'}</h2><form data-form="trip" data-g="${g.id}" data-t="${t.id}">
      <label>Name</label><input name="label" required value="${esc(t.label)}" placeholder="e.g. To school"><label>Time</label><input type="time" name="time" value="${t.time}" required>
      <label>Days</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(x => `<label style="margin:0"><input type="checkbox" name="day" value="${x}" ${t.days.includes(x) ? 'checked' : ''} hidden><span class="day ${t.days.includes(x) ? 'on' : ''}" data-act="dayBox">${WD[x][0]}</span></label>`).join('')}</div>
      <button class="btn" style="margin-top:16px">Save</button>${t.id && g.trips.length > 1 ? `<button type="button" class="btn ghost" style="margin-top:10px" data-act="deleteTrip" data-g="${g.id}" data-t="${t.id}">Delete trip</button>` : ''}</form>`);
  };
  A.deleteTrip = d => { const g = L.byId(S.groups, d.g); g.trips = g.trips.filter(t => t.id !== d.t); for (const k of Object.keys(S.assignments)) { const p = L.parseKey(k); if (p.groupId === g.id && p.tripId === d.t) delete S.assignments[k]; } save(); closeSheet(); render(); };
  A.dayBox = (d, el, e) => { e.preventDefault(); const cb = el.previousElementSibling; cb.checked = !cb.checked; el.classList.toggle('on', cb.checked); };
  A.unskip = d => { const g = L.byId(S.groups, d.g); g.skipDates = g.skipDates.filter(x => x !== d.d); L.generateRotation(S, g); save(); render(); };
  A.deleteGroup = d => { const g = L.byId(S.groups, d.g); if (!confirm(`Delete ${g.name}? Its turns and history are removed.`)) return; S.groups = S.groups.filter(x => x.id !== d.g); for (const k of Object.keys(S.assignments)) if (L.parseKey(k).groupId === d.g) delete S.assignments[k]; save(); go('#/groups'); };
  A.editKid = d => {
    const f = fam(d.f); const k = f.kids.find(x => x.id === d.k) || { id: '', name: '', emoji: KID_EMOJI[f.kids.length % 4], bg: KID_BG[(S.families.indexOf(f) + f.kids.length) % KID_BG.length], seat: 'none', grade: '', medical: '', contacts: [] };
    const c = k.contacts || [];
    openSheet(`<h2>${k.id ? 'Edit ' + esc(k.name) : 'Add a child'}</h2><form data-form="kid" data-f="${f.id}" data-k="${k.id}">
      <div class="row"><div style="width:80px"><label>Avatar</label><select name="emoji">${KID_EMOJI.map(e => `<option ${k.emoji === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div><div class="grow"><label>First name</label><input name="name" required value="${esc(k.name)}"></div></div>
      <div class="row"><div class="grow"><label>Grade / class</label><input name="grade" value="${esc(k.grade)}"></div><div class="grow"><label>Seat needed</label><select name="seat"><option value="none">Regular seat</option><option value="booster" ${k.seat === 'booster' ? 'selected' : ''}>Booster</option><option value="car" ${k.seat === 'car' ? 'selected' : ''}>Car seat</option></select></div></div>
      <label>Medical & care notes (only shown to drivers)</label><textarea name="medical" placeholder="Allergies, medication, who may collect">${esc(k.medical)}</textarea>
      <label>Emergency contacts</label>${[0, 1].map(i => `<div class="row" style="margin-bottom:8px"><input name="cn${i}" placeholder="Name" value="${esc(c[i]?.name || '')}"><input name="cp${i}" type="tel" placeholder="Phone" value="${esc(c[i]?.phone || '')}"></div>`).join('')}
      <button class="btn" style="margin-top:8px">Save</button>${k.id ? `<button type="button" class="btn ghost" style="margin-top:10px" data-act="deleteKid" data-f="${f.id}" data-k="${k.id}">Remove child</button>` : ''}</form>`);
  };
  A.deleteKid = d => { const f = fam(d.f); if (!confirm('Remove this child?')) return; f.kids = f.kids.filter(k => k.id !== d.k); for (const g of S.groups) g.kidIds = g.kidIds.filter(x => x !== d.k); save(); closeSheet(); render(); };
  A.editCar = d => {
    const f = fam(d.f); const c = (f.cars || []).find(x => x.id === d.c) || { id: '', label: '', plate: '', seats: 4, boosters: 0, carSeats: 0 };
    openSheet(`<h2>${c.id ? 'Edit car' : 'Add a car'}</h2><form data-form="car" data-f="${f.id}" data-c="${c.id}">
      <label>Car (colour, make, model)</label><input name="label" required value="${esc(c.label)}" placeholder="e.g. White Honda City"><label>Number plate</label><input name="plate" value="${esc(c.plate)}">
      <div class="row"><div class="grow"><label>Seats for kids</label><input type="number" name="seats" min="1" max="12" value="${c.seats}"></div><div class="grow"><label>Boosters</label><input type="number" name="boosters" min="0" max="6" value="${c.boosters}"></div><div class="grow"><label>Car seats</label><input type="number" name="carSeats" min="0" max="6" value="${c.carSeats}"></div></div>
      <button class="btn" style="margin-top:14px">Save</button>${c.id ? `<button type="button" class="btn ghost" style="margin-top:10px" data-act="deleteCar" data-f="${f.id}" data-c="${c.id}">Remove car</button>` : ''}</form>`);
  };
  A.deleteCar = d => { const f = fam(d.f); f.cars = f.cars.filter(c => c.id !== d.c); save(); closeSheet(); render(); };
  A.deleteFam = d => {
    const f = fam(d.f); if (!confirm(`Delete ${f.name}?`)) return;
    S.families = S.families.filter(x => x.id !== d.f);
    for (const g of S.groups) { g.familyIds = g.familyIds.filter(x => x !== d.f); g.kidIds = g.kidIds.filter(k => !f.kids.some(x => x.id === k)); L.generateRotation(S, g); }
    S.rides = S.rides.filter(r => r.ownerId !== d.f).map(r => ({ ...r, riders: r.riders.filter(x => x !== d.f) }));
    save(); history.back();
  };
  A.finishSetup = () => { save(); };
  A.remindersChange = (d, el) => { S.settings.reminders = el.checked; save(); toast(el.checked ? 'Reminders on' : 'Reminders off'); };
  A.currencyChange = (d, el) => { S.settings.currency = el.value || '₹'; save(); };
  A.backup = () => share(JSON.stringify(S), 'Carpool backup');
  A.restore = () => openSheet(`<h2>Restore a backup</h2><form data-form="restore"><label>Paste the backup text</label><textarea name="json" required></textarea><button class="btn" style="margin-top:12px">Restore</button></form><p class="note">This replaces everything on this phone.</p>`);
  A.reset = () => { if (!confirm('Erase all carpool data on this phone?')) return; S = blank(); save(); go('#/welcome'); render(); };
  A.joinRide = d => { const r = L.byId(S.rides, d.id); if (r.riders.includes(S.me)) r.riders = r.riders.filter(x => x !== S.me); else if (r.riders.length < r.seats) r.riders.push(S.me); else return toast('No seats left'); save(); render(); };
  A.driveRide = d => { const r = L.byId(S.rides, d.id); r.riders = r.riders.includes(S.me) ? [] : [S.me]; save(); render(); if (r.riders.length) share(`🚙 I can drive you: ${r.from} → ${r.to}, ${r.date ? fmtDate(r.date) : ''} ${fmtTime(r.time)}. — ${me().adults[0].name}`); };
  A.logRide = d => {
    const r = L.byId(S.rides, d.id); const payers = r.ownerId === S.me ? r.riders : [S.me];
    for (const p of payers) S.ledger.push({ id: uid(), from: p, to: r.ownerId, amount: r.price, note: `${r.from} → ${r.to}`, date: L.today(), settled: false });
    save(); toast(`Logged ${money(r.price)} × ${payers.length}`); render();
  };
  A.shareRide = d => { const r = L.byId(S.rides, d.id); share(`🚙 ${r.kind === 'offer' ? 'Seats available' : 'Need a ride'}: ${r.from} → ${r.to}\n${r.days.length ? r.days.map(x => WD[x]).join(' ') : fmtDate(r.date)} at ${fmtTime(r.time)} · ${r.seats} seat${r.seats > 1 ? 's' : ''}${r.price ? ' · ' + money(r.price) + ' per ride' : ''}\nReply if you're in! — ${me().adults[0].name}`); };
  A.deleteRide = d => { S.rides = S.rides.filter(r => r.id !== d.id); save(); render(); };
  A.settle = d => { for (const e of S.ledger) if (!e.settled && ((e.from === d.a && e.to === d.b) || (e.from === d.b && e.to === d.a))) e.settled = true; save(); render(); toast('Marked as settled'); };
  A.addExpense = () => openSheet(`<h2>Add a shared cost</h2><form data-form="expense"><label>Who paid?</label><select name="to">${S.families.map(f => `<option value="${f.id}" ${f.id === S.me ? 'selected' : ''}>${esc(famName(f.id))}</option>`).join('')}</select>
    <label>Split with</label><div class="chips">${S.families.filter(f => f.id !== S.me || true).map(f => `<label class="chip" style="margin:0;color:var(--ink)"><input type="checkbox" name="with" value="${f.id}" style="width:auto;margin-right:4px">${esc(famName(f.id))}</label>`).join('')}</div>
    <div class="row"><div class="grow"><label>Total amount</label><input type="number" name="amount" min="0" step="any" required></div><div class="grow"><label>For</label><input name="note" placeholder="Fuel, toll, parking"></div></div>
    <button class="btn" style="margin-top:14px">Add</button></form><p class="note">The total is split equally between everyone ticked (including the payer if ticked).</p>`);
  A.rsvp = d => { const o = L.byId(S.outings, d.o); o.rsvp[d.f] = d.v; planOuting(o); save(); render(); };
  A.replanOuting = d => { const o = L.byId(S.outings, d.o); planOuting(o); save(); render(); toast('Seats re-planned'); };
  A.moveKid = d => {
    const o = L.byId(S.outings, d.o); const cars = outingCars(o, d.dir); const k = kidById(d.k);
    openSheet(`<h2>Move ${esc(k.name)}</h2><div class="menu">${cars.map(c => `<button data-act="moveKidTo" data-o="${o.id}" data-dir="${d.dir}" data-k="${d.k}" data-c="${c.key}">${avatar(c.familyId, true)}<span class="grow">${esc(famName(c.familyId))}'s car<div class="mut">${(o.plan[d.dir].plan[c.key] || []).length}/${c.seats} seats</div></span></button>`).join('')}</div>`);
  };
  A.moveKidTo = d => {
    const o = L.byId(S.outings, d.o); const p = o.plan[d.dir];
    for (const key of Object.keys(p.plan)) p.plan[key] = p.plan[key].filter(x => x !== d.k);
    p.unseated = p.unseated.filter(x => x !== d.k); (p.plan[d.c] = p.plan[d.c] || []).push(d.k);
    save(); closeSheet(); render();
  };
  A.shareOuting = d => {
    const o = L.byId(S.outings, d.o); if (!o.plan) planOuting(o);
    const part = dir => outingCars(o, dir).map(c => `• ${fam(c.familyId).adults[0].name}: ${(o.plan[dir].plan[c.key] || []).map(id => kidById(id)?.name).join(', ') || '—'}`).join('\n');
    share(`${o.emoji || '🎈'} ${o.name}\n📍 ${o.place}\n📅 ${fmtDate(o.date, true)}\n\nThere (leave ${fmtTime(o.goTime)}):\n${part('go')}\n\nBack (${fmtTime(o.backTime)}):\n${part('back')}`);
  };
  A.deleteOuting = d => { if (!confirm('Delete this outing?')) return; S.outings = S.outings.filter(o => o.id !== d.o); save(); go('#/today'); };

  // ---------- forms ----------
  const F = {};
  const days = fd => fd.getAll('day').map(Number);
  F.setup = fd => {
    const id = 'f' + uid();
    S.families.push({ id, name: fd.get('name') || `${fd.get('adult')}'s family`, color: COLORS[0], adults: [{ id: id + 'a', name: fd.get('adult'), phone: fd.get('phone') }], kids: [], cars: [], unavailable: {} });
    S.me = id; save(); go('#/setup');
  };
  F.famEdit = (fd, form) => {
    const f = fam(form.dataset.f); f.name = fd.get('name') || f.name;
    const adults = [];
    for (let i = 0; i <= f.adults.length; i++) { const n = (fd.get('an' + i) || '').trim(); if (n) adults.push({ id: (f.adults[i] || {}).id || uid(), name: n, phone: fd.get('ap' + i) || '' }); }
    if (adults.length) f.adults = adults;
    if (f.id !== S.me) f.friend = fd.get('friend') === 'on';
    save(); render(); toast('Saved');
  };
  F.famNew = (fd, form) => {
    const id = 'f' + uid(); const used = new Set(S.families.map(f => f.color));
    S.families.push({ id, name: fd.get('name') || `${fd.get('adult')}'s family`, color: COLORS.find(c => !used.has(c)) || COLORS[S.families.length % COLORS.length], adults: [{ id: id + 'a', name: fd.get('adult'), phone: fd.get('phone') }], kids: [], cars: [], unavailable: {}, friend: form.dataset.friend === '1' });
    const g = L.byId(S.groups, form.dataset.g); if (g) g.familyIds.push(id);
    save(); location.replace('#/family/' + id);
  };
  F.kid = (fd, form) => {
    const f = fam(form.dataset.f); let k = f.kids.find(x => x.id === form.dataset.k);
    const isNew = !k; if (!k) { k = { id: 'k' + uid(), bg: KID_BG[(S.families.indexOf(f) + f.kids.length) % KID_BG.length] }; f.kids.push(k); }
    Object.assign(k, { name: fd.get('name'), emoji: fd.get('emoji'), grade: fd.get('grade'), seat: fd.get('seat'), medical: fd.get('medical'),
      contacts: [0, 1].map(i => ({ name: fd.get('cn' + i), phone: fd.get('cp' + i) })).filter(c => c.name || c.phone) });
    if (isNew) for (const g of S.groups) if (g.familyIds.includes(f.id)) g.kidIds.push(k.id);
    for (const g of S.groups) if (g.familyIds.includes(f.id)) L.generateRotation(S, g);
    save(); closeSheet(); render();
  };
  F.car = (fd, form) => {
    const f = fam(form.dataset.f); f.cars = f.cars || []; let c = f.cars.find(x => x.id === form.dataset.c);
    if (!c) { c = { id: 'c' + uid() }; f.cars.push(c); }
    Object.assign(c, { label: fd.get('label'), plate: fd.get('plate'), seats: +fd.get('seats') || 1, boosters: +fd.get('boosters') || 0, carSeats: +fd.get('carSeats') || 0 });
    for (const g of S.groups) if (g.familyIds.includes(f.id)) L.generateRotation(S, g);
    save(); closeSheet(); render();
  };
  F.groupNew = fd => {
    const d = days(fd); if (!d.length) return toast('Pick at least one day');
    const trips = [];
    if (fd.get('to')) trips.push({ id: 't' + uid(), label: fd.get('toLabel') || 'There', time: fd.get('toTime') || '08:00', days: d });
    if (fd.get('back')) trips.push({ id: 't' + uid(), label: fd.get('backLabel') || 'Back', time: fd.get('backTime') || '15:00', days: d });
    if (!trips.length) return toast('Add at least one trip');
    const fids = [S.me, ...fd.getAll('fam').filter(x => x !== S.me)];
    const g = { id: 'g' + uid(), name: fd.get('name'), type: fd.get('type'), place: fd.get('place'), familyIds: fids, kidIds: fids.flatMap(id => fam(id).kids.map(k => k.id)), trips, mode: 'round', skipDates: [] };
    S.groups.push(g); const r = L.generateRotation(S, g); save(); location.replace('#/group/' + g.id);
    if (r.problems.length) setTimeout(() => toast('Some trips have no driver yet: add cars or families'), 300);
  };
  F.groupEdit = (fd, form) => { const g = L.byId(S.groups, form.dataset.g); Object.assign(g, { name: fd.get('name'), place: fd.get('place'), type: fd.get('type') }); save(); render(); toast('Saved'); };
  F.skip = (fd, form) => { const g = L.byId(S.groups, form.dataset.g); g.skipDates = [...new Set([...(g.skipDates || []), fd.get('d')])]; L.generateRotation(S, g); save(); render(); };
  F.trip = (fd, form) => {
    const g = L.byId(S.groups, form.dataset.g); const d = days(fd); if (!d.length) return toast('Pick at least one day');
    let t = L.byId(g.trips, form.dataset.t); if (!t) { t = { id: 't' + uid() }; g.trips.push(t); }
    Object.assign(t, { label: fd.get('label'), time: fd.get('time'), days: d });
    for (const k of Object.keys(S.assignments)) { const p = L.parseKey(k); const a = S.assignments[k]; if (p.groupId === g.id && p.tripId === t.id && p.date >= L.today() && !d.includes(L.weekday(p.date)) && a.status !== 'done') delete S.assignments[k]; }
    L.generateRotation(S, g); save(); closeSheet(); render();
  };
  F.cover = (fd, form) => {
    const key = form.dataset.key; const s = slotInfo(key); L.requestCover(S, key, fd.get('reason')); save(); closeSheet(); render();
    share(`🙋 Can anyone cover ${s.group.name} · ${s.trip.label} on ${fmtDate(s.date)} at ${fmtTime(s.trip.time)}?${fd.get('reason') ? ' (' + fd.get('reason') + ')' : ''} Happy to swap a day. — ${me().adults[0].name}`);
  };
  F.restore = fd => {
    try { const s = JSON.parse(fd.get('json')); if (!s || s.v !== 1 || !Array.isArray(s.families)) throw new Error('not a carpool backup'); S = { ...blank(), ...s }; save(); closeSheet(); go('#/today'); render(); toast('Backup restored'); }
    catch (e) { toast('That text is not a valid backup'); }
  };
  F.rideNew = (fd, form) => {
    const d = days(fd); if (!d.length && !fd.get('date')) return toast('Pick a date or repeat days');
    S.rides.push({ id: 'r' + uid(), kind: form.dataset.kind, ownerId: S.me, from: fd.get('from'), to: fd.get('to'), date: d.length ? '' : fd.get('date'), days: d, time: fd.get('time'), seats: +fd.get('seats') || 1, price: +fd.get('price') || 0, riders: [], note: fd.get('note') });
    save(); location.replace('#/friends/rides'); setTimeout(() => A.shareRide({ id: S.rides[S.rides.length - 1].id }), 200);
  };
  F.expense = fd => {
    const to = fd.get('to'); const w = fd.getAll('with'); const amt = +fd.get('amount');
    if (!w.length || !amt) return toast('Pick who shares it');
    const each = amt / w.length;
    for (const p of w) if (p !== to) S.ledger.push({ id: uid(), from: p, to, amount: each, note: fd.get('note'), date: L.today(), settled: false });
    save(); closeSheet(); render();
  };
  F.outing = (fd, form) => {
    let o = L.byId(S.outings, form.dataset.id);
    if (!o) { o = { id: 'o' + uid(), rsvp: { [S.me]: 'yes' } }; S.outings.push(o); }
    Object.assign(o, { name: fd.get('name'), emoji: fd.get('emoji'), place: fd.get('place'), date: fd.get('date'), goTime: fd.get('goTime'), backTime: fd.get('backTime'), kidIds: fd.getAll('kid'), drivers: { go: fd.getAll('go'), back: fd.getAll('back') } });
    for (const k of o.kidIds) { const kk = kidById(k); if (kk && !o.rsvp[kk.familyId]) o.rsvp[kk.familyId] = 'pending'; }
    planOuting(o); save(); location.replace('#/outing/' + o.id);
  };

  // ---------- events ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = A[el.dataset.act]; if (fn) fn(el.dataset, el, e);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-act-change]'); if (!el) return;
    const fn = A[el.dataset.actChange + 'Change']; if (fn) fn(el.dataset, el, e);
  });
  document.addEventListener('submit', e => {
    const form = e.target.closest('form[data-form]'); if (!form) return;
    e.preventDefault(); const fn = F[form.dataset.form]; if (fn) fn(new FormData(form), form);
  });

  // Android back button (called by app-shell.js): close a sheet, then go back, then let the app close.
  window.onAppBack = function () {
    if (!$('#sheetWrap').hidden) { closeSheet(); return true; }
    if (['today', 'welcome', ''].includes(route[0] || '') || (route[0] === 'setup')) return false;
    if (['calendar', 'groups', 'friends'].includes(route[0])) { go('#/today'); return true; }
    history.back(); return true;
  };

  // Tapping a reminder opens that trip.
  const LN = plugin('LocalNotifications');
  if (LN) LN.addListener('localNotificationActionPerformed', ev => { const k = ev.notification && ev.notification.extra && ev.notification.extra.key; if (k) go('#/slot/' + encodeURIComponent(k)); });

  // Keep the rotation filled 4 weeks ahead as time passes.
  for (const g of S.groups) L.generateRotation(S, g);
  if (S.me) save();
  render();
  window.__carpool = { get state() { return S; }, demo: A.demo };
})();
