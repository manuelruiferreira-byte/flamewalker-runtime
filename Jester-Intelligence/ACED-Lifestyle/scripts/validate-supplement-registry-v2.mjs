#!/usr/bin/env node
// Validates the canonical v2 supplement registry.
// Enforces the same governance invariants as v1 PLUS the v2 canonical-card
// sections (personal response, functions, body-axis matrix, esoteric signature).
import fs from 'node:fs';
import crypto from 'node:crypto';

const path = process.argv[2] || 'Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json';
const registry = JSON.parse(fs.readFileSync(path, 'utf8'));

function assert(cond, msg) {
  if (!cond) {
    console.error('Registry v2 validation failed:', msg);
    process.exit(1);
  }
}

// --- Registry-level ---
assert(registry.schemaVersion === 'ace_mind_supplement_registry.v2', 'schemaVersion must be ace_mind_supplement_registry.v2');
assert(Array.isArray(registry.supplements) && registry.supplements.length >= 30, 'expected at least 30 supplements');
assert(Array.isArray(registry.bodySystems) && registry.bodySystems.length >= 13, 'missing bodySystems');
assert(Array.isArray(registry.functionAxes) && registry.functionAxes.length >= 10, 'missing functionAxes');

// --- Per-supplement governance + v2 canonical sections ---
const ids = new Set();
const names = new Set();
const frequencyTiers = new Set(['constitutional', 'governed', 'conditional', 'maintenance']);
const polarities = new Set(['strongly_positive', 'positive', 'neutral', 'mixed', 'negative', 'unknown']);

for (const s of registry.supplements) {
  // Governance (shared with v1)
  assert(/^[a-z0-9_]+$/.test(s.id), `bad id ${s.id}`);
  assert(!ids.has(s.id), `duplicate id ${s.id}`);
  ids.add(s.id);
  assert(!names.has(s.name.toLowerCase()), `duplicate name ${s.name}`);
  names.add(s.name.toLowerCase());
  assert(s.frequency.maxUses7d >= s.frequency.targetUses7d, `${s.id} max < target`);
  assert(s.frequency.minimumGapHours >= 0, `${s.id} negative gap`);
  assert(frequencyTiers.has(s.frequency.priorityTier), `${s.id} missing/invalid frequency priority tier`);
  assert(Array.isArray(s.timeWindows) && s.timeWindows.length > 0, `${s.id} missing time window`);
  assert(s.body && s.body.benefits && s.body.burdens, `${s.id} missing body vectors`);

  // v2 canonical sections
  assert(s.personalResponse && polarities.has(s.personalResponse.responsePolarity), `${s.id} missing/invalid personalResponse.responsePolarity`);
  assert(s.functions && (Array.isArray(s.functions.primary) || Array.isArray(s.functions.secondary)), `${s.id} missing functions.primary/secondary`);
  assert(Array.isArray(s.functionalClasses), `${s.id} missing top-level functionalClasses`);
  assert(s.bodyAxes && typeof s.bodyAxes === 'object', `${s.id} missing bodyAxes`);
  for (const [axis, entry] of Object.entries(s.bodyAxes)) {
    assert('supportStrength' in entry || 'burdenStrength' in entry, `${s.id}.bodyAxes.${axis} missing strengths`);
  }
  assert(s.esotericSignature && typeof s.esotericSignature === 'object', `${s.id} missing esotericSignature`);
  for (const system of ['astrology', 'bazi', 'numerology', 'mayan']) {
    assert(system in s.esotericSignature, `${s.id}.esotericSignature missing ${system}`);
  }
  assert(s.stackingProfile && Array.isArray(s.stackingProfile.functionalClasses), `${s.id} missing stackingProfile.functionalClasses`);
  assert(s.planetaryHourProfile && typeof s.planetaryHourProfile === 'object', `${s.id} missing planetaryHourProfile`);
  assert(s.display && typeof s.display === 'object', `${s.id} missing display`);

  // No block residue
  for (const bf of ['block', 'blockId', 'blockName', 'blockNumber', 'blockAssignment']) {
    assert(!(bf in s), `${s.id} carries forbidden block field '${bf}'`);
  }
}

// --- NAD rotation governance ---
const byId = Object.fromEntries(registry.supplements.map(s => [s.id, s]));
for (const id of ['nr', 'nmn', 'nmnh']) {
  assert(byId[id], `missing ${id}`);
  assert(byId[id].classes.includes('nad_booster'), `${id} not classed nad_booster`);
  assert(byId[id].rotationFamily === 'nad_booster', `${id} missing rotationFamily nad_booster`);
  assert(byId[id].pairing.requiredCompanions.includes('tmg'), `${id} missing TMG companion`);
  assert(byId[id].pairing.requiredCompanions.includes('magnesium_citrate'), `${id} missing Magnesium Citrate companion`);
  assert(byId[id].frequency.priorityTier === 'constitutional', `${id} must be constitutional`);
  assert(byId[id].frequency.rotationGroup === 'nad_booster', `${id} missing NAD rotation group`);
  assert(byId[id].frequency.groupTargetUses7d === 5, `${id} NAD group target must be 5`);
}

