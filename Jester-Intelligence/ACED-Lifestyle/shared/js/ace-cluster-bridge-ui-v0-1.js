/* ACE Cluster Bridge UI v0.6
   External stabilization patch for ACE Cluster runtime.
   Scope: compact UI, ACE Mind-style AI handoff, swipe loop, pinch/swipe guard, Sentinel packet export + GitHub sync helper.
   v0.6 fixes Sentinel parser: canonical source is TOP COINS BY RESONANCE block only.
   No trading logic changes. No portfolio mutation.
*/
(function aceClusterBridgeUIV06(){
  'use strict';
  if(window.__ACE_CLUSTER_BRIDGE_UI_V06__)return;
  window.__ACE_CLUSTER_BRIDGE_UI_V06__=true;
  const VERSION='ace-cluster-bridge-ui-v0.6-clean-sentinel-parser';
  const GITHUB_SENTINEL_EDIT_URL='https://github.com/manuelruiferreira-byte/flamewalker-runtime/edit/main/Jester-Intelligence/ACED-Lifestyle/shared/data/cluster/cluster-sentinel-state.json';
  const MODELS=[
    ['Gemini','https://gemini.google.com/app','GM'],['AI Mode','https://www.google.com/search?udm=50','AI'],['ChatGPT','https://chatgpt.com/','CG'],['Grok','https://grok.com/','GK'],['Claude','https://claude.ai/','CL'],['DeepSeek','https://chat.deepseek.com/','DS'],['Perplexity','https://www.perplexity.ai/','PX'],['Copilot','https://copilot.microsoft.com/','CP']
  ];
  const PAYLOAD_LABELS={research:'Research State',esoteric:'Esoteric Field',portfolio:'Portfolio Only'};
  let clusterZoom=Number(localStorage.getItem('ace_cluster_ui_zoom_v01')||'1')||1;
  let selectedPatchModel=localStorage.getItem('ace_cluster_selected_model_v03')||'Gemini';
  let selectedPatchPayload=localStorage.getItem('ace_cluster_payload_mode_v03')||'research';
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function css(){
    const old=document.getElementById('ace-cluster-bridge-ui-css');if(old)old.remove();
    const s=document.createElement('style');s.id='ace-cluster-bridge-ui-css';
    s.textContent=`
      :root{--ace-cluster-ui-zoom:${clusterZoom}}
      html{font-size:calc(16px * var(--ace-cluster-ui-zoom,1));touch-action:pan-x pan-y pinch-zoom!important}
      body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.42}
      .brand-title,.chamber-title,.focus-title,.label-up{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
      .small,.tiny,.row-note,.detail-val,.notice,.info{line-height:1.5!important}
      .brand-sub,.chamber-sub{white-space:normal!important;line-height:1.25!important}
      .card,.stat-card{padding:12px!important}.chamber-inner{gap:12px!important}.chamber-body{gap:10px!important}
      #carouselWrap,.carousel-track,.chamber,.chamber-body{touch-action:pan-x pan-y pinch-zoom!important}
      .patch-console{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace!important;font-size:.78rem!important;line-height:1.46!important}
      .ace-cluster-zoom-dock{position:fixed;right:10px;bottom:74px;z-index:150;display:flex;gap:6px;padding:6px;border:1px solid rgba(214,168,79,.24);border-radius:999px;background:rgba(1,3,10,.76);backdrop-filter:blur(14px);box-shadow:0 16px 42px rgba(0,0,0,.35)}
      .ace-cluster-zoom-dock button{width:34px;height:34px;border-radius:999px;border:1px solid rgba(214,168,79,.28);background:rgba(5,12,26,.92);color:#fff0ad;font-weight:900}
      .fw-to-resonance-row{grid-template-columns:96px minmax(0,1fr)!important;gap:12px!important;padding:12px 0!important;align-items:center!important}
      .fw-to-resonance-row .fw-to-coin-sym{font-size:1.02rem!important;letter-spacing:.04em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .fw-to-resonance-row .fw-to-coin-nums,.fw-to-resonance-row .tiny{display:none!important}
      .fw-to-resonance-row>div:nth-child(2){display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;min-width:0!important}
      .fw-to-resonance-row .eso-badge{font-size:.68rem!important;line-height:1!important;padding:7px 10px!important;border-radius:12px!important;white-space:nowrap!important;max-width:100%!important}
      .fw-to-resonance-row .eso-badge+span{margin-left:0!important}
      .info b:nth-of-type(1),.info b:nth-of-type(2){color:#fff0ad!important}.info{font-size:.74rem!important;color:#93a8c4!important;max-height:72px!important;overflow:auto!important}
      .payload-grid,.model-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}
      .payload-btn,.model-btn{border:1px solid rgba(215,181,109,.28)!important;background:rgba(4,12,26,.72)!important;border-radius:14px!important;padding:10px 8px!important;text-align:center!important;color:#c4b5fd!important;font-size:.78rem!important;letter-spacing:.06em!important;min-height:42px!important}
      .payload-btn.active,.model-btn.model-active{border-color:rgba(32,231,255,.78)!important;background:linear-gradient(135deg,rgba(32,231,255,.13),rgba(139,92,246,.12))!important;color:#dffbff!important;font-weight:800!important}
      .ai-section-label{font-size:.65rem!important;letter-spacing:.22em!important;text-transform:uppercase!important;color:var(--gold)!important;padding:10px 2px 4px!important;opacity:.8!important;display:block!important}
      .action-row{display:flex!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important;margin-top:10px!important}.cluster-copy-status{font-size:.76rem;color:#a5f3fc;min-height:18px;margin-top:8px;text-align:right}
      .cluster-sentinel-btn{border:1px solid rgba(52,211,153,.34)!important;background:rgba(52,211,153,.09)!important;color:#bbf7d0!important;border-radius:14px!important;padding:10px 12px!important;font-weight:900!important;letter-spacing:.04em!important}
      .cluster-sync-btn{border:1px solid rgba(32,231,255,.40)!important;background:rgba(32,231,255,.10)!important;color:#a5f3fc!important;border-radius:14px!important;padding:10px 12px!important;font-weight:900!important;letter-spacing:.04em!important}
      @media(max-width:760px){.table-wrap{overflow:visible!important}#watchTable{border-collapse:separate!important;border-spacing:0 10px!important}#watchTable thead{display:none!important}#watchTable,#watchTable tbody,#watchTable tr,#watchTable td{display:block!important;width:100%!important}#watchTable tr{border:1px solid rgba(217,166,74,.22);border-radius:18px;background:linear-gradient(145deg,rgba(3,11,27,.86),rgba(1,5,14,.72));padding:9px;margin-bottom:10px;box-shadow:0 12px 32px rgba(0,0,0,.28)}#watchTable td{border-bottom:1px solid rgba(255,255,255,.05)!important;padding:7px 4px!important;display:grid!important;grid-template-columns:88px 1fr!important;gap:8px!important;align-items:center!important;font-size:.86rem!important}#watchTable td:last-child{border-bottom:0!important}#watchTable td:before{content:attr(data-label);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#d9a64a;font-weight:900}.entry-meta{max-width:none!important}.qty-input{width:100%!important;min-height:38px}.badge,.eso-badge{white-space:normal!important;line-height:1.25!important}.fw-to-resonance-row{grid-template-columns:88px minmax(0,1fr)!important;padding:11px 0!important}.fw-to-resonance-row .eso-badge{font-size:.64rem!important;padding:7px 9px!important}}
      @media(max-width:620px){.payload-grid,.model-grid{grid-template-columns:1fr!important}.action-row{justify-content:stretch!important}.action-row button{flex:1 1 100%!important}}
      @media(max-width:480px){.day-panel{top:calc(env(safe-area-inset-top) + 78px)!important}.brand-card{grid-template-columns:auto 1fr!important}.top-actions{gap:6px}.icon-btn{width:38px;height:38px}.fw-to-clock-wrap{align-items:flex-start}.fw-to-svg-wrap{width:68px;height:68px;flex-basis:68px}.fw-to-time-big{font-size:1.28rem}.fw-to-resonance-row{grid-template-columns:82px minmax(0,1fr)!important}.fw-to-resonance-row .fw-to-coin-sym{font-size:.98rem!important}.ace-cluster-zoom-dock{right:10px;bottom:82px}}
    `;
    document.head.appendChild(s);applyZoom();
  }
  function applyZoom(){document.documentElement.style.setProperty('--ace-cluster-ui-zoom',String(clusterZoom));localStorage.setItem('ace_cluster_ui_zoom_v01',String(clusterZoom));}
  function zoomDock(){if(document.getElementById('aceClusterZoomDock'))return;const d=document.createElement('div');d.id='aceClusterZoomDock';d.className='ace-cluster-zoom-dock';d.innerHTML='<button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Reset zoom">1×</button><button type="button" aria-label="Zoom in">＋</button>';const [minus,reset,plus]=d.querySelectorAll('button');minus.onclick=()=>{clusterZoom=clamp(clusterZoom-.08,.82,1.45);applyZoom();};reset.onclick=()=>{clusterZoom=1;applyZoom();};plus.onclick=()=>{clusterZoom=clamp(clusterZoom+.08,.82,1.45);applyZoom();};document.body.appendChild(d);}
  function installPinchSwipeGuard(){const wrap=document.getElementById('carouselWrap')||document;['touchstart','touchmove','touchend'].forEach(type=>{wrap.addEventListener(type,e=>{if((e.touches&&e.touches.length>1)||(e.changedTouches&&e.changedTouches.length>1)){try{e.stopImmediatePropagation();}catch(_){}}},{capture:true,passive:true});});}
  function currentIndex(){const dots=[...document.querySelectorAll('.dot')];const di=dots.findIndex(d=>d.classList.contains('active'));if(di>=0)return di;const nav=[...document.querySelectorAll('.suit-nav button')];const ni=nav.findIndex(b=>b.classList.contains('active'));if(ni>=0)return ni;try{const m=(document.getElementById('carouselTrack')?.style.transform||'').match(/-(\d+)00%/);if(m)return Number(m[1])||0;}catch(_){}return 0;}
  function chamberCount(){return Math.max(1,document.querySelectorAll('.chamber').length||document.querySelectorAll('.dot').length||6);}
  function patchLoopingCarousel(){if(window.__ACE_CLUSTER_LOOP_PATCHED__)return;const originalOpen=window.openChamber;if(typeof originalOpen!=='function')return;window.openChamber=function aceClusterLoopOpen(n){const total=chamberCount();const idx=((Number(n)||0)%total+total)%total;return originalOpen(idx);};window.prevChamber=function aceClusterLoopPrev(){return window.openChamber(currentIndex()-1);};window.nextChamber=function aceClusterLoopNext(){return window.openChamber(currentIndex()+1);};window.__ACE_CLUSTER_LOOP_PATCHED__=true;}
  function labelWatchTable(){const table=document.getElementById('watchTable');if(!table)return;const labels=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim()||'Field');table.querySelectorAll('tbody tr').forEach(tr=>{[...tr.children].forEach((td,i)=>td.setAttribute('data-label',labels[i]||'Field'));});}
  function patchRenderHooks(){try{if(typeof window.renderWatchTable==='function'&&!window.renderWatchTable.__clusterBridgeWrapped){const base=window.renderWatchTable;window.renderWatchTable=function(){const out=base.apply(this,arguments);setTimeout(labelWatchTable,20);return out};window.renderWatchTable.__clusterBridgeWrapped=true;}}catch(e){}try{if(typeof window.renderChamber==='function'&&!window.renderChamber.__clusterBridgeWrappedV06){const base=window.renderChamber;window.renderChamber=function(){const out=base.apply(this,arguments);setTimeout(()=>{labelWatchTable();enhanceAISection(true);patchLoopingCarousel();installSentinelButtons();},40);return out};window.renderChamber.__clusterBridgeWrappedV06=true;}}catch(e){}}
  function normalizeModelUrl(name,url){const n=String(name||'').toLowerCase();if(n.includes('grok'))return 'https://grok.com/';if(n.includes('gemini'))return 'https://gemini.google.com/app';if(n.includes('chatgpt'))return 'https://chatgpt.com/';if(n.includes('claude'))return 'https://claude.ai/';if(n.includes('deepseek'))return 'https://chat.deepseek.com/';if(n.includes('perplexity'))return 'https://www.perplexity.ai/';if(n.includes('copilot'))return 'https://copilot.microsoft.com/';return String(url||'').trim();}
  function currentPayload(){const box=document.getElementById('payloadBox');if(box&&box.value)return box.value;try{if(typeof window.buildPayload==='function')return window.buildPayload(selectedPatchModel||'Gemini');}catch(e){}return 'ACE Cluster payload unavailable. Open Jester chamber and refresh payload.';}
  function copyText(text){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text).then(()=>true).catch(()=>false);const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();return Promise.resolve(ok);}
  function status(msg,cls){const el=document.getElementById('aiStatus')||document.getElementById('clusterCopyStatus');if(el){el.className=(el.id==='aiStatus'?'fetch-status ':'cluster-copy-status ')+(cls||'');el.textContent=msg;}}
  function openAITabBlank(){try{return window.open('about:blank','_blank');}catch(e){return null;}}
  function navigateAITab(tab,url){const target=String(url||'').trim();if(!target)return false;try{if(tab&&!tab.closed){tab.location.href=target;try{tab.focus();}catch(_){}return true;}}catch(_){}try{if(window.top){window.top.location.href=target;return true;}}catch(_){}try{window.location.href=target;return true;}catch(_){}return false;}
  function openClusterModel(name,url,mark){selectedPatchModel=name;localStorage.setItem('ace_cluster_selected_model_v03',name);const targetUrl=normalizeModelUrl(name,url);const aiTab=openAITabBlank();const payload=currentPayload();const box=document.getElementById('payloadBox');if(box)box.value=payload;const gate=document.getElementById('handoffGate'),me=document.getElementById('handoffMark'),ne=document.getElementById('handoffName');if(me)me.textContent=mark||'AI';if(ne)ne.textContent=name||'Opening';if(gate)gate.classList.add('open');status('Copying…','');copyText(payload).then(ok=>{status(ok?`Copied for ${name}`:'Copy failed. Select text manually if needed.',ok?'ok':'warn');setTimeout(()=>navigateAITab(aiTab,targetUrl),180);});}
  window.__ACEClusterOpenModelV06=openClusterModel;
  function setPayloadMode(mode){selectedPatchPayload=mode;localStorage.setItem('ace_cluster_payload_mode_v03',mode);try{if(typeof window.setPayload==='function')window.setPayload(mode);}catch(_){}setTimeout(()=>enhanceAISection(true),60);}
  function enhanceAISection(force){const body=document.getElementById('jesterBody');if(!body)return;if(body.__clusterAIPatchedV06&&!force)return;const payloadIds=['research','esoteric','portfolio'];const payloadText=payloadIds.map(id=>`<button class="payload-btn ${selectedPatchPayload===id?'active':''}" type="button" data-payload="${id}">${PAYLOAD_LABELS[id]}</button>`).join('');const modelText=MODELS.map(([name,url,mark])=>`<button class="model-btn ${selectedPatchModel===name?'model-active':''}" type="button" data-model="${escapeHtml(name)}" data-url="${escapeHtml(normalizeModelUrl(name,url))}" data-mark="${escapeHtml(mark)}">${escapeHtml(name)}</button>`).join('');body.innerHTML=`<div class="card"><div class="ai-section-label">What to send</div><div class="payload-grid" id="clusterPayloadGrid">${payloadText}</div><div class="ai-section-label">Where to send it</div><div class="model-grid" id="clusterModelGrid">${modelText}</div><div class="action-row"><button class="btn" id="clusterBridgeBtn" type="button">Bridge</button><button class="btn btn-blue" id="clusterCopyBtn" type="button">Copy</button><button class="cluster-sentinel-btn" id="clusterSentinelBtn" type="button">Export Packet</button><button class="cluster-sync-btn" id="clusterSyncBtn" type="button">Sync GitHub</button><button class="btn" id="clusterRefreshBtn" type="button">Refresh</button></div><div id="clusterCopyStatus" class="cluster-copy-status">Compact AI packet · ${(currentPayload()||'').length.toLocaleString()} chars</div></div><div class="card"><span class="label-up">Payload Preview</span><textarea class="patch-console" id="payloadBox" style="min-height:180px" readonly>${escapeHtml(currentPayload())}</textarea></div>`;body.querySelectorAll('[data-payload]').forEach(btn=>btn.onclick=()=>setPayloadMode(btn.dataset.payload));body.querySelectorAll('[data-model]').forEach(btn=>btn.onclick=()=>openClusterModel(btn.dataset.model,btn.dataset.url,btn.dataset.mark));const copyBtn=document.getElementById('clusterCopyBtn');if(copyBtn)copyBtn.onclick=()=>copyText(currentPayload()).then(ok=>status(ok?'Copied':'Copy failed',ok?'ok':'warn'));const bridgeBtn=document.getElementById('clusterBridgeBtn');if(bridgeBtn)bridgeBtn.onclick=()=>{const m=MODELS.find(x=>x[0]===selectedPatchModel)||MODELS[0];openClusterModel(m[0],m[1],m[2]);};const sentBtn=document.getElementById('clusterSentinelBtn');if(sentBtn)sentBtn.onclick=()=>exportSentinelPacket();const syncBtn=document.getElementById('clusterSyncBtn');if(syncBtn)syncBtn.onclick=()=>syncSentinelToGitHub();const refreshBtn=document.getElementById('clusterRefreshBtn');if(refreshBtn)refreshBtn.onclick=()=>enhanceAISection(true);body.__clusterAIPatchedV06=true;}
  function isValidTicker(sym){if(!sym||sym.length<1||sym.length>12)return false;if(!/^[A-Z0-9]+$/.test(sym))return false;if(/^(WATCH|PRIME|CAUTION|CLASH|RESONANT|NEUTRAL)P?\d*$/i.test(sym))return false;if(/P\d+$/.test(sym)&&sym.length>4)return false;if(/(AI|L1|DEFI|GAMING|OTHER)$/i.test(sym)&&sym.length>5)return false;return true;}
  function parseTopResonanceBlock(payload){
    const text=String(payload||'');
    const start=text.indexOf('TOP COINS BY RESONANCE:');
    if(start<0)return [];
    const block=text.slice(start+'TOP COINS BY RESONANCE:'.length).split(/\n\s*\n/)[0];
    const rows=[];
    block.split(/\n+/).forEach(line=>{
      const m=line.trim().match(/^([A-Z0-9]{1,12})\s*:\s*([A-Z_]+)(?:\(([-+]?\d+(?:\.\d+)?)\))?\s*(.*)$/i);
      if(!m)return;
      const symbol=m[1].toUpperCase();
      if(!isValidTicker(symbol))return;
      rows.push({symbol,status:m[2].toUpperCase(),score:m[3]!==undefined?Number(m[3]):null,context:(m[4]||'').trim()});
    });
    return rows;
  }
  function buildSentinelPacket(){
    const payload=currentPayload();
    const rows=parseTopResonanceBlock(payload);
    const symbols=rows.map(r=>r.symbol);
    const byStatus=rows.reduce((a,r)=>{const k=r.status.toLowerCase();(a[k]||(a[k]=[])).push(r.symbol);return a;},{});
    const prime=byStatus.prime||[];
    const resonant=byStatus.resonant||[];
    const watch=byStatus.watch||[];
    const caution=[...(byStatus.caution||[]),...(byStatus.clash||[])];
    const attention=[...new Set([...prime,...caution,...resonant.slice(0,6),...watch.slice(0,6)])].slice(0,30);
    return {schema:'ace_cluster_sentinel_state_v0_1',parser_version:'v0.6_payload_top_resonance_only',updated_at:new Date().toISOString(),source:'ACE Cluster',currency:'USDC',status:rows.length?'exported_from_cluster_runtime_clean':'exported_but_no_top_resonance_block_found',watchlist:symbols,portfolio:[],cluster_flags:{prime,resonant,watch,caution,attention_required:attention},coin_rows:rows,report_targets:{funding_rates:true,open_interest:true,volume_price_divergence:true,long_short_imbalance:true,btc_eth_context:true,news_unlock_protocol_risk:true,esoteric_overlay:true},notes:'Clean v0.6 export. Symbols are parsed only from TOP COINS BY RESONANCE block, not from page UI text.',ai_payload_preview:payload};
  }
  function downloadObject(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
  function exportSentinelPacket(){const packet=buildSentinelPacket();downloadObject(packet,'cluster-sentinel-state.json');copyText(JSON.stringify(packet,null,2)).then(ok=>status(ok?'Clean Sentinel packet downloaded + copied. Upload or Sync GitHub.':'Clean Sentinel packet downloaded. Copy may need manual check.',ok?'ok':'warn'));return packet;}
  function syncSentinelToGitHub(){const githubTab=openAITabBlank();const packet=buildSentinelPacket();const json=JSON.stringify(packet,null,2);copyText(json).then(ok=>{status(ok?'Clean Sentinel JSON copied. Paste over GitHub file, then commit.':'GitHub opened. Copy failed, use Export Packet as fallback.',ok?'ok':'warn');setTimeout(()=>navigateAITab(githubTab,GITHUB_SENTINEL_EDIT_URL),180);});return packet;}
  window.ACEClusterSentinel={version:VERSION,buildPacket:buildSentinelPacket,exportPacket:exportSentinelPacket,syncGitHub:syncSentinelToGitHub,parseTopResonanceBlock,githubEditUrl:GITHUB_SENTINEL_EDIT_URL};
  function installSentinelButtons(){if(document.getElementById('clusterFloatingSentinel'))return;const dock=document.querySelector('.ace-cluster-zoom-dock');if(!dock)return;const b=document.createElement('button');b.id='clusterFloatingSentinel';b.type='button';b.textContent='S';b.title='Sync Clean Sentinel to GitHub';b.onclick=syncSentinelToGitHub;dock.appendChild(b);}
  function boot(){css();zoomDock();installPinchSwipeGuard();patchLoopingCarousel();patchRenderHooks();setTimeout(()=>{labelWatchTable();enhanceAISection(true);patchLoopingCarousel();installSentinelButtons();},800);try{console.log('ACE Cluster Bridge UI active:',VERSION);}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
