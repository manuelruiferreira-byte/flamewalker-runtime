export const OPTIMIZER_CONFIG = Object.freeze({
  WEIGHTS: Object.freeze({
    W_ESO: 0.30,
    W_OP: 0.25,
    W_FREQ: 0.20,
    W_BAL: 0.15,
    W_CONF: 0.10
  }),
  DIMINISHING_RETURNS: Object.freeze([1.00, 0.60, 0.25, 0.00]),
  BURDEN_ESCALATION: Object.freeze([1.00, 1.80]),
  BURDEN_HARD_CEILING: 3,
  MIN_MEANINGFUL_BENEFIT: 0.25,
  MIN_MEANINGFUL_BURDEN: 0.25,
  MIN_BURDEN_FOR_CEILING: 1.50,
  BENEFIT_NORMALIZER: 18,
  BURDEN_NORMALIZER: 60,
  COMPLEXITY_PENALTY_PER_ATOM: 0.025,
  MIN_MARGINAL_UTILITY: 0.15,
  QUALITY_MARGIN: 0.04,
  LOCAL_SWAP_ROUNDS: 2,
  FREQUENCY_PRIORITY_RANK: Object.freeze({ constitutional: 3, governed: 2, conditional: 1, maintenance: 0 }),
  DEADLINE_RESERVATION_MIN_RANK: 2,
  CONDITIONAL_NEED_MIN_OPERATIONAL: 0.65,
  CONDITIONAL_NEED_MIN_ESOTERIC: 0.64,
  SLOT_CAPS: Object.freeze({ morning: 4, afternoon: 4, night: 3 }),
  SLOT_ORDER: Object.freeze(['morning', 'afternoon', 'night']),
  CLASS_CAPS: Object.freeze({
    nad_booster: 1,
    brain_activation: 2,
    endocrine_caution: 1,
    immune_mushroom: 2,
    stimulant: 1
  }),
  CLASS_ALIASES: Object.freeze({
    immune_mushroom: Object.freeze(['immune_mushroom', 'mushroom'])
  }),
  QUANTIZE: 1e-4,
  CONFIDENCE: Object.freeze({
    personalStatus: Object.freeze({ active: 1.00, active_caution: 0.62 }),
    evidenceClass: Object.freeze({
      baseline: 0.90,
      personal_protocol: 0.88,
      mixed_human_evidence: 0.68,
      traditional_or_preclinical: 0.42,
      manual_research: 0.10,
      excluded_personal: 0.00
    }),
    unknownDataPenalty: 0.03,
    qualitySensitivePenalty: 0.18
  }),
  CRITICAL_DATA_FIELDS: Object.freeze(['doseKnown', 'productVerified', 'medicationInteractionChecked', 'labDependent'])
});

export function mergeOptimizerConfig(overrides = {}) {
  return {
    ...OPTIMIZER_CONFIG,
    ...overrides,
    WEIGHTS: { ...OPTIMIZER_CONFIG.WEIGHTS, ...(overrides.WEIGHTS ?? {}) },
    SLOT_CAPS: { ...OPTIMIZER_CONFIG.SLOT_CAPS, ...(overrides.SLOT_CAPS ?? {}) },
    CLASS_CAPS: { ...OPTIMIZER_CONFIG.CLASS_CAPS, ...(overrides.CLASS_CAPS ?? {}) },
    CLASS_ALIASES: { ...OPTIMIZER_CONFIG.CLASS_ALIASES, ...(overrides.CLASS_ALIASES ?? {}) },
    CONFIDENCE: {
      ...OPTIMIZER_CONFIG.CONFIDENCE,
      ...(overrides.CONFIDENCE ?? {}),
      personalStatus: {
        ...OPTIMIZER_CONFIG.CONFIDENCE.personalStatus,
        ...(overrides.CONFIDENCE?.personalStatus ?? {})
      },
      evidenceClass: {
        ...OPTIMIZER_CONFIG.CONFIDENCE.evidenceClass,
        ...(overrides.CONFIDENCE?.evidenceClass ?? {})
      }
    }
  };
}
