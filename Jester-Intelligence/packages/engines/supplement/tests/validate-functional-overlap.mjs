// validate-functional-overlap.mjs
// Tests for the functional overlap engine

import {
  evaluateFunctionalOverlap,
  updateCoveredFunctions,
  evaluateOverlapRegistry
} from '../functional-overlap-engine.mjs';

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

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    const msg = `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`;
    failures.push(msg);
    console.error(`FAIL: ${msg}`);
  }
}

// Mock supplements with overlapping function classes
const cognitiveA = {
  id: 'cognitive_a',
  name: 'Cognitive A',
  classes: ['brain_activation']  // => cognition, focus, memory
};

const cognitiveB = {
  id: 'cognitive_b',
  name: 'Cognitive B',
  classes: ['brain_activation']  // same functional classes
};

const cognitiveC = {
  id: 'cognitive_c',
  name: 'Cognitive C',
  classes: ['brain_activation', 'nootropic']  // overlapping + additional overlap
};

const energyOnly = {
  id: 'energy_only',
  name: 'Energy Only',
  classes: ['nad_booster']  // => mitochondrial_energy, longevity_cellular_repair, methylation — unique class
};

const mechA = {
  id: 'mech_a',
  name: 'Mechanism A',
  functionalClasses: ['cognition']
};

const mechB = {
  id: 'mech_b',
  name: 'Mechanism B',
  functionalClasses: ['memory']  // different sub-class, same broad category
};

// --- Test 1: First supplement in a function class has minimal overlap penalty ---
const emptyMap = new Map();
const result1 = evaluateFunctionalOverlap(cognitiveA, emptyMap);
assert(result1.marginalValue > 0.8, 'First supplement has high marginal value (>0.8)');
assert(result1.overlapPenalty < 0.2, `First supplement has low overlap penalty (<0.2), got ${result1.overlapPenalty}`);
assert(result1.uniqueContribution.length > 0, 'First supplement has unique contribution');
assert(result1.coveredClasses.length === 0, 'First supplement has no already-covered classes');

// --- Test 2: Second supplement in same function class has higher overlap penalty ---
let covered1 = updateCoveredFunctions(emptyMap, cognitiveA);
const result2 = evaluateFunctionalOverlap(cognitiveB, covered1);
assert(result2.overlapPenalty > result1.overlapPenalty, `Second supplement has higher penalty than first (${result2.overlapPenalty} > ${result1.overlapPenalty})`);
assert(result2.marginalValue < result1.marginalValue, `Second supplement has lower marginal value (${result2.marginalValue} < ${result1.marginalValue})`);
assert(result2.coveredClasses.length > 0, 'Second supplement has covered classes');

// --- Test 3: Third supplement in same function class has highest penalty ---
let covered2 = updateCoveredFunctions(covered1, cognitiveB);
const result3 = evaluateFunctionalOverlap(cognitiveC, covered2);
assert(result3.overlapPenalty > result2.overlapPenalty, `Third supplement has highest penalty (${result3.overlapPenalty} > ${result2.overlapPenalty})`);
assert(result3.marginalValue < result2.marginalValue, `Third supplement has lowest marginal value (${result3.marginalValue} < ${result2.marginalValue})`);

// --- Test 4: Supplement in unique function class has no (or low) overlap penalty ---
const covered_cognitive = updateCoveredFunctions(updateCoveredFunctions(emptyMap, cognitiveA), cognitiveB);
const resultEnergy = evaluateFunctionalOverlap(energyOnly, covered_cognitive);
assert(resultEnergy.overlapPenalty === 0, `Unique-class supplement has zero overlap penalty, got ${resultEnergy.overlapPenalty}`);
assert(resultEnergy.marginalValue === 1, `Unique-class supplement has marginalValue of 1, got ${resultEnergy.marginalValue}`);
assert(resultEnergy.uniqueContribution.length > 0, 'Unique-class supplement has unique contribution');

