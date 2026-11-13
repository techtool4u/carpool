// Carpool rules with no UI: dates, the driving rotation, fairness, seat checks, cover/swap and the outing seat plan.
// Loaded by index.html as a plain script (window.Logic) and by the Node tests (require('../logic.js')).
(function (root) {
  'use strict';

  // ---------- dates (always local time, as 'YYYY-MM-DD') ----------
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const weekday = s => parse(s).getDay(); // 0 = Sunday
  const today = () => ymd(new Date());
  const mondayOf = s => addDays(s, -((weekday(s) + 6) % 7));

  // ---------- lookups ----------
  const byId = (list, id) => list.find(x => x.id === id);
  const slotKey = (groupId, tripId, date) => `${groupId}|${tripId}|${date}`;
  const parseKey = k => { const [groupId, tripId, date] = k.split('|'); return { groupId, tripId, date }; };

  function kidsOf(state, familyId) { const f = byId(state.families, familyId); return f ? f.kids : []; }

  // The kids who ride on a trip: kids picked for the group, minus any opted out of this trip.
  function tripKids(state, group, trip) {
    const kids = [];
    for (const fid of group.familyIds) {
      for (const k of kidsOf(state, fid)) {
        if (!group.kidIds.includes(k.id)) continue;
        if (trip.kidIds && !trip.kidIds.includes(k.id)) continue;
        kids.push({ ...k, familyId: fid });
      }
    }
    return kids;
  }

  // Seats needed: every kid needs a seat; booster and car-seat kids need that seat type too.
  function seatNeeds(kids) {
    return {
      seats: kids.length,
      boosters: kids.filter(k => k.seat === 'booster').length,
      carSeats: kids.filter(k => k.seat === 'car').length,
    };
  }

  // The family's car that fits these kids best (the driver's own seat is not counted in `seats`).
  function carThatFits(family, kids) {
    const need = seatNeeds(kids);
    const fits = (family.cars || []).filter(c =>
      c.seats >= need.seats && (c.boosters || 0) >= need.boosters && (c.carSeats || 0) >= need.carSeats);
    fits.sort((a, b) => a.seats - b.seats);
    return fits[0] || null;
  }

  function canDrive(state, group, trip, familyId, date) {
    const f = byId(state.families, familyId);
    if (!f) return { ok: false, why: 'Not found' };
    const off = (f.unavailable && f.unavailable[group.id]) || [];
    if (off.includes(`${trip.id}:${weekday(date)}`) || off.includes(`*:${weekday(date)}`)) return { ok: false, why: "Can't drive this day" };
    const car = carThatFits(f, tripKids(state, group, trip));
    if (!car) return { ok: false, why: (f.cars || []).length ? 'Car too small or missing booster seats' : 'No car' };
    return { ok: true, car };
  }

  // Every trip date of a group between two dates (inclusive), skipping skip-dates.
  function tripSlots(group, from, to) {
    const out = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if ((group.skipDates || []).includes(d)) continue;
      const wd = weekday(d);
      for (const trip of group.trips) if (trip.days.includes(wd)) out.push({ key: slotKey(group.id, trip.id, d), date: d, trip });
    }
    out.sort((a, b) => (a.date + a.trip.time).localeCompare(b.date + b.trip.time));
    return out;
  }

  // Trips driven per family in a group (past and planned), from the assignments.
  function fairness(state, group, until) {
    const counts = Object.fromEntries(group.familyIds.map(id => [id, { driven: 0, planned: 0, last: '' }]));
    for (const [k, a] of Object.entries(state.assignments)) {
      const { groupId, date } = parseKey(k);
      if (groupId !== group.id || !a.driverId || !counts[a.driverId]) continue;
      if ((group.skipDates || []).includes(date)) continue;
      const c = counts[a.driverId];
      if (date <= (until || today())) { c.driven++; if (date > c.last) c.last = date; } else c.planned++;
    }
    return counts;
  }

  // Build the rotation for the coming weeks. Keeps past trips, confirmed trips and manual changes (locked);
  // re-plans everything else so every family drives about the same number of trips.
  function generateRotation(state, group, opts = {}) {
    const from = opts.from || today();
    const to = opts.to || addDays(from, 7 * (opts.weeks || 4) - 1);
    const counts = {}; const last = {};
    for (const id of group.familyIds) { counts[id] = 0; last[id] = ''; }
    // Count what is already fixed: trips before `from`, and locked ones in range.
    for (const [k, a] of Object.entries(state.assignments)) {
      const { groupId, date } = parseKey(k);
      if (groupId !== group.id || !a.driverId || !(a.driverId in counts)) continue;
      if (date < from || a.locked || a.confirmed) { counts[a.driverId]++; if (date > last[a.driverId]) last[a.driverId] = date; }
    }
    const problems = [];
    for (const slot of tripSlots(group, from, to)) {
      const cur = state.assignments[slot.key];
      if (cur && (cur.locked || cur.confirmed || cur.status === 'active' || cur.status === 'done')) continue;
      let pick = null;
      const fixed = group.mode === 'weekday' && group.fixedDays && group.fixedDays[`${slot.trip.id}:${weekday(slot.date)}`];
      if (fixed && canDrive(state, group, slot.trip, fixed, slot.date).ok) pick = fixed;
      if (!pick) {
        const ok = group.familyIds.filter(id => canDrive(state, group, slot.trip, id, slot.date).ok);
        ok.sort((a, b) => counts[a] - counts[b] || last[a].localeCompare(last[b]) || group.familyIds.indexOf(a) - group.familyIds.indexOf(b));
        pick = ok[0] || null;
      }
      const base = cur || { riders: {} };
      state.assignments[slot.key] = { ...base, driverId: pick, status: base.status || 'scheduled' };
      if (pick) { counts[pick]++; last[pick] = slot.date; } else problems.push(slot);
    }
    return { problems };
  }

  // A driver asks for cover. Another family takes it (cover) or the two families swap trips.
  function requestCover(state, key, reason) {
    const a = state.assignments[key]; if (!a) return;
    a.cover = { requested: true, reason: reason || '', at: Date.now(), from: a.driverId };
    a.confirmed = false;
  }
  function takeCover(state, key, familyId) {
    const a = state.assignments[key]; if (!a) return;
    a.driverId = familyId; a.locked = true; a.confirmed = true;
    a.cover = { ...(a.cover || {}), requested: false, by: familyId };
  }
  function swap(state, keyA, keyB) {
    const a = state.assignments[keyA], b = state.assignments[keyB]; if (!a || !b) return;
    [a.driverId, b.driverId] = [b.driverId, a.driverId];
    a.locked = b.locked = true; a.confirmed = b.confirmed = false;
    if (a.cover) a.cover.requested = false;
  }

  // ---------- outing seat plan ----------
  // cars: [{ key, familyId, seats, boosters, carSeats }], kids: [{ id, familyId, seat }]
  // Kids ride with their own parent first, then fill the cars evenly, keeping siblings together.
  function seatPlan(cars, kids) {
    const plan = Object.fromEntries(cars.map(c => [c.key, []]));
    const left = cars.map(c => ({ ...c, free: c.seats, freeB: c.boosters || 0, freeC: c.carSeats || 0 }));
    const fits = (car, k) => car.free > 0 && (k.seat !== 'booster' || car.freeB > 0) && (k.seat !== 'car' || car.freeC > 0);
    const put = (car, k) => { plan[car.key].push(k.id); car.free--; if (k.seat === 'booster') car.freeB--; if (k.seat === 'car') car.freeC--; };
    const unseated = [];
    // Hardest kids first (car seat, booster), siblings next to each other.
    const order = [...kids].sort((a, b) => rank(b) - rank(a) || String(a.familyId).localeCompare(String(b.familyId)));
    function rank(k) { return k.seat === 'car' ? 2 : k.seat === 'booster' ? 1 : 0; }
    for (const k of order) {
      const own = left.find(c => c.familyId === k.familyId && fits(c, k));
      const sib = left.find(c => fits(c, k) && plan[c.key].some(id => (kids.find(x => x.id === id) || {}).familyId === k.familyId));
      const roomiest = left.filter(c => fits(c, k)).sort((a, b) => b.free - a.free)[0];
      const car = own || sib || roomiest;
      if (car) put(car, k); else unseated.push(k.id);
    }
    return { plan, unseated };
  }

  // ---------- cost split for adult rides ----------
  // Net amount each person owes others: [{ from, to, amount }] after cancelling pairs out.
  function balances(ledger) {
    const net = {};
    for (const e of ledger) {
      if (e.settled) continue;
      const k = [e.from, e.to].sort().join('>');
      const sign = e.from < e.to ? 1 : -1;
      net[k] = (net[k] || 0) + sign * e.amount;
    }
    return Object.entries(net).filter(([, v]) => Math.abs(v) > 0.001).map(([k, v]) => {
      const [a, b] = k.split('>');
      return v > 0 ? { from: a, to: b, amount: v } : { from: b, to: a, amount: -v };
    });
  }

  const api = { ymd, parse, addDays, weekday, today, mondayOf, byId, slotKey, parseKey, tripKids, seatNeeds, carThatFits,
    canDrive, tripSlots, fairness, generateRotation, requestCover, takeCover, swap, seatPlan, balances };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
