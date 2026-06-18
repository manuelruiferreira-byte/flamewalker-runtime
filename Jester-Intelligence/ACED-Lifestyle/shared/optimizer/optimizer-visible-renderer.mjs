import { buildVisibleSupplementModel } from './optimizer-visible-model.mjs';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);
}

function actionColor(action) {
  if (action === 'TAKE TODAY') return 'var(--cyan,#22d3ee)';
  if (action === 'REQUIRED PAIR') return 'var(--gold2,#fde68a)';
  if (/HOLD|REVIEW|INCOMPLETE|LIMIT|COOLING|CONFLICT/.test(action)) return 'var(--orange,#f97316)';
  if (action === 'EXCLUDED') return 'var(--red,#ef4444)';
  return 'var(--muted,#91a3b9)';
}


function selectedRow(row,date) {
  const ticked=typeof window!=='undefined'&&typeof window.isTicked==='function'&&window.isTicked(date,row.name);
  return `<div class="supp-item" data-optimizer-supp="${esc(row.name)}" data-optimizer-reason="${esc(row.reason)}">`+
    `<button type="button" class="check${ticked?' checked':''}" data-optimizer-tick="1" aria-label="Mark ${esc(row.name)} taken"></button>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div></div>`+
    `<div class="supp-side"><span class="fw-timing-badge now">${esc(row.slot.toUpperCase())}</span></div></div>`;
}

function notTodayRow(row) {
  return `<div class="supp-item dim" data-optimizer-supp="${esc(row.name)}" data-optimizer-reason="${esc(row.reason)}">`+
    `<div class="check" aria-hidden="true"></div>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div></div>`+
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

export function renderVisibleSupplements(record,registry,root=document.getElementById('grid-clubs')) {
  if (!root) return false;
  const model=buildVisibleSupplementModel(record,registry);
  const slotLabels={morning:'Morning',afternoon:'Afternoon',night:'Night'};
  const selectedHtml=Object.entries(model.groups)
    .filter(([,rows])=>rows.length)
    .map(([slot,rows])=>`<div class="supp-group"><div class="supp-head">${slotLabels[slot]}</div>${rows.map(row=>selectedRow(row,model.date)).join('')}</div>`)
    .join('');
  const notTodayHtml=model.notToday.length
    ? `<details class="supp-group"><summary class="supp-head" style="cursor:pointer">Not today · ${model.notToday.length}</summary>${model.notToday.map(notTodayRow).join('')}</details>`
    : '';
  root.innerHTML=`<div class="card"><div class="focus-title">Individual Supplement Optimizer</div>`+
    `<div class="tiny" style="margin-top:5px;color:var(--cyan)">Authority: individual optimizer · ${esc(model.date)}</div></div>`+
    (selectedHtml||`<div class="supp-group"><div class="small">No supplement cleared every gate today.</div></div>`)+notTodayHtml;
  root.dataset.optimizerAuthority='individual';
  root.dataset.optimizerDate=model.date;
  bindRows(root,model.date);
  return model;
}
