/* ACE Cluster Bridge UI v0.2
   External stabilization patch for ACE Cluster runtime.
   Scope: UI readability, mobile compact display, pinch/text zoom, ACE Mind style AI bridge behavior.
   No trading logic changes. No portfolio mutation.
*/
(function aceClusterBridgeUIV02(){
  'use strict';
  if(window.__ACE_CLUSTER_BRIDGE_UI_V02__)return;
  window.__ACE_CLUSTER_BRIDGE_UI_V02__=true;
  const VERSION='ace-cluster-bridge-ui-v0.2-compact-resonance';
  const MODELS=[
    ['Gemini','https://gemini.google.com/app','GM'],
    ['AI Mode','https://www.google.com/search?udm=50','AI'],
    ['ChatGPT','https://chatgpt.com/','CG'],
    ['Grok','https://x.com/i/grok','GK'],
    ['Claude','https://claude.ai/','CL'],
    ['DeepSeek','https://chat.deepseek.com/','DS'],
    ['Perplexity','https://www.perplexity.ai/','PX'],
    ['Copilot','https://copilot.microsoft.com/','CP']
  ];
  let clusterZoom=Number(localStorage.getItem('ace_cluster_ui_zoom_v01')||'1')||1;
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
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

      /* v0.2 compact resonance display: keep diagnostic data in DOM/payload, hide it from the main visual field */
      .fw-to-resonance-row{grid-template-columns:96px minmax(0,1fr)!important;gap:12px!important;padding:12px 0!important;align-items:center!important}
      .fw-to-resonance-row .fw-to-coin-sym{font-size:1.02rem!important;letter-spacing:.04em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .fw-to-resonance-row .fw-to-coin-nums,.fw-to-resonance-row .tiny{display:none!important}
      .fw-to-resonance-row>div:nth-child(2){display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;min-width:0!important}
      .fw-to-resonance-row .eso-badge{font-size:.68rem!important;line-height:1!important;padding:7px 10px!important;border-radius:12px!important;white-space:nowrap!important;max-width:100%!important}
      .fw-to-resonance-row .eso-badge+span{margin-left:0!important}
      .info b:nth-of-type(1),.info b:nth-of-type(2){color:#fff0ad!important}
      .info{font-size:.74rem!important;color:#93a8c4!important;max-height:72px!important;overflow:auto!important}

      @media(max-width:760px){
        .table-wrap{overflow:visible!important}#watchTable{border-collapse:separate!important;border-spacing:0 10px!important}#watchTable thead{display:none!important}
        #watchTable,#watchTable tbody,#watchTable tr,#watchTable td{display:block!important;width:100%!important}
        #watchTable tr{border:1px solid rgba(217,166,74,.22);border-radius:18px;background:linear-gradient(145deg,rgba(3,11,27,.86),rgba(1,5,14,.72));padding:9px;margin-bottom:10px;box-shadow:0 12px 32px rgba(0,0,0,.28)}
        #watchTable td{border-bottom:1px solid rgba(255,255,255,.05)!important;padding:7px 4px!important;display:grid!important;grid-template-columns:88px 1fr!important;gap:8px!important;align-items:center!important;font-size:.86rem!important}
        #watchTable td:last-child{border-bottom:0!important}#watchTable td:before{content:attr(data-label);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#d9a64a;font-weight:900}
        .entry-meta{max-width:none!important}.qty-input{width:100%!important;min-height:38px}.badge,.eso-badge{white-space:normal!important;line-height:1.25!important}
        .fw-to-resonance-row{grid-template-columns:88px minmax(0,1fr)!important;padding:11px 0!important}
        .fw-to-resonance-row .eso-badge{font-size:.64rem!important;padding:7px 9px!important}
      }
      @media(max-width:480px){.day-panel{top:calc(env(safe-area-inset-top) + 78px)!important}.brand-card{grid-template-columns:auto 1fr!important}.top-actions{gap:6px}.icon-btn{width:38px;height:38px}.fw-to-clock-wrap{align-items:flex-start}.fw-to-svg-wrap{width:68px;height:68px;flex-basis:68px}.fw-to-time-big{font-size:1.28rem}.ai-model-grid{grid-template-columns:repeat(2,1fr)!important}.fw-to-resonance-row{grid-template-columns:82px minmax(0,1fr)!important}.fw-to-resonance-row .fw-to-coin-sym{font-size:.98rem!important}.ace-cluster-zoom-dock{right:10px;bottom:82px}}
    `;
    document.head.appendChild(s);
    applyZoom();
  }
  function applyZoom(){document.documentElement.style.setProperty('--ace-cluster-ui-zoom',String(clusterZoom));localStorage.setItem('ace_cluster_ui_zoom_v01',String(clusterZoom));}
  function zoomDock(){
    if(document.getElementById('aceClusterZoomDock'))return;
    const d=document.createElement('div');d.id='aceClusterZoomDock';d.className='ace-cluster-zoom-dock';
    d.innerHTML='<button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Reset zoom">1×</button><button type="button" aria-label="Zoom in">＋</button>';
    const [minus,reset,plus]=d.querySelectorAll('button');
    minus.onclick=()=>{clusterZoom=clamp(clusterZoom-.08,.82,1.45);applyZoom();};
    reset.onclick=()=>{clusterZoom=1;applyZoom();};
    plus.onclick=()=>{clusterZoom=clamp(clusterZoom+.08,.82,1.45);applyZoom();};
    document.body.appendChild(d);
  }
  function pinch(){
    let startDist=0,startZoom=clusterZoom;
    function dist(t){const a=t[0],b=t[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
    document.addEventListener('touchstart',e=>{if(e.touches&&e.touches.length===2){startDist=dist(e.touches);startZoom=clusterZoom;}},{passive:true});
    document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length===2&&startDist>0){e.preventDefault();clusterZoom=clamp(startZoom*(dist(e.touches)/startDist),.82,1.45);applyZoom();}}, {passive:false});
    document.addEventListener('touchend',()=>{startDist=0;startZoom=clusterZoom;},{passive:true});
  }
  function labelWatchTable(){
    const table=document.getElementById('watchTable');if(!table)return;
    const labels=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim()||'Field');
    table.querySelectorAll('tbody tr').forEach(tr=>{[...tr.children].forEach((td,i)=>td.setAttribute('data-label',labels[i]||'Field'));});
  }
  function patchRenderHooks(){
    try{if(typeof window.renderWatchTable==='function'&&!window.renderWatchTable.__clusterBridgeWrapped){const base=window.renderWatchTable;window.renderWatchTable=function(){const out=base.apply(this,arguments);setTimeout(labelWatchTable,20);return out};window.renderWatchTable.__clusterBridgeWrapped=true;}}catch(e){}
    try{if(typeof window.renderChamber==='function'&&!window.renderChamber.__clusterBridgeWrapped){const base=window.renderChamber;window.renderChamber=function(){const out=base.apply(this,arguments);setTimeout(()=>{labelWatchTable();enhanceAIButtons();},40);return out};window.renderChamber.__clusterBridgeWrapped=true;}}catch(e){}
  }
  function currentPayload(){
    const box=document.getElementById('payloadBox');
    if(box&&box.value)return box.value;
    try{if(typeof window.buildPayload==='function')return window.buildPayload('ACE Bridge');}catch(e){}
    return 'ACE Cluster payload unavailable. Open Jester chamber and refresh payload.';
  }
  function copyText(text,cb){
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(()=>cb&&cb(true)).catch(()=>cb&&cb(false));return;}
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();cb&&cb(ok);
  }
  function status(msg,cls){const el=document.getElementById('aiStatus');if(el){el.className='fetch-status '+(cls||'');el.textContent=msg;}}
  function openBridgeModel(name,url,mark){
    const payload=currentPayload();
    copyText(payload,ok=>status((ok?'Copied · ':'Copy may need manual check · ')+'Opening '+name,ok?'ok':'warn'));
    const gate=document.getElementById('handoffGate'),me=document.getElementById('handoffMark'),ne=document.getElementById('handoffName');
    if(me)me.textContent=mark;if(ne)ne.textContent=name;if(gate)gate.classList.add('open');
    setTimeout(()=>{try{window.location.href=url;}catch(e){window.open(url,'_blank');}},280);
  }
  function enhanceAIButtons(){
    const body=document.getElementById('jesterBody');if(!body||body.__clusterAIPatched)return;
    const grids=body.querySelectorAll('.ai-model-grid');if(grids.length<2)return;
    const modelGrid=grids[1];
    modelGrid.innerHTML=MODELS.map(m=>`<button class="ai-model-btn" data-ai-name="${m[0]}" type="button">${m[0]}</button>`).join('');
    modelGrid.querySelectorAll('button').forEach((btn,i)=>btn.onclick=()=>openBridgeModel(MODELS[i][0],MODELS[i][1],MODELS[i][2]));
    const label=modelGrid.previousElementSibling;if(label)label.textContent='Open Model · ACE Mind Bridge Scheme';
    body.__clusterAIPatched=true;
  }
  function boot(){css();zoomDock();pinch();patchRenderHooks();setTimeout(()=>{labelWatchTable();enhanceAIButtons();},800);try{console.log('ACE Cluster Bridge UI active:',VERSION);}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
