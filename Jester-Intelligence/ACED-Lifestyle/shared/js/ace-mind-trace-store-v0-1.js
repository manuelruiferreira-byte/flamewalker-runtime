/* ACE Mind IndexedDB Trace Store v0.1
   Memory before mutation. Observe only.
   No scoring changes, no supplement changes, no block recalculation, no patch application.
*/
(function aceMindTraceStoreV01(){
  'use strict';
  if (window.__ACE_MIND_TRACE_STORE_V01__) return;
  window.__ACE_MIND_TRACE_STORE_V01__ = true;

  const TRACE_VERSION = 'ace-mind-trace-store-v0.1';
  const DB_NAME = 'aced_mind_db';
  const DB_VERSION = 1;
  const STORES = {
    traces: 'traces',
    corrections: 'corrections',
    feedbackPackets: 'feedbackPackets',
    patchArchive: 'patchArchive',
    appSnapshots: 'appSnapshots'
  };
  const META_KEY = 'ace_mind_trace_store_v01_meta';
  let dbPromise = null;
  let captureTimer = null;
  let lastDigest = '';

  function nowIso(){ return new Date().toISOString(); }
  function safeDate(value){
    try {
      const v = value || window.activeDate || (window.state && window.state.activeDate) || (typeof window.brusselsISODate === 'function' ? window.brusselsISODate() : null) || nowIso();
      return String(v).slice(0, 10);
    } catch(e) { return nowIso().slice(0, 10); }
  }
  function hashString(str){
    let h = 2166136261;
    str = String(str || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }
  function cloneLite(value, depth, seen){
    depth = depth == null ? 0 : depth;
    seen = seen || new WeakSet();
    if (value == null) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'function') return '[Function]';
    if (depth > 5) return '[DepthLimit]';
    if (typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      if (Array.isArray(value)) return value.slice(0, 80).map(v => cloneLite(v, depth + 1, seen));
      const out = {};
      Object.keys(value).slice(0, 140).forEach(k => {
        if (/html|element|node|target|currentTarget/i.test(k)) return;
        try { out[k] = cloneLite(value[k], depth + 1, seen); } catch(e) { out[k] = '[Unreadable]'; }
      });
      return out;
    }
    return String(value);
  }
  function stableStringify(value){
    const seen = new WeakSet();
    function sortObj(v){
      if (!v || typeof v !== 'object') return v;
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
      if (Array.isArray(v)) return v.map(sortObj);
      return Object.keys(v).sort().reduce((o, k) => { o[k] = sortObj(v[k]); return o; }, {});
    }
    try { return JSON.stringify(sortObj(value)); } catch(e) { return String(value); }
  }

  function openDB(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(ev){
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORES.traces)) {
          const s = db.createObjectStore(STORES.traces, { keyPath: 'traceId' });
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
          s.createIndex('digest', 'digest', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.corrections)) {
          const s = db.createObjectStore(STORES.corrections, { keyPath: 'correctionId' });
          s.createIndex('traceId', 'traceId', { unique: false });
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
          s.createIndex('surface', 'surface', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.feedbackPackets)) {
          const s = db.createObjectStore(STORES.feedbackPackets, { keyPath: 'packetId' });
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.patchArchive)) {
          const s = db.createObjectStore(STORES.patchArchive, { keyPath: 'patchId' });
          s.createIndex('status', 'status', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.appSnapshots)) {
          const s = db.createObjectStore(STORES.appSnapshots, { keyPath: 'snapshotId' });
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
    return dbPromise;
  }
  async function put(storeName, value){
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || new Error('IndexedDB put failed'));
    });
  }
  async function getAll(storeName, limit){
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const out = [];
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).openCursor(null, 'prev');
      req.onsuccess = ev => {
        const cursor = ev.target.result;
        if (!cursor || (limit && out.length >= limit)) return resolve(out);
        out.push(cursor.value);
        cursor.continue();
      };
      req.onerror = () => reject(req.error || new Error('IndexedDB cursor failed'));
    });
  }
  async function getByIndex(storeName, indexName, value, limit){
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const out = [];
      const tx = db.transaction(storeName, 'readonly');
      const idx = tx.objectStore(storeName).index(indexName);
      const req = idx.openCursor(IDBKeyRange.only(value), 'prev');
      req.onsuccess = ev => {
        const cursor = ev.target.result;
        if (!cursor || (limit && out.length >= limit)) return resolve(out);
        out.push(cursor.value);
        cursor.continue();
      };
      req.onerror = () => reject(req.error || new Error('IndexedDB index cursor failed'));
    });
  }

  function currentEngineObjects(date){
    date = safeDate(date);
    let d = null, g = null, body = null, block = null;
    try { if (typeof window.day === 'function' && safeDate(window.activeDate) === date) d = window.day(); } catch(e) {}
    try { if (!d && typeof window.fwEngineDay === 'function') d = window.fwEngineDay(date); } catch(e) {}
    try { if (d && typeof window.deriveGuidanceV23 === 'function') g = window.deriveGuidanceV23(d); } catch(e) {}
    try { if (typeof window.bodySummaryForDate === 'function') body = window.bodySummaryForDate(date); } catch(e) {}
    try { if (d && typeof window.blockFor === 'function') block = window.blockFor(d); } catch(e) {}
    return { d, g, body, block };
  }

  function buildTrace(reason, date){
    date = safeDate(date);
    const eo = currentEngineObjects(date);
    const d = eo.d || {};
    const g = eo.g || {};
    const body = eo.body || (g.c && g.c.body) || {};
    const blockHistory = (window.state && window.state.blockHistory && window.state.blockHistory[date]) || null;
    const suppLog = (window.state && window.state.suppLog && window.state.suppLog[date]) || null;
    const practiceLog = (window.state && window.state.practiceLog && window.state.practiceLog[date]) || null;
    const domainScores = {};
    try {
      Object.entries(g.life || {}).forEach(([k, v]) => {
        domainScores[k] = {
          score: Number(v && v.score || 0),
          action: v && v.action || '',
          why: v && v.why || '',
          state: v && (v.state || (v.axis && v.axis.state) || (v.chromatic && v.chromatic.state)) || '',
          theon: cloneLite(v && (v.theon || v.theonFull) || null)
        };
      });
    } catch(e) {}
    const trace = {
      traceId: 'ace-mind-' + date + '-' + hashString(nowIso() + Math.random()),
      app: 'ACE Mind', traceVersion: TRACE_VERSION,
      appVersion: window.APP_VERSION || window.ACE_THEON_V05_VERSION || window.ACE_MIND_STABILITY_BRIDGE_VERSION || 'unknown',
      date, reason: reason || 'scheduled-capture', createdAt: nowIso(),
      engineInputs: {
        activeDate: date,
        bodyState: cloneLite(body),
        esotericSignals: cloneLite({ ptrm: d.ptrm, focusHint: d.focusHint, mayan: d.mayan, bazi: d.bazi, astrology: d.astrology }),
        manualOverrides: cloneLite((window.state && window.state.manualOverrides) || []),
        environmentSignals: cloneLite({ shift: d.shift, dayNum: d.dayNum, weekday: d.weekday })
      },
      engineOutputs: {
        activeDate: date,
        primaryQuest: g.c && (g.c.focus || g.c.primaryQuest || g.c.command) || '',
        summary: g.c && (g.c.summary || g.c.theon || '') || '',
        domainScores,
        supplementBlock: {
          dayBlock: d.block || d.finalBlock || d.supplementBlock || null,
          frozen: !!(d.blockFrozen || (blockHistory && blockHistory.frozen)),
          blockHistory: cloneLite(blockHistory),
          blockName: eo.block && eo.block.name || null,
          suppMode: g.suppMode || null,
          supplements: cloneLite(g.supplements || g.suppBlock || null)
        },
        practiceBlock: {
          frequency: g.freq || null, breath: g.breath || null, movement: g.movement || null,
          acupressure: g.acu || null, chakra: g.chakra || null, food: g.food || null,
          practiceReason: g.practiceReason || null
        },
        warnings: cloneLite(g.warnings || g.alerts || [])
      },
      lockState: {
        dailyBlockLocked: !!(blockHistory && blockHistory.frozen),
        manualOverrideUsed: !!(window.state && window.state.manualOverrides && window.state.manualOverrides.length),
        blockHistory: cloneLite(blockHistory), suppLog: cloneLite(suppLog), practiceLog: cloneLite(practiceLog)
      },
      userCorrections: [], mutationStatus: 'observe_only_no_mutation'
    };
    trace.digest = hashString(stableStringify({ date, engineInputs: trace.engineInputs, engineOutputs: trace.engineOutputs, lockState: trace.lockState }));
    return trace;
  }

  async function captureTrace(reason, date, force){
    try {
      const trace = buildTrace(reason, date);
      if (!force && trace.digest === lastDigest) return trace;
      lastDigest = trace.digest;
      await put(STORES.traces, trace);
      localStorage.setItem(META_KEY, JSON.stringify({ version: TRACE_VERSION, lastTraceId: trace.traceId, lastDate: trace.date, lastDigest: trace.digest, lastAt: trace.createdAt }));
      return trace;
    } catch(e) { console.warn('ACE Mind Trace Store capture failed', e); return null; }
  }
  function captureSoon(reason, date, force){ clearTimeout(captureTimer); captureTimer = setTimeout(() => captureTrace(reason, date, force), 180); }
  async function addCorrection(message, surface, severity, date){
    date = safeDate(date);
    const latest = await captureTrace('before-user-correction', date, true);
    const correction = { correctionId: 'corr-' + date + '-' + hashString(nowIso() + message + Math.random()), traceId: latest && latest.traceId || null, app: 'ACE Mind', date, surface: surface || 'general', severity: severity || 'medium', message: String(message || '').slice(0, 2000), createdAt: nowIso(), status: 'unresolved' };
    await put(STORES.corrections, correction);
    try { if (typeof window.toast === 'function') window.toast('Trace correction saved'); } catch(e) {}
    return correction;
  }
  async function buildFeedbackPacket(date){
    date = safeDate(date);
    const latestTrace = await captureTrace('feedback-packet-export', date, true);
    const traces = await getByIndex(STORES.traces, 'date', date, 12);
    const corrections = await getByIndex(STORES.corrections, 'date', date, 20);
    const packet = {
      packetId: 'feedback-' + date + '-' + hashString(nowIso() + Math.random()),
      packetType: 'theon_sia_feedback_v0_1', targetApp: 'ACE Mind', sourceApp: 'ACE Mind IndexedDB Trace Store',
      version: TRACE_VERSION, date, createdAt: nowIso(),
      doctrine: 'Memory before mutation. Observe only. Any future patch must pass THEON gate, shadow run, human approval, and rollback preservation.',
      latestTraceId: latestTrace && latestTrace.traceId,
      evidence: { latestTrace: cloneLite(latestTrace), recentTraces: cloneLite(traces), corrections: cloneLite(corrections) },
      allowedMutationTypes: ['harness_patch', 'soft_weight_delta', 'prompt_template_update', 'routing_threshold_update'],
      forbiddenMutationTypes: ['silent_daily_recalculation', 'breaking_daily_block_lock', 'unbounded_weight_change', 'direct_model_training', 'removing_human_approval', 'removing_rollback'],
      requiredOutput: { patch: true, tests: true, rollback: true, failureModes: true, shadowRunPlan: true }
    };
    await put(STORES.feedbackPackets, packet);
    return packet;
  }
  async function exportFeedbackPacket(date){ const packet = await buildFeedbackPacket(date); downloadObject(packet, 'ace-mind-feedback-packet-' + packet.date + '.json'); return packet; }
  async function exportTraceArchive(){
    const archive = { packetType: 'ace_mind_indexeddb_trace_archive_v0_1', version: TRACE_VERSION, exportedAt: nowIso(), traces: await getAll(STORES.traces, 80), corrections: await getAll(STORES.corrections, 80), feedbackPackets: await getAll(STORES.feedbackPackets, 20), patchArchive: await getAll(STORES.patchArchive, 40), appSnapshots: await getAll(STORES.appSnapshots, 20) };
    downloadObject(archive, 'ace-mind-trace-archive-' + safeDate() + '.json');
    return archive;
  }
  function downloadObject(obj, name){
    if (typeof window.downloadJson === 'function') return window.downloadJson(obj, name);
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function installWrappers(){
    try { if (typeof window.render === 'function' && !window.render.__aceTraceWrapped) { const baseRender = window.render; window.render = function aceTraceWrappedRender(){ const out = baseRender.apply(this, arguments); captureSoon('after-render', safeDate(), false); return out; }; window.render.__aceTraceWrapped = true; } } catch(e) {}
    try { if (typeof window.setDay === 'function' && !window.setDay.__aceTraceWrapped) { const baseSetDay = window.setDay; window.setDay = function aceTraceWrappedSetDay(){ const out = baseSetDay.apply(this, arguments); captureSoon('after-set-day', safeDate(), true); return out; }; window.setDay.__aceTraceWrapped = true; } } catch(e) {}
    try { if (typeof window.exportState === 'function' && !window.exportState.__aceTraceWrapped) { const baseExport = window.exportState; window.exportState = function aceTraceWrappedExportState(){ captureSoon('before-export-state', safeDate(), true); return baseExport.apply(this, arguments); }; window.exportState.__aceTraceWrapped = true; } } catch(e) {}
    try { if (typeof window.buildBridgePayload === 'function' && !window.buildBridgePayload.__aceTraceWrapped) { const basePayload = window.buildBridgePayload; window.buildBridgePayload = function aceTraceWrappedBuildBridgePayload(){ const out = basePayload.apply(this, arguments); try { out.trace_store = { version: TRACE_VERSION, indexedDB: DB_NAME, lastDigest, export_hint: 'Use ACETraceStore.exportFeedbackPacket() for full trace packet.' }; } catch(e) {} captureSoon('after-build-ai-payload', safeDate(), true); return out; }; window.buildBridgePayload.__aceTraceWrapped = true; } } catch(e) {}
  }
  function boot(){
    window.ACETraceStore = { version: TRACE_VERSION, dbName: DB_NAME, stores: Object.assign({}, STORES), openDB, captureTrace: (reason, date) => captureTrace(reason || 'manual-capture', date, true), addCorrection, buildFeedbackPacket, exportFeedbackPacket, exportTraceArchive, getRecentTraces: limit => getAll(STORES.traces, limit || 20), getCorrections: limit => getAll(STORES.corrections, limit || 20) };
    installWrappers(); captureSoon('trace-store-boot', safeDate(), true); setTimeout(installWrappers, 700); setTimeout(() => captureTrace('trace-store-boot-late', safeDate(), true), 1200);
    try { console.log('ACE Mind IndexedDB Trace Store active:', TRACE_VERSION); } catch(e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
