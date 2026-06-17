// validate-block-free.mjs
// Constitutional test: ACE Mind supplements are card-registry-driven and block-free.

import fs from 'node:fs';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays
} from '../index.mjs';

const registryPath = process.argv[2]
  ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json', import.meta.url).pathname;
const appPath = new URL('../../../../../ACED-Lifestyle/ace-mind.html', import.meta.url).pathname;
const liveModulePath = new URL('../../../../../ACED-Lifestyle/shared/optimizer/ace-mind-optimizer-live-v2.mjs', import.meta.url).pathname;
const visibleRendererPath = new URL('../../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-renderer.mjs', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const appSource = fs.readFileSync(appPath, 'utf8');
const liveSource = fs.readFileSync(liveModulePath, 'utf8');
const visibleRendererSource = fs.readFileSync(visibleRendererPath, 'utf8');

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

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const brace = source.indexOf('{', start);
  if (brace < 0) return '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return '';
}

const greenBody = Object.fromEntries(registry.bodySystems.map(axis => [axis, 'green']));
const NAD_BOOSTERS = ['nr', 'nmn', 'nmnh'];
const BLOCK_KEYS = ['block', 'blockId', 'selectedBlock', 'blockAssignment', 'blockName', 'blockNumber'];

function dayField(scalar = 0.78, tags = ['sun', 'mercury', 'fire', 'focus', 'vitality']) {
  return {
    astrology: { scalar, tags },
    bazi: { scalar, tags },
    numerology: { scalar, tags },
    mayan: { scalar, tags }
  };
}

function inputFor(day, histories = {}, body = greenBody) {
  return {
    day,
    registry,
    daySignals: { career: 1, study: 0.9, creative: 0.7, body: 0.5 },
    layers: {
      esoteric: evaluateEsotericRegistry(registry, dayField()),
      body: evaluateBodyRegistry(registry, body),
      frequency: evaluateFrequencyRegistry(registry, day, histories),
      pairing: evaluatePairingRegistry(registry, [])
    },
    config: {}
  };
}

function hasBlockField(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 10) return false;
  for (const key of Object.keys(obj)) {
    if (BLOCK_KEYS.includes(key)) return true;
    if (Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        if (hasBlockField(item, depth + 1)) return true;
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasBlockField(obj[key], depth + 1)) return true;
    }
  }
  return false;
}

// 1. Optimizer outputs must never contain supplement-block fields.
const baseDay = '2026-06-16';
const baseOutput = optimize(inputFor(baseDay));
assert(!hasBlockField(baseOutput), 'Optimizer output has no supplement-block fields');
for (const rec of baseOutput.selected) {
  for (const key of BLOCK_KEYS) {
    assert(!(key in rec), `Selected record for ${rec.atom.primaryId} has no '${key}' field`);
    assert(!(key in (rec.atom ?? {})), `Selected atom for ${rec.atom.primaryId} has no '${key}' field`);
  }
}

// 2. Seven consecutive days must not collapse into one repeated result.
const DAYS_7 = Array.from({ length: 7 }, (_, i) => addDays(baseDay, i));
const outputs7 = DAYS_7.map(day => optimize(inputFor(day)));
for (let i = 0; i < outputs7.length; i++) {
  assert(!hasBlockField(outputs7[i]), `Day ${DAYS_7[i]} output has no supplement-block fields`);
}
const hashes = outputs7.map(o => o.determinismHash);
const uniqueHashes = new Set(hashes);
assert(uniqueHashes.size > 1, `Outputs vary across seven days (${uniqueHashes.size} unique hashes)`);

// 3. NAD-family exclusivity remains constitutional.
for (let i = 0; i < outputs7.length; i++) {
  const selectedNads = outputs7[i].selected
    .map(r => r.atom.primaryId)
    .filter(id => NAD_BOOSTERS.includes(id));
  assert(selectedNads.length <= 1, `Day ${DAYS_7[i]} selects at most one NAD booster`);
}

// 4. The visible chamber must be owned only by the live individual optimizer.
const renderClubs = functionBody(appSource, 'renderClubs');
const tickSupp = functionBody(appSource, 'tickSupp');
const setBody = functionBody(appSource, 'setBody');
assert(renderClubs.length > 0, 'renderClubs exists');
assert(!/g\.block|BLOCKS|blockAssignment|fwFreezeBlock|groupSupps/.test(renderClubs), 'renderClubs cannot render legacy supplement blocks');
assert(!/blockAssignment|fwFreezeBlock|finalBlock|selectedBlock/.test(tickSupp), 'tickSupp cannot write or freeze supplement blocks');
assert(!/blockAssignment|fwFreezeBlock|finalBlock|selectedBlock/.test(setBody), 'setBody cannot write or freeze supplement blocks');
assert(/ace-mind-optimizer-live-v2\.mjs/.test(appSource), 'ACE Mind imports the live individual optimizer directly');
assert(!/ace-mind-optimizer-shadow\.mjs/.test(appSource), 'ACE Mind does not load the shadow bridge as visible authority');
assert(/supplement-registry\.v2\.json/.test(liveSource), 'Live optimizer uses the v2 card registry');
assert(!/g\.block\.items|groupSupps\(/.test(liveSource), 'Live optimizer has no legacy block renderer');

// 5. Visible block labels and controls must be removed whenever the optimizer renders.
assert(/individual card optimizer/.test(visibleRendererSource), 'Visible renderer declares individual card optimizer authority');
assert(/year-block-label/.test(visibleRendererSource), 'Visible renderer targets stale Year Map block labels for removal');
assert(/alt-block-card/.test(visibleRendererSource), 'Visible renderer targets stale alternative-block controls for removal');
assert(/\.remove\(\)/.test(visibleRendererSource), 'Visible renderer physically removes stale block UI nodes');
assert(!/Block \$\{model\.|supplement block/.test(visibleRendererSource), 'Visible renderer emits no supplement block label');

// 6. Regression tripwires for the exact failure that produced identical days.
assert(/currentDate\(\)/.test(liveSource), 'Live optimizer reads the selected date');
assert(/inputHash/.test(liveSource), 'Live optimizer hashes the complete live context');
assert(/date-race/.test(liveSource), 'Live optimizer rejects selected-day races');

console.log(`\n=== validate-block-free results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('Failures:');
  for (const failure of failures) console.log(` - ${failure}`);
  process.exit(1);
}
