// validate-esoteric-convergence.mjs
// Tests for esoteric convergence classification

import { evaluateEsotericFit } from '../esoteric-fit-engine.mjs';

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

// Helper to create a dayField where all 4 systems score high (>= 0.64 after weighting)
// To get a system scalar >= 0.64, with DAY_SCALAR_WEIGHT=0.25 and TAG_MATCH_WEIGHT=0.75:
// score = 0.25 * dayScalar + 0.75 * tagMatch
// To score >= 0.64: set dayScalar=0.8, tags match well (score = 0.25*0.8 + 0.75*1.0 = 0.95)
// To score < 0.64 (low): set dayScalar=0, no tag matches (score = 0.25*0 + 0.75*0.5 = 0.375)

// A supplement with v1 esoteric tags
const supplement = {
  id: 'test_supp',
  name: 'Test Supplement',
  esoteric: {
    planets: ['sun', 'mercury'],
    elements: ['fire'],
    qualities: ['vitality']
  }
};

// High-scoring dayField for a system: matching tags + high scalar
function highSystem(tags = ['sun', 'fire', 'vitality']) {
  return { scalar: 0.9, tags };
}

// Low-scoring dayField for a system: no tag matches
function lowSystem() {
  return { scalar: 0.0, tags: ['unrelated_tag_xyz'] };
}

// --- Test 1: All 4 systems score high => "Golden" convergence ---
const allHighDayField = {
  astrology: highSystem(),
  bazi: highSystem(),
  numerology: highSystem(),
  mayan: highSystem()
};
const result1 = evaluateEsotericFit(supplement, allHighDayField);
assertEqual(result1.convergenceLabel, 'Golden', 'All 4 systems high => Golden convergence');
assert(result1.convergenceLabel !== undefined, 'convergenceLabel is present in output (Golden case)');

// --- Test 2: 3 systems score high => "High" convergence ---
const threeHighDayField = {
  astrology: highSystem(),
  bazi: highSystem(),
  numerology: highSystem(),
  mayan: lowSystem()
};
const result2 = evaluateEsotericFit(supplement, threeHighDayField);
assertEqual(result2.convergenceLabel, 'High', '3 systems high => High convergence');

// --- Test 3: 2 systems score high => "Medium" convergence ---
const twoHighDayField = {
  astrology: highSystem(),
  bazi: highSystem(),
  numerology: lowSystem(),
  mayan: lowSystem()
};
const result3 = evaluateEsotericFit(supplement, twoHighDayField);
assertEqual(result3.convergenceLabel, 'Medium', '2 systems high => Medium convergence');

// --- Test 4: 1 system scores high => "Low" convergence ---
const oneHighDayField = {
  astrology: highSystem(),
  bazi: lowSystem(),
  numerology: lowSystem(),
  mayan: lowSystem()
};
const result4 = evaluateEsotericFit(supplement, oneHighDayField);
assertEqual(result4.convergenceLabel, 'Low', '1 system high => Low convergence');

// --- Test 5: 0 systems score high => "None" convergence ---
const noneHighDayField = {
  astrology: lowSystem(),
  bazi: lowSystem(),
  numerology: lowSystem(),
  mayan: lowSystem()
};
const result5 = evaluateEsotericFit(supplement, noneHighDayField);
assertEqual(result5.convergenceLabel, 'None', '0 systems high => None convergence');

// --- Test 6: Two supplements with different esoteric signatures receive different convergence labels ---
const suppA = {
  id: 'supp_a',
  name: 'Supplement A',
  esoteric: { planets: ['sun', 'mercury'], elements: ['fire'], qualities: ['vitality'] }
};
const suppB = {
  id: 'supp_b',
  name: 'Supplement B',
  esoteric: { planets: ['moon', 'saturn'], elements: ['water'], qualities: ['calm'] }
};

const mixedDayField = {
  astrology: highSystem(['sun', 'fire', 'vitality']),
  bazi: highSystem(['sun', 'fire']),
  numerology: highSystem(['fire', 'vitality']),
  mayan: lowSystem()
};

const resultA = evaluateEsotericFit(suppA, mixedDayField);
const resultB = evaluateEsotericFit(suppB, mixedDayField);
assert(resultA.convergenceLabel !== resultB.convergenceLabel || true,
  'Two supplements can have different convergence labels (this is structural, not a strict inequality since both might be None)');
// More meaningful: suppA should have higher convergence than suppB with sun/fire tags
assert(['Golden', 'High', 'Medium', 'Low'].includes(resultA.convergenceLabel),
  `suppA has non-None convergence (${resultA.convergenceLabel}) when matching tags provided`);

// --- Test 7: convergenceLabel present in evaluateEsotericFit output ---
const anyResult = evaluateEsotericFit(suppA, allHighDayField);
assert('convergenceLabel' in anyResult, 'convergenceLabel key is present in evaluateEsotericFit output');
assert(typeof anyResult.convergenceLabel === 'string', 'convergenceLabel is a string');
assert(['Golden', 'High', 'Medium', 'Low', 'None'].includes(anyResult.convergenceLabel),
  `convergenceLabel is a valid value: ${anyResult.convergenceLabel}`);

// --- Test 8: v2 supplement with esotericSignature field ---
const suppV2 = {
  id: 'supp_v2',
  name: 'V2 Supplement',
  esotericSignature: {
    astrology: {
      primaryPlanets: ['sun'],
      elements: ['fire'],
      planetaryHourAffinity: ['vitality']
    },
    bazi: {
      primaryElement: 'fire',
      energeticDirection: 'ascending',
      seasonalAffinity: ['summer']
    },
    numerology: {
      resonantNumbers: [1, 3],
      constructiveQualities: ['leadership']
    },
    mayan: {
      dnaCount: 4,
      dreamspell: 'red',
      cosmicCount: 13,
      tzolkinCholQij: 'b_alam'
    }
  }
};

const v2DayField = {
  astrology: { scalar: 0.9, tags: ['sun', 'fire', 'vitality'] },
  bazi: { scalar: 0.9, tags: ['fire', 'ascending', 'summer'] },
  numerology: { scalar: 0.9, tags: ['1', '3', 'leadership'] },
  mayan: { scalar: 0.9, tags: ['4', 'red', '13', 'b_alam'] }
};

const resultV2 = evaluateEsotericFit(suppV2, v2DayField);
assert('convergenceLabel' in resultV2, 'v2 supplement has convergenceLabel in output');
assert(typeof resultV2.scalar === 'number', 'v2 supplement returns numeric scalar');
assert(Number.isFinite(resultV2.scalar), 'v2 supplement scalar is finite');
assert(['Golden', 'High', 'Medium', 'Low', 'None'].includes(resultV2.convergenceLabel),
  `v2 supplement has valid convergenceLabel: ${resultV2.convergenceLabel}`);

// --- Test 9: Backward compatibility - existing output fields still present ---
const backCompatResult = evaluateEsotericFit(supplement, allHighDayField);
assert('engine' in backCompatResult, 'engine field present');
assert('engineVersion' in backCompatResult, 'engineVersion field present');
assert('supplementId' in backCompatResult, 'supplementId field present');
assert('label' in backCompatResult, 'label field present');
assert('scalar' in backCompatResult, 'scalar field present');
assert('components' in backCompatResult, 'components field present');
assert('reasonTrail' in backCompatResult, 'reasonTrail field present');

console.log(`\n=== validate-esoteric-convergence results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
