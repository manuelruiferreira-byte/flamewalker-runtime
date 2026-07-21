import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize
} from '../../../packages/engines/supplement/index.mjs';

const SHADOW_VERSION = 'ace_mind_optimizer_shadow.v1';
const REGISTRY_URL = './shared/data/supplements/supplement-registry.v1.json';
const STATE = {
  registry: null,
  registryById: new Map(),
  registryByName: new Map(),
  cache: new Map(),
  lastError: null
};

const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const norm = value => String(value ?? '').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);

function addDays(date, delta) {
  const d = new Date(`${String(date).slice(0,10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(delta));
  return d.toISOString().slice(0,10);
}

function inferTags(day, guidance) {
  const tags = new Set();
  const text = `${day?.element ?? ''} ${day?.baziElement ?? ''} ${day?.pillar ?? ''} ${day?.ptrm ?? ''} ${guidance?.c?.focus ?? ''} ${guidance?.suppMode ?? ''}`;
  for (const raw of text.split(/[^A-Za-z0-9]+/)) if (raw) tags.add(norm(raw));
  const block = Number(day?.block ?? 0);
  if (block === 1) ['repair','liver','foundation','earth'].forEach(x=>tags.add(x));
  if (block === 2) ['immune','repair','water'].forEach(x=>tags.add(x));
  if (block === 3) ['focus','cognition','mercury','air'].forEach(x=>tags.add(x));
  if (block === 4) ['foundation','structure','saturn','earth'].forEach(x=>tags.add(x));
  if (block === 5) ['body','stamina','movement','mars','fire'].forEach(x=>tags.add(x));
  if (block === 6) ['heart','social','venus','water'].forEach(x=>tags.add(x));
  if (block === 7) ['spirit','longevity','moon','water'].forEach(x=>tags.add(x));
  return [...tags].filter(Boolean).slice(0,24);
}

function scalarFor(day, guidance) {
  const intensity = Number(String(guidance?.c?.intensity ?? '').match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);
  if (Number.isFinite(intensity)) return Math.max(0.35, Math.min(0.92, intensity / 100));
  const blockScore = Number(day?.blockAssignment?.blockScore ?? NaN);
  if (Number.isFinite(blockScore)) return Math.max(0.35, Math.min(0.92, blockScore));
  return 0.72;
}

function dayField(day, guidance) {
  const tags = inferTags(day, guidance);
  const scalar = scalarFor(day, guidance);
  return {
    astrology: { scalar, tags },
    bazi: { scalar, tags },
    numerology: { scalar, tags },
    mayan: { scalar, tags }
  };
}

function daySignals(day, guidance) {
  const text = `${guidance?.c?.focus ?? ''} ${guidance?.suppMode ?? ''}`.toLowerCase();
  const out = { career:.45, study:.45, creative:.45, body:.45, spirit:.45, love:.35, social:.35, leisure:.35, money:.35 };
  if (/work|career|operation|logistic|build/.test(text)) out.career = .9;
  if (/study|learn|mind|focus|brain|mercury/.test(text)) out.study = .9;
  if (/creative|write|music|art/.test(text)) out.creative = .9;
  if (/body|physical|stamina|movement|back|muscle/.test(text) || Number(day?.block) === 5) out.body = 1;
  if (/spirit|meditation|prayer|sophia|christ/.test(text)) out.spirit = .9;
  if (/love|heart/.test(text)) out.love = .85;
  if (/social|friend|people/.test(text)) out.social = .85;
  if (/money|portfolio|investment/.test(text)) out.money = .85;
  return out;
}

function bodyStatesFor(date) {
  try {
    if (typeof window.bodySummaryForDate === 'function') return window.bodySummaryForDate(date)?.states ?? {};
  } catch {}
  return {};
}

function ensureRegistryIndexes() {
  STATE.registryById = new Map((STATE.registry?.supplements ?? []).map(s => [s.id, s]));
  STATE.registryByName = new Map();
  for (const supplement of STATE.registry?.supplements ?? []) {
    STATE.registryByName.set(norm(supplement.name), supplement.id);
    STATE.registryByName.set(norm(supplement.id), supplement.id);
    for (const alias of supplement.aliases ?? []) STATE.registryByName.set(norm(alias), supplement.id);
  }
}

async function loadRegistry() {
  if (STATE.registry) return STATE.registry;
  const response = await fetch(REGISTRY_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`registry fetch failed: ${response.status}`);
  STATE.registry = await response.json();
  ensureRegistryIndexes();
  return STATE.registry;
}

function historyById(activeDate) {
  const history = {};
  const log = window.state?.suppLog ?? {};
  for (const [date, entry] of Object.entries(log)) {
    if (date > activeDate) continue;
    for (const raw of entry?.taken ?? []) {
      const id = STATE.registryByName.get(norm(raw));
      if (!id) continue;
      (history[id] ??= []).push(date);
    }
  }
  return history;
}

function buildInput(date, day, guidance) {
  const registry = STATE.registry;
  const body = bodyStatesFor(date);
  const field = dayField(day, guidance);
  const histories = historyById(date);
  return {
    day: date,
    registry,
    daySignals: daySignals(day, guidance),
    layers: {
      esoteric: evaluateEsotericRegistry(registry, field),
      body: evaluateBodyRegistry(registry, body),
      frequency: evaluateFrequencyRegistry(registry, date, histories),
      pairing: evaluatePairingRegistry(registry, [])
    },
    config: {}
  };
}

function selectedNames(output) {
  return output.selected.map(item => {
    const primary = STATE.registryById.get(item.atom.primaryId);
    const members = item.atom.memberIds.map(id => STATE.registryById.get(id)?.name ?? id);
    return { primary: primary?.name ?? item.atom.primaryId, members, reason: item.primaryReason, slot: item.slot };
  });
}

function summaryHtml(date, output, legacyBlock) {
  const selected = selectedNames(output).slice(0, 8);
  const held = output.held.slice(0, 5).map(x => `${STATE.registryById.get(x.id)?.name ?? x.id}: ${x.reason}`);
  const residual = output.residual.slice(0, 4).map(x => STATE.registryById.get(x.id)?.name ?? x.id);
  return `<div class="card ace-shadow-card" data-shadow-date="${esc(date)}" style="border-color:rgba(34,211,238,.28)">
    <div class="focus-title">Optimizer Shadow · v1</div>
    <div class="tiny" style="color:var(--muted);margin-top:4px">Legacy Block ${esc(legacyBlock ?? '?')} remains authoritative. This panel is comparison-only.</div>
    <div class="tiny" style="margin-top:8px;color:var(--blue,#60a5fa)">Hash ${esc(output.determinismHash.slice(0,12))} · selected ${output.selected.length} · held ${output.held.length} · residual ${output.residual.length}</div>
    <div style="margin-top:10px;display:grid;gap:6px">${selected.map(item => `<div class="tiny"><b>${esc(item.primary)}</b> · ${esc(item.slot ?? 'slot?')} · ${esc(item.reason)}${item.members.length>1?`<br><span style="color:var(--muted)">group: ${esc(item.members.join(', '))}</span>`:''}</div>`).join('')}</div>
    ${held.length?`<div class="tiny" style="margin-top:10px;color:var(--orange,#fb923c)">Held: ${esc(held.join(' | '))}</div>`:''}
    ${residual.length?`<div class="tiny" style="margin-top:6px;color:var(--muted)">Residual/complete: ${esc(residual.join(', '))}</div>`:''}
  </div>`;
}

function errorHtml(error) {
  return `<div class="card ace-shadow-card" style="border-color:rgba(251,146,60,.35)"><div class="focus-title">Optimizer Shadow · unavailable</div><div class="tiny" style="color:var(--orange,#fb923c)">${esc(error?.message ?? error)}</div></div>`;
}

function mount(html) {
  const grid = document.getElementById('grid-clubs');
  if (!grid) return;
  grid.querySelectorAll('.ace-shadow-card').forEach(node => node.remove());
  grid.insertAdjacentHTML('beforeend', html);
}

async function computeAndMount() {
  try {
    const date = String(window.activeDate || window.state?.activeDate || todayIso()).slice(0,10);
    const day = typeof window.fwEngineDay === 'function' ? window.fwEngineDay(date) : { id: date };
    const guidance = typeof window.deriveGuidanceV23 === 'function' ? window.deriveGuidanceV23(day) : {};
    await loadRegistry();
    const input = buildInput(date, day, guidance);
    const output = optimize(input);
    STATE.cache.set(date, output);
    STATE.lastError = null;
    window.AceMindOptimizerShadow.last = { date, input, output, version: SHADOW_VERSION };
    mount(summaryHtml(date, output, day?.block));
  } catch (error) {
    STATE.lastError = error;
    window.AceMindOptimizerShadow.lastError = String(error?.stack ?? error);
    mount(errorHtml(error));
  }
}

function installRenderPatch() {
  if (window.AceMindOptimizerShadow?.installed) return;
  window.AceMindOptimizerShadow = { version: SHADOW_VERSION, installed: true, compute: computeAndMount, state: STATE };
  const base = window.renderClubs;
  if (typeof base === 'function') {
    window.renderClubs = function patchedRenderClubs(day, guidance) {
      const result = base.apply(this, arguments);
      computeAndMount();
      return result;
    };
  }
  if (document.readyState !== 'loading') computeAndMount();
  else document.addEventListener('DOMContentLoaded', computeAndMount, { once: true });
}

installRenderPatch();
