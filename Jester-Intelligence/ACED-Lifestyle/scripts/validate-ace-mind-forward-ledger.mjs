#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

const STORAGE_KEY = 'ace_mind_state_v214';
const ROOT = path.resolve('Jester-Intelligence/ACED-Lifestyle');
const HTML_PATH = path.join(ROOT, 'ace-mind.html');
const T = '2026-07-10';
const T_PLUS_1 = '2026-07-11';
const FIXED_NOON_UTC_T = '2026-07-10T10:00:00.000Z';
const FIXED_NOON_UTC_T_PLUS_1 = '2026-07-11T10:00:00.000Z';

const report = {
  ok: false,
  test_date: T,
  rollover_date: T_PLUS_1,
  checks: [],
  evidence: {}
};

function assert(cond, message, meta = {}) {
  if (!cond) {
    const err = new Error(message);
    err.meta = meta;
    throw err;
  }
}

function check(name, meta = {}) {
  report.checks.push({ name, ok: true, ...meta });
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function dateRange(start, count) {
  return Array.from({ length: count }, (_, i) => addDaysISO(start, i));
}

function isoWeekStart(iso) {
  const dt = new Date(`${iso}T00:00:00Z`);
  const dow = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - dow + 1);
  return dt.toISOString().slice(0, 10);
}

function isoWeekDatesThrough(iso) {
  const start = isoWeekStart(iso);
  const out = [];
  for (let d = start; d <= iso; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

function sortedKeys(obj) {
  return Object.keys(obj || {}).sort();
}

function parseStateFromStorage(storage) {
  return JSON.parse(storage || '{}');
}

function ledgerOf(state) {
  return state.suppCardPlanHistory || {};
}

function selectedIds(rec) {
  if (!rec) return [];
  if (Array.isArray(rec.selectedIds)) return rec.selectedIds.slice();
  if (Array.isArray(rec.selected)) return rec.selected.map(x => typeof x === 'string' ? x : x && x.id).filter(Boolean);
  return [];
}

function selectedByDate(ledger, dates = sortedKeys(ledger)) {
  return Object.fromEntries(dates.map(d => [d, selectedIds(ledger[d])]));
}

function recordBytesByDate(ledger, dates = sortedKeys(ledger)) {
  return Object.fromEntries(dates.map(d => [d, JSON.stringify(ledger[d])]));
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mapEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function assertInlineJavaScriptParses() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs))
    .filter(([, attrs]) => {
      const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
      return !type || /^(text\/javascript|application\/javascript|module)$/i.test(type);
    })
    .map(([, , body]) => body);
  assert(scripts.length > 0, 'No inline scripts found in ace-mind.html');
  scripts.forEach((script, i) => {
    try {
      new Function(script);
    } catch (err) {
      throw new Error(`Inline script ${i + 1} failed to parse: ${err.message}`);
    }
  });
  check('JavaScript parses successfully', { scripts: scripts.length });
}

function assertYearMapRemoved() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const forbidden = [
    'yearMapModal',
    'openYearMap',
    'renderYearMap',
    'fwPreviewYearDate',
    'fwApplyYearDate',
    'fwSelectYearMonth',
    'fwYearMap',
    'year-map',
    'year-preview',
    'lazy-year-map',
    'keepYearMapOpen'
  ];
  const found = forbidden.filter(token => html.includes(token));
  assert(found.length === 0, 'Year Map code still exists', { found });
  check('Year Map code and preview paths removed', { forbidden_tokens: forbidden.length });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json' || ext === '.webmanifest') return 'application/json; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

async function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'ace-mind.html';
      const filePath = path.normalize(path.join(ROOT, rel));
      if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'content-type': contentType(filePath) });
        res.end(data);
      });
    } catch (err) {
      res.writeHead(500);
      res.end(String(err && err.message || err));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, url: `http://127.0.0.1:${port}/ace-mind.html` };
}

function dateMockInit({ fixedIso, storageValue }) {
  return {
    fixedMs: Date.parse(fixedIso),
    storageKey: STORAGE_KEY,
    storageValue
  };
}

