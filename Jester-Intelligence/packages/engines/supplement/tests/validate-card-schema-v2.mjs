// validate-card-schema-v2.mjs
// Tests for v2 registry card schema

import fs from 'node:fs';
import path from 'node:path';

const v2RegistryPath = process.argv[2]
  ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json', import.meta.url).pathname;

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

// Load v2 registry or use mocked supplements
let supplements;
let usingMock = false;

try {
  const data = JSON.parse(fs.readFileSync(v2RegistryPath, 'utf8'));
  supplements = data.supplements ?? [];
  console.log(`Loaded v2 registry from ${v2RegistryPath}: ${supplements.length} supplements`);
} catch (e) {
  console.log(`v2 registry not found at ${v2RegistryPath}, using mock supplements`);
  usingMock = true;
  // Mock 5 supplement cards with v2 schema
  supplements = [
    {
      id: 'nr',
      name: 'NR (Nicotinamide Riboside)',
      available: true,
      autoSelection: 'allowed',
      personalStatus: 'active',
      evidenceClass: 'baseline',
      criticalData: { doseKnown: true, productVerified: true, medicationInteractionChecked: true, labDependent: false },
      frequency: { targetUses7d: 2, maxUses7d: 3, minimumGapHours: 48, priorityTier: 'constitutional' },
      timeWindows: ['morning'],
      classes: ['nad_booster', 'brain_activation', 'methylation_driver'],
      functionalClasses: ['mitochondrial_energy', 'cognition', 'longevity_cellular_repair', 'methylation'],
      rotationFamily: 'nad_booster',
      body: { benefits: { brain: 3, energy_mitochondria: 3 }, burdens: {} },
      domains: { career: 2, study: 2, body: 1 },
      pairing: {
        requiredCompanions: ['tmg', 'magnesium_citrate'],
        preferredPairs: [],
        avoidSameDay: ['nmn', 'nmnh'],
        avoidSameSlot: [],
        redundantWith: ['nmn', 'nmnh']
      },
      esotericSignature: {
        astrology: { primaryPlanets: ['Sun', 'Mercury'], elements: ['Fire', 'Air'], planetaryHourAffinity: [] },
        bazi: { primaryElement: 'Fire', energeticDirection: 'ascending', seasonalAffinity: ['summer'] },
        numerology: { resonantNumbers: [1, 5], constructiveQualities: ['vitality', 'cognition'] },
        mayan: { dnaCount: 1, dreamspell: 'kin_1', cosmicCount: 1, tzolkinCholQij: 'imix' }
      },
      personalResponse: {
        responsePolarity: 'strongly_positive',
        notes: 'Excellent cellular energy response'
      },
      functions: {
        primary: ['mitochondrial_energy', 'cellular_repair'],
        secondary: ['cognition', 'methylation']
      },
      bodyAxes: {
        energy_mitochondria: { supportStrength: 3, burdenStrength: 0, confidence: 0.9 },
        brain: { supportStrength: 2, burdenStrength: 0, confidence: 0.8 }
      }
    },
    {
      id: 'nmn',
      name: 'NMN (Nicotinamide Mononucleotide)',
      available: true,
      autoSelection: 'allowed',
      personalStatus: 'active',
      evidenceClass: 'baseline',
      criticalData: { doseKnown: true, productVerified: true, medicationInteractionChecked: true, labDependent: false },
      frequency: { targetUses7d: 2, maxUses7d: 3, minimumGapHours: 48, priorityTier: 'constitutional' },
      timeWindows: ['morning'],
      classes: ['nad_booster', 'brain_activation'],
      functionalClasses: ['mitochondrial_energy', 'longevity_cellular_repair', 'methylation'],
      rotationFamily: 'nad_booster',
      body: { benefits: { brain: 3, energy_mitochondria: 3 }, burdens: {} },
      domains: { career: 2, study: 1, body: 1 },
      pairing: {
        requiredCompanions: ['tmg', 'magnesium_citrate'],
        preferredPairs: [],
        avoidSameDay: ['nr', 'nmnh'],
        avoidSameSlot: [],
        redundantWith: ['nr', 'nmnh']
      },
      esotericSignature: {
        astrology: { primaryPlanets: ['Sun'], elements: ['Fire'], planetaryHourAffinity: [] },
        bazi: { primaryElement: 'Fire', energeticDirection: 'ascending', seasonalAffinity: [] },
        numerology: { resonantNumbers: [1], constructiveQualities: ['vitality'] },
        mayan: { dnaCount: 2, dreamspell: 'kin_2', cosmicCount: 2, tzolkinCholQij: 'ik' }
      },
      personalResponse: {
        responsePolarity: 'positive',
        notes: ''
      },
      functions: {
        primary: ['mitochondrial_energy'],
        secondary: ['cognition']
      },
      bodyAxes: {
        energy_mitochondria: { supportStrength: 3, burdenStrength: 0, confidence: 0.9 }
      }
    },
    {
      id: 'nmnh',
      name: 'NMNH (Reduced NMN)',
      available: true,
      autoSelection: 'allowed',
      personalStatus: 'active',
      evidenceClass: 'mixed_human_evidence',
      criticalData: { doseKnown: true, productVerified: true, medicationInteractionChecked: true, labDependent: false },
      frequency: { targetUses7d: 1, maxUses7d: 2, minimumGapHours: 72, priorityTier: 'constitutional' },
      timeWindows: ['morning'],
      classes: ['nad_booster'],
      functionalClasses: ['mitochondrial_energy', 'antioxidant_support'],
      rotationFamily: 'nad_booster',
      body: { benefits: { energy_mitochondria: 3 }, burdens: {} },
      domains: { body: 1 },
      pairing: {
        requiredCompanions: ['tmg', 'magnesium_citrate'],
        preferredPairs: [],
        avoidSameDay: ['nr', 'nmn'],
        avoidSameSlot: [],
        redundantWith: ['nr', 'nmn']
      },
      esotericSignature: {
        astrology: { primaryPlanets: ['Sun'], elements: ['Fire'], planetaryHourAffinity: [] },
        bazi: { primaryElement: 'Fire', energeticDirection: 'ascending', seasonalAffinity: [] },
        numerology: { resonantNumbers: [3], constructiveQualities: ['repair'] },
        mayan: { dnaCount: 3, dreamspell: 'kin_3', cosmicCount: 3, tzolkinCholQij: 'akbal' }
      },
      personalResponse: {
        responsePolarity: 'positive',
        notes: ''
      },
      functions: {
        primary: ['mitochondrial_energy'],
        secondary: ['antioxidant_support']
      },
      bodyAxes: {
        energy_mitochondria: { supportStrength: 3, burdenStrength: 0, confidence: 0.85 }
      }
    },
    {
      id: 'cordyceps',
      name: 'Cordyceps',
      available: true,
      autoSelection: 'allowed',
      personalStatus: 'active',
      evidenceClass: 'traditional_or_preclinical',
      criticalData: { doseKnown: true, productVerified: false, medicationInteractionChecked: false, labDependent: false },
      frequency: { targetUses7d: 3, maxUses7d: 5, minimumGapHours: 0, priorityTier: 'maintenance' },
      timeWindows: ['morning', 'afternoon'],
      classes: ['immune_mushroom', 'mushroom'],
      functionalClasses: ['physical_energy', 'immune_modulation', 'respiratory_support'],
      body: { benefits: { energy_mitochondria: 2, respiration: 2, immune: 1 }, burdens: { nervous: 1 } },
      domains: { body: 2, career: 1 },
      pairing: {
        requiredCompanions: [],
        preferredPairs: [],
        avoidSameDay: [],
        avoidSameSlot: [],
        redundantWith: []
      },
      esotericSignature: {
        astrology: { primaryPlanets: ['Mars'], elements: ['Fire', 'Wood'], planetaryHourAffinity: ['vitality'] },
        bazi: { primaryElement: 'Wood', energeticDirection: 'upward', seasonalAffinity: ['spring'] },
        numerology: { resonantNumbers: [9], constructiveQualities: ['stamina', 'movement'] },
        mayan: { dnaCount: 9, dreamspell: 'kin_9', cosmicCount: 9, tzolkinCholQij: 'muluc' }
      },
      personalResponse: {
        responsePolarity: 'strongly_positive',
        notes: 'Strong physical energy response'
      },
      functions: {
        primary: ['physical_energy', 'respiratory_support'],
        secondary: ['immune_modulation']
      },
      bodyAxes: {
        energy_mitochondria: { supportStrength: 2, burdenStrength: 0, confidence: 0.7 },
        respiration: { supportStrength: 2, burdenStrength: 0, confidence: 0.7 },
        nervous: { supportStrength: 0, burdenStrength: 1, confidence: 0.5 }
      }
    },
    {
      id: 'ashwagandha',
      name: 'Ashwagandha',
      available: false,
      autoSelection: 'excluded',
      personalStatus: 'excluded',
      evidenceClass: 'mixed_human_evidence',
      criticalData: { doseKnown: false, productVerified: false, medicationInteractionChecked: false, labDependent: false },
      frequency: { targetUses7d: 0, maxUses7d: 0, minimumGapHours: 0, priorityTier: 'maintenance' },
      timeWindows: ['night'],
      classes: ['adaptogen'],
      functionalClasses: ['nervous_system_calming', 'endocrine_hormonal'],
      body: { benefits: { nervous: 2, endocrine: 1 }, burdens: { endocrine: 2 } },
      domains: { spirit: 1 },
      pairing: {
        requiredCompanions: [],
        preferredPairs: [],
        avoidSameDay: [],
        avoidSameSlot: [],
        redundantWith: []
      },
      esotericSignature: {
        astrology: { primaryPlanets: ['Saturn'], elements: ['Earth'], planetaryHourAffinity: [] },
        bazi: { primaryElement: 'Earth', energeticDirection: 'descending', seasonalAffinity: ['autumn'] },
        numerology: { resonantNumbers: [8], constructiveQualities: ['grounding'] },
        mayan: { dnaCount: 8, dreamspell: 'kin_8', cosmicCount: 8, tzolkinCholQij: 'lamat' }
      },
      personalResponse: {
        responsePolarity: 'negative',
        notes: 'Excluded due to hormonal sensitivity'
      },
      functions: {
        primary: ['nervous_system_calming'],
        secondary: ['endocrine_hormonal']
      },
      bodyAxes: {
        nervous: { supportStrength: 2, burdenStrength: 0, confidence: 0.6 },
        endocrine: { supportStrength: 1, burdenStrength: 2, confidence: 0.5 }
      }
    }
  ];
}

