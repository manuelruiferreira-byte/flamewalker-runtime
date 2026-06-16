import {
  ENGINE_VERSION,
  BODY_PERMISSION_LABELS,
  assertSupplementRecord,
  normalizeBodyState,
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

  for (const axis of axes) {
    const state = normalizeBodyState(bodyState?.[axis]);
    const severity = Number(config.STATE_SEVERITY?.[state] ?? 1);
    const benefit = Number(benefits?.[axis] ?? 0);
    const burden = Number(burdens?.[axis] ?? 0);
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
