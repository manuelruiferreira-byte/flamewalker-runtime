import {
  buildDaySignals,
  buildEsotericDayField,
  normalizeBodyState,
  registryLookup,
  legacySnapshot,
  sanitizeShadowContext
} from './shadow-context-adapter.mjs';

function normalizedName(value) {
  return String(value ?? '').trim();
}

function eventState(record = {}) {
  const latest = new Map();
  for (const event of Array.isArray(record.events) ? record.events : []) {
    const name = normalizedName(event?.name);
    if (!name) continue;
    latest.set(name, Boolean(event?.ticked));
  }
  return [...latest.entries()].filter(([,ticked])=>ticked).map(([name])=>name);
}

export function extractActualHistory(state = {}, registry = {}) {
  const lookup = registryLookup(registry);
  const histories = {};
  const logs = state?.suppLog && typeof state.suppLog === 'object' ? state.suppLog : {};

  for (const date of Object.keys(logs).sort()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const record = logs[date] ?? {};
    const currentNames = Array.isArray(record.taken)
      ? record.taken.map(normalizedName).filter(Boolean)
      : eventState(record);

    for (const name of [...new Set(currentNames)]) {
      const id = lookup.get(String(name).trim().toLowerCase().normalize('NFKD')
        .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''));
      if (!id) continue;
      (histories[id] ??= []).push(date);
    }
  }

  for (const id of Object.keys(histories)) histories[id] = [...new Set(histories[id])].sort();
  return histories;
}

export function readVisibleSupplementNames(root = null) {
  const chamber = root ?? (typeof document !== 'undefined' ? document.getElementById('grid-clubs') : null);
  if (!chamber) return [];
  const names = [];
  chamber.querySelectorAll('[data-supp],[data-optimizer-supp]').forEach(node=>{
    const name = node.getAttribute('data-supp') || node.getAttribute('data-optimizer-supp');
    if (name) names.push(name);
  });
  return [...new Set(names)].sort();
}

function supplementItems(snapshot = {}, visibleNames = []) {
  if (visibleNames.length) return visibleNames;
  if (Array.isArray(snapshot.supplements)) return snapshot.supplements;
  if (Array.isArray(snapshot.supplements?.items)) return snapshot.supplements.items;
  return [];
}

function guidanceFromSnapshot(snapshot = {}, day = {}, visibleNames = []) {
  return {
    life: snapshot.domains || {},
    c: {
      focus: snapshot.day_summary?.focus || snapshot.focus || '',
      summary: snapshot.convergence?.synthesis || snapshot.summary || '',
      body: snapshot.body || {}
    },
    movement: snapshot.grounding?.movement || '',
    practiceReason: snapshot.grounding?.mantra || '',
    suppMode: snapshot.day_summary?.supplement_mode || '',
    block: {
      id: snapshot.day_summary?.block || day.block,
      items: supplementItems(snapshot,visibleNames)
    }
  };
}

export function buildLiveContext({
  snapshot = {},
  state = {},
  registry = {},
  day = {},
  bodySummary = {},
  visibleNames = [],
  fallbackDate = ''
} = {}) {
  const date = String(day?.id || snapshot.active_day || snapshot.activeDate || fallbackDate).slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('selected day unavailable');

  const fullDay = day && typeof day === 'object' ? {...day,id:date} : {id:date};
  const guidance = guidanceFromSnapshot(snapshot,fullDay,visibleNames);

  return sanitizeShadowContext({
    date,
    daySignals: buildDaySignals(fullDay,guidance),
    dayField: buildEsotericDayField(fullDay),
    bodyState: normalizeBodyState(bodySummary || snapshot.body || {},registry.bodySystems ?? []),
    histories: extractActualHistory(state,registry),
    legacy: legacySnapshot(fullDay,guidance,registry)
  });
}