// --- Test 1: Each supplement has required sections ---
const requiredSections = ['id', 'name', 'available', 'personalStatus', 'evidenceClass', 'frequency',
  'body', 'pairing', 'personalResponse', 'functions', 'bodyAxes'];

for (const supp of supplements) {
  for (const section of requiredSections) {
    assert(section in supp, `${supp.id}: has required section '${section}'`);
  }
}

// --- Test 2: No supplement has 'block' as a field ---
const blockFields = ['block', 'blockId', 'blockName', 'blockNumber', 'blockAssignment'];
for (const supp of supplements) {
  for (const bf of blockFields) {
    assert(!(bf in supp), `${supp.id}: does not have field '${bf}'`);
  }
}

// --- Test 3: Esoteric section present with per-system data ---
for (const supp of supplements) {
  // v2 supplements use esotericSignature
  const hasEsotericSignature = 'esotericSignature' in supp;
  const hasLegacyEsoteric = 'esoteric' in supp;
  assert(hasEsotericSignature || hasLegacyEsoteric,
    `${supp.id}: has esotericSignature or esoteric section`);

  if (hasEsotericSignature) {
    const eso = supp.esotericSignature;
    for (const system of ['astrology', 'bazi', 'numerology', 'mayan']) {
      assert(system in eso, `${supp.id}: esotericSignature has '${system}' section`);
    }
  }
}

