import {
  ENGINE_VERSION,
  BODY_PERMISSION_LABELS,
  AXIS_COLORS,
  assertSupplementRecord,
  normalizeBodyState,
  clamp,
  quantize
} from './contracts.mjs';

export const DEFAULT_BODY_CONFIG = Object.freeze({
  STATE_SEVERITY: Object.freeze({ green: 0, yellow: 1, orange: 2, red: 3, unknown: 1 }),
  CONDITIONAL_BURDEN: 2,
  HOLD_BURDEN: 4,
  QUANTIZE: 1e-4
});

export function evaluateBodyPermission(supplement, bodyState = {}, config = DEFAULT_BODY_CONFIG) {
  assertSupplementRecord(supplement);

  if (!supplement.available || supplement.autoSelection === 'excluded') {
    return Object.freeze({
      engine: 'body_permission', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
      label: BODY_PERMISSION_LABELS.EXCLUDED, benefitVec: supplement.body?.benefits ?? {},
      burdenVec: supplement.body?.burdens ?? {}, supportScore: 0, burdenScore: 0,
      bindingAxes: [], reasonTrail: ['Unavailable or personally excluded.']
    });
  }
  if (supplement.autoSelection === 'manual_only') {
    return Object.freeze({
      engine: 'body_permission', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
      label: BODY_PERMISSION_LABELS.HOLD, benefitVec: supplement.body?.benefits ?? {},
      burdenVec: supplement.body?.burdens ?? {}, supportScore: 0, burdenScore: 0,
      bindingAxes: [], reasonTrail: ['Manual-only research lane.']
    });
  }

  const benefits = supplement.body?.benefits ?? {};
  const burdens = supplement.body?.burdens ?? {};
  const axes = [...new Set([...Object.keys(benefits), ...Object.keys(burdens), ...Object.keys(bodyState ?? {})])].sort();
  let supportScore = 0;
  let burdenScore = 0;
  const bindingAxes = [];
  const unknownAxes = [];

  // v2 bodyAxes support: if supplement has bodyAxes, use per-axis supportStrength/burdenStrength
  const bodyAxes = supplement.bodyAxes ?? null;

  for (const axis of axes) {
    const state = normalizeBodyState(bodyState?.[axis]);
    const severity = Number(config.STATE_SEVERITY?.[state] ?? 1);

    let benefit, burden;
    if (bodyAxes && bodyAxes[axis]) {
      // v2: use bodyAxes with confidence weighting
      const axisEntry = bodyAxes[axis];
      const confidence = clamp(Number(axisEntry.confidence ?? 1));
      benefit = Number(axisEntry.supportStrength ?? 0) * confidence;
      burden = Number(axisEntry.burdenStrength ?? 0) * confidence;
    } else {
      // v1: use body.benefits / body.burdens
      benefit = Number(benefits?.[axis] ?? 0);
      burden = Number(burdens?.[axis] ?? 0);
    }

    supportScore += benefit * severity;
    burdenScore += burden * severity;
    if (burden > 0 && severity >= 2) bindingAxes.push({ axis, state, burden, weightedBurden: burden * severity });
    if (state === 'unknown' && (benefit > 0 || burden > 0)) unknownAxes.push(axis);
  }

  let label = BODY_PERMISSION_LABELS.CLEAR;
  if (burdenScore >= config.HOLD_BURDEN || bindingAxes.some(x => x.state === 'red' && x.burden >= 2)) {
    label = BODY_PERMISSION_LABELS.HOLD;
  } else if (burdenScore >= config.CONDITIONAL_BURDEN || unknownAxes.length) {
    label = BODY_PERMISSION_LABELS.CONDITIONAL;
  }

  const reasonTrail = [`Body permission ${label}.`];
  if (bindingAxes.length) reasonTrail.push(`Burden axes: ${bindingAxes.map(x => `${x.axis}:${x.state}`).join(', ')}.`);
  if (unknownAxes.length) reasonTrail.push(`Unknown body axes: ${unknownAxes.join(', ')}.`);
  if (supportScore > 0) reasonTrail.push(`Support score ${quantize(supportScore, config.QUANTIZE)}.`);

  return Object.freeze({
    engine: 'body_permission', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
    label, benefitVec: { ...benefits }, burdenVec: { ...burdens },
    supportScore: quantize(supportScore, config.QUANTIZE),
    burdenScore: quantize(burdenScore, config.QUANTIZE),
    bindingAxes: bindingAxes.sort((a, b) => a.axis.localeCompare(b.axis)),
    unknownAxes: unknownAxes.sort(), reasonTrail
  });
}

