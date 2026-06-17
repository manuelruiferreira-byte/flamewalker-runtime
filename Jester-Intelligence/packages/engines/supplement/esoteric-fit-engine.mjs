import {
  ENGINE_VERSION,
  ESOTERIC_LABELS,
  assertSupplementRecord,
  clamp,
  quantize,
  stableUnique
} from './contracts.mjs';

export const DEFAULT_ESOTERIC_CONFIG = Object.freeze({
  SYSTEM_WEIGHTS: Object.freeze({ astrology: 0.35, bazi: 0.30, numerology: 0.20, mayan: 0.15 }),
  DAY_SCALAR_WEIGHT: 0.25,
  TAG_MATCH_WEIGHT: 0.75,
  QUANTIZE: 1e-4,
  THRESHOLDS: Object.freeze({ PRIME: 0.82, STRONG: 0.64, COMPATIBLE: 0.42, LOW_RESONANCE: 0.20 })
});

function supplementTags(supplement) {
  const eso = supplement.esoteric ?? {};
  return stableUnique([...(eso.planets ?? []), ...(eso.elements ?? []), ...(eso.qualities ?? [])]);
}

function tagOverlapScore(supplementTagList, dayTags) {
  const day = new Set(stableUnique(dayTags));
  if (!supplementTagList.length || !day.size) return 0;
  let matches = 0;
  for (const tag of supplementTagList) if (day.has(tag)) matches += 1;
  return clamp(matches / Math.max(1, Math.min(3, supplementTagList.length)));
}

function labelForScalar(scalar, thresholds) {
  if (scalar >= thresholds.PRIME) return ESOTERIC_LABELS.PRIME;
  if (scalar >= thresholds.STRONG) return ESOTERIC_LABELS.STRONG;
  if (scalar >= thresholds.COMPATIBLE) return ESOTERIC_LABELS.COMPATIBLE;
  if (scalar >= thresholds.LOW_RESONANCE) return ESOTERIC_LABELS.LOW_RESONANCE;
  return ESOTERIC_LABELS.DISCORDANT;
}

function convergenceBand(count) {
  if (count >= 4) return 'Gold';
  if (count === 3) return 'High';
  if (count === 2) return 'Medium';
  if (count === 1) return 'Low';
  return 'None';
}

export function evaluateEsotericFit(supplement, dayField = {}, config = DEFAULT_ESOTERIC_CONFIG) {
  assertSupplementRecord(supplement);
  const tags = supplementTags(supplement);
  const components = {};
  let weighted = 0;
  let totalWeight = 0;
  const supportSystems=[];

  for (const system of ['astrology', 'bazi', 'numerology', 'mayan']) {
    const weight = Number(config.SYSTEM_WEIGHTS?.[system] ?? 0);
    const signal = dayField?.[system] ?? {};
    const dayScalar = clamp(signal.scalar ?? 0.5);
    const overlap = tagOverlapScore(tags, signal.tags ?? []);
    const score = clamp(
      Number(config.DAY_SCALAR_WEIGHT ?? 0.25) * dayScalar
      + Number(config.TAG_MATCH_WEIGHT ?? 0.75) * overlap
    );
    const signalTags = new Set(stableUnique(signal.tags ?? []));
    const matchedTags=tags.filter(tag => signalTags.has(tag)).sort();
    if(matchedTags.length)supportSystems.push(system);
    components[system] = {
      scalar: quantize(score, config.QUANTIZE),
      dayScalar: quantize(dayScalar, config.QUANTIZE),
      tagMatch: quantize(overlap, config.QUANTIZE),
      matchedTags
    };
    weighted += score * weight;
    totalWeight += weight;
  }

  const scalar = quantize(totalWeight > 0 ? weighted / totalWeight : 0, config.QUANTIZE);
  const label = labelForScalar(scalar, config.THRESHOLDS);
  const convergenceCount=supportSystems.length;
  const band=convergenceBand(convergenceCount);
  return Object.freeze({
    engine: 'esoteric_fit', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
    label,
    scalar,
    convergenceCount,
    convergenceTotal:4,
    convergenceBand:band,
    supportSystems:Object.freeze([...supportSystems]),
    components,
    reasonTrail: [`Esoteric fit ${label} (${scalar.toFixed(4)}); convergence ${band} ${convergenceCount}/4.`]
  });
}

export function evaluateEsotericRegistry(registry, dayField, config = DEFAULT_ESOTERIC_CONFIG) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateEsotericFit(s, dayField, config)])
  );
}
