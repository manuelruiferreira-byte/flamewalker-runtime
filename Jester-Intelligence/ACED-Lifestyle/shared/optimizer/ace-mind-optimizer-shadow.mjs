const LIVE_BUILD='20260617-3';
import(`./ace-mind-optimizer-live-v3.mjs?v=${LIVE_BUILD}`).catch(error=>{
  console.error('ACE Mind supplement planner failed to load',error);
  const root=document.getElementById('grid-clubs');
  if(root){
    root.innerHTML='<div data-optimizer-live-v3="load-failure"><div class="card"><div class="focus-title">Supplements held</div><div class="small">The daily planner did not load.</div></div></div>';
  }
});
