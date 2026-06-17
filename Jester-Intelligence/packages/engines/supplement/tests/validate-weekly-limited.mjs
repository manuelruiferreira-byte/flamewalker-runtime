// validate-weekly-limited.mjs
// Verifies the WEEKLY_LIMITED_HERBS governance: rolling-7-day cap of 1,
// no automatic frequency boost, no makeup, no permanent highlight, plus the
// per-day anti-clustering rules.

import fs from 'node:fs';
import {
  evaluateFrequencyPersistence,
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays
} from '../index.mjs';

const registryPath = process.argv[2]
  ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const byId = new Map(registry.supplements.map(s => [s.id, s]));

let passed = 0, failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error(`FAIL: ${msg}`); }
}

const EXPECTED_MEMBERS = ['ashwagandha', 'fadogia_agrestis', 'gotu_kola', 'reishi', 'turkesterone'];

// --- Test 1: registry-level weeklyLimitedHerbs group ---
const grp = registry.weeklyLimitedHerbs;
assert(grp && typeof grp === 'object', 'registry has weeklyLimitedHerbs group');
assert(JSON.stringify([...(grp?.members ?? [])].sort()) === JSON.stringify(EXPECTED_MEMBERS), 'weeklyLimitedHerbs has expected members');
assert(grp?.maxUsesPerRolling7Days === 1, 'maxUsesPerRolling7Days === 1');
assert(grp?.automaticFrequencyBoost === false, 'automaticFrequencyBoost === false');
assert(grp?.missedWeekRequiresMakeup === false, 'missedWeekRequiresMakeup === false');
assert(grp?.permanentHighlightAllowed === false, 'permanentHighlightAllowed === false');

// --- Test 2: each member card carries the governance flags ---
for (const id of EXPECTED_MEMBERS) {
  const f = byId.get(id)?.frequency ?? {};
  assert(f.weeklyLimited === true, `${id}.frequency.weeklyLimited === true`);
  assert(f.maxUses7d === 1, `${id}.frequency.maxUses7d === 1`);
  assert(f.rollingWindowDays === 7, `${id}.frequency.rollingWindowDays === 7`);
  assert(f.automaticFrequencyBoost === false, `${id}.frequency.automaticFrequencyBoost === false`);
  assert(f.missedWeekRequiresMakeup === false, `${id}.frequency.missedWeekRequiresMakeup === false`);
  assert(f.permanentHighlightAllowed === false, `${id}.frequency.permanentHighlightAllowed === false`);
}

// --- Test 3: rolling-window enforcement in the frequency engine ---
// Use an auto-selectable member (reishi). Taken on 2026-06-16; must remain
// COMPLETE for the trailing window and become eligible again on 2026-06-23.
const reishi = byId.get('reishi');
const taken = ['2026-06-16'];
for (let i = 1; i <= 6; i++) {
  const day = addDays('2026-06-16', i);
  const fr = evaluateFrequencyPersistence(reishi, day, taken);
  assert(fr.state === 'complete', `reishi COMPLETE on ${day} (rolling window, taken 06-16)`);
}
const day7 = addDays('2026-06-16', 7); // 2026-06-23
const fr7 = evaluateFrequencyPersistence(reishi, day7, taken);
assert(fr7.state !== 'complete', `reishi eligible again on ${day7} (state ${fr7.state})`);
assert(fr7.weeklyLimited === true, 'reishi frequency output marks weeklyLimited');
assert(fr7.rollingWindowDays === 7, 'reishi frequency output reports rollingWindowDays 7');

// --- Test 4: no automatic frequency boost -> never DUE ---
// Even with an empty history and pressure, a weekly-limited herb stays OPTIONAL.
for (const id of ['reishi', 'gotu_kola']) {
  const supp = byId.get(id);
  for (let i = 0; i < 7; i++) {
    const day = addDays('2026-06-16', i);
    const fr = evaluateFrequencyPersistence(supp, day, []);
    assert(fr.state !== 'due', `${id} never DUE on ${day} (state ${fr.state})`);
  }
}

// --- Test 5: anti-clustering avoidSameDay ---
const reishiAvoid = new Set(byId.get('reishi').pairing.avoidSameDay);
for (const other of ['gotu_kola', 'ashwagandha', 'fadogia_agrestis', 'turkesterone']) {
  assert(reishiAvoid.has(other), `reishi avoidSameDay includes ${other}`);
}
const spirulinaAvoid = new Set(byId.get('spirulina').pairing.avoidSameDay);
assert(spirulinaAvoid.has('irish_sea_moss') && spirulinaAvoid.has('shilajit'), 'spirulina avoids the other mineral-biomass products');
const melatoninAvoid = new Set(byId.get('melatonin').pairing.avoidSameDay);
assert(melatoninAvoid.has('valerian'), 'melatonin avoids valerian (one primary sleep aid)');

// --- Test 6: 21-day optimizer simulation honours rolling cap ---
const greenBody = Object.fromEntries(registry.bodySystems.map(a => [a, 'green']));
const ARCH = [
  ['saturn', 'earth', 'water', 'longevity', 'spirit'],
  ['moon', 'water', 'earth', 'calm', 'repair'],
  ['venus', 'moon', 'water', 'social', 'heart']
];
function dayField(tags) {
  return { astrology: { scalar: 0.8, tags }, bazi: { scalar: 0.8, tags }, numerology: { scalar: 0.8, tags }, mayan: { scalar: 0.8, tags } };
}
const histories = {};
const usageDays = {};
for (let i = 0; i < 21; i++) {
  const day = addDays('2026-06-16', i);
  const tags = ARCH[i % ARCH.length];
  const out = optimize({
    day, registry,
    daySignals: { spirit: 1, leisure: 0.8, body: 0.6 },
    layers: {
      esoteric: evaluateEsotericRegistry(registry, dayField(tags)),
      body: evaluateBodyRegistry(registry, greenBody),
      frequency: evaluateFrequencyRegistry(registry, day, histories),
      pairing: evaluatePairingRegistry(registry, [])
    },
    config: {}
  });
  const ids = new Set(out.selected.flatMap(r => r.atom.memberIds));
  for (const id of ids) {
    if (!histories[id]) histories[id] = [];
    histories[id].push(day);
    if (EXPECTED_MEMBERS.includes(id)) {
      if (!usageDays[id]) usageDays[id] = [];
      usageDays[id].push(day);
    }
  }
}
// For each weekly-limited herb actually selected, no two uses within any rolling 7-day window.
for (const [id, days] of Object.entries(usageDays)) {
  const sorted = [...days].sort();
  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
    assert(gap >= 7, `${id} uses ${sorted[i - 1]} and ${sorted[i]} are >= 7 days apart (rolling cap)`);
  }
}

console.log(`\n=== validate-weekly-limited results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
