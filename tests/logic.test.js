const test = require('node:test');
const assert = require('node:assert');
const L = require('../logic.js');

function world() {
  const fam = (id, kids, cars, unavailable) => ({ id, name: id, adults: [{ id: id + 'a', name: id }], kids, cars, unavailable: unavailable || {} });
  const kid = (id, seat = 'none') => ({ id, name: id, seat });
  const families = [
    fam('A', [kid('a1')], [{ id: 'ca', seats: 4, boosters: 1 }]),
    fam('B', [kid('b1', 'booster')], [{ id: 'cb', seats: 4, boosters: 1 }]),
    fam('C', [kid('c1')], [{ id: 'cc', seats: 4, boosters: 1 }], { g: ['*:3'] }), // can't drive Wednesdays
    fam('D', [kid('d1')], [{ id: 'cd', seats: 4, boosters: 0 }]), // no booster, so can never take b1
  ];
  const group = { id: 'g', name: 'School', familyIds: ['A', 'B', 'C', 'D'], kidIds: ['a1', 'b1', 'c1', 'd1'],
    trips: [{ id: 'am', label: 'Morning', time: '07:45', days: [1, 2, 3, 4, 5] }], skipDates: [] };
  return { families, groups: [group], assignments: {}, group };
}

test('rotation shares driving evenly and respects availability and seats', () => {
  const s = world();
  const from = '2026-11-16'; // a Monday
  const { problems } = L.generateRotation(s, s.group, { from, weeks: 4 });
  assert.equal(problems.length, 0);
  const counts = {};
  for (const [k, a] of Object.entries(s.assignments)) {
    const { date } = L.parseKey(k);
    counts[a.driverId] = (counts[a.driverId] || 0) + 1;
    if (L.weekday(date) === 3) assert.notEqual(a.driverId, 'C', 'C cannot drive on Wednesday');
  }
  assert.equal(counts.D, undefined, 'D has no booster seat for b1');
  const vals = Object.values(counts);
  assert.equal(vals.reduce((a, b) => a + b), 20);
  assert.ok(Math.max(...vals) - Math.min(...vals) <= 1, JSON.stringify(counts));
});

test('regenerating keeps confirmed and locked trips', () => {
  const s = world();
  const from = '2026-11-16';
  L.generateRotation(s, s.group, { from, weeks: 1 });
  const k = L.slotKey('g', 'am', from);
  L.takeCover(s, k, 'C');
  L.generateRotation(s, s.group, { from, weeks: 1 });
  assert.equal(s.assignments[k].driverId, 'C');
});

test('skip dates produce no trips', () => {
  const s = world();
  s.group.skipDates = ['2026-11-17'];
  const slots = L.tripSlots(s.group, '2026-11-16', '2026-11-20');
  assert.equal(slots.length, 4);
  assert.ok(!slots.some(x => x.date === '2026-11-17'));
});

test('cover request and swap', () => {
  const s = world();
  L.generateRotation(s, s.group, { from: '2026-11-16', weeks: 1 });
  const k1 = L.slotKey('g', 'am', '2026-11-16'), k2 = L.slotKey('g', 'am', '2026-11-17');
  const d1 = s.assignments[k1].driverId, d2 = s.assignments[k2].driverId;
  L.requestCover(s, k1, 'meeting');
  assert.equal(s.assignments[k1].cover.requested, true);
  L.swap(s, k1, k2);
  assert.equal(s.assignments[k1].driverId, d2);
  assert.equal(s.assignments[k2].driverId, d1);
  assert.equal(s.assignments[k1].cover.requested, false);
});

test('fairness counts driven vs planned', () => {
  const s = world();
  L.generateRotation(s, s.group, { from: '2026-11-16', weeks: 1 });
  const f = L.fairness(s, s.group, '2026-11-18');
  const driven = Object.values(f).reduce((a, c) => a + c.driven, 0);
  const planned = Object.values(f).reduce((a, c) => a + c.planned, 0);
  assert.equal(driven, 3);
  assert.equal(planned, 2);
});

test('seat plan: own parent first, booster rules, overflow reported', () => {
  const cars = [{ key: 'A', familyId: 'A', seats: 2, boosters: 0 }, { key: 'B', familyId: 'B', seats: 2, boosters: 1 }];
  const kids = [{ id: 'a1', familyId: 'A', seat: 'none' }, { id: 'b1', familyId: 'B', seat: 'booster' },
    { id: 'x1', familyId: 'X', seat: 'booster' }, { id: 'y1', familyId: 'Y', seat: 'none' }, { id: 'z1', familyId: 'Z', seat: 'none' }];
  const { plan, unseated } = L.seatPlan(cars, kids);
  assert.ok(plan.A.includes('a1'));
  assert.ok(plan.B.includes('b1') || plan.B.includes('x1'));
  assert.equal(plan.A.length + plan.B.length, 4);
  assert.equal(unseated.length, 1);
  assert.ok(!plan.A.includes('x1') && !plan.A.includes('b1'), 'booster kids only in car B');
});

test('balances net out pairs', () => {
  const b = L.balances([
    { from: 'me', to: 'dev', amount: 60 }, { from: 'me', to: 'dev', amount: 60 }, { from: 'dev', to: 'me', amount: 20 },
    { from: 'sam', to: 'me', amount: 50, settled: true },
  ]);
  assert.deepEqual(b, [{ from: 'me', to: 'dev', amount: 100 }]);
});
