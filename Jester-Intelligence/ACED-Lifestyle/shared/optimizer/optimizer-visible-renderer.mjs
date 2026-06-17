import { buildVisibleSupplementModel } from './optimizer-visible-model-v2.mjs?v=20260617-3';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);
}

function brusselsDate(){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  catch{return new Date().toISOString().slice(0,10);}
}

function actionColor(action) {
  if (action === 'TAKE TODAY') return 'var(--cyan,#22d3ee)';
  if (action === 'REQUIRED PAIR') return 'var(--gold2,#fde68a)';
  if (/HOLD|REVIEW|INCOMPLETE|LIMIT|COOLING|CONFLICT/.test(action)) return 'var(--orange,#f97316)';
  if (action === 'EXCLUDED') return 'var(--red,#ef4444)';
  return 'var(--muted,#91a3b9)';
}

function convergenceBadge(row){
  const d=row.diagnostics??{};
  const band=d.convergenceBand??'None';
  const count=Number(d.convergenceCount??0),total=Number(d.convergenceTotal??4);
  const color=band==='Gold'?'var(--gold2,#fde68a)':band==='High'?'var(--cyan,#22d3ee)':band==='Medium'?'var(--blue,#93c5fd)':band==='Low'?'var(--muted,#91a3b9)':'var(--muted,#91a3b9)';
  return `<span class="fw-timing-badge" style="color:${color};border-color:currentColor">${esc(band)} ${count}/${total}</span>`;
}

function timingBadge(row,date){
  if(date===brusselsDate()&&typeof window!=='undefined'&&typeof window.fwComputeTimingBadge==='function'){
    try{
      const result=window.fwComputeTimingBadge(row.name,'ALLOWED','M');
      return `<span class="fw-timing-badge ${esc(result.cls)}" data-timing-name="${esc(row.name)}" data-timing-status="ALLOWED" data-timing-cbr="M" title="${esc(result.title)}">${esc(result.text)}</span>`;
    }catch{}
  }
  return `<span class="fw-timing-badge later">${esc(String(row.slot??'later').toUpperCase())}</span>`;
}

function calculationDetails(row){
  const d=row.diagnostics??{};
  const systems=(d.supportSystems??[]).map(x=>x[0]?.toUpperCase()+x.slice(1)).join(', ')||'none';
  const last=d.lastTakenDate?` · last ${esc(d.lastTakenDate)}`:'';
  return `<details style="margin-top:4px"><summary class="tiny" style="cursor:pointer;color:var(--muted)">Why today</summary>`+
    `<div class="tiny" style="margin-top:4px;line-height:1.45;color:var(--muted)">`+
    `Convergence: ${esc(d.convergenceBand)} ${esc(d.convergenceCount)}/${esc(d.convergenceTotal)} · ${esc(systems)}<br>`+
    `Frequency: ${esc(d.usesThisWindow)}/${esc(d.targetUses7d)} target · max ${esc(d.maxUses7d)}${last}<br>`+
    `Minimum gap ${esc(d.minimumGapHours)}h · active window ${esc(d.residualWindowHours)}h · body ${esc(d.body)} · pairing ${esc(d.pairing)}`+
    `</div></details>`;
}

function selectedRow(row,date) {
  const ticked=typeof window!=='undefined'&&typeof window.isTicked==='function'&&window.isTicked(date,row.name);
  return `<div class="supp-item" data-optimizer-supp="${esc(row.name)}" data-optimizer-reason="${esc(row.reason)}">`+
    `<button type="button" class="check${ticked?' checked':''}" data-optimizer-tick="1" aria-label="Mark ${esc(row.name)} taken"></button>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="supp-note">${esc(row.reason)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div>`+
    calculationDetails(row)+`</div>`+
    `<div class="supp-side">${convergenceBadge(row)}${timingBadge(row,date)}</div></div>`;
}

function notTodayRow(row) {
  return `<div class="supp-item dim" data-optimizer-supp="${esc(row.name)}" data-optimizer-reason="${esc(row.reason)}">`+
    `<div class="check" aria-hidden="true"></div>`+
    `<div><div class="supp-name">${esc(row.name)}</div>`+
    `<div class="supp-note">${esc(row.reason)}</div>`+
    `<div class="tiny" style="margin-top:3px;font-weight:850;color:${actionColor(row.action)}">${esc(row.action)}</div></div>`+
    `<div class="supp-side">${convergenceBadge(row)}</div></div>`;
}

function bindRows(root,date) {
  root.querySelectorAll('[data-optimizer-supp]').forEach(element=>{
    element.addEventListener('click',event=>{
      if (event.target.closest('[data-optimizer-tick]')) return;
      if (typeof window.openSupplementCard==='function') {
        window.openSupplementCard(element.dataset.optimizerSupp,element.dataset.optimizerReason||'Daily selection','M');
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
  const mode=model.historyMode==='projected'?'Future plan · virtual schedule':'Actual intake history';
  root.innerHTML=`<div data-optimizer-live-v3="1"><div class="card"><div class="focus-title">Supplements · ${esc(model.date)}</div>`+
    `<div class="small" style="margin-top:5px">${esc(mode)}</div></div>`+
    (selectedHtml||`<div class="supp-group"><div class="small">No supplement is selected for this date.</div></div>`)+notTodayHtml+`</div>`;
  root.dataset.optimizerAuthority='individual-v3';
  root.dataset.optimizerDate=model.date;
  root.dataset.optimizerVersion=model.version;
  bindRows(root,model.date);
  if(model.date===brusselsDate()&&typeof window.fwUpdateTimingBadges==='function'){
    try{window.fwUpdateTimingBadges();}catch{}
  }
  return model;
}
