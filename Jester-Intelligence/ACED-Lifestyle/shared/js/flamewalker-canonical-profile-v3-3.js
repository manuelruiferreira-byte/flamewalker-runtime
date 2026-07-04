/* Flamewalker Canonical Esoteric Profile Bridge v3.3 UNIVERSAL
   Source of truth: shared/data/flamewalker-canonical-esoteric-profile-v3-3.json
   This bridge owns personal esoteric identity and interpretation governance.
   Supplement authority belongs exclusively to the canonical 42-card optimizer policy.
*/
(function(){
  'use strict';
  if(window.FlamewalkerCanonicalProfileV33)return;

  var PROFILE_URL='./shared/data/flamewalker-canonical-esoteric-profile-v3-3.json';
  var BRIDGE_SCRIPT_URL=(document.currentScript&&document.currentScript.src)||location.href;
  var OPTIMIZER_VERSION='20260618-cards-only';
  var cache=null;
  var pending=null;
  var appliedPromise=null;
  var optimizerImportPromise=null;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function optimizerModuleUrl(){return new URL('../optimizer/ace-mind-optimizer-live-v2.mjs?v='+OPTIMIZER_VERSION,BRIDGE_SCRIPT_URL).href;}
  function profileStatus(){return window.ACE_MIND_CANONICAL_PROFILE_APPLIED&&window.ACE_MIND_CANONICAL_PROFILE_APPLIED.ok?'applied':'pending';}
  function showOptimizerImportFailure(error){
    var chamber=document.getElementById('grid-clubs');
    if(!chamber)return;
    var message=String(error&&error.message||error||'Unknown optimizer import failure').replace(/[\r\n\t]+/g,' ').slice(0,180);
    chamber.innerHTML='<div data-optimizer-live-v3="held"><div class="card"><div class="focus-title">Supplement optimizer held</div><div class="small" style="margin-top:5px">The canonical optimizer could not start.</div><div class="tiny" style="margin-top:5px;color:var(--orange,#f97316)"></div></div></div>';
    var detail=chamber.querySelector('.tiny');
    if(detail)detail.textContent=message;
    chamber.dataset.optimizerAuthority='canonical-import-failed';
  }
  function ensureOptimizerRuntime(reason){
    if(window.AceMindOptimizerLive)return Promise.resolve(window.AceMindOptimizerLive.run?window.AceMindOptimizerLive.run(reason||'profile-ready'):window.AceMindOptimizerLive);
    if(optimizerImportPromise)return optimizerImportPromise;
    window.ACE_MIND_OPTIMIZER_WATCHDOG={status:'importing',reason:reason||'profile-watchdog',url:optimizerModuleUrl(),at:new Date().toISOString()};
    optimizerImportPromise=import(optimizerModuleUrl()).then(function(){
      if(!window.AceMindOptimizerLive)throw new Error('Optimizer module loaded without publishing runtime authority');
      window.ACE_MIND_OPTIMIZER_WATCHDOG={status:'ready',reason:reason||'profile-watchdog',version:window.AceMindOptimizerLive.version||null,at:new Date().toISOString()};
      return window.AceMindOptimizerLive.run?window.AceMindOptimizerLive.run(reason||'profile-watchdog'):window.AceMindOptimizerLive;
    }).catch(function(error){
      window.ACE_MIND_OPTIMIZER_WATCHDOG={status:'failed',reason:reason||'profile-watchdog',error:String(error&&error.message||error),at:new Date().toISOString()};
      showOptimizerImportFailure(error);
      optimizerImportPromise=null;
      throw error;
    });
    return optimizerImportPromise;
  }
  function armOptimizerWatchdog(){setTimeout(function(){ensureOptimizerRuntime('profile-watchdog').catch(function(){});},1200);}
  function load(force){
    if(cache&&!force)return Promise.resolve(clone(cache));
    if(pending&&!force)return pending.then(clone);
    pending=fetch(PROFILE_URL,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('Canonical profile fetch failed: '+response.status);return response.json();}).then(function(profile){
      if(!profile||profile.version!=='3.3_UNIVERSAL')throw new Error('Unexpected canonical profile version');
      cache=profile;window.FLAMEWALKER_CANONICAL_PROFILE=clone(profile);return clone(profile);
    }).finally(function(){pending=null;});
    return pending;
  }
  function aceMindNatal(profile){
    var tropical=profile.astrology.tropical_placidus;
    return {
      profile_id:'flamewalker-canonical-v3.3-universal-09h00-porto',
      source:{authority:'Flamewalker Canonical Esoteric Profile v3.3 UNIVERSAL',method:'Astrodienst tropical Placidus; corrected 09:00 Porto foundation',status:'source-sealed geometry; operationally canonical birth time',version:profile.version,sealed_date:profile.sealed_date},
      birth:{name:profile.identity.legal_name,date:profile.identity.birth_date,local_time:profile.identity.birth_time_local,utc_time:profile.identity.birth_time_utc,place:profile.identity.birth_place,time_status:profile.identity.birth_time_status},
      planets:clone(tropical.planets),angles:clone(tropical.angles),houses:clone(tropical.houses),
      engine_policy:{primary_method:'tropical_placidus',whole_sign_cross_check:true,western_sidereal_method:'fagan_bradley',jyotish_method:'lahiri_separate',true_node_default:true,bazi_local_apparent_solar_time:true,bazi_hour:'Bing Chen Dragon',interpretation_order:clone(profile.interpretation_governance.mandatory_order),universal_domains:clone(profile.interpretation_governance.universal_domains),body_veto_first:true,supplement_esoteric_authority:['numerology','bazi','astrology','mayan']}
    };
  }
  function profileSummary(profile){return {version:profile.version,sealed_date:profile.sealed_date,birth_date:profile.identity.birth_date,birth_time_local:profile.identity.birth_time_local,birth_time_utc:profile.identity.birth_time_utc,birth_place:profile.identity.birth_place,tropical_ascendant:profile.app_projection.ascendant,tropical_midheaven:profile.app_projection.midheaven,sidereal_ascendant:profile.app_projection.siderealAscendant,bazi_hour:profile.app_projection.baziHour,day_master:profile.bazi.day_master,life_path:profile.numerology.life_path,interpretation_rule:'geometry -> universal meaning -> full-domain scan -> personal resonance -> current application',supplement_authority:'canonical 42-card policy; numerology first, BaZi second'};}
  function supplementGovernanceSummary(){var live=window.AceMindOptimizerLive;return live?{version:live.version||null,policyVersion:live.policyVersion||null,mode:live.mode||null}:{policyVersion:'ace_mind_supplement_policy.v3.2026-06-18',mode:'individual-card-policy'};}
  function installPayloadGovernance(profile){
    try{if(typeof buildBridgePayload==='function'&&!buildBridgePayload.__canonicalV33){var base=buildBridgePayload;buildBridgePayload=function(){var out=base.apply(this,arguments)||{};out.canonical_esoteric_profile=profileSummary(profile);out.interpretation_governance=clone(profile.interpretation_governance);out.supplement_governance=supplementGovernanceSummary();return out;};buildBridgePayload.__canonicalV33=true;}}catch(error){console.warn('Canonical profile payload bridge unavailable',error);}
    try{if(typeof updateLens==='function'&&!updateLens.__canonicalV33){var baseLens=updateLens;updateLens=function(){var out=baseLens.apply(this,arguments);try{var element=document.getElementById('lensPre');if(element){var obj=JSON.parse(element.textContent||'{}');obj.canonical_esoteric_profile=profileSummary(profile);obj.interpretation_governance=clone(profile.interpretation_governance);obj.supplement_governance=supplementGovernanceSummary();element.textContent=JSON.stringify(obj,null,2);}}catch(_error){}return out;};updateLens.__canonicalV33=true;}}catch(error){console.warn('Canonical profile Lens bridge unavailable',error);}
  }
  function applyAceMind(profile){
    profile=profile||cache;if(!profile)throw new Error('Canonical profile not loaded');
    var natal=aceMindNatal(profile);
    try{
      if(typeof state!=='undefined'&&state){state.natal=natal;state.canonicalProfile={version:profile.version,sealed_date:profile.sealed_date,profile_id:natal.profile_id};}
      if(typeof saveState==='function')saveState();
      installPayloadGovernance(profile);
      if(typeof render==='function')render();
      window.ACE_MIND_CANONICAL_PROFILE_APPLIED={ok:true,version:profile.version,profile_id:natal.profile_id,supplementAuthority:'canonical-42-card-policy-v3',status:profileStatus(),at:new Date().toISOString()};
      window.dispatchEvent(new CustomEvent('ace-mind:canonical-profile-applied',{detail:clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED)}));
      setTimeout(function(){ensureOptimizerRuntime('canonical-profile-applied').catch(function(){});},0);
      return clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED);
    }catch(error){window.ACE_MIND_CANONICAL_PROFILE_APPLIED={ok:false,version:profile.version,error:String(error&&error.message||error),at:new Date().toISOString()};window.dispatchEvent(new CustomEvent('ace-mind:canonical-profile-failed',{detail:clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED)}));throw error;}
  }
  function ensureAceMindApplied(force){if(appliedPromise&&!force)return appliedPromise;appliedPromise=load(Boolean(force)).then(applyAceMind);window.ACE_MIND_CANONICAL_PROFILE_READY=appliedPromise;return appliedPromise;}
  window.FlamewalkerCanonicalProfileV33={version:'3.3_UNIVERSAL',url:PROFILE_URL,load,aceMindNatal,summary:profileSummary,applyAceMind,ensureAceMindApplied,ensureOptimizerRuntime,applyCluster:function(){},applyInvestment:function(){},supplementAuthority:'canonical-42-card-policy-v3'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',armOptimizerWatchdog,{once:true});else armOptimizerWatchdog();
})();