export function evaluateBodyRegistry(registry, bodyState, config = DEFAULT_BODY_CONFIG) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateBodyPermission(s, bodyState, config)])
  );
}

/**
 * Determine axis color based on support/burden strengths and personal response.
 *
 * @param {number} supportStrength
 * @param {number} burdenStrength
 * @param {number} personalResponseModifier - positive = good, negative = bad. 0 = neutral
 * @returns {'green'|'blue'|'yellow'|'orange'|'red'}
 */
export function axisColor(supportStrength, burdenStrength, personalResponseModifier = 0) {
  const support = Number(supportStrength ?? 0);
  const burden = Number(burdenStrength ?? 0);
  const personal = Number(personalResponseModifier ?? 0);

  // red: burden >= 3 or personal veto
  if (burden >= 3 || personal < -0.5) return AXIS_COLORS.RED;
  // orange: burden >= 2 or caution
  if (burden >= 2 || (burden >= 1 && personal < 0)) return AXIS_COLORS.ORANGE;
  // green: support >= 2 and burden == 0 and personal positive
  if (support >= 2 && burden === 0 && personal >= 0) return AXIS_COLORS.GREEN;
  // blue: support >= 1 and burden <= 1
  if (support >= 1 && burden <= 1) return AXIS_COLORS.BLUE;
  // yellow: neutral or unknown
  return AXIS_COLORS.YELLOW;
}

/**
 * Evaluate cumulative body burden across a set of selected supplements.
 *
 * @param {object[]} selectedSupplements - array of supplement registry cards
 * @param {object} bodyState - Map of axis => body state (green/yellow/orange/red)
 * @param {object} config
 * @returns {{ cumulativeBurden: Object.<string,number>, overloadedAxes: string[], totalBurdenScore: number }}
 */
export function evaluateCumulativeBodyBurden(selectedSupplements, bodyState = {}, config = DEFAULT_BODY_CONFIG) {
  const cumulativeBurden = {};
  const cumulativeSupport = {};

  for (const supplement of selectedSupplements) {
    const bodyAxes = supplement.bodyAxes ?? null;
    const burdens = supplement.body?.burdens ?? {};
    const benefits = supplement.body?.benefits ?? {};

    if (bodyAxes) {
      // v2: per-axis with confidence weighting
      for (const [axis, entry] of Object.entries(bodyAxes)) {
        const confidence = clamp(Number(entry.confidence ?? 1));
        const burden = Number(entry.burdenStrength ?? 0) * confidence;
        const support = Number(entry.supportStrength ?? 0) * confidence;
        cumulativeBurden[axis] = (cumulativeBurden[axis] ?? 0) + burden;
        cumulativeSupport[axis] = (cumulativeSupport[axis] ?? 0) + support;
      }
    } else {
      // v1
      for (const [axis, value] of Object.entries(burdens)) {
        cumulativeBurden[axis] = (cumulativeBurden[axis] ?? 0) + Number(value ?? 0);
      }
      for (const [axis, value] of Object.entries(benefits)) {
        cumulativeSupport[axis] = (cumulativeSupport[axis] ?? 0) + Number(value ?? 0);
      }
    }
  }

  const overloadedAxes = Object.entries(cumulativeBurden)
    .filter(([, v]) => v >= Number(config.HOLD_BURDEN ?? 4))
    .map(([axis]) => axis)
    .sort();

  const totalBurdenScore = Object.values(cumulativeBurden).reduce((sum, v) => sum + v, 0);

  return Object.freeze({
    cumulativeBurden: Object.fromEntries(Object.entries(cumulativeBurden).sort(([a], [b]) => a.localeCompare(b))),
    cumulativeSupport: Object.fromEntries(Object.entries(cumulativeSupport).sort(([a], [b]) => a.localeCompare(b))),
    overloadedAxes,
    totalBurdenScore: quantize(totalBurdenScore, config.QUANTIZE ?? 1e-4)
  });
}
