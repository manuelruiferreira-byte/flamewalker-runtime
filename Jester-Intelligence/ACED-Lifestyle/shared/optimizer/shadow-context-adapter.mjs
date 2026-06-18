const DOMAIN_KEYS = Object.freeze(['career','study','social','leisure','love','creative','spirit','body','money']);
const AXIS_ALIASES = Object.freeze({
  nervous:'nervous', nervous_system:'nervous', brain:'nervous', cognition:'nervous',
  heart:'heart', cardiovascular:'heart', sleep:'sleep', liver:'liver', gut:'gut',
  digestion:'gut', muscles_back:'back', muscles:'back', back:'back',
  skin_connective:'skin', skin:'skin', eyes:'eyes', immune:null, endocrine:null,
  energy_mitochondria:null, respiration:null, body:null
});

export function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u4e00-\u9fff]+/g,'_').replace(/^_+|_+$/g,'');
}

export function collectTokens(value, out = new Set(), depth = 0) {
  if (depth > 5 || value == null) return out;
  if (['string','number','boolean'].includes(typeof value)) {
    const raw = String(value);
    const full = normalizeToken(raw);
    if (full) out.add(full);
    for (const part of raw.split(/[^A-Za-z0-9\u4e00-\u9fff]+/)) {
      const token = normalizeToken(part);
      if (token) out.add(token);
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0,40)) collectTokens(item,out,depth+1);
    return out;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value).sort().slice(0,60)) {
      collectTokens(key,out,depth+1);
      collectTokens(value[key],out,depth+1);
    }
  }
  return out;
}

function sortedTokens(value) {
  return [...collectTokens(value)].sort();
}

function scalar(base, verified = false) {
  return Math.max(0, Math.min(1, Number(base) + (verified ? 0.06 : 0)));
}

function digitRoot(value) {
  let n = Math.abs(Number(value));
  if (!Number.isFinite(n)) return null;
  n = Math.trunc(n);
  while (n > 9 && ![11,22,33].includes(n)) {
    n = String(n).split('').reduce((sum,digit)=>sum+Number(digit),0);
  }
  return n;
}

function dateNumerology(date) {
  const digits=String(date??'').replace(/\D/g,'').split('').map(Number);
  if (digits.length !== 8) return {};
  const sum=digits.reduce((a,b)=>a+b,0);
  return { dateSum:sum, dateRoot:digitRoot(sum) };
}

function numerologyField(day = {}) {
  const dateNumbers=dateNumerology(day.id);
  const source={
    ptrm:day.ptrm,
    personalDay:day.personalDay,
    personalDayRaw:day.personalDayRaw,
    personalIso:day.personalIso,
    personalNumerology:day.personalNumerology,
    numerology:day.numerology,
    dayNumber:day.dayNum,
    ...dateNumbers
  };
  return {
    scalar: scalar(0.78, Boolean(day.ptrm || day.personalDay || day.numerology)),
    tags: sortedTokens(source)
  };
}

function baziField(day = {}) {
  const source={
    bazi:day.bazi,
    pillar:day.bazi?.pillar,
    hanzi:day.bazi?.hanzi,
    signature:day.bazi?.signature,
    stem:day.bazi?.stem ?? day.bazi?.dayMasterStem,
    branch:day.bazi?.branch,
    element:day.bazi?.element ?? day.bazi?.primaryElement,
    polarity:day.bazi?.polarity
  };
  return {
    scalar: scalar(0.74, Boolean(day.bazi?.pillar || day.bazi?.hanzi || day.bazi?.dayMasterStem)),
    tags: sortedTokens(source)
  };
}

export function buildEsotericDayField(day = {}) {
  const verified = Boolean(day?.verified || day?.astrology?.verified);
  return {
    numerology:numerologyField(day),
    bazi:baziField(day),
    astrology:{
      scalar:scalar(0.66,verified),
      tags:sortedTokens({astrology:day.astrology,natalTransit:day.natalTransit,focusHint:day.focusHint})
    },
    mayan:{
      scalar:scalar(0.64,Boolean(day.mayan)),
      tags:sortedTokens(day.mayan)
    }
  };
}

