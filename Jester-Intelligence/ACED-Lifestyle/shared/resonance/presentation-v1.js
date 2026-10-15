(function(root){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function factors(row){return `<details class="ace-factors"><summary>Why ${row.score}%?</summary><p>Neutral baseline 50. Each symbolic contribution is shown below.</p>${row.contributions.map(c=>`<div><b>${esc(c.layer)} · ${c.points>=0?'+':''}${c.points.toFixed(2)} points</b><p>${esc(c.explanation)}</p></div>`).join('')}<small>Rounding occurs once at the final 0–100 score. Resonance is symbolic, not medical evidence.</small></details>`;}
function banner(out){return `<div class="card ace-engine-banner"><b>Immutable daily forecast · ${esc(out.date)}</b><p>${esc(out.engineVersion)} · Profile ${esc(out.profileVersion)} · Europe/Brussels</p><p>${out.astronomyStatus.includes('unavailable')?'Astronomical data unavailable for this date. Transit and lunar contributions are neutral; other symbolic layers remain active.':'Astronomy: source-transcribed 2026 ephemeris, fixed 00:00 UTC reference. Interpretations and scores are symbolic.'}</p><details><summary>Version migration and forecast evidence</summary><p>This engine replaces the former mixed body/frequency selector. Earlier recorded forecasts are retained in exported user data as legacy records. Forecasts are recalculated from date and versioned inputs, never from those records. Future methodology changes require a new version.</p><button class="secondary" onclick="aceExportForecast()">Export this forecast</button></details></div>`;}
function warning(w){return `<div class="ace-warning"><b>${esc(w.evidence)}</b><p>${esc(w.reason)}</p>${w.source?`<a href="${esc(w.source)}" target="_blank" rel="noopener noreferrer">Safety source</a>`:''}</div>`;}
function supplements(element,date,profile,isTaken,onToggle){
 const out=root.ACEResonance.scoreSupplements(date,profile,root.ACEResonance.VERSION);
 const cards=root.ACEReference.supplements,byId=new Map(cards.map(x=>[x.id,x]));
 const taken=out.rows.filter(r=>isTaken(r.name)).map(r=>r.id);
 const warnings=root.ACEWarnings.combinations(out.rows,taken);
 element.innerHTML=banner(out)+`<div class="card"><h2>Daily resonance · all ${out.rows.length} supplements</h2><p>Ranked highest first. All remain selectable. Checkboxes record your decisions and never change scores.</p><p>Scores do not establish safety, effectiveness or a need to take anything. Planetary timing is symbolic, not dosing advice.</p></div>`+
 (warnings.length?`<details class="card" open><summary>Combination warnings · ${warnings.length}</summary>${warnings.map(w=>`<div><b>${esc(w.items.map(x=>x.name+': '+x.score+'%').join(' + '))}</b>${warning(w)}</div>`).join('')}</details>`:'')+
 out.rows.map(r=>{
 const t=root.ACETiming.recommendation(date,byId.get(r.id)),w=t.window;
 const time=w?`${w.planet} · ${w.start.date} ${w.start.time} ${w.start.zone} to ${w.end.date} ${w.end.time} ${w.end.zone}`:'Timing unavailable';
 return `<article class="card ace-res-card" data-supplement-id="${esc(r.id)}" data-score="${r.score}" style="--res-color:${r.color}"><div class="ace-res-head"><label><input type="checkbox" data-taken="${esc(r.id)}" ${isTaken(r.name)?'checked':''} aria-label="Taken ${esc(r.name)}"><span><small>#${r.rank}</small><b>${esc(r.name)}</b></span></label><strong>${r.score}%</strong></div><p style="color:${r.color}">${esc(r.classification)}</p><p class="ace-time">${esc(time)}<br><small>Europe/Brussels · Brussels reference · approximate sunrise/sunset</small></p>${factors(r)}${root.ACEWarnings.forItem(r.id).map(warning).join('')}</article>`;
 }).join('');
 element.querySelectorAll('[data-taken]').forEach(input=>input.addEventListener('change',()=>onToggle(byId.get(input.dataset.taken).name)));
 return out;
}
function domains(element,out){
 const glyphs={money:'◈',career:'◆',love:'♡',social:'◎',health:'⊕',creative:'✦',study:'◉',spiritual:'⟡',leisure:'◟◞'};
 element.innerHTML=banner(out)+`<div class="ace-domain-grid">${out.rows.map(r=>`<button class="ace-domain-dot" data-domain="${esc(r.id)}" data-score="${r.score}" style="--res-color:${r.color}"><span>${glyphs[r.id]}</span><b>${esc(r.name)}</b><strong>${r.score}%</strong><small>#${r.rank}</small></button>`).join('')}</div><div class="card" id="ace-domain-explanation">Select a domain to inspect its independent score.</div>`;
 element.querySelectorAll('[data-domain]').forEach(button=>button.addEventListener('click',()=>{const r=out.rows.find(x=>x.id===button.dataset.domain);element.querySelector('#ace-domain-explanation').innerHTML=`<h3>${esc(r.name)} · ${r.score}% · #${r.rank}</h3><p>${esc(r.classification)}</p>${factors(r)}`;element.querySelector('#ace-domain-explanation details').open=true;}));
}
root.ACEPresentation={supplements,domains};
})(globalThis);
