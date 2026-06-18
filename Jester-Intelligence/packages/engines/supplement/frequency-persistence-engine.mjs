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

function stableHash(value) {
  let hash=2166136261;
  for (const char of String(value)) {
    hash^=char.codePointAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

const ROTATION_PATTERNS=Object.freeze({
  0:Object.freeze([]),
  1:Object.freeze([0]),
  2:Object.freeze([0,3]),
  3:Object.freeze([0,2,4]),
  4:Object.freeze([0,2,4,6]),
  5:Object.freeze([0,1,3,4,6]),
  6:Object.freeze([0,1,2,3,4,5]),
  7:Object.freeze([0,1,2,3,4,5,6])
});

function rotationCadence(supplementId, date, targetUses7d) {
  const weekStart=mondayOf(date);
  const count=Math.max(0,Math.min(7,Math.round(Number(targetUses7d ?? 0))));
  const offset=stableHash(`${supplementId}:${weekStart}`)%7;
  const slots=(ROTATION_PATTERNS[count] ?? ROTATION_PATTERNS[7])
    .map(slot=>(slot+offset)%7)
    .sort((a,b)=>a-b);
  const dayIndex=Math.max(0,Math.min(6,daysBetween(weekStart,date)));
  return {weekStart,offset,slots,dayIndex,eligible:count>=7||slots.includes(dayIndex)};
}

function cadenceFor(supplement,date,targetUses7d){
  const enabled=supplement.protocolPolicy?.practicalTimingAuthority===true
    && String(supplement.protocolPolicy?.version??'').startsWith('ace_mind_supplement_policy.v3');
  if(enabled)return {enabled,...rotationCadence(supplement.id,date,targetUses7d)};
  const weekStart=mondayOf(date);
  return {enabled:false,weekStart,offset:0,slots:[0,1,2,3,4,5,6],dayIndex:Math.max(0,Math.min(6,daysBetween(weekStart,date))),eligible:true};
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
  const weeklyLimited = f.weeklyLimited === true || Number.isFinite(Number(f.rollingWindowDays));
  const rollingWindowDays = Math.max(1, Number(f.rollingWindowDays ?? 7));
  const automaticFrequencyBoost = f.automaticFrequencyBoost !== false;
  const cadence=cadenceFor(supplement,date,targetUses7d);

  const common={
    engine:'frequency_persistence',engineVersion:ENGINE_VERSION,supplementId:supplement.id,
    targetUses7d,maxUses7d,priorityTier,rotationGroup,groupTargetUses7d,
    weeklyLimited,rollingWindowDays:weeklyLimited?rollingWindowDays:null,
    automaticFrequencyBoost,rotationCadenceEnabled:cadence.enabled,calendarEligible:cadence.eligible,
    calendarSlots:cadence.slots,calendarDayIndex:cadence.dayIndex,rotationWeekStart:cadence.weekStart
  };

  if (!supplement.available || supplement.autoSelection === 'excluded') {
    return Object.freeze({...common,state:FREQUENCY_STATES.EXCLUDED,urgency:0,minGapMet:false,usesThisWindow:0,daysLeftInWindow:0,lastTakenDate:null,reasonTrail:['Excluded.']});
  }
  if (supplement.autoSelection === 'manual_only') {
    return Object.freeze({...common,state:FREQUENCY_STATES.MANUAL_ONLY,urgency:0,minGapMet:false,usesThisWindow:0,daysLeftInWindow:0,lastTakenDate:null,calendarEligible:false,reasonTrail:['Manual-only.']});
  }

  const history = normalizeHistory(takenHistory);
  const windowStart = weeklyLimited ? addDays(date, -(rollingWindowDays - 1)) : mondayOf(date);
  const windowEnd = weeklyLimited ? date : addDays(windowStart, 6);
  const inWindow = history.filter(d => d >= windowStart && d <= date);
  const usesThisWindow = inWindow.length;
  const daysLeftInWindow = weeklyLimited ? 1 : Math.max(0, daysBetween(date, windowEnd) + 1);
  const lastTakenDate = lastOnOrBefore(history, date);
  const gapHours = lastTakenDate ? daysBetween(lastTakenDate, date) * 24 : Infinity;
  const minGapMet = gapHours >= minimumGapHours;
  const residualActive = lastTakenDate !== null && gapHours < residualWindowHours;
  const effectiveRepeatGapHours = Math.max(minimumGapHours, residualWindowHours);
  const eligibleOpportunitiesRemaining = eligibleOpportunityCount(date, windowEnd, effectiveRepeatGapHours, lastTakenDate);
  const base = { usesThisWindow, daysLeftInWindow, eligibleOpportunitiesRemaining, targetUses7d, maxUses7d, minGapMet };
  const rawUrgency = frequencyUrgency(base, config);
  const urgency = (!automaticFrequencyBoost || !cadence.eligible)
    ? 0
    : quantize(rawUrgency ?? 0, config.QUANTIZE);

  let state;
  let reason;
  if (usesThisWindow >= maxUses7d) {
    state = FREQUENCY_STATES.COMPLETE; reason = weeklyLimited ? `Rolling ${rollingWindowDays}-day maximum reached.` : 'Weekly maximum reached.';
  } else if (!minGapMet) {
    state = FREQUENCY_STATES.COOLING_DOWN; reason = `Minimum gap ${minimumGapHours}h not reached.`;
  } else if (residualActive) {
    state = FREQUENCY_STATES.RESIDUAL; reason = `Residual window ${residualWindowHours}h active.`;
  } else if (usesThisWindow >= targetUses7d && targetUses7d > 0) {
    state = FREQUENCY_STATES.COMPLETE; reason = 'Weekly target complete.';
  } else if (automaticFrequencyBoost && cadence.eligible && urgency >= 0.55) {
    state = FREQUENCY_STATES.DUE; reason = cadence.enabled ? 'Deadline-pressured target on an eligible rotation day.' : 'Deadline-pressured frequency target.';
  } else {
    state = FREQUENCY_STATES.OPTIONAL;
    if (!automaticFrequencyBoost) reason = 'Eligible only for a current-day reason; automatic frequency boost disabled.';
    else if (cadence.enabled && !cadence.eligible) reason = 'Off-cycle rotation day; requires exceptional current-day fit.';
    else if (cadence.enabled) reason = 'Eligible rotation day with comfortable weekly slack.';
    else reason = 'Eligible with comfortable weekly slack.';
  }

  return Object.freeze({
    ...common,state,urgency,minGapMet,residualActive,
    usesThisWindow,daysLeftInWindow,eligibleOpportunitiesRemaining,windowStart,windowEnd,
    lastTakenDate,minimumGapHours,residualWindowHours,effectiveRepeatGapHours,
    persistenceClass:f.persistenceClass ?? 'unknown_conservative',
    reasonTrail:[reason]
  });
}

export function evaluateFrequencyRegistry(registry, day, historyById = {}, config = DEFAULT_FREQUENCY_CONFIG) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateFrequencyPersistence(s, day, historyById?.[s.id] ?? [], config)])
  );
}