function clamp(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0,Math.min(1,n)) : 0;
}

function scoreFromLifeRecord(record) {
  if (!record || typeof record !== 'object') return null;
  for (const key of ['score','value','scalar','strength','activation']) {
    if (Number.isFinite(Number(record[key]))) return clamp(record[key]);
  }
  const text = JSON.stringify(record).toLowerCase();
  if (/gold|prime|strong|green|favour|favor|act|open/.test(text)) return 0.82;
  if (/yellow|watch|conditional|observe/.test(text)) return 0.52;
  if (/red|hold|avoid|closed|veto/.test(text)) return 0.12;
  return null;
}

const DOMAIN_PATTERNS = Object.freeze({
  career:/career|work|mission|logistics|operations|vocation|job/,
  study:/study|learn|mercury|analysis|theon|knowledge|focus|cognition/,
  social:/social|network|friend|community|group/,
  leisure:/leisure|rest|play|recovery|enjoy|fun/,
  love:/love|relationship|romance|venus|heart|intimacy/,
  creative:/creative|write|music|art|studio|expression|create/,
  spirit:/spirit|prayer|meditation|sophia|logos|ritual|chakra/,
  body:/body|physical|mars|movement|exercise|stamina|health/,
  money:/money|trading|finance|provision|market|value/
});

export function buildDaySignals(day = {}, guidance = {}) {
  const out = Object.fromEntries(DOMAIN_KEYS.map(key=>[key,0.18]));
  const life = guidance?.life && typeof guidance.life === 'object' ? guidance.life : {};
  for (const key of DOMAIN_KEYS) {
    const direct = scoreFromLifeRecord(life[key]);
    if (direct != null) out[key] = Math.max(out[key],direct);
  }
  const text = JSON.stringify({focusHint:day.focusHint,ptrm:day.ptrm,focus:guidance?.c?.focus,summary:guidance?.c?.summary,movement:guidance?.movement,practiceReason:guidance?.practiceReason}).toLowerCase();
  for (const [key,pattern] of Object.entries(DOMAIN_PATTERNS)) if (pattern.test(text)) out[key] = Math.max(out[key],0.76);
  const ranked = guidance?.theonFullStack?.ranked ?? guidance?.theonKernel?.ranked ?? [];
  if (Array.isArray(ranked)) ranked.slice(0,4).forEach((entry,index)=>{
    const key = normalizeToken(entry?.domain ?? entry?.id ?? entry?.name);
    if (DOMAIN_KEYS.includes(key)) out[key] = Math.max(out[key],1-index*0.12);
  });
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,clamp(v)]));
}

export function normalizeBodyState(bodySummary = {}, bodySystems = []) {
  const states = bodySummary?.states && typeof bodySummary.states === 'object' ? bodySummary.states : {};
  const out = {};
  for (const system of bodySystems) {
    const normalized = normalizeToken(system);
    const aceAxis = Object.prototype.hasOwnProperty.call(AXIS_ALIASES,normalized) ? AXIS_ALIASES[normalized] : normalized;
    const fallback = bodySummary?.allGreen ? 'green' : 'unknown';
    const raw = normalizeToken((aceAxis ? states[aceAxis] : undefined) ?? states[normalized] ?? fallback);
    out[system] = ['green','yellow','orange','red'].includes(raw) ? raw : fallback;
  }
  return out;
}

export function registryLookup(registry = {}) {
  const map = new Map();
  for (const supplement of registry.supplements ?? []) {
    const tokens = [supplement.id,supplement.name,...(supplement.aliases ?? [])];
    for (const token of tokens) {
      const key = normalizeToken(token);
      if (key) map.set(key,supplement.id);
    }
  }
  return map;
}

