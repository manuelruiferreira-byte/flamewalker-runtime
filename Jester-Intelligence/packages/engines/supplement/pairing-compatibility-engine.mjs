import {
  ENGINE_VERSION,
  PAIRING_STATES,
  assertSupplementRecord,
  stableUnique
} from './contracts.mjs';

export function indexRegistry(registry) {
  return new Map([...(registry?.supplements ?? [])].map(s => [s.id, s]));
}

export function resolveRequiredGroup(primaryId, registry) {
  const byId = indexRegistry(registry);
  const visiting = new Set();
  const resolved = new Set();

  function visit(id) {
    if (resolved.has(id)) return;
    if (visiting.has(id)) throw new Error(`required companion cycle at ${id}`);
    const supplement = byId.get(id);
    if (!supplement) throw new Error(`unknown required companion: ${id}`);
    visiting.add(id);
    for (const companion of [...(supplement.pairing?.requiredCompanions ?? [])].sort()) visit(companion);
    visiting.delete(id);
    resolved.add(id);
  }

  visit(primaryId);
  return [...resolved].sort();
}

function directionalConflicts(a, b) {
  const ap = a?.pairing ?? {};
  const bp = b?.pairing ?? {};
  const sameDay = new Set([...(ap.avoidSameDay ?? []), ...(bp.avoidSameDay ?? [])]);
  return sameDay.has(b?.id) || sameDay.has(a?.id);
}

export function evaluatePairingCompatibility(supplement, registry, selectedIds = [], proposedSlot = null) {
  assertSupplementRecord(supplement);
  const byId = indexRegistry(registry);
  const selected = stableUnique(selectedIds);
  const required = [...(supplement.pairing?.requiredCompanions ?? [])].sort();
  const missing = required.filter(id => !byId.has(id) || !byId.get(id)?.available);
  const unresolved = required.filter(id => !selected.includes(id));
  const conflicts = [];

  for (const id of selected) {
    const other = byId.get(id);
    if (!other || other.id === supplement.id) continue;
    if (directionalConflicts(supplement, other)) conflicts.push({ type: 'same_day', with: other.id });
    if (proposedSlot && (supplement.pairing?.avoidSameSlot ?? []).includes(other.id)) conflicts.push({ type: 'same_slot', with: other.id, slot: proposedSlot });
    if (proposedSlot && (other.pairing?.avoidSameSlot ?? []).includes(supplement.id)) conflicts.push({ type: 'same_slot', with: other.id, slot: proposedSlot });
  }

  let state = PAIRING_STATES.COMPLETE;
  const reasonTrail = [];
  if (missing.length) {
    state = PAIRING_STATES.INVALID;
    reasonTrail.push(`Unavailable or unknown companions: ${missing.join(', ')}.`);
  } else if (conflicts.length) {
    state = PAIRING_STATES.CONFLICT;
    reasonTrail.push(`Conflicts: ${conflicts.map(c => `${c.type}:${c.with}`).join(', ')}.`);
  } else if (unresolved.length) {
    state = PAIRING_STATES.COMPANION_REQUIRED;
    reasonTrail.push(`Required companions not selected: ${unresolved.join(', ')}.`);
  } else {
    reasonTrail.push('Required companions complete and no conflict found.');
  }

  return Object.freeze({
    engine: 'pairing_compatibility', engineVersion: ENGINE_VERSION, supplementId: supplement.id,
    state, requiredCompanions: required, requiredGroup: missing.length ? [] : resolveRequiredGroup(supplement.id, registry),
    preferredPairs: [...(supplement.pairing?.preferredPairs ?? [])].sort(),
    conflicts: conflicts.sort((a, b) => `${a.type}:${a.with}`.localeCompare(`${b.type}:${b.with}`)),
    unresolvedCompanions: unresolved, missingCompanions: missing, reasonTrail
  });
}

export function evaluatePairingRegistry(registry, selectedIds = [], proposedSlot = null) {
  return Object.fromEntries(
    [...(registry?.supplements ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => [s.id, evaluatePairingCompatibility(s, registry, selectedIds, proposedSlot)])
  );
}
