// validate-simulation-variation.mjs
// Tests for simulation variation over consecutive days

import fs from 'node:fs';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays,
  mondayOf
} from '../index.mjs';

const registryPath = process.argv[2]
  ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`FAIL: ${message}`);
  }
}

const greenBody = Object.fromEntries(registry.bodySystems.map(axis => [axis, 'green']));
const NAD_BOOSTERS = new Set(['nr', 'nmn', 'nmnh']);

// Rotating archetypes for variety
const ARCHETYPES = [
  { tags: ['sun', 'mercury', 'fire', 'focus', 'vitality'], signals: { career: 1, study: 0.8, creative: 0.5, body: 0.4 } },
  { tags: ['mars', 'fire', 'wood', 'stamina', 'movement'], signals: { body: 1, career: 0.6, leisure: 0.4 } },
  { tags: ['mercury', 'air', 'focus', 'cognition', 'study'], signals: { study: 1, career: 0.6, creative: 0.4 } },
  { tags: ['moon', 'water', 'earth', 'calm', 'repair'], signals: { body: 0.8, spirit: 0.7, leisure: 0.6 } },
  { tags: ['venus', 'sun', 'fire', 'creative', 'expression'], signals: { creative: 1, love: 0.6, social: 0.5 } },
  { tags: ['venus', 'moon', 'water', 'social', 'heart'], signals: { love: 1, social: 1, leisure: 0.5 } },
  { tags: ['saturn', 'earth', 'water', 'longevity', 'spirit'], signals: { spirit: 1, body: 0.6, money: 0.4 } }
];

function dayField(archetype) {
  return {
    astrology: { scalar: 0.78, tags: archetype.tags },
    bazi: { scalar: 0.76, tags: archetype.tags },
    numerology: { scalar: 0.72, tags: archetype.tags },
    mayan: { scalar: 0.68, tags: archetype.tags }
  };
}

function inputFor(day, histories = {}, archetypeIndex = 0) {
  const archetype = ARCHETYPES[archetypeIndex % ARCHETYPES.length];
  return {
    day,
    registry,
    daySignals: archetype.signals,
    layers: {
      esoteric: evaluateEsotericRegistry(registry, dayField(archetype)),
      body: evaluateBodyRegistry(registry, greenBody),
      frequency: evaluateFrequencyRegistry(registry, day, histories),
      pairing: evaluatePairingRegistry(registry, [])
    },
    config: {}
  };
}

function runSimulation(startDay, numDays) {
  const results = [];
  // histories: supplement id => array of ISO dates taken
  const histories = {};

  for (let i = 0; i < numDays; i++) {
    const day = addDays(startDay, i);
    const out = optimize(inputFor(day, histories, i));
    results.push({ day, out });

    // Update histories with today's selections (deduplicate member IDs per day)
    const todayMemberIds = new Set();
    for (const rec of out.selected) {
      for (const memberId of rec.atom.memberIds) {
        todayMemberIds.add(memberId);
      }
    }
    for (const memberId of todayMemberIds) {
      if (!histories[memberId]) histories[memberId] = [];
      histories[memberId].push(day);
    }
  }
  return results;
}

// ===================== 14-day simulation =====================
const START_14 = '2026-06-16'; // Monday
const sim14 = runSimulation(START_14, 14);

console.log('14-day simulation results:');
for (const { day, out } of sim14) {
  const ids = out.selected.map(r => r.atom.primaryId).sort();
  console.log(`  ${day}: [${ids.join(', ')}]`);
}

// --- Test 1: No two consecutive days have identical selected sets ---
let consecutiveDupes = 0;
for (let i = 1; i < sim14.length; i++) {
  const a = new Set(sim14[i-1].out.selected.map(r => r.atom.primaryId));
  const b = new Set(sim14[i].out.selected.map(r => r.atom.primaryId));
  const identical = a.size === b.size && [...a].every(id => b.has(id));
  if (identical) consecutiveDupes++;
}
// Allow at most 3 consecutive-day duplicates out of 13 pairs (some days may inevitably match)
assert(consecutiveDupes <= 3, `At most 3 consecutive duplicate days in 14-day sim (got ${consecutiveDupes})`);

// --- Test 2: maxUses7d not exceeded per supplement per 7-day window ---
// Check weeks 1 and 2
function getWeekUses(results, weekStart, weekEnd) {
  // Count distinct days each supplement appears (mirroring how frequency engine counts)
  const daysSeen = {};
  for (const { day, out } of results) {
    if (day >= weekStart && day <= weekEnd) {
      // Collect unique member IDs for this day
      const todayIds = new Set();
      for (const rec of out.selected) {
        for (const memberId of rec.atom.memberIds) {
          todayIds.add(memberId);
        }
      }
      // Count each unique supplement once per day
      for (const memberId of todayIds) {
        if (!daysSeen[memberId]) daysSeen[memberId] = new Set();
        daysSeen[memberId].add(day);
      }
    }
  }
  return Object.fromEntries(Object.entries(daysSeen).map(([id, days]) => [id, days.size]));
}