export function extractTakenHistory(state = {}, registry = {}) {
  const lookup = registryLookup(registry);
  const histories = {};
  const logs = state?.suppLog && typeof state.suppLog === 'object' ? state.suppLog : {};
  for (const date of Object.keys(logs).sort()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const record = logs[date] ?? {};
    const names = new Set(Array.isArray(record.taken) ? record.taken : []);
    for (const event of Array.isArray(record.events) ? record.events : []) if (event?.ticked) names.add(event.name);
    for (const name of names) {
      const id = lookup.get(normalizeToken(name));
      if (!id) continue;
      (histories[id] ??= []).push(date);
    }
  }
  for (const id of Object.keys(histories)) histories[id] = [...new Set(histories[id])].sort();
  return histories;
}

export function legacySnapshot(day = {}, guidance = {}, registry = {}) {
  const lookup = registryLookup(registry);
  const rawItems = guidance?.block?.items ?? [];
  const names = rawItems.map(item=>Array.isArray(item)?item[0]:item?.name ?? item).filter(Boolean);
  const ids = [...new Set(names.map(name=>lookup.get(normalizeToken(name))).filter(Boolean))].sort();
  return {
    date:String(day?.id ?? ''),
    block:Number(day?.block ?? guidance?.block?.id ?? 0) || null,
    itemIds:ids,
    itemNames:names.map(String).sort(),
    mode:String(guidance?.suppMode ?? ''),
    bodyGovernor:String(guidance?.c?.body?.governor ?? '')
  };
}

export function compareLegacyToOptimizer(legacy = {}, optimizer = {}) {
  const legacyIds = [...new Set(legacy.itemIds ?? [])].sort();
  const optimizerIds = [...new Set((optimizer.selected ?? []).flatMap(rec=>rec?.atom?.memberIds ?? []))].sort();
  const legacySet = new Set(legacyIds), optimizerSet = new Set(optimizerIds);
  const overlap = legacyIds.filter(id=>optimizerSet.has(id));
  const legacyOnly = legacyIds.filter(id=>!optimizerSet.has(id));
  const optimizerOnly = optimizerIds.filter(id=>!legacySet.has(id));
  const unionSize = new Set([...legacyIds,...optimizerIds]).size;
  return {
    overlap,
    legacyOnly,
    optimizerOnly,
    jaccard:unionSize ? Number((overlap.length/unionSize).toFixed(4)) : 1,
    sameSet:legacyOnly.length===0 && optimizerOnly.length===0,
    legacyCount:legacyIds.length,
    optimizerCount:optimizerIds.length
  };
}

export function sanitizeShadowContext(context = {}) {
  return {
    date:String(context.date ?? ''),
    daySignals:context.daySignals ?? {},
    dayField:context.dayField ?? {},
    bodyState:context.bodyState ?? {},
    histories:context.histories ?? {},
    legacy:context.legacy ?? {}
  };
}

export function snapshotToContext(snapshot, registry = {}, state = {}, fallbackDate = '') {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('agent-state snapshot unavailable');
  const day = snapshot.day && typeof snapshot.day === 'object'
    ? snapshot.day
    : { id: snapshot.active_day || snapshot.activeDate || fallbackDate };
  const date = String(snapshot.active_day || snapshot.activeDate || day.id || fallbackDate).slice(0,10);
  const guidance = {
    life: snapshot.domains || {},
    c: {
      focus: snapshot.day_summary?.focus || '',
      summary: snapshot.convergence?.synthesis || '',
      body: snapshot.body || {}
    },
    movement: snapshot.grounding?.movement || '',
    practiceReason: snapshot.grounding?.mantra || '',
    suppMode: snapshot.day_summary?.supplement_mode || '',
    block: {
      id: snapshot.day_summary?.block || day.block,
      items: snapshot.supplements?.items || []
    }
  };
  return sanitizeShadowContext({
    date,
    daySignals: buildDaySignals(day, guidance),
    dayField: buildEsotericDayField(day),
    bodyState: normalizeBodyState(snapshot.body || {}, registry.bodySystems ?? []),
    histories: extractTakenHistory(state, registry),
    legacy: legacySnapshot({ ...day, id: date, block: snapshot.day_summary?.block || day.block }, guidance, registry)
  });
}