// --- Test 4: personalResponse section present ---
for (const supp of supplements) {
  assert('personalResponse' in supp, `${supp.id}: has personalResponse section`);
  if ('personalResponse' in supp) {
    assert('responsePolarity' in supp.personalResponse,
      `${supp.id}: personalResponse has responsePolarity`);
  }
}

// --- Test 5: functions section present ---
for (const supp of supplements) {
  assert('functions' in supp, `${supp.id}: has functions section`);
  if ('functions' in supp) {
    assert('primary' in supp.functions || 'secondary' in supp.functions,
      `${supp.id}: functions has primary or secondary`);
  }
}

// --- Test 6: bodyAxes section present ---
for (const supp of supplements) {
  assert('bodyAxes' in supp, `${supp.id}: has bodyAxes section`);
  if ('bodyAxes' in supp && typeof supp.bodyAxes === 'object') {
    for (const [axis, entry] of Object.entries(supp.bodyAxes ?? {})) {
      assert('supportStrength' in entry || 'burdenStrength' in entry,
        `${supp.id}.bodyAxes.${axis}: has supportStrength or burdenStrength`);
    }
  }
}

// --- Test 7: NR has responsePolarity "strongly_positive" ---
const nr = supplements.find(s => s.id === 'nr');
if (nr && nr.personalResponse) {
  assertEqual(nr.personalResponse.responsePolarity, 'strongly_positive',
    'NR has responsePolarity "strongly_positive"');
} else if (nr) {
  assert(false, 'NR is missing personalResponse section');
} else {
  assert(true, 'NR not in this registry (skipping)');
}

