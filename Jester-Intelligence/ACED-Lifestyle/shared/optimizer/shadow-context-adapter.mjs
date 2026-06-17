const DOMAIN_KEYS = Object.freeze(['career','study','social','leisure','love','creative','spirit','body','money']);
const AXIS_ALIASES = Object.freeze({
  nervous:'nervous', nervous_system:'nervous', brain:'nervous', cognition:'nervous',
  heart:'heart', cardiovascular:'heart', sleep:'sleep', liver:'liver', gut:'gut',
  digestion:'gut', muscles_back:'back', muscles:'back', back:'back',
  skin_connective:'skin', skin:'skin', eyes:'eyes', immune:null, endocrine:null,
  energy_mitochondria:null, respiration:null, body:null
});
const PLANETS = Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
const WEEKDAY_PLANET = Object.freeze({sunday:'sun',monday:'moon',tuesday:'mars',wednesday:'mercury',thursday:'jupiter',friday:'venus',saturday:'saturn'});
const SIGN_ELEMENT = Object.freeze({
  aries:'fire',leo:'fire',sagittarius:'fire',taurus:'earth',virgo:'earth',capricorn:'earth',
  gemini:'air',libra:'air',aquarius:'air',cancer:'water',scorpio:'water',pisces:'water'
});
const NUMEROLOGY_BRIDGE = Object.freeze({
  1:['sun','initiation','vitality'],2:['moon','receptive','balance'],3:['jupiter','mercury','expression'],
  4:['saturn','uranus','structure'],5:['mercury','activation','movement'],6:['venus','balance','healing'],
  7:['neptune','moon','introspection'],8:['saturn','mars','power'],9:['mars','release','completion'],
  11:['uranus','moon','illumination'],22:['saturn','jupiter','mastery'],33:['venus','jupiter','healing']
});
const MAYAN_COLOR_BRIDGE = Object.freeze({
  red:['fire','mars','initiation','movement'],white:['air','mercury','moon','refinement'],
  blue:['water','jupiter','uranus','transformation'],yellow:['earth','sun','saturn','integration']
});
const MAYAN_ARCHETYPE_BRIDGE = Object.freeze({
  dragon:['moon','water','nourishment'],wind:['mercury','air','communication'],night:['moon','neptune','rest'],
  seed:['venus','earth','growth'],serpent:['mars','fire','vitality'],worldbridger:['saturn','release','transition'],
  hand:['mercury','healing','skill'],star:['venus','beauty','harmony'],moon:['moon','water','purification'],
  dog:['venus','heart','love'],monkey:['mercury','play','creativity'],human:['jupiter','wisdom','choice'],
  skywalker:['jupiter','exploration','space'],wizard:['neptune','spirit','receptive'],eagle:['jupiter','vision','air'],
  warrior:['mars','courage','strategy'],earth:['saturn','earth','navigation'],mirror:['mercury','clarity','reflection'],
  storm:['uranus','mars','transformation'],sun:['sun','fire','vitality']
});
const TONE_BRIDGE = Object.freeze({
  1:['sun','initiation'],2:['moon','balance'],3:['mercury','activation'],4:['saturn','structure'],
  5:['jupiter','empowerment'],6:['venus','balance'],7:['neptune','attunement'],8:['venus','harmony'],
  9:['mars','pulse'],10:['saturn','manifestation'],11:['uranus','release'],12:['jupiter','cooperation'],13:['neptune','transcendence']
});

export function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

