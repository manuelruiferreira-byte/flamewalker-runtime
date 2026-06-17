const NAD_IDS = Object.freeze(['nr','nmn','nmnh']);
const PRIORITY_TIERS = new Set(['constitutional','governed','conditional']);
const SLOT_ORDER = Object.freeze(['morning','afternoon','night']);

function byId(registry = {}) {
  return new Map((registry.supplements ?? []).map(item => [item.id, item]));
}

function displayName(id, index) {
  return index.get(id)?.name ?? id;
}

function diagnosticFor(id, diagnostics = {}) {
  const d = diagnostics[id] ?? {};
  return {
    esoteric: d.esotericLabel ?? 'Unscored',
    esotericScalar: Number.isFinite(Number(d.esotericScalar)) ? Number(d.esotericScalar) : null,
    body: d.bodyPermission ?? 'unknown',
    frequency: d.frequencyState ?? 'unknown',
    urgency: Number.isFinite(Number(d.frequencyUrgency)) ? Number(d.frequencyUrgency) : null,
    pairing: d.pairingState ?? 'unknown'
  };
}

function reasonAction(reason = '') {
  const text = String(reason).toLowerCase();
  if (text.includes('body hold')) return 'BODY HOLD';
  if (text.includes('critical data')) return 'MANUAL REVIEW';
  if (text.includes('personal maximum')) return 'WEEKLY LIMIT';
  if (text.includes('min gap')) return 'COOLING DOWN';
  if (text.includes('residual')) return 'RESIDUAL ACTIVE';
  if (text.includes('pairing conflict')) return 'PAIRING HOLD';
  if (text.includes('rotation sibling')) return 'ROTATION HOLD';
  if (text.includes('mandatory companion')) return 'PAIR INCOMPLETE';
  if (text.includes('slot full') || text.includes('class full')) return 'STACK FULL';
  if (text.includes('target at risk')) return 'TARGET AT RISK';
  if (text.includes('low esoteric')) return 'LOW FIT';
  return 'NOT SELECTED';
}

function buildSelected(record, index) {
  const rows = new Map();
  for (const selected of record.selected ?? []) {
    const primaryId = selected?.atom?.primaryId;
    for (const id of selected?.atom?.memberIds ?? []) {
      const existing = rows.get(id);
      const primary = id === primaryId;
      const slot = selected?.memberSlots?.[id] ?? selected?.slot ?? 'morning';
      const candidate = {
        id,
        name: displayName(id,index),
        tier: index.get(id)?.frequency?.priorityTier ?? 'maintenance',
        action: primary ? 'TAKE TODAY' : 'REQUIRED PAIR',
        reason: primary ? selected.primaryReason ?? 'optimizer selection' : `Required by ${displayName(primaryId,index)}`,
        primary,
        primaryId,
        slot: SLOT_ORDER.includes(slot) ? slot : 'morning',
        diagnostics: diagnosticFor(id,record.diagnostics)
      };
      if (!existing || (candidate.primary && !existing.primary)) rows.set(id,candidate);
    }
  }
  return [...rows.values()].sort((a,b)=>SLOT_ORDER.indexOf(a.slot)-SLOT_ORDER.indexOf(b.slot)||a.name.localeCompare(b.name));
}

function assertNadExclusivity(selected) {
  const nad = selected.filter(row=>row.primary && NAD_IDS.includes(row.id));
  if (nad.length > 1) throw new Error(`NAD exclusivity breach: ${nad.map(x=>x.id).join(', ')}`);
}

function buildNotToday(record,index,selectedIds) {
  const residual = new Map((record.residual ?? []).map(x=>[x.id,x.reason]));
  const held = new Map((record.held ?? []).map(x=>[x.id,x.reason]));
  const excluded = new Map((record.excluded ?? []).map(x=>[x.id,x.reason]));
  const rows=[];
  for (const supplement of [...index.values()].sort((a,b)=>a.name.localeCompare(b.name))) {
    if (selectedIds.has(supplement.id)) continue;
    const tier = supplement.frequency?.priorityTier ?? 'maintenance';
    if (!PRIORITY_TIERS.has(tier) && !held.has(supplement.id)) continue;
    let action='NOT DUE', reason='Not selected today';
    if (held.has(supplement.id)) {
      reason=held.get(supplement.id);
      action=reasonAction(reason);
    } else if (residual.has(supplement.id)) {
      reason=residual.get(supplement.id);
      action=reason === 'residual' ? 'RESIDUAL ACTIVE' : 'TARGET COMPLETE';
    } else if (excluded.has(supplement.id)) {
      reason=excluded.get(supplement.id);
      action='EXCLUDED';
    }
    rows.push({
      id:supplement.id,
      name:supplement.name,
      tier,
      action,
      reason,
      diagnostics:diagnosticFor(supplement.id,record.diagnostics)
    });
  }
  return rows;
}

export function buildVisibleSupplementModel(record = {}, registry = {}) {
  const index=byId(registry);
  const selected=buildSelected(record,index);
  assertNadExclusivity(selected);
  const selectedIds=new Set(selected.map(x=>x.id));
  const notToday=buildNotToday(record,index,selectedIds);
  const groups=Object.fromEntries(SLOT_ORDER.map(slot=>[slot,selected.filter(x=>x.slot===slot)]));
  return Object.freeze({
    version:'ace_mind_optimizer_visible.v1',
    date:String(record.date ?? ''),
    authority:'INDIVIDUAL_OPTIMIZER',
    selected,
    groups,
    notToday,
    nadPrimary:selected.find(x=>x.primary&&NAD_IDS.includes(x.id))?.id ?? null,
    selectedCount:selected.length,
    notTodayCount:notToday.length
  });
}