// --- Test 8: Cordyceps has responsePolarity "strongly_positive" ---
const cordyceps = supplements.find(s => s.id === 'cordyceps');
if (cordyceps && cordyceps.personalResponse) {
  assertEqual(cordyceps.personalResponse.responsePolarity, 'strongly_positive',
    'Cordyceps has responsePolarity "strongly_positive"');
} else if (cordyceps) {
  assert(false, 'Cordyceps is missing personalResponse section');
} else {
  assert(true, 'Cordyceps not in this registry (skipping)');
}

// --- Test 9: Ashwagandha has personalStatus "excluded" ---
const ashwagandha = supplements.find(s => s.id === 'ashwagandha');
if (ashwagandha) {
  assertEqual(ashwagandha.personalStatus, 'excluded', 'Ashwagandha has personalStatus "excluded"');
} else {
  assert(true, 'Ashwagandha not in this registry (skipping)');
}

// --- Test 10: NAD boosters are in rotationFamily "nad_booster" ---
const nadBoosters = supplements.filter(s => ['nr', 'nmn', 'nmnh'].includes(s.id));
for (const nad of nadBoosters) {
  if ('rotationFamily' in nad) {
    assertEqual(nad.rotationFamily, 'nad_booster',
      `${nad.id}: rotationFamily is "nad_booster"`);
  } else if ((nad.classes ?? []).includes('nad_booster')) {
    assert(true, `${nad.id}: has nad_booster class (v1 format)`);
  } else {
    assert(false, `${nad.id}: is not identified as nad_booster`);
  }
}

// --- Test 11: NR's requiredCompanions includes "tmg" and "magnesium_citrate" ---
if (nr && nr.pairing) {
  const companions = nr.pairing.requiredCompanions ?? [];
  assert(companions.includes('tmg'), 'NR requiredCompanions includes "tmg"');
  assert(companions.includes('magnesium_citrate'), 'NR requiredCompanions includes "magnesium_citrate"');
} else if (nr) {
  assert(false, 'NR is missing pairing section');
}

console.log(`\n=== validate-card-schema-v2 results${usingMock ? ' (MOCK DATA)' : ''} ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
