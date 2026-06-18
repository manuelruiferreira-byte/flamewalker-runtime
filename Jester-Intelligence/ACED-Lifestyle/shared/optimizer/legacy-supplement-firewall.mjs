// Runtime UI boundary between the historical ACE Mind monolith and the
// canonical 42-card supplement engine.
//
// Important: the monolith still calls its internal block functions while it
// builds non-supplement guidance. Those functions are legacy internals, but
// their return contracts must remain intact until they are extracted. This
// firewall therefore owns only the visible supplement chamber and header. It
// never rewrites supplement history, block history, localStorage, IndexedDB,
// export payloads, or stateful global functions.

const FIREWALL_VERSION='ace_mind_legacy_supplement_firewall.v2-contract-safe';
let dayMetaObserver=null;

function cleanDayMetaText(value){
  return String(value??'')
    .replace(/\s*·\s*Block\s+\d+\s*/ig,' · ')
    .replace(/\s*·\s*·\s*/g,' · ')
    .replace(/^\s*·\s*|\s*·\s*$/g,'')
    .replace(/\s{2,}/g,' ')
    .trim();
}

function scrubVisibleDayMeta(){
  const element=document.getElementById('dayMeta');
  if(!element)return false;
  const cleaned=cleanDayMetaText(element.textContent);
  if(cleaned!==element.textContent)element.textContent=cleaned;
  element.dataset.supplementBlockAuthority='disabled';
  return true;
}

function installDayMetaFirewall(){
  scrubVisibleDayMeta();
  dayMetaObserver?.disconnect();
  const element=document.getElementById('dayMeta');
  if(!element||typeof MutationObserver!=='function')return;
  dayMetaObserver=new MutationObserver(()=>scrubVisibleDayMeta());
  dayMetaObserver.observe(element,{childList:true,characterData:true,subtree:true});
}

function installRenderFirewall(){
  const legacyRender=window.renderClubs;
  function canonicalSupplementRenderBoundary(){
    const chamber=document.getElementById('grid-clubs');
    if(!chamber)return null;
    if(!chamber.querySelector('[data-optimizer-live-v3],[data-optimizer-supp]')){
      chamber.innerHTML='<div data-optimizer-live-v3="pending"><div class="card"><div class="focus-title">Preparing supplement decision</div><div class="small" style="margin-top:5px">Canonical 42-card policy is calculating this selected day.</div></div></div>';
    }
    chamber.dataset.optimizerAuthority='canonical-card-policy-pending';
    return chamber;
  }
  canonicalSupplementRenderBoundary.__canonicalCardFirewall=true;
  canonicalSupplementRenderBoundary.__legacyBase=typeof legacyRender==='function'?legacyRender:null;
  window.renderClubs=canonicalSupplementRenderBoundary;
}

export function installLegacySupplementFirewall(){
  installRenderFirewall();
  installDayMetaFirewall();
  try{
    delete window.ACE_MIND_SUPPLEMENT_V41;
    delete window.ACE_MIND_SUPPLEMENT_V41_APPLIED;
  }catch{}
  const detail={
    version:FIREWALL_VERSION,
    legacyBlocks:false,
    visibleAuthority:'canonical-42-card-policy-v3',
    legacyInternalContractsPreserved:true,
    stateMutation:false
  };
  window.ACE_MIND_LEGACY_SUPPLEMENT_FIREWALL=Object.freeze(detail);
  window.dispatchEvent(new CustomEvent('ace-mind:legacy-supplement-firewall',{detail}));
  return detail;
}

export function legacySupplementFirewallStatus(){
  return window.ACE_MIND_LEGACY_SUPPLEMENT_FIREWALL??null;
}

export { FIREWALL_VERSION, cleanDayMetaText };

if(typeof window!=='undefined')installLegacySupplementFirewall();
