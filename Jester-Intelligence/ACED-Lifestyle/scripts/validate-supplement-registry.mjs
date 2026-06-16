#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const path = process.argv[2] || 'Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json';
const registry = JSON.parse(fs.readFileSync(path, 'utf8'));

function assert(cond, msg) {
  if (!cond) {
    console.error('Registry validation failed:', msg);
    process.exit(1);
  }
}

assert(registry.schemaVersion === 'ace_mind_supplement_registry.v1', 'schemaVersion mismatch');
assert(Array.isArray(registry.supplements) && registry.supplements.length >= 30, 'expected at least 30 supplements');

const ids = new Set();
const names = new Set();
for (const s of registry.supplements) {
  assert(/^[a-z0-9_]+$/.test(s.id), `bad id ${s.id}`);
  assert(!ids.has(s.id), `duplicate id ${s.id}`);
  ids.add(s.id);
  assert(!names.has(s.name.toLowerCase()), `duplicate name ${s.name}`);
  names.add(s.name.toLowerCase());
  assert(s.frequency.maxUses7d >= s.frequency.targetUses7d, `${s.id} max < target`);
  assert(s.frequency.minimumGapHours >= 0, `${s.id} negative gap`);
  assert(Array.isArray(s.timeWindows) && s.timeWindows.length > 0, `${s.id} missing time window`);
  assert(s.body && s.body.benefits && s.body.burdens, `${s.id} missing body vectors`);
}

const byId = Object.fromEntries(registry.supplements.map(s => [s.id, s]));
for (const id of ['nr','nmn','nmnh']) {
  assert(byId[id], `missing ${id}`);
  assert(byId[id].classes.includes('nad_booster'), `${id} not classed nad_booster`);
  assert(byId[id].pairing.requiredCompanions.includes('tmg'), `${id} missing TMG companion`);
  assert(byId[id].pairing.requiredCompanions.includes('magnesium_citrate'), `${id} missing Magnesium Citrate companion`);
}
assert(byId.ashwagandha.autoSelection === 'excluded', 'ashwagandha must be excluded');
assert(byId.fadogia_agrestis.autoSelection === 'manual_only', 'fadogia must be manual_only');
assert(byId.turkesterone.autoSelection === 'manual_only', 'turkesterone must be manual_only');
assert(byId.cordyceps.domains.body >= 2, 'cordyceps must be a body/physical candidate');
assert(byId.spermidine.frequency.targetUses7d === 2, 'spermidine target must be 2');
assert(byId.spirulina.frequency.targetUses7d === 2, 'spirulina target must be 2');
assert(byId.lions_mane.frequency.targetUses7d >= 3, "lion's mane target must be at least 3");
assert(byId.l_citrulline, 'missing L-Citrulline');

const canonical = JSON.stringify(registry);
const hash = crypto.createHash('sha256').update(canonical).digest('hex');
console.log(JSON.stringify({ ok: true, supplements: registry.supplements.length, hash }, null, 2));
