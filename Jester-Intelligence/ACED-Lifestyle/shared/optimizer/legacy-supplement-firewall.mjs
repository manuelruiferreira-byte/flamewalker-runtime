// Runtime boundary between the historical ACE Mind monolith and the canonical
// 42-card supplement engine. This module does not change overview, body,
// practice, temporal, or canonical-profile calculations.

const FIREWALL_VERSION='ace_mind_legacy_supplement_firewall.v1';
const disabledFunctions=new Map();

function globalValue(expression,fallback=null){
  try{return Function(`try{return (${expression})}catch(e){return null}`)()??fallback;}catch{return fallback;}
}

function setGlobalFunction(name,replacement){
  try{
    const existing=window[name];
    if(typeof existing==='function'&&!disabledFunctions.has(name))disabledFunctions.set(name,existing);
    window[name]=replacement;
    return true;
  }catch{return false;}
}

function scrubLegacyState(){
  const state=globalValue('typeof state!=="undefined"?state:null');
  if(!state||typeof state!=='object')return;
  try{state.blockHistory={};}catch{}
  try{
    for(const record of Object.values(state.suppLog??{})){
      if(!record||typeof record!=='object')continue;
      delete record.block;
      delete record.finalBlock;
      delete record.supplementBlock;
      delete record.blockAssignment;
    }
  }catch{}
  try{
    delete state.frequencyGovernor;
    if(state.calibrationBridge&&typeof state.calibrationBridge==='object')delete state.calibrationBridge.blockDoctrine;
  }catch{}
}

function neutralizeDayBlockFields(day){
  if(!day||typeof day!=='object')return day;
  for(const key of ['block','finalBlock','supplementBlock','blockReason','blockAssignment']){
    try{delete day[key];}catch{}
  }
  return day;
}

function neutralizeGuidance(guidance){
  if(!guidance||typeof guidance!=='object')return guidance;
  try{delete guidance.block;}catch{}
  try{delete guidance.blockAssignment;}catch{}
  try{delete guidance.theonBlockSelection;}catch{}
  try{guidance.suppMode='CANONICAL 42-CARD POLICY';}catch{}
  return guidance;
}

function installRenderFirewall(){
  setGlobalFunction('renderClubs',function canonicalSupplementRenderBoundary(){
    const chamber=document.getElementById('grid-clubs');
    if(!chamber)return null;
    if(!chamber.querySelector('[data-optimizer-live-v3],[data-optimizer-supp]')){
      chamber.innerHTML='<div data-optimizer-live-v3="pending"><div class="card"><div class="focus-title">Preparing supplement decision</div><div class="small" style="margin-top:5px">Canonical 42-card policy is calculating this selected day.</div></div></div>';
    }
    chamber.dataset.optimizerAuthority='canonical-card-policy-pending';
    return chamber;
  });
}

function installWriteFirewall(){
  const noWrite=function(){return null;};
  for(const name of ['aceFreezeSelectedBlock','fwFreezeBlock','persistAssignment'])setGlobalFunction(name,noWrite);
}

function installGuidanceScrubber(){
  const base=window.deriveGuidanceV23;
  if(typeof base!=='function'||base.__canonicalCardFirewall)return;
  function wrapped(day){
    const guidance=base.apply(this,arguments);
    neutralizeDayBlockFields(day);
    neutralizeGuidance(guidance);
    scrubLegacyState();
    return guidance;
  }
  wrapped.__canonicalCardFirewall=true;
  wrapped.__legacyBase=base;
  window.deriveGuidanceV23=wrapped;
}

function installExportScrubber(){
  const base=window.exportState;
  if(typeof base!=='function'||base.__canonicalCardFirewall)return;
  function wrapped(){
    scrubLegacyState();
    return base.apply(this,arguments);
  }
  wrapped.__canonicalCardFirewall=true;
  wrapped.__legacyBase=base;
  window.exportState=wrapped;
}

export function installLegacySupplementFirewall(){
  installRenderFirewall();
  installWriteFirewall();
  installGuidanceScrubber();
  installExportScrubber();
  scrubLegacyState();
  try{
    delete window.ACE_MIND_SUPPLEMENT_V41;
    delete window.ACE_MIND_SUPPLEMENT_V41_APPLIED;
  }catch{}
  const detail={version:FIREWALL_VERSION,legacyBlocks:false,authority:'canonical-42-card-policy-v3'};
  window.ACE_MIND_LEGACY_SUPPLEMENT_FIREWALL=Object.freeze(detail);
  window.dispatchEvent(new CustomEvent('ace-mind:legacy-supplement-firewall',{detail}));
  return detail;
}

export function legacySupplementFirewallStatus(){
  return window.ACE_MIND_LEGACY_SUPPLEMENT_FIREWALL??null;
}

export { FIREWALL_VERSION };

if(typeof window!=='undefined')installLegacySupplementFirewall();
