import { clamp, quantize } from './contracts.mjs';

export const DEFAULT_OVERLAP_CONFIG = Object.freeze({
  // How much coverage each additional supplement adds per function class
  COVERAGE_MARGINAL: Object.freeze([1.0, 0.4, 0.1, 0.0]),  // 1st, 2nd, 3rd, 4th+ supplement in same class
  // Minimum marginal value to consider a supplement useful
  MIN_MARGINAL_OVERLAP_VALUE: 0.1,
  // Maximum overlap penalty (0-1)
  MAX_OVERLAP_PENALTY: 0.8
});

// V1 class to functional class mappings
const V1_CLASS_MAP = Object.freeze({
  nad_booster: ['mitochondrial_energy', 'longevity_cellular_repair', 'methylation'],
  brain_activation: ['cognition', 'focus', 'memory'],
  methylation_driver: ['methylation'],
  nad_companion: ['mitochondrial_energy', 'methylation'],
  mineral: ['nervous_system_calming', 'muscle_back_support'],
  magnesium: ['nervous_system_calming', 'sleep_initiation', 'muscle_back_support'],
  omega3: ['inflammation_modulation', 'heart_circulation', 'cognition'],
  antioxidant: ['antioxidant_support', 'longevity_cellular_repair'],
  immune_mushroom: ['immune_modulation', 'longevity_cellular_repair'],
  mushroom: ['immune_modulation'],
  adaptogen: ['nervous_system_calming', 'endocrine_hormonal'],
  longevity: ['longevity_cellular_repair', 'autophagy', 'antioxidant_support'],
  liver_support: ['liver_support'],
  probiotic: ['gut_digestion', 'immune_modulation'],
  sleep_support: ['sleep_initiation', 'sleep_maintenance'],
  endocrine_caution: ['endocrine_hormonal', 'libido'],
  stimulant: ['physical_energy', 'focus'],
  nootropic: ['cognition', 'focus', 'memory'],
  nitric_oxide: ['nitric_oxide', 'heart_circulation', 'physical_energy'],
  collagen_support: ['joints_connective_tissue', 'skin'],
  skin: ['skin'],
  connective_tissue: ['joints_connective_tissue'],
  methylation_support: ['methylation'],
  cardiovascular: ['heart_circulation'],
  respiratory: ['respiratory_support'],
  eye_support: ['eyes'],
  gut_support: ['gut_digestion'],
  quality_sensitive: [],
  multivitamin: ['mitochondrial_energy', 'immune_modulation', 'antioxidant_support'],
  vitamin_d: ['immune_modulation', 'endocrine_hormonal'],
  zinc_source: ['immune_modulation', 'endocrine_hormonal'],
  protein_support: ['muscle_back_support'],
  spirulina: ['antioxidant_support', 'immune_modulation', 'physical_energy'],
  seaweed: ['gut_digestion', 'immune_modulation'],
  creatine: ['physical_energy', 'cognition', 'muscle_back_support']
});

/**
 * Extract functional classes from a supplement card.
 * Supports v2 (functionalClasses field) and v1 (classes field with mapping).
 */
function extractFunctionalClasses(supplement) {
  // v2 format: direct functionalClasses field
  if (supplement.functionalClasses && Array.isArray(supplement.functionalClasses)) {
    return [...supplement.functionalClasses];
  }
  // v1 fallback: map classes through V1_CLASS_MAP
  const classes = supplement.classes ?? [];
  const result = new Set();
  for (const cls of classes) {
    const mapped = V1_CLASS_MAP[cls];
    if (mapped) {
      for (const fc of mapped) result.add(fc);
    }
  }
  return [...result];
}

/**
 * Evaluate functional overlap for a supplement given current coverage.
 *
 * @param {object} supplement - registry card
 * @param {Map<string,number>} coveredFunctions - Map of functionClass => currentCoverageScore (0-3)
 * @param {object} config
 * @returns {{ marginalValue, overlapPenalty, uniqueContribution, coveredClasses, uncoveredClasses }}
 */
export function evaluateFunctionalOverlap(supplement, coveredFunctions = new Map(), config = DEFAULT_OVERLAP_CONFIG) {
  const marginals = config.COVERAGE_MARGINAL;
  const maxPenalty = Number(config.MAX_OVERLAP_PENALTY ?? 0.8);

  const functionalClasses = extractFunctionalClasses(supplement);
  const coveredClasses = [];
  const uniqueContribution = [];
  let marginalSum = 0;

  for (const fc of functionalClasses) {
    const currentCount = Math.floor(Number(coveredFunctions.get(fc) ?? 0));
    const idx = Math.min(currentCount, marginals.length - 1);
    const marginal = Number(marginals[idx] ?? 0);
    marginalSum += marginal;
    if (currentCount > 0) {
      coveredClasses.push(fc);
    } else {
      uniqueContribution.push(fc);
    }
  }

  const marginalValue = functionalClasses.length > 0
    ? quantize(marginalSum / functionalClasses.length, 1e-4)
    : 0;

  const rawPenalty = 1 - marginalValue;
  const overlapPenalty = quantize(clamp(rawPenalty, 0, maxPenalty), 1e-4);

  // uncoveredClasses: all known function classes not covered by this supplement
  const supplementSet = new Set(functionalClasses);
  const uncoveredClasses = [...coveredFunctions.keys()].filter(fc => !supplementSet.has(fc)).sort();

  return Object.freeze({
    marginalValue,
    overlapPenalty,
    uniqueContribution: uniqueContribution.sort(),
    coveredClasses: coveredClasses.sort(),
    uncoveredClasses
  });
}

/**
 * Return updated coverage Map after adding supplement.
 * Each functional class the supplement covers gets its count incremented by 1.
 *
 * @param {Map<string,number>} coveredFunctions
 * @param {object} supplement
 * @returns {Map<string,number>}
 */
export function updateCoveredFunctions(coveredFunctions, supplement) {
  const updated = new Map(coveredFunctions);
  const functionalClasses = extractFunctionalClasses(supplement);
  for (const fc of functionalClasses) {
    updated.set(fc, (updated.get(fc) ?? 0) + 1);
  }
  return updated;
}

/**
 * Evaluates overlap penalty for all supplements given a selected set.
 *
 * @param {object} registry - supplement registry with .supplements array
 * @param {string[]} selectedIds - IDs of currently selected supplements
 * @param {object} config
 * @returns {Object.<string, ReturnType<evaluateFunctionalOverlap>>}
 */
export function evaluateOverlapRegistry(registry, selectedIds = [], config = DEFAULT_OVERLAP_CONFIG) {
  const selectedSet = new Set(selectedIds);
  const supplements = registry?.supplements ?? [];

  // Build coverage map from selected supplements
  let coveredFunctions = new Map();
  for (const supp of supplements) {
    if (selectedSet.has(supp.id)) {
      coveredFunctions = updateCoveredFunctions(coveredFunctions, supp);
    }
  }

  return Object.fromEntries(
    [...supplements]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluateFunctionalOverlap(s, coveredFunctions, config)])
  );
}
