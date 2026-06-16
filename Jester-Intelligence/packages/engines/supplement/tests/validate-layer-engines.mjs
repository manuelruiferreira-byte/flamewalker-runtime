import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  evaluateEsotericFit,
  evaluateEsotericRegistry,
  evaluateBodyPermission,
  evaluateBodyRegistry,
  evaluateFrequencyPersistence,
  evaluateFrequencyRegistry,
  evaluatePairingCompatibility,
  evaluatePairingRegistry,
  resolveRequiredGroup,
  ESOTERIC_LABELS,
  BODY_PERMISSION_LABELS,
  FREQUENCY_STATES,
  PAIRING_STATES
} from '../index.mjs';

const registryPath = process.argv[2] ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const byId = new Map(registry.supplements.map(s => [s.id, s]));

function dayField(scalar, tags = []) {
  return {
    astrology: { scalar, tags },
    bazi: { scalar, tags },
    numerology: { scalar, tags },
    mayan: { scalar, tags }
  };
}

const cordyceps = byId.get('cordyceps');
const high = evaluateEsotericFit(cordyceps, dayField(1, ['mars', 'fire', 'stamina', 'movement']));
const low = evaluateEsotericFit(cordyceps, dayField(0, ['moon', 'water', 'sleep']));
assert.ok(high.scalar > low.scalar);
assert.equal(high.label, ESOTERIC_LABELS.PRIME);
assert.notEqual(low.label, ESOTERIC_LABELS.PRIME);
assert.deepEqual(evaluateEsotericFit(cordyceps, dayField(1, ['mars', 'fire', 'stamina', 'movement'])), high);

const bodyHold = evaluateBodyPermission(cordyceps, { nervous: 'red', sleep: 'red', heart: 'orange', gut: 'green' });
assert.equal(bodyHold.label, BODY_PERMISSION_LABELS.HOLD);
assert.equal(high.label, ESOTERIC_LABELS.PRIME);
const greenBody = Object.fromEntries(registry.bodySystems.map(x => [x, 'green']));
assert.equal(evaluateBodyPermission(cordyceps, greenBody).label, BODY_PERMISSION_LABELS.CLEAR);
assert.equal(evaluateBodyPermission(byId.get('ashwagandha'), {}).label, BODY_PERMISSION_LABELS.EXCLUDED);
assert.equal(evaluateBodyPermission(byId.get('fadogia_agrestis'), {}).label, BODY_PERMISSION_LABELS.HOLD);

const lionsMane = byId.get('lions_mane');
assert.equal(evaluateFrequencyPersistence(lionsMane, '2026-06-16', ['2026-06-16']).state, FREQUENCY_STATES.COOLING_DOWN);
const due = evaluateFrequencyPersistence(lionsMane, '2026-06-21', ['2026-06-16']);
assert.equal(due.state, FREQUENCY_STATES.DUE);
assert.ok(due.urgency >= 0.55);
assert.equal(
  evaluateFrequencyPersistence(lionsMane, '2026-06-20', ['2026-06-16', '2026-06-18', '2026-06-19']).state,
  FREQUENCY_STATES.COMPLETE
);
assert.equal(
  evaluateFrequencyPersistence(byId.get('shilajit'), '2026-06-21', ['2026-06-16', '2026-06-19']).state,
  FREQUENCY_STATES.COMPLETE
);

const nr = byId.get('nr');
const nrMissing = evaluatePairingCompatibility(nr, registry, []);
assert.equal(nrMissing.state, PAIRING_STATES.COMPANION_REQUIRED);
assert.deepEqual(nrMissing.unresolvedCompanions, ['magnesium_citrate', 'tmg']);
assert.equal(evaluatePairingCompatibility(nr, registry, ['tmg', 'magnesium_citrate']).state, PAIRING_STATES.COMPLETE);
assert.deepEqual(resolveRequiredGroup('nr', registry), ['magnesium_citrate', 'nr', 'tmg']);
assert.equal(
  evaluatePairingCompatibility(byId.get('nmnh'), registry, ['cordyceps', 'tmg', 'magnesium_citrate']).state,
  PAIRING_STATES.CONFLICT
);

const esoAll = evaluateEsotericRegistry(registry, dayField(0.7, ['sun', 'mercury', 'fire', 'focus']));
const bodyAll = evaluateBodyRegistry(registry, greenBody);
const freqAll = evaluateFrequencyRegistry(registry, '2026-06-16', {});
const pairAll = evaluatePairingRegistry(registry, []);
for (const id of byId.keys()) {
  assert.ok(esoAll[id]);
  assert.ok(bodyAll[id]);
  assert.ok(freqAll[id]);
  assert.ok(pairAll[id]);
  assert.ok(Number.isFinite(esoAll[id].scalar));
  JSON.stringify([esoAll[id], bodyAll[id], freqAll[id], pairAll[id]]);
}

console.log(JSON.stringify({
  ok: true,
  supplements: registry.supplements.length,
  engines: ['esoteric_fit', 'body_permission', 'frequency_persistence', 'pairing_compatibility'],
  checks: 24
}, null, 2));
