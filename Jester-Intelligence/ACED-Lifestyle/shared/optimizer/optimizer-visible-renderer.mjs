import { buildVisibleSupplementModel } from './optimizer-visible-model-v2.mjs';

const SLOT_LABELS=Object.freeze({morning:'Morning',afternoon:'Afternoon',night:'Night'});
const timingObservers=new WeakMap();

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);
}

function actionColor(action) {
  if (action === 'TAKE TODAY') return 'var(--cyan,#22d3ee)';
  if (action === 'REQUIRED PAIR') return 'var(--gold2,#fde68a)';
  if (/HOLD|REVIEW|INCOMPLETE|LIMIT|COOLING|CONFLICT|ROTATION/.test(action)) return 'var(--orange,#f97316)';
  if (action === 'EXCLUDED') return 'var(--red,#ef4444)';
  return 'var(--muted,#91a3b9)';
}

function diagnosticsHtml(row) {
  const d=row.diagnostics ?? {};
  const num=Number.isFinite(Number(d.numerologyScalar))?Number(d.numerologyScalar).toFixed(2):'—';
  const bazi=Number.isFinite(Number(d.baziScalar))?Number(d.baziScalar).toFixed(2):'—';
  return `<div class="tiny" style="margin-top:4px;line-height:1.45;color:var(--muted)">`+
    `Numerology: ${esc(num)} · BaZi: ${esc(bazi)}<br>`+
    `Convergence: ${esc(d.convergence ?? d.esoteric)} · Body: ${esc(d.body)}<br>`+
    `Frequency: ${esc(d.frequency)} · Pairing: ${esc(d.pairing)}`+
    `</div>`;
}

function selectedRow(row,date) {
  const ticked=typeof window!=='undefined'&&typeof window.isTicked==='function'&&window.isTicked(date,row.name);
  const slot=SLOT_LABELS[row.slot]?row.slot:'morning';
  return `<div class="supp-item" data-optimizer-supp="${esc(row.name)}" data-optimizer-id="${esc(row.id)}" data-optimizer-reason="${esc(row.reason)}" data-practical-slot="${slot}">`+
    `<button type="button" class="check${ticked?' checked':''}" data-optimizer-tick="1" aria-label="Mark ${esc(row.name)} taken"></button>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="supp-note">${esc(row.reason)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div>`+
    diagnosticsHtml(row)+`</div>`+
    `<div class="supp-side"><span class="fw-timing-badge now" data-practical-timing="${slot}">${SLOT_LABELS[slot]}</span></div></div>`;
}

function notTodayRow(row) {
  return `<div class="supp-item dim" data-optimizer-supp="${esc(row.name)}" data-optimizer-id="${esc(row.id)}" data-optimizer-reason="${esc(row.reason)}">`+
    `<div class="check" aria-hidden="true"></div>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="supp-note">${esc(row.reason)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div>`+
    diagnosticsHtml(row)+`</div>`+
    `<div class="supp-side"><span class="fw-timing-badge hold">${esc(String(row.tier).toUpperCase())}</span></div></div>`;
}

function bindRows(root,date) {
  root.querySelectorAll('[data-optimizer-supp]').forEach(element=>{
    element.addEventListener('click',event=>{
      if (event.target.closest('[data-optimizer-tick]')) return;
      if (typeof window.openSupplementCard==='function') {
        window.openSupplementCard(element.dataset.optimizerSupp,element.dataset.optimizerReason||'Optimizer decision','M');
      }
    });
  });
  root.querySelectorAll('[data-optimizer-tick]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const row=button.closest('[data-optimizer-supp]');
      if (row&&typeof window.tickSupp==='function') window.tickSupp(date,row.dataset.optimizerSupp);
    });
  });
}

function enforcePracticalTiming(root) {
  root.querySelectorAll('[data-practical-slot]').forEach(row=>{
    const slot=SLOT_LABELS[row.dataset.practicalSlot]?row.dataset.practicalSlot:'morning';
    const badge=row.querySelector('[data-practical-timing]');
    if (!badge) return;
    badge.dataset.practicalTiming=slot;
    const expected=SLOT_LABELS[slot];
    if (badge.textContent!==expected) badge.textContent=expected;
    badge.setAttribute('aria-label',`Practical intake window: ${expected}`);
  });
}

function installPracticalTimingGuard(root) {
  timingObservers.get(root)?.disconnect();
  const observer=new MutationObserver(()=>enforcePracticalTiming(root));
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-practical-slot','data-practical-timing']});
  timingObservers.set(root,observer);
  enforcePracticalTiming(root);
}

function removeLegacyBlockUi(date) {
  const dayMeta=document.getElementById('dayMeta');
  if(dayMeta)dayMeta.textContent=`${date} · numerology-first card optimizer`;
  const note=document.getElementById('dayNoteSpades');
  if(note)note.placeholder='Log observations for today: what worked, what to tune, how the guidance felt, body signals, and anything worth reviewing later.';
  document.querySelectorAll('.year-block-label,.alt-block-card').forEach(element=>element.remove());
}

export function renderVisibleSupplements(record,registry,root=document.getElementById('grid-clubs')) {
  if (!root) return false;
  const model=buildVisibleSupplementModel(record,registry);
  const selectedHtml=Object.entries(model.groups)
    .filter(([,rows])=>rows.length)
    .map(([slot,rows])=>`<div class="supp-group" data-practical-group="${slot}"><div class="supp-head">${SLOT_LABELS[slot]}</div>${rows.map(row=>selectedRow(row,model.date)).join('')}</div>`)
    .join('');
  const notTodayHtml=model.notToday.length
    ? `<details class="supp-group"><summary class="supp-head" style="cursor:pointer">Not today · ${model.notToday.length}</summary>${model.notToday.map(notTodayRow).join('')}</details>`
    : '';
  root.innerHTML=`<div class="card"><div class="focus-title">Individual Supplement Optimizer</div>`+
    `<div class="small" style="margin-top:5px">Numerology first · BaZi second · body and safety veto · practical timing protected</div>`+
    `<div class="tiny" style="margin-top:5px;color:var(--cyan)">Authority: canonical 42-card policy · ${esc(model.date)}</div></div>`+
    (selectedHtml||`<div class="supp-group"><div class="small">No supplement cleared every gate today.</div></div>`)+notTodayHtml;
  root.dataset.optimizerAuthority='individual-card-policy-v3';
  root.dataset.optimizerDate=model.date;
  bindRows(root,model.date);
  installPracticalTimingGuard(root);
  removeLegacyBlockUi(model.date);
  return model;
}