async function openApp(browser, appUrl, fixedIso, storageValue) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  await context.addInitScript(({ fixedMs, storageKey, storageValue: initialStorage }) => {
    const RealDate = Date;
    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) return new RealDate(fixedMs);
        return new RealDate(...args);
      }
      static now() { return fixedMs; }
      static parse(value) { return RealDate.parse(value); }
      static UTC(...args) { return RealDate.UTC(...args); }
    }
    Object.defineProperty(MockDate, 'name', { value: 'Date' });
    window.Date = MockDate;
    if (initialStorage) localStorage.setItem(storageKey, initialStorage);
  }, dateMockInit({ fixedIso, storageValue }));
  const page = await context.newPage();
  page.on('pageerror', err => pageErrors.push(err.message || String(err)));
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.ensureRollingSupplementLedger === 'function', null, { timeout: 15000 });
  await page.evaluate(() => window.ensureRollingSupplementLedger());
  await page.waitForFunction(key => {
    try {
      const st = JSON.parse(localStorage.getItem(key) || '{}');
      return st.suppCardPlanHistory && Object.keys(st.suppCardPlanHistory).length >= 15;
    } catch (err) {
      return false;
    }
  }, STORAGE_KEY, { timeout: 15000 });
  await page.waitForTimeout(150);
  return { context, page, pageErrors };
}

async function readStorage(page) {
  return page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
}

async function readState(page) {
  return parseStateFromStorage(await readStorage(page));
}

function assertNoPageErrors(opened, label) {
  assert(opened.pageErrors.length === 0, `${label} page errors`, { pageErrors: opened.pageErrors });
}

function mutateStorage(storage, fn) {
  const state = parseStateFromStorage(storage);
  fn(state);
  return JSON.stringify(state);
}

function countAny(ids, pool) {
  const set = new Set(pool);
  return ids.filter(id => set.has(id)).length;
}

function assertSupplementRules({ ledger, policy, appendedDate, model }) {
  const nadIds = ['nr', 'nmn', 'nmnh'];
  const nadPairIds = ['tmg', 'magnesium_citrate'];
  const mineralBiomass = ['spirulina', 'irish_sea_moss', 'shilajit'];
  const sleepAid = ['melatonin', 'valerian', 'ashwagandha'];
  const weeklyHerbs = policy.weekly_limited_herbs || ['gotu_kola', 'reishi', 'fadogia_agrestis', 'turkesterone', 'ashwagandha'];
  const repeatable = new Set([...(policy.repeatable_support_ids || []), 'tmg', 'magnesium_citrate', 'magnesium_malate', 'magnesium_bisglycinate', 'magnesium_taurate', 'omega_3', 'coq10', 'creatine', 'collagen', 'vitamin_c']);
  const ids = selectedIds(ledger[appendedDate]);
  const priorDate = addDaysISO(appendedDate, -1);
  const priorIds = selectedIds(ledger[priorDate]);
  const weekDates = isoWeekDatesThrough(appendedDate);
  const weeklyQuotas = policy.weekly_esoteric_quotas || {};

  assert(ids.length > 0, 'Appended day has no selected supplements', { appendedDate });
  assert(new Set(ids).size === ids.length, 'Appended day contains duplicate selected IDs', { appendedDate, ids });
  assert(ids.length <= Number(policy.daily_cap || 12), 'Appended day exceeds daily cap', { appendedDate, ids, daily_cap: policy.daily_cap });
  assert(countAny(ids, nadIds) <= 1, 'More than one primary NAD booster selected', { appendedDate, ids });
  if (countAny(ids, nadIds) === 1) {
    assert(nadPairIds.every(id => ids.includes(id)), 'NAD day is missing mandatory TMG/Magnesium Citrate companions', { appendedDate, ids });
  }
  assert(countAny(ids, weeklyHerbs) <= 1, 'Weekly-limited herbs cluster on appended day', { appendedDate, ids, weeklyHerbs });
  assert(countAny(ids, mineralBiomass) <= 1, 'Mineral-biomass products cluster on appended day', { appendedDate, ids });
  assert(countAny(ids, sleepAid) <= 1, 'Primary sleep aids cluster on appended day', { appendedDate, ids });
  assert(!(ids.includes('multivitamin') && ids.includes('b_complex')), 'Multivitamin and B-Complex selected together', { appendedDate, ids });
  assert(!(ids.includes('black_maca') && (ids.includes('fadogia_agrestis') || ids.includes('turkesterone'))), 'Black Maca conflicts with Fadogia/Turkesterone', { appendedDate, ids });
  assert(!(ids.includes('l_citrulline') && ids.includes('reishi')), 'L-Citrulline conflicts with Reishi', { appendedDate, ids });
  assert(!(ids.includes('ashwagandha') && ids.includes('valerian') && ids.includes('melatonin')), 'Ashwagandha selected with Valerian and Melatonin', { appendedDate, ids });

  const rollingPrior = dateRange(addDaysISO(appendedDate, -6), 6);
  for (const id of ids.filter(id => weeklyHerbs.includes(id))) {
    const previousUse = rollingPrior.some(date => selectedIds(ledger[date]).includes(id));
    assert(!previousUse, 'Weekly-limited herb ignored prior frozen rolling history', { appendedDate, id, rollingPrior });
  }

  const repeated = ids.filter(id => priorIds.includes(id) && !repeatable.has(id));
  assert(repeated.length === 0, 'Consecutive-day cooldown ignored prior frozen day', { appendedDate, priorDate, repeated });

  const weekNad = weekDates.reduce((sum, date) => sum + countAny(selectedIds(ledger[date]), nadIds), 0);
  assert(weekNad <= Number(policy.nad_days || 6), 'Weekly NAD cap exceeded through appended day', { appendedDate, weekDates, weekNad, nad_days: policy.nad_days });

  const quotaFailures = [];
  for (const [id, quota] of Object.entries(weeklyQuotas)) {
    if (!quota || quota.max == null) continue;
    const count = weekDates.reduce((sum, date) => sum + (selectedIds(ledger[date]).includes(id) ? 1 : 0), 0);
    if (count > Number(quota.max)) quotaFailures.push({ id, count, max: quota.max });
  }
  assert(quotaFailures.length === 0, 'Weekly quotas exceeded through appended day', { appendedDate, quotaFailures });

  const locked = (model.selected || []).filter(item => item && item.body && item.body.status === 'LOCKED').map(item => item.card && item.card.id);
  assert(locked.length === 0, 'Body veto locked card selected on appended day', { appendedDate, locked });

  return {
    appended_selected: ids,
    appended_nad_count: countAny(ids, nadIds),
    week_nad_count_through_appended: weekNad,
    appended_weekly_limited_count: countAny(ids, weeklyHerbs),
    prior_day_overlap_allowed: ids.filter(id => priorIds.includes(id))
  };
}

