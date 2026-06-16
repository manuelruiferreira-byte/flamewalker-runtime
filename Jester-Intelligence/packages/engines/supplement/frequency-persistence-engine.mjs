import {
  ENGINE_VERSION,
  FREQUENCY_STATES,
  addDays,
  assertSupplementRecord,
  clamp,
  daysBetween,
  isoDate,
  mondayOf,
  quantize
} from './contracts.mjs';

export const DEFAULT_FREQUENCY_CONFIG = Object.freeze({
  FREQ_BASE_LOW: 0.20,
  FREQ_BASE_HIGH: 1.00,
  FREQ_COMFORTABLE_SLACK: 2,
  QUANTIZE: 1e-4
});

function normalizeHistory(history = []) {
  return [...new Set((history ?? []).map(entry => isoDate(typeof entry === 'string' ? entry : entry?.date)))].sort();
}

function lastOnOrBefore(history, day) {
  return [...history].filter(d => d <= day).sort().at(-1) ?? null;
}

function eligibleOpportunityCount(day, windowEnd, minimumGapHours, lastTakenDate) {
  const gapDays = Math.max(1, Math.ceil(Number(minimumGapHours ?? 0) / 24));
  let first = day;
  if (lastTakenDate) {
    const earliest = addDays(lastTakenDate, gapDays);
    if (earliest > first) first = earliest;
  }
  if (first > windowEnd) return 0;
  return Math.floor(daysBetween(first, windowEnd) / gapDays) + 1;
}

export function frequencyUrgency({ usesThisWindow, daysLeftInWindow, eligibleOpportunitiesRemaining, targetUses7d, maxUses7d, minGapMet }, config = DEFAULT_FREQUENCY_CONFIG) {
  if (usesThisWindow >= maxUses7d || !minGapMet) return null;
  const usesRemaining = Math.max(0, targetUses7d - usesThisWindow);
  if (usesRemaining === 0) return 0;
  const opportunities = Number.isFinite(Number(eligibleOpportunitiesRemaining))
    ? Number(eligibleOpportunitiesRemaining)
    : daysLeftInWindow;
  const slack = opportunities - usesRemaining;
  if (slack >= config.FREQ_COMFORTABLE_SLACK) return quantize(config.FREQ_BASE_LOW, config.QUANTIZE);
  const t = clamp((config.FREQ_COMFORTABLE_SLACK - slack) / (config.FREQ_COMFORTABLE_SLACK + 1));
  const pressured = t * t;
  return quantize(config.FREQ_BASE_LOW + (config.FREQ_BASE_HIGH - config.FREQ_BASE_LOW) * pressured, config.QUANTIZE);
}

export function evaluateFrequencyPersistence(supplement, day, takenHistory = [], config = DEFAULT_FREQUENCY_CONFIG) {
  assertSupplementRecord(supplement);
  const date = isoDate(day);
  const f = supplement.frequency ?? {};
  const targetUses7d = Number(f.targetUses7d ?? 0);
  const maxUses7d = Number(f.maxUses7d ?? targetUses7d);
  const priorityTier = f.priorityTier ?? 'maintenance';
  const rotationGroup = f.rotationGroup ?? null;
  const groupTargetUses7d = Number(f.groupTargetUses7d ?? 0);
  const minimumGapHours = Number(f.minimumGapHours ?? 0);
  const residualWindowHours = Number(f.residualWindowHours ?? 0);

  if (!supplement.available || supplement.autoSelection === 'excluded') {
    return Object.freeze({ engine: 'frequency_persistence', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
      state: FREQUENCY_STATES.EXCLUDED, urgency: 0, minGapMet: false, usesThisWindow: 0,
      targetUses7d, maxUses7d, priorityTier, rotationGroup, groupTargetUses7d, daysLeftInWindow: 0, lastTakenDate: null, reasonTrail: ['Excluded.'] });
  }
  if (supplement.autoSelection === 'manual_only') {
    return Object.freeze({ engine: 'frequency_persistence', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
      state: FREQUENCY_STATES.MANUAL_ONLY, urgency: 0, minGapMet: false, usesThisWindow: 0,
      targetUses7d, maxUses7d, priorityTier, rotationGroup, groupTargetUses7d, daysLeftInWindow: 0, lastTakenDate: null, reasonTrail: ['Manual-only.'] });
  }

  const history = normalizeHistory(takenHistory);
  const windowStart = mondayOf(date);
  const windowEnd = addDays(windowStart, 6);
  const inWindow = history.filter(d => d >= windowStart && d <= date);
  const usesThisWindow = inWindow.length;
  const daysLeftInWindow = Math.max(0, daysBetween(date, windowEnd) + 1);
  const lastTakenDate = lastOnOrBefore(history, date);
  const gapHours = lastTakenDate ? daysBetween(lastTakenDate, date) * 24 : Infinity;
  const minGapMet = gapHours >= minimumGapHours;
  const residualActive = lastTakenDate !== null && gapHours < residualWindowHours;
  const effectiveRepeatGapHours = Math.max(minimumGapHours, residualWindowHours);
  const eligibleOpportunitiesRemaining = eligibleOpportunityCount(date, windowEnd, effectiveRepeatGapHours, lastTakenDate);
  const base = { usesThisWindow, daysLeftInWindow, eligibleOpportunitiesRemaining, targetUses7d, maxUses7d, minGapMet };
  const urgency = frequencyUrgency(base, config);

  let state;
  let reason;
  if (usesThisWindow >= maxUses7d) {
    state = FREQUENCY_STATES.COMPLETE; reason = 'Weekly maximum reached.';
  } else if (!minGapMet) {
    state = FREQUENCY_STATES.COOLING_DOWN; reason = `Minimum gap ${minimumGapHours}h not reached.`;
  } else if (residualActive) {
    state = FREQUENCY_STATES.RESIDUAL; reason = `Residual window ${residualWindowHours}h active.`;
  } else if (usesThisWindow >= targetUses7d) {
    state = FREQUENCY_STATES.COMPLETE; reason = 'Weekly target complete.';
  } else if ((urgency ?? 0) >= 0.55) {
    state = FREQUENCY_STATES.DUE; reason = 'Deadline-pressured frequency target.';
  } else {
    state = FREQUENCY_STATES.OPTIONAL; reason = 'Eligible with comfortable weekly slack.';
  }

  return Object.freeze({
    engine: 'frequency_persistence', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
    state, urgency: quantize(urgency ?? 0, config.QUANTIZE), minGapMet, residualActive,
    usesThisWindow, targetUses7d, maxUses7d, priorityTier, rotationGroup, groupTargetUses7d,
    daysLeftInWindow, eligibleOpportunitiesRemaining, windowStart, windowEnd,
    lastTakenDate, minimumGapHours, residualWindowHours, effectiveRepeatGapHours, persistenceClass: f.persistenceClass ?? 'unknown_conservative',
    reasonTrail: [reason]
  });
}

export function evaluateFrequencyRegistry(registry, day, historyById = {}, config = DEFAULT_FREQUENCY_CONFIG) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateFrequencyPersistence(s, day, historyById?.[s.id] ?? [], config)])
  );
}
