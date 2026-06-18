/* Flamewalker Canonical Esoteric Profile Bridge v3.3 UNIVERSAL
   Source of truth: shared/data/flamewalker-canonical-esoteric-profile-v3-3.json
   Constitutional boundary:
   - This bridge owns canonical personal esoteric identity and interpretation governance.
   - It must never create, replace, score, schedule, or render supplement blocks.
   - Supplement authority belongs exclusively to the canonical 42-card optimizer policy.
*/
(function(){
  'use strict';
  if(window.FlamewalkerCanonicalProfileV33)return;

  var PROFILE_URL='./shared/data/flamewalker-canonical-esoteric-profile-v3-3.json';
  var BRIDGE_SCRIPT_URL=(document.currentScript&&document.currentScript.src)||location.href;
  var OPTIMIZER_VERSION='20260618-3';
  var cache=null;
  var pending=null;
  var appliedPromise=null;
  var optimizerImportPromise=null;
  var dayMetaObserver=null;

  function clone(x){return JSON.parse(JSON.stringify(x));}

  function cleanDayMetaText(value){
    return String(value||'')
      .replace(/\s*·\s*Block\s+\d+\s*/ig,' · ')
      .replace(/\s*·\s*·\s*/g,' · ')
      .replace(/^\s*·\s*|\s*·\s*$/g,'')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function scrubDayMeta(){
    var el=document.getElementById('dayMeta');
    if(!el)return false;
    var clean=cleanDayMetaText(el.textContent);
    if(clean!==el.textContent)el.textContent=clean;
    el.dataset.supplementBlockAuthority='disabled';
    return true;
  }

  function installDayMetaGuard(){
    scrubDayMeta();
    if(dayMetaObserver)dayMetaObserver.disconnect();
    var el=document.getElementById('dayMeta');
    if(!el)return;
    dayMetaObserver=new MutationObserver(function(){scrubDayMeta();});
    dayMetaObserver.observe(el,{childList:true,characterData:true,subtree:true});
  }

  function optimizerModuleUrl(){
    return new URL('../optimizer/ace-mind-optimizer-live-v2.mjs?v='+OPTIMIZER_VERSION,BRIDGE_SCRIPT_URL).href;
  }

  function showOptimizerImportFailure(error){
    var chamber=document.getElementById('grid-clubs');
    if(!chamber)return;
    var message=String(error&&error.message||error||'Unknown optimizer import failure');
    chamber.innerHTML='<div data-optimizer-live-v3="held"><div class="card"><div class="focus-title">Supplement optimizer held</div><div class="small" style="margin-top:5px">The canonical optimizer could not start.</div><div class="tiny" style="margin-top:5px;color:var(--orange,#f97316)"></div></div></div>';
    var detail=chamber.querySelector('.tiny');
    if(detail)detail.textContent=message;
    chamber.dataset.optimizerAuthority='canonical-import-failed';
  }

  function ensureOptimizerRuntime(reason){
    if(window.AceMindOptimizerLive){
      return Promise.resolve(window.AceMindOptimizerLive.run?window.AceMindOptimizerLive.run(reason||'profile-ready'):window.AceMindOptimizerLive);
    }
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

  function armOptimizerWatchdog(){
    installDayMetaGuard();
    setTimeout(function(){
      if(window.AceMindOptimizerLive){
        if(window.AceMindOptimizerLive.run)window.AceMindOptimizerLive.run('profile-watchdog-ready');
        return;
      }
      ensureOptimizerRuntime('profile-watchdog-import').catch(function(){});
    },1200);
  }

  function load(force){
    if(cache&&!force)return Promise.resolve(clone(cache));
    if(pending&&!force)return pending.then(clone);
    pending=fetch(PROFILE_URL,{cache:'no-store'}).then(function(r){
      if(!r.ok)throw new Error('Canonical profile fetch failed: '+r.status);
      return r.json();
    }).then(function(p){
      if(!p||p.version!=='3.3_UNIVERSAL')throw new Error('Unexpected canonical profile version');
      cache=p;
      window.FLAMEWALKER_CANONICAL_PROFILE=clone(p);
      return clone(p);
    }).finally(function(){pending=null;});
    return pending;
  }

  function aceMindNatal(p){
    var t=p.astrology.tropical_placidus;
    return {
      profile_id:'flamewalker-canonical-v3.3-universal-09h00-porto',
      source:{
        authority:'Flamewalker Canonical Esoteric Profile v3.3 UNIVERSAL',
        method:'Astrodienst tropical Placidus; corrected 09:00 Porto foundation',
        status:'source-sealed geometry; operationally canonical birth time',
        version:p.version,
        sealed_date:p.sealed_date
      },
      birth:{
        name:p.identity.legal_name,
        date:p.identity.birth_date,
        local_time:p.identity.birth_time_local,
        utc_time:p.identity.birth_time_utc,
        place:p.identity.birth_place,
        time_status:p.identity.birth_time_status
      },
      planets:clone(t.planets),
      angles:clone(t.angles),
      houses:clone(t.houses),
      engine_policy:{
        primary_method:'tropical_placidus',
        whole_sign_cross_check:true,
        western_sidereal_method:'fagan_bradley',
        jyotish_method:'lahiri_separate',
        true_node_default:true,
        bazi_local_apparent_solar_time:true,
        bazi_hour:'Bing Chen Dragon',
        permanent_timing_separation:true,
        interpretation_order:clone(p.interpretation_governance.mandatory_order),
        universal_domains:clone(p.interpretation_governance.universal_domains),
        forbidden_shortcuts:clone(p.interpretation_governance.forbidden_shortcuts),
        universal_meaning_first:true,
        vocation_is_one_domain_not_master_key:true,
        biography_is_manifestation_not_definition:true,
        body_veto_first:true,
        supplement_esoteric_authority:['numerology','bazi','astrology','mayan']
      }
    };
  }

  function profileSummary(p){
    return {
      version:p.version,
      sealed_date:p.sealed_date,
      birth_date:p.identity.birth_date,
      birth_time_local:p.identity.birth_time_local,
      birth_time_utc:p.identity.birth_time_utc,
      birth_place:p.identity.birth_place,
      tropical_ascendant:p.app_projection.ascendant,
      tropical_midheaven:p.app_projection.midheaven,
      sidereal_ascendant:p.app_projection.siderealAscendant,
      bazi_hour:p.app_projection.baziHour,
      day_master:p.bazi.day_master,
      life_path:p.numerology.life_path,
      interpretation_rule:'geometry -> universal meaning -> full-domain scan -> personal resonance -> current application',
      supplement_authority:'canonical 42-card policy; numerology first, BaZi second'
    };
  }

  function supplementGovernanceSummary(){
    var live=window.AceMindOptimizerLive;
    return live?{
      version:live.version||null,
      policyVersion:live.policyVersion||null,
      mode:live.mode||null,
      blocks:false
    }:{policyVersion:'ace_mind_supplement_policy.v3.2026-06-18',blocks:false};
  }

  function installPayloadGovernance(p){
    try{
      if(typeof buildBridgePayload==='function'&&!buildBridgePayload.__canonicalV33){
        var base=buildBridgePayload;
        buildBridgePayload=function(){
          var out=base.apply(this,arguments)||{};
          out.canonical_esoteric_profile=profileSummary(p);
          out.interpretation_governance=clone(p.interpretation_governance);
          out.supplement_governance=supplementGovernanceSummary();
          return out;
        };
        buildBridgePayload.__canonicalV33=true;
      }
    }catch(e){console.warn('Canonical profile payload bridge unavailable',e);}

    try{
      if(typeof updateLens==='function'&&!updateLens.__canonicalV33){
        var baseLens=updateLens;
        updateLens=function(){
          var out=baseLens.apply(this,arguments);
          try{
            var el=document.getElementById('lensPre');
            if(el){
              var obj=JSON.parse(el.textContent||'{}');
              obj.canonical_esoteric_profile=profileSummary(p);
              obj.interpretation_governance=clone(p.interpretation_governance);
              obj.supplement_governance=supplementGovernanceSummary();
              el.textContent=JSON.stringify(obj,null,2);
            }
          }catch(_e){}
          return out;
        };
        updateLens.__canonicalV33=true;
      }
    }catch(e){console.warn('Canonical profile Lens bridge unavailable',e);}
  }

  function applyAceMind(p){
    p=p||cache;
    if(!p)throw new Error('Canonical profile not loaded');
    var natal=aceMindNatal(p);
    try{
      if(typeof state!=='undefined'&&state){
        state.natal=natal;
        state.canonicalProfile={version:p.version,sealed_date:p.sealed_date,profile_id:natal.profile_id};
      }
      try{delete window.ACE_MIND_SUPPLEMENT_V41;delete window.ACE_MIND_SUPPLEMENT_V41_APPLIED;}catch(_e){}
      if(typeof FW_AXIS_CACHE!=='undefined'&&FW_AXIS_CACHE&&FW_AXIS_CACHE.yearScan)FW_AXIS_CACHE.yearScan={};
      if(typeof fwGuidanceCacheClearV2524==='function')fwGuidanceCacheClearV2524();
      if(typeof saveState==='function')saveState();
      installPayloadGovernance(p);
      if(typeof render==='function')render();
      installDayMetaGuard();
      window.ACE_MIND_CANONICAL_PROFILE_APPLIED={
        ok:true,
        version:p.version,
        profile_id:natal.profile_id,
        supplementAuthority:'canonical-42-card-policy-v3',
        blocks:false,
        at:new Date().toISOString()
      };
      window.dispatchEvent(new CustomEvent('ace-mind:canonical-profile-applied',{detail:clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED)}));
      setTimeout(function(){ensureOptimizerRuntime('canonical-profile-applied').catch(function(){});},0);
      return clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED);
    }catch(e){
      window.ACE_MIND_CANONICAL_PROFILE_APPLIED={ok:false,version:p.version,error:String(e&&e.message||e),at:new Date().toISOString()};
      window.dispatchEvent(new CustomEvent('ace-mind:canonical-profile-failed',{detail:clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED)}));
      throw e;
    }
  }

  function ensureAceMindApplied(force){
    if(appliedPromise&&!force)return appliedPromise;
    appliedPromise=load(Boolean(force)).then(applyAceMind);
    window.ACE_MIND_CANONICAL_PROFILE_READY=appliedPromise;
    return appliedPromise;
  }

  function applyCluster(p){
    p=p||cache;
    if(!p)throw new Error('Canonical profile not loaded');
    var a=p.app_projection;
    try{
      if(typeof FW!=='undefined'&&FW){
        FW.birthHour=a.birthHour;FW.birthTimeLocal=a.birthTimeLocal;FW.birthTimeUtc=a.birthTimeUtc;
        FW.ascSign=a.ascSign;FW.ascendant=a.ascendant;FW.midheaven=a.midheaven;
        FW.siderealAscendant=a.siderealAscendant;FW.baziHour=a.baziHour;
        FW.baziHourAnimal=a.baziHourAnimal;FW.canonicalProfileVersion=p.version;
      }
      if(typeof state!=='undefined'&&state){state.canonicalProfile=profileSummary(p);if(typeof saveState==='function')saveState();}
      if(typeof buildPayload==='function'&&!buildPayload.__canonicalV33){
        var base=buildPayload;
        buildPayload=function(){
          var text=String(base.apply(this,arguments)||'');
          var prefix='CANONICAL_PROFILE='+p.version+' | BIRTH_LOCAL='+a.birthTimeLocal+' | ASC='+a.ascendant+' | MC='+a.midheaven+' | BAZI_HOUR='+a.baziHour+'\nINTERPRETATION_RULE=Universal human meaning before vocational or project application.\n';
          return prefix+text;
        };
        buildPayload.__canonicalV33=true;
      }
      if(typeof renderChamber==='function')renderChamber(typeof activeChamber!=='undefined'?activeChamber:0);
      window.ACE_CLUSTER_CANONICAL_PROFILE_APPLIED={ok:true,version:p.version,at:new Date().toISOString()};
      return clone(window.ACE_CLUSTER_CANONICAL_PROFILE_APPLIED);
    }catch(e){
      window.ACE_CLUSTER_CANONICAL_PROFILE_APPLIED={ok:false,version:p.version,error:String(e&&e.message||e),at:new Date().toISOString()};
      throw e;
    }
  }

  function applyInvestment(p){
    p=p||cache;
    if(!p)throw new Error('Canonical profile not loaded');
    var a=p.app_projection;
    try{
      if(typeof FW_PROFILE!=='undefined'&&FW_PROFILE){
        FW_PROFILE.birthHour=a.birthHour;FW_PROFILE.birthTimeLocal=a.birthTimeLocal;
        FW_PROFILE.birthTimeUtc=a.birthTimeUtc;FW_PROFILE.ascSign=a.ascSign;
        FW_PROFILE.ascendant=a.ascendant;FW_PROFILE.midheaven=a.midheaven;
        FW_PROFILE.baziHour=a.baziHour;FW_PROFILE.canonicalProfileVersion=p.version;
      }
      window.INVESTMENT_CANONICAL_PROFILE_APPLIED={ok:true,version:p.version,at:new Date().toISOString()};
      return clone(window.INVESTMENT_CANONICAL_PROFILE_APPLIED);
    }catch(e){
      window.INVESTMENT_CANONICAL_PROFILE_APPLIED={ok:false,version:p.version,error:String(e&&e.message||e),at:new Date().toISOString()};
      throw e;
    }
  }

  window.FlamewalkerCanonicalProfileV33={
    version:'3.3_UNIVERSAL',url:PROFILE_URL,load:load,aceMindNatal:aceMindNatal,
    summary:profileSummary,applyAceMind:applyAceMind,ensureAceMindApplied:ensureAceMindApplied,
    ensureOptimizerRuntime:ensureOptimizerRuntime,installDayMetaGuard:installDayMetaGuard,
    applyCluster:applyCluster,applyInvestment:applyInvestment,
    supplementAuthority:'canonical-42-card-policy-v3',blocks:false
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',armOptimizerWatchdog,{once:true});
  else armOptimizerWatchdog();
})();