async function assertExistingFunctionality(page) {
  const result = await page.evaluate(async () => {
    if (typeof render === 'function') render();
    const chamberIds = ['spades', 'clubs', 'diamonds', 'hearts', 'jester', 'temporal'];
    const grids = chamberIds.map(id => {
      const el = document.getElementById(`grid-${id}`);
      return { id, present: !!el, hasHtml: !!(el && el.innerHTML.trim()) };
    });
    const buttonTexts = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
    const hasTodayButton = buttonTexts.includes('Today');
    const hasYearButton = buttonTexts.includes('Year');
    const railCount = document.querySelectorAll('#dayRail .day-btn').length;
    if (typeof setDay === 'function') setDay(brusselsISODate());
    if (typeof setChamber === 'function') {
      for (const id of chamberIds) setChamber(id, false, true);
    }
    if (typeof openModal === 'function') {
      openModal('aiModal');
      openModal('lensModal');
      openModal('patchModal');
    }
    const serviceWorkerSupported = 'serviceWorker' in navigator;
    let serviceWorkerRegistered = false;
    let serviceWorkerError = '';
    try {
      if (typeof aceNudgeRegisterSW === 'function') {
        const reg = await aceNudgeRegisterSW();
        serviceWorkerRegistered = !!reg;
      }
    } catch (err) {
      serviceWorkerError = err && err.message || String(err);
    }
    return {
      grids,
      hasTodayButton,
      hasYearButton,
      railCount,
      exportImport: typeof exportState === 'function' && typeof importStateFile === 'function',
      ai: typeof renderAI === 'function' && !!document.getElementById('aiModal'),
      lens: typeof updateLens === 'function' && !!document.getElementById('lensModal'),
      patch: typeof applyPatch === 'function' && !!document.getElementById('patchModal'),
      serviceWorkerSupported,
      serviceWorkerRegistered,
      serviceWorkerError
    };
  });
  assert(result.grids.every(g => g.present && g.hasHtml), 'One or more ACE Mind chambers failed to render', result);
  assert(result.hasTodayButton, 'Today button missing', result);
  assert(!result.hasYearButton, 'Year button still visible', result);
  assert(result.railCount === 15, 'Rolling selector should render 15 visible days', result);
  assert(result.exportImport, 'JSON export/import functions missing', result);
  assert(result.ai, 'AI modal/rendering path missing', result);
  assert(result.lens, 'Lens modal/rendering path missing', result);
  assert(result.patch, 'Patch modal/apply path missing', result);
  assert(result.serviceWorkerSupported && result.serviceWorkerRegistered, 'Service worker failed to load/register', result);
  check('Existing ACE Mind workflows still exposed', result);
}