// --- Test 5: Two supplements with different mechanisms in same broad class can both be selected ---
const resultMechA = evaluateFunctionalOverlap(mechA, emptyMap);
const coveredMechA = updateCoveredFunctions(emptyMap, mechA);
const resultMechB = evaluateFunctionalOverlap(mechB, coveredMechA);
assert(resultMechA.marginalValue === 1, `mechA (unique) has marginalValue 1, got ${resultMechA.marginalValue}`);
assert(resultMechB.marginalValue === 1, `mechB (different class) has marginalValue 1, got ${resultMechB.marginalValue}`);
assert(resultMechA.overlapPenalty === 0, `mechA has no overlap penalty, got ${resultMechA.overlapPenalty}`);
assert(resultMechB.overlapPenalty === 0, `mechB has no overlap penalty with mechA, got ${resultMechB.overlapPenalty}`);

// --- Test 6: updateCoveredFunctions correctly increments coverage counts ---
const startMap = new Map();
const afterA = updateCoveredFunctions(startMap, cognitiveA);
// cognitiveA has brain_activation => cognition, focus, memory
assert(afterA.has('cognition'), 'Coverage map has cognition after adding cognitiveA');
assert(afterA.has('focus'), 'Coverage map has focus after adding cognitiveA');
assert(afterA.has('memory'), 'Coverage map has memory after adding cognitiveA');
assertEqual(afterA.get('cognition'), 1, 'cognition count is 1 after first supplement');

const afterB = updateCoveredFunctions(afterA, cognitiveB);
assertEqual(afterB.get('cognition'), 2, 'cognition count is 2 after second supplement in same class');
assertEqual(afterB.get('focus'), 2, 'focus count is 2 after second supplement in same class');
assertEqual(afterB.get('memory'), 2, 'memory count is 2 after second supplement in same class');

const afterEnergy = updateCoveredFunctions(afterB, energyOnly);
assertEqual(afterEnergy.get('cognition'), 2, 'cognition count unchanged after unrelated supplement');
assert(afterEnergy.has('mitochondrial_energy'), 'mitochondrial_energy added by energyOnly');
assertEqual(afterEnergy.get('mitochondrial_energy'), 1, 'mitochondrial_energy count is 1');

// --- Test 7: v2 supplement with functionalClasses field ---
const v2Supplement = {
  id: 'v2_supp',
  name: 'V2 Supplement',
  functionalClasses: ['cognition', 'focus', 'antioxidant_support']
};
const emptyMap2 = new Map();
const resultV2First = evaluateFunctionalOverlap(v2Supplement, emptyMap2);
assert(resultV2First.marginalValue === 1, `v2 supplement first has marginalValue 1, got ${resultV2First.marginalValue}`);

const coveredWithCognitiveA = updateCoveredFunctions(emptyMap2, cognitiveA);
const resultV2Second = evaluateFunctionalOverlap(v2Supplement, coveredWithCognitiveA);
assert(resultV2Second.overlapPenalty > 0, `v2 supplement with overlap has penalty > 0, got ${resultV2Second.overlapPenalty}`);
assert(resultV2Second.marginalValue < 1, `v2 supplement with overlap has marginalValue < 1, got ${resultV2Second.marginalValue}`);
// antioxidant_support is still unique
assert(resultV2Second.uniqueContribution.includes('antioxidant_support'), 'antioxidant_support is still unique contribution');

// --- Test 8: COVERAGE_MARGINAL array has expected behavior ---
// 1st: 1.0, 2nd: 0.4, 3rd: 0.1, 4th+: 0.0
const singleClass = { id: 's1', name: 'S1', functionalClasses: ['cognition'] };
const s1Map0 = new Map();
const s1Map1 = new Map([['cognition', 1]]);
const s1Map2 = new Map([['cognition', 2]]);
const s1Map3 = new Map([['cognition', 3]]);
const r0 = evaluateFunctionalOverlap(singleClass, s1Map0);
const r1 = evaluateFunctionalOverlap(singleClass, s1Map1);
const r2 = evaluateFunctionalOverlap(singleClass, s1Map2);
const r3 = evaluateFunctionalOverlap(singleClass, s1Map3);
assertEqual(r0.marginalValue, 1.0, 'marginalValue 1.0 for 0 existing coverage');
assertEqual(r1.marginalValue, 0.4, 'marginalValue 0.4 for 1 existing coverage');
assertEqual(r2.marginalValue, 0.1, 'marginalValue 0.1 for 2 existing coverage');
assertEqual(r3.marginalValue, 0.0, 'marginalValue 0.0 for 3+ existing coverage');

console.log(`\n=== validate-functional-overlap results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
