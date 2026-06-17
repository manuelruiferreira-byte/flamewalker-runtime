import {
  ENGINE_VERSION,
  ESOTERIC_LABELS,
  ESOTERIC_CONVERGENCE_LABELS,
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

// --- v1 tag extraction ---
function supplementTagsV1(supplement) {
  const eso = supplement.esoteric ?? {};
  return stableUnique([...(eso.planets ?? []), ...(eso.elements ?? []), ...(eso.qualities ?? [])]);
}

// --- v2 per-system tag extraction ---
function supplementTagsV2ForSystem(supplement, system) {
  const eso = supplement.esotericSignature ?? {};
  const section = eso[system] ?? {};
  switch (system) {
    case 'astrology':
      return stableUnique([
        ...(section.primaryPlanets ?? []),
        ...(section.elements ?? []),
        ...(section.planetaryHourAffinity ?? [])
      ]);
    case 'bazi':
      return stableUnique([
        ...(section.primaryElement ? [section.primaryElement] : []),
        ...(section.energeticDirection ? [section.energeticDirection] : []),
        ...(section.seasonalAffinity ?? [])
      ]);
    case 'numerology':
      return stableUnique([
        ...(section.resonantNumbers ?? []).map(String),
        ...(section.constructiveQualities ?? [])
      ]);
    case 'mayan':
      return stableUnique([
        ...(section.dnaCount ? [String(section.dnaCount)] : []),
        ...(section.dreamspell ? [section.dreamspell] : []),
        ...(section.cosmicCount ? [String(section.cosmicCount)] : []),
        ...(section.tzolkinCholQij ? [section.tzolkinCholQij] : [])
      ]);
    default:
      return [];
  }
}

function isV2(supplement) {
  return 'esotericSignature' in supplement;
}

// Card tags are canonical proper nouns (e.g. "Mars", "Fire"); day-signal tags
// arrive normalized to lowercase tokens. Match case-insensitively so canonical
// card data resonates with normalized day signals.
function lc(tag) {
  return String(tag ?? '').toLowerCase();
}

function tagOverlapScore(supplementTagList, dayTags) {
  const day = new Set(stableUnique(dayTags).map(lc));
  if (!supplementTagList.length || !day.size) return 0.5;
  let matches = 0;
  for (const tag of supplementTagList) if (day.has(lc(tag))) matches += 1;
  return clamp(matches / Math.max(1, Math.min(3, supplementTagList.length)));
}

function labelForScalar(scalar, thresholds) {
  if (scalar >= thresholds.PRIME) return ESOTERIC_LABELS.PRIME;
  if (scalar >= thresholds.STRONG) return ESOTERIC_LABELS.STRONG;
  if (scalar >= thresholds.COMPATIBLE) return ESOTERIC_LABELS.COMPATIBLE;
  if (scalar >= thresholds.LOW_RESONANCE) return ESOTERIC_LABELS.LOW_RESONANCE;
  return ESOTERIC_LABELS.DISCORDANT;
}

function convergenceLabelForSystems(systemScores, threshold) {
  const strongCount = Object.values(systemScores).filter(s => s >= threshold).length;
  if (strongCount >= 4) return ESOTERIC_CONVERGENCE_LABELS.GOLDEN;
  if (strongCount === 3) return ESOTERIC_CONVERGENCE_LABELS.HIGH;
  if (strongCount === 2) return ESOTERIC_CONVERGENCE_LABELS.MEDIUM;
  if (strongCount === 1) return ESOTERIC_CONVERGENCE_LABELS.LOW;
  return ESOTERIC_CONVERGENCE_LABELS.NONE;
}

export function evaluateEsotericFit(supplement, dayField = {}, config = DEFAULT_ESOTERIC_CONFIG) {
  assertSupplementRecord(supplement);
  const v2 = isV2(supplement);

  // For v1, precompute unified tag list once
  const v1Tags = v2 ? [] : supplementTagsV1(supplement);

  const components = {};
  const systemScalars = {};
  let weighted = 0;
  let totalWeight = 0;

  for (const system of ['astrology', 'bazi', 'numerology', 'mayan']) {
    const weight = Number(config.SYSTEM_WEIGHTS?.[system] ?? 0);
    const signal = dayField?.[system] ?? {};
    const dayScalar = clamp(signal.scalar ?? 0.5);

    // Extract per-system tags
    const tags = v2 ? supplementTagsV2ForSystem(supplement, system) : v1Tags;

    const overlap = tagOverlapScore(tags, signal.tags ?? []);
    const score = clamp(
      Number(config.DAY_SCALAR_WEIGHT ?? 0.25) * dayScalar
      + Number(config.TAG_MATCH_WEIGHT ?? 0.75) * overlap
    );
    const signalTags = new Set(stableUnique(signal.tags ?? []).map(lc));
    components[system] = {
      scalar: quantize(score, config.QUANTIZE),
      dayScalar: quantize(dayScalar, config.QUANTIZE),
      tagMatch: quantize(overlap, config.QUANTIZE),
      matchedTags: tags.filter(tag => signalTags.has(lc(tag))).sort()
    };
    systemScalars[system] = quantize(score, config.QUANTIZE);
    weighted += score * weight;
    totalWeight += weight;
  }

  const scalar = quantize(totalWeight > 0 ? weighted / totalWeight : 0.5, config.QUANTIZE);
  const label = labelForScalar(scalar, config.THRESHOLDS);
  const strongThreshold = config.THRESHOLDS?.STRONG ?? 0.64;
  const convergenceLabel = convergenceLabelForSystems(systemScalars, strongThreshold);

  return Object.freeze({
    engine: 'esoteric_fit',
    engineVersion: ENGINE_VERSION,
    supplementId: supplement.id,
    label,
    scalar,
    convergenceLabel,
    components,
    reasonTrail: [`Esoteric fit ${label} (${scalar.toFixed(4)}). Convergence: ${convergenceLabel}.`]
  });
}

export function evaluateEsotericRegistry(registry, dayField, config = DEFAULT_ESOTERIC_CONFIG) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateEsotericFit(s, dayField, config)])
  );
}