async function runUiMutationImmutability(page, dates) {
  const beforeState = await readState(page);
  const beforeBytes = recordBytesByDate(ledgerOf(beforeState), dates);
  const beforeSelected = selectedByDate(ledgerOf(beforeState), dates);
  const target = dates[2];
  await page.evaluate(async ({ target }) => {
    if (typeof setChamber === 'function') setChamber('clubs', false, true);
    if (typeof setDay === 'function') setDay(target);
    if (typeof window.aceRenderSuppAlternatives === 'function') window.aceRenderSuppAlternatives(target);
    const rec = state.suppCardPlanHistory[target];
    const firstName = rec && rec.selectedNames && rec.selectedNames[0];
    if (firstName && typeof tickSupp === 'function') {
      tickSupp(target, firstName);
      tickSupp(target, firstName);
    }
    if (typeof setBody === 'function') setBody(target, 'liver', 'orange');
    if (typeof setChamber === 'function') {
      for (const id of ['spades', 'diamonds', 'hearts', 'jester', 'temporal', 'clubs']) setChamber(id, false, true);
    }
    if (typeof openModal === 'function') {
      openModal('aiModal');
      openModal('lensModal');
      openModal('patchModal');
    }
    if (window.JesterAI && typeof restoreAfterAIHandoff === 'function') {
      JesterAI.handoffActive = true;
      JesterAI.handoffStartedAt = Date.now() - 2000;
      JesterAI.lastModel = 'Harness';
      restoreAfterAIHandoff();
    }
    if (typeof window.aceClearSupplementVolatileCaches === 'function') window.aceClearSupplementVolatileCaches();
    if (typeof render === 'function') render();
  }, { target });
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.ensureRollingSupplementLedger === 'function', null, { timeout: 15000 });
  await page.evaluate(() => window.ensureRollingSupplementLedger());
  await page.waitForTimeout(150);
  const afterState = await readState(page);
  const afterBytes = recordBytesByDate(ledgerOf(afterState), dates);
  const afterSelected = selectedByDate(ledgerOf(afterState), dates);
  assert(mapEqual(afterSelected, beforeSelected), 'Frozen selected IDs changed after UI mutations/reload', { beforeSelected, afterSelected });
  assert(mapEqual(afterBytes, beforeBytes), 'Frozen records changed after UI mutations/reload', { changed_dates: dates.filter(d => beforeBytes[d] !== afterBytes[d]) });
  check('UI actions, cache clearing, body edits, ticking, AI return, and reload preserve frozen records', { checked_dates: dates.length, target });
}

