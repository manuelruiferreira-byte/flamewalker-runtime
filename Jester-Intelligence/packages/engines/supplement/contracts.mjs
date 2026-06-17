export const ENGINE_VERSION = 'ace_supplement_layers.v1';

export const ESOTERIC_LABELS = Object.freeze({
  PRIME: 'Prime',
  STRONG: 'Strong',
  COMPATIBLE: 'Compatible',
  LOW_RESONANCE: 'LowResonance',
  DISCORDANT: 'Discordant'
});

export const BODY_PERMISSION_LABELS = Object.freeze({
  CLEAR: 'clear',
  CONDITIONAL: 'conditional',
  HOLD: 'hold',
  EXCLUDED: 'excluded'
});

export const FREQUENCY_STATES = Object.freeze({
  DUE: 'due',
  OPTIONAL: 'optional',
  RESIDUAL: 'residual',
  COOLING_DOWN: 'cooling_down',
  COMPLETE: 'complete',
  MANUAL_ONLY: 'manual_only',
  EXCLUDED: 'excluded'
});

export const PAIRING_STATES = Object.freeze({
  COMPLETE: 'complete',
  COMPANION_REQUIRED: 'companion_required',
  CONFLICT: 'conflict',
  INVALID: 'invalid'
});

export const BODY_STATES = Object.freeze({
  GREEN: 'green',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  RED: 'red',
  UNKNOWN: 'unknown'
});

export function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function quantize(value, quantum = 1e-4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n / quantum) * quantum;
}

export function normalizeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function stableUnique(values) {
  return [...new Set((values ?? []).map(normalizeToken).filter(Boolean))].sort();
}

export function stableSortById(values) {
  return [...(values ?? [])].sort((a, b) => String(a?.id ?? a).localeCompare(String(b?.id ?? b)));
}

export function assertSupplementRecord(supplement) {
  if (!supplement || typeof supplement !== 'object') throw new TypeError('supplement must be an object');
  if (!supplement.id || !supplement.name) throw new TypeError('supplement.id and supplement.name are required');
  return supplement;
}

export function normalizeBodyState(value) {
  const v = normalizeToken(value);
  return ['green', 'yellow', 'orange', 'red'].includes(v) ? v : 'unknown';
}

export function isoDate(value) {
  const s = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new TypeError(`invalid ISO date: ${s}`);
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw new TypeError(`invalid ISO date: ${s}`);
  return s;
}

export function addDays(date, delta) {
  const d = new Date(`${isoDate(date)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(delta));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const aa = new Date(`${isoDate(a)}T00:00:00.000Z`).getTime();
  const bb = new Date(`${isoDate(b)}T00:00:00.000Z`).getTime();
  return Math.floor((bb - aa) / 86400000);
}

export function mondayOf(date) {
  const d = new Date(`${isoDate(date)}T00:00:00.000Z`);
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const ESOTERIC_CONVERGENCE_LABELS = Object.freeze({
  GOLDEN: 'Golden',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NONE: 'None'
});

export const AXIS_COLORS = Object.freeze({
  GREEN: 'green',
  BLUE: 'blue',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  RED: 'red'
});

export const FUNCTION_AXES = Object.freeze([
  'mitochondrial_energy', 'physical_energy', 'cognition', 'memory', 'focus',
  'nervous_system_calming', 'sleep_initiation', 'sleep_maintenance',
  'liver_support', 'methylation', 'antioxidant_support', 'heart_circulation',
  'nitric_oxide', 'muscle_back_support', 'joints_connective_tissue', 'skin',
  'gut_digestion', 'immune_modulation', 'endocrine_hormonal', 'libido',
  'respiratory_support', 'eyes', 'longevity_cellular_repair', 'autophagy',
  'inflammation_modulation'
]);

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('canonical data cannot contain NaN or Infinity');
    return value;
  }
  return value;
}