// --- Personal-status governance ---
assert(byId.ashwagandha.autoSelection === 'excluded', 'ashwagandha must be excluded');
assert(byId.ashwagandha.personalResponse.responsePolarity === 'negative', 'ashwagandha response must be negative');
assert(byId.fadogia_agrestis.autoSelection === 'manual_only', 'fadogia must be manual_only');
assert(byId.turkesterone.autoSelection === 'manual_only', 'turkesterone must be manual_only');
assert(byId.cordyceps.domains.body >= 2, 'cordyceps must be a body/physical candidate');
assert(byId.cordyceps.frequency.priorityTier === 'conditional', 'cordyceps must be conditional');
assert(byId.cordyceps.personalResponse.responsePolarity === 'strongly_positive', 'cordyceps response must be strongly_positive');
assert(byId.nr.personalResponse.responsePolarity === 'strongly_positive', 'nr response must be strongly_positive');
assert(byId.shilajit.frequency.priorityTier === 'constitutional', 'shilajit must be constitutional');
assert(byId.lions_mane.frequency.priorityTier === 'constitutional', "lion's mane must be constitutional");
assert(byId.spermidine.frequency.targetUses7d === 2, 'spermidine target must be 2');
assert(byId.spirulina.frequency.targetUses7d === 2, 'spirulina target must be 2');
assert(byId.spermidine.frequency.priorityTier === 'governed', 'spermidine must be governed');
assert(byId.spirulina.frequency.priorityTier === 'governed', 'spirulina must be governed');
assert(byId.lions_mane.frequency.targetUses7d >= 3, "lion's mane target must be at least 3");
assert(byId.l_citrulline, 'missing L-Citrulline');

// --- Weekly-limited herb governance ---
const expectedWeekly = ['ashwagandha', 'fadogia_agrestis', 'gotu_kola', 'reishi', 'turkesterone'];
const grp = registry.weeklyLimitedHerbs;
assert(grp && typeof grp === 'object', 'missing weeklyLimitedHerbs group');
assert(JSON.stringify([...(grp.members ?? [])].sort()) === JSON.stringify(expectedWeekly), 'weeklyLimitedHerbs members mismatch');
assert(grp.maxUsesPerRolling7Days === 1, 'weeklyLimitedHerbs.maxUsesPerRolling7Days must be 1');
assert(grp.automaticFrequencyBoost === false, 'weeklyLimitedHerbs.automaticFrequencyBoost must be false');
assert(grp.missedWeekRequiresMakeup === false, 'weeklyLimitedHerbs.missedWeekRequiresMakeup must be false');
assert(grp.permanentHighlightAllowed === false, 'weeklyLimitedHerbs.permanentHighlightAllowed must be false');
for (const id of expectedWeekly) {
  const f = byId[id]?.frequency ?? {};
  assert(f.weeklyLimited === true, `${id} must be weeklyLimited`);
  assert(f.maxUses7d === 1, `${id} maxUses7d must be 1`);
  assert(f.rollingWindowDays === 7, `${id} rollingWindowDays must be 7`);
  assert(f.automaticFrequencyBoost === false, `${id} automaticFrequencyBoost must be false`);
  assert(f.missedWeekRequiresMakeup === false, `${id} missedWeekRequiresMakeup must be false`);
  assert(f.permanentHighlightAllowed === false, `${id} permanentHighlightAllowed must be false`);
}
// Weekly-capped herbs must not auto-cluster with each other on the same day.
for (const id of expectedWeekly) {
  const avoid = new Set(byId[id].pairing.avoidSameDay ?? []);
  for (const other of expectedWeekly) {
    if (other !== id) assert(avoid.has(other), `${id} must avoid ${other} same day`);
  }
}
// One mineral-biomass product per day.
for (const id of ['spirulina', 'irish_sea_moss', 'shilajit']) {
  const avoid = new Set(byId[id].pairing.avoidSameDay ?? []);
  for (const other of ['spirulina', 'irish_sea_moss', 'shilajit']) {
    if (other !== id) assert(avoid.has(other), `${id} must avoid ${other} same day (one mineral-biomass per day)`);
  }
}

const canonical = JSON.stringify(registry);
const hash = crypto.createHash('sha256').update(canonical).digest('hex');
console.log(JSON.stringify({ ok: true, schemaVersion: registry.schemaVersion, supplements: registry.supplements.length, hash }, null, 2));