async function main() {
  assertInlineJavaScriptParses();
  assertYearMapRemoved();

  const expectedT = dateRange(T, 15);
  const expectedTPlus1Visible = dateRange(T_PLUS_1, 15);
  const appendedDate = addDaysISO(T_PLUS_1, 14);
  const { server, url } = await startServer();
  let browser;
  try {
    browser = await chromium.launch();

    const fresh = await openApp(browser, url, FIXED_NOON_UTC_T);
    assertNoPageErrors(fresh, 'fresh T');
    const freshStorage = await readStorage(fresh.page);
    const freshState = parseStateFromStorage(freshStorage);
    const freshLedger = ledgerOf(freshState);
    assert(arraysEqual(sortedKeys(freshLedger), expectedT), 'Fresh state did not create exactly T through T+14 records', { keys: sortedKeys(freshLedger), expectedT });
    for (const date of expectedT) {
      const rec = freshLedger[date];
      assert(rec && rec.date === date, 'Ledger record date/key mismatch', { date, recDate: rec && rec.date });
      assert(selectedIds(rec).length > 0, 'Ledger record has no selected IDs', { date });
      assert(rec.createdAt, 'Ledger record has no creation timestamp', { date });
    }
    check('Fresh mocked Brussels date creates exactly 15 immutable records', { from: T, through: expectedT[14] });

    const freshBytes = recordBytesByDate(freshLedger, expectedT);
    const freshCreatedAt = Object.fromEntries(expectedT.map(d => [d, freshLedger[d].createdAt]));
    const freshSelected = selectedByDate(freshLedger, expectedT);
    await fresh.context.close();

    const reloaded = await openApp(browser, url, FIXED_NOON_UTC_T, freshStorage);
    assertNoPageErrors(reloaded, 'reload T');
    const reloadStorage = await readStorage(reloaded.page);
    const reloadState = parseStateFromStorage(reloadStorage);
    const reloadLedger = ledgerOf(reloadState);
    assert(arraysEqual(sortedKeys(reloadLedger), expectedT), 'Reload on T changed ledger keys', { keys: sortedKeys(reloadLedger), expectedT });
    assert(mapEqual(selectedByDate(reloadLedger, expectedT), freshSelected), 'Reload on T changed selected IDs');
    assert(mapEqual(Object.fromEntries(expectedT.map(d => [d, reloadLedger[d].createdAt])), freshCreatedAt), 'Reload on T changed creation timestamps');
    assert(mapEqual(recordBytesByDate(reloadLedger, expectedT), freshBytes), 'Reload on T rewrote frozen records');
    check('Reload on T preserves selected arrays, createdAt, and record bytes', { records: expectedT.length });

    const storageWithFutureBodyVeto = mutateStorage(reloadStorage, state => {
      const bodyPlan = { ...(state.bodyPlan || state.body || {}) };
      bodyPlan[`${appendedDate}__liver`] = 'red';
      state.bodyPlan = bodyPlan;
      state.body = bodyPlan;
    });
    const beforeRolloverState = parseStateFromStorage(storageWithFutureBodyVeto);
    const beforeRolloverLedger = ledgerOf(beforeRolloverState);
    const beforeRolloverKeys = sortedKeys(beforeRolloverLedger);
    const preservedDates = dateRange(T_PLUS_1, 14);
    const preservedBytes = recordBytesByDate(beforeRolloverLedger, preservedDates);
    await reloaded.context.close();

    const rollover = await openApp(browser, url, FIXED_NOON_UTC_T_PLUS_1, storageWithFutureBodyVeto);
    assertNoPageErrors(rollover, 'rollover T+1');
    const rolloverState = await readState(rollover.page);
    const rolloverLedger = ledgerOf(rolloverState);
    const rolloverKeys = sortedKeys(rolloverLedger);
    const newKeys = rolloverKeys.filter(k => !beforeRolloverKeys.includes(k));
    assert(rolloverLedger[T], 'Historical first date was removed on rollover', { T, rolloverKeys });
    assert(newKeys.length === 1 && newKeys[0] === appendedDate, 'Rollover should create only the newly appended final date', { newKeys, appendedDate });
    assert(expectedTPlus1Visible.every(d => rolloverLedger[d]), 'Visible T+1 through T+15 records are missing after rollover', { expectedTPlus1Visible, rolloverKeys });
    assert(mapEqual(recordBytesByDate(rolloverLedger, preservedDates), preservedBytes), 'Rollover rewrote one or more surviving visible records', { changed_dates: preservedDates.filter(d => preservedBytes[d] !== JSON.stringify(rolloverLedger[d])) });
    check('Advancing Brussels date creates only the new final day and preserves surviving records byte-for-byte', { newKeys, preserved_dates: preservedDates.length, retained_history: T });

    await rollover.page.evaluate(date => {
      if (typeof setDay === 'function') setDay(date);
      if (typeof setChamber === 'function') setChamber('clubs', false, true);
      if (typeof render === 'function') render();
    }, appendedDate);
    const policyAndModel = await rollover.page.evaluate(date => {
      const d = fwEngineDay(date);
      const g = deriveGuidanceV23(d);
      const model = window.aceBuildSupplementCardModel(d, g);
      return {
        policy: window.ACE_SUPPLEMENT_POLICY_V4,
        model: {
          selected: (model.selected || []).map(item => ({
            id: item.card && item.card.id,
            body: item.body || null
          }))
        }
      };
    }, appendedDate);
    const ruleEvidence = assertSupplementRules({
      ledger: rolloverLedger,
      policy: policyAndModel.policy,
      appendedDate,
      model: policyAndModel.model
    });
    check('Newly appended day respects frozen-history rotations, quotas, pairings, cooldowns, conflicts, and body vetoes', ruleEvidence);

    await runUiMutationImmutability(rollover.page, expectedTPlus1Visible);
    await assertExistingFunctionality(rollover.page);
    assertNoPageErrors(rollover, 'post-mutation');

    const finalState = await readState(rollover.page);
    report.evidence = {
      fresh_keys: sortedKeys(freshLedger),
      reload_record_bytes_unchanged: true,
      rollover_before_keys: beforeRolloverKeys,
      rollover_after_keys: sortedKeys(ledgerOf(finalState)),
      rollover_new_keys: newKeys,
      rollover_preserved_visible_dates: preservedDates,
      rollover_preserved_visible_records_byte_for_byte: true,
      appended_date: appendedDate,
      appended_selected_ids: selectedIds(ledgerOf(finalState)[appendedDate]),
      body_snapshot_for_appended_day: ledgerOf(finalState)[appendedDate] && ledgerOf(finalState)[appendedDate].bodySnapshot,
      rule_evidence: ruleEvidence
    };
    await rollover.context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  report.ok = true;
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  report.ok = false;
  report.error = err.message || String(err);
  if (err.meta) report.error_meta = err.meta;
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
