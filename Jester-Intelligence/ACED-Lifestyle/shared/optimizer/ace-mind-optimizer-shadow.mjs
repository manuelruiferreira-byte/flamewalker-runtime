const LIVE_BUILD='20260617-2';
try{localStorage.removeItem('ace_mind_optimizer_shadow_disabled');}catch{}
import(`./ace-mind-optimizer-live-v2.mjs?v=${LIVE_BUILD}`).catch(error=>{
  console.error('ACE Mind optimizer live v2 failed to load',error);
  const root=document.getElementById('grid-clubs');
  if(root){
    root.innerHTML='<div data-optimizer-live-v2="load-failure"><div class="card"><div class="focus-title">Supplement optimizer held</div><div class="small" style="margin-top:5px">The live authority did not load. No supplement recommendation is shown.</div></div></div>';
    root.dataset.optimizerAuthority='individual-v2-load-failure';
  }
});