export function collectTokens(value, out = new Set(), depth = 0) {
  if (depth > 5 || value == null) return out;
  if (['string','number','boolean'].includes(typeof value)) {
    const raw = String(value);
    const full = normalizeToken(raw);
    if (full) out.add(full);
    for (const part of raw.split(/[^A-Za-z0-9]+/)) {
      const token = normalizeToken(part);
      if (token && token.length > 1) out.add(token);
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

function addTokens(target, values) {
  for (const value of values ?? []) {
    const token=normalizeToken(value);
    if(token)target.add(token);
  }
}

function planetWords(value) {
  const text=String(value??'').toLowerCase();
  return PLANETS.filter(planet=>new RegExp(`\\b${planet}\\b`,'i').test(text));
}

function signWords(value) {
  const text=String(value??'').toLowerCase();
  return Object.keys(SIGN_ELEMENT).filter(sign=>new RegExp(`\\b${sign}\\b`,'i').test(text));
}

function astrologyTags(day={}) {
  const tags=new Set();
  const weekday=normalizeToken(day.weekday);
  if(WEEKDAY_PLANET[weekday])tags.add(WEEKDAY_PLANET[weekday]);
  const astrology=day.astrology??{};
  const active=day.natalTransit?.top??[];
  for(const row of active.slice(0,4)){
    addTokens(tags,planetWords(row?.transit_label));
    addTokens(tags,planetWords(row?.natal_label));
    addTokens(tags,sortedTokens(row?.aspect));
  }
  if(!active.length)addTokens(tags,planetWords(astrology.focus));
  for(const key of ['sun','moon']){
    if(astrology[key]){
      tags.add(key);
      for(const sign of signWords(astrology[key])){
        tags.add(sign);
        tags.add(SIGN_ELEMENT[sign]);
      }
    }
  }
  addTokens(tags,sortedTokens(astrology.moonPhase));
  return [...tags].sort();
}

function baziTags(day={}) {
  const tags=new Set();
  addTokens(tags,sortedTokens({element:day.bazi?.element,signature:day.bazi?.signature,pillar:day.bazi?.pillar}));
  return [...tags].sort();
}

function numerologyTags(day={}) {
  const tags=new Set();
  const number=Number(day.personalDay??day.personalDayRaw??0);
  addTokens(tags,NUMEROLOGY_BRIDGE[number]??[]);
  addTokens(tags,[String(number),day.ptrm]);
  return [...tags].sort();
}

function mayanTags(day={}) {
  const tags=new Set();
  const mayan=day.mayan??{};
  const color=normalizeToken(mayan.dsColor??mayan.dreamspell?.color??String(mayan.dreamspell?.archetype??'').split(' ')[0]);
  addTokens(tags,MAYAN_COLOR_BRIDGE[color]??[]);
  const tone=Number(mayan.dsTone??mayan.dreamspell?.tone??0);
  addTokens(tags,TONE_BRIDGE[tone]??[]);
  const tracks=[mayan.dreamspell,mayan.dna,mayan.cosmic,mayan.tzolkin];
  for(const track of tracks){
    const words=sortedTokens(track?.archetype??track?.sign??track);
    addTokens(tags,words);
    for(const word of words)addTokens(tags,MAYAN_ARCHETYPE_BRIDGE[word]??[]);
  }
  return [...tags].sort();
}

export function buildEsotericDayField(day = {}) {
  const verified = Boolean(day?.verified || day?.astrology?.verified);
  return {
    astrology:{scalar:scalar(0.66,verified),tags:astrologyTags(day)},
    bazi:{scalar:scalar(0.68,false),tags:baziTags(day)},
    numerology:{scalar:scalar(0.64,false),tags:numerologyTags(day)},
    mayan:{scalar:scalar(0.67,false),tags:mayanTags(day)}
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
  if (/gold|prime|strong|green|favour|favor|open/.test(text)) return 0.82;
  if (/yellow|watch|conditional|observe/.test(text)) return 0.52;
  if (/red|hold|avoid|closed|veto/.test(text)) return 0.12;
  return null;
}

const DOMAIN_PATTERNS = Object.freeze({
  career:/career|work|mission|logistics|operations|vocation|job/,
  study:/study|learn|analysis|theon|knowledge|focus|cognition/,
  social:/social|network|friend|community|group/,
  leisure:/leisure|rest|play|recovery|enjoy|fun/,
  love:/love|relationship|romance|heart|intimacy/,
  creative:/creative|write|music|art|studio|expression|create/,
  spirit:/spirit|prayer|meditation|sophia|logos|ritual|chakra/,
  body:/body|physical|movement|exercise|stamina|health/,
  money:/money|trading|finance|provision|market|value/
});

export function buildDaySignals(day = {}, guidance = {}) {
  const out = Object.fromEntries(DOMAIN_KEYS.map(key=>[key,0.18]));
  const life = guidance?.life && typeof guidance.life === 'object' ? guidance.life : {};
  for (const key of DOMAIN_KEYS) {
    const direct = scoreFromLifeRecord(life[key]);
    if (direct != null) out[key] = Math.max(out[key],direct);
  }
  const text = JSON.stringify({focus:guidance?.c?.focus,summary:guidance?.c?.summary,movement:guidance?.movement,practiceReason:guidance?.practiceReason}).toLowerCase();
  for (const [key,pattern] of Object.entries(DOMAIN_PATTERNS)) if (pattern.test(text)) out[key] = Math.max(out[key],0.68);
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