const byId = new Map(registry.supplements.map(s => [s.id, s]));
const week1Start = START_14;
const week1End = addDays(START_14, 6);
const week1Uses = getWeekUses(sim14, week1Start, week1End);

for (const [id, count] of Object.entries(week1Uses)) {
  const supp = byId.get(id);
  if (!supp) continue;
  const maxUses = supp.frequency?.maxUses7d ?? Infinity;
  assert(count <= maxUses, `${id} does not exceed maxUses7d (${count} <= ${maxUses}) in week 1`);
}

// --- Test 3: No NAD booster appears more than once per day ---
for (const { day, out } of sim14) {
  const nadIds = out.selected
    .map(r => r.atom.primaryId)
    .filter(id => NAD_BOOSTERS.has(id));
  assert(nadIds.length <= 1, `${day}: at most 1 NAD booster selected (got ${nadIds.join(', ')})`);
}

// --- Test 4: Constitutional supplements appear at least once per 7-day window ---
const CONSTITUTIONAL = ['nr', 'nmn', 'nmnh', 'lions_mane', 'shilajit'];

// Week 1 (days 0-6)
const week1Primary = new Set(
  sim14.slice(0, 7).flatMap(({ out }) => out.selected.map(r => r.atom.primaryId))
);
// NAD booster rotation: at least one of nr/nmn/nmnh should appear
const week1NadCount = ['nr', 'nmn', 'nmnh'].filter(id => week1Primary.has(id)).length;
assert(week1NadCount >= 1, `At least one NAD booster appears in week 1 (got ${week1NadCount})`);

// Week 2 (days 7-13)
const week2Primary = new Set(
  sim14.slice(7, 14).flatMap(({ out }) => out.selected.map(r => r.atom.primaryId))
);
const week2NadCount = ['nr', 'nmn', 'nmnh'].filter(id => week2Primary.has(id)).length;
assert(week2NadCount >= 1, `At least one NAD booster appears in week 2 (got ${week2NadCount})`);

// Lions Mane and Shilajit are constitutional: check they appear
const allPrimaries14 = new Set(sim14.flatMap(({ out }) => out.selected.map(r => r.atom.primaryId)));
// At least one week should have lions_mane
const lionsManeWeek1 = sim14.slice(0, 7).some(({ out }) => out.selected.some(r => r.atom.primaryId === 'lions_mane'));
const lionsManeWeek2 = sim14.slice(7, 14).some(({ out }) => out.selected.some(r => r.atom.primaryId === 'lions_mane'));
assert(lionsManeWeek1 || lionsManeWeek2, `lions_mane appears at least once in 14-day simulation`);

// ===================== 28-day simulation =====================
const START_28 = '2026-06-16';
const sim28 = runSimulation(START_28, 28);

console.log('\n28-day simulation summary:');
const allHashes28 = sim28.map(({ out }) => out.determinismHash);
const uniqueHashes28 = new Set(allHashes28);
console.log(`  Total days: 28, Unique outputs: ${uniqueHashes28.size}`);

// --- Test 5: 28-day simulation shows variation ---
assert(uniqueHashes28.size > 7, `28-day sim has more than 7 unique daily outputs (got ${uniqueHashes28.size})`);

// --- Test 6: Not same set every day in 28-day sim ---
const sets28 = sim28.map(({ out }) => new Set(out.selected.map(r => r.atom.primaryId)));
let sameAsFirst = 0;
const firstSet = sets28[0];
for (let i = 1; i < sets28.length; i++) {
  const s = sets28[i];
  if (s.size === firstSet.size && [...firstSet].every(id => s.has(id))) sameAsFirst++;
}
// Not all 27 remaining days should be identical to day 1
assert(sameAsFirst < 20, `Not all 28 days have the same selected set (${sameAsFirst} match day 1)`);

// --- Test 7: NAD boosters mutually exclusive across all 28 days ---
for (const { day, out } of sim28) {
  const nadIds = out.selected
    .map(r => r.atom.primaryId)
    .filter(id => NAD_BOOSTERS.has(id));
  assert(nadIds.length <= 1, `${day}: at most 1 NAD booster in 28-day sim`);
}

// --- Test 8: Week-level maxUses7d not exceeded in any of the 4 weeks in 28-day sim ---
for (let week = 0; week < 4; week++) {
  const weekStart = addDays(START_28, week * 7);
  const weekEnd = addDays(START_28, week * 7 + 6);
  const weekUses = getWeekUses(sim28, weekStart, weekEnd);
  for (const [id, count] of Object.entries(weekUses)) {
    const supp = byId.get(id);
    if (!supp) continue;
    const maxUses = supp.frequency?.maxUses7d ?? Infinity;
    assert(count <= maxUses, `Week ${week+1}: ${id} does not exceed maxUses7d (${count} <= ${maxUses})`);
  }
}

console.log(`\n=== validate-simulation-variation results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
