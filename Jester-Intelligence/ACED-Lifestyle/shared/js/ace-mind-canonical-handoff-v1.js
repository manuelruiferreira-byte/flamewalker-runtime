/* ACE Mind Canonical Handoff Binding v1
   Loads the shared Flamewalker canonical esoteric profile into ACE Mind AI handoffs.
   This file does not alter supplement rules, wrappers, manifests, or service worker behavior.
*/
(function(){
  'use strict';
  if(window.AceMindCanonicalHandoffV1)return;

  var PROFILE_URL='./shared/data/flamewalker-canonical-esoteric-profile-v3-3.json';
  var VERSION='20260618-1';
  var profileCache=null;
  var pending=null;

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function compactPlanets(planets){
    var out={};
    Object.keys(planets||{}).forEach(function(k){
      var p=planets[k]||{};
      out[k]={sign:p.sign,position:p.position||p.display,display:p.display,lon:p.lon,house:p.house,motion:p.motion,retrograde:!!p.retrograde};
    });
    return out;
  }
  function compactAngles(angles){
    var out={};
    Object.keys(angles||{}).forEach(function(k){
      var a=angles[k]||{};
      out[k]={sign:a.sign,position:a.position||a.display,display:a.display,lon:a.lon};
    });
    return out;
  }
  function compactHouses(houses){
    var out={};
    Object.keys(houses||{}).forEach(function(k){
      var h=houses[k]||{};
      out[k]={sign:h.sign,position:h.position||h.display,display:h.display,lon:h.lon};
    });
    return out;
  }
  function loadProfile(force){
    if(profileCache&&!force)return Promise.resolve(clone(profileCache));
    if(pending&&!force)return pending.then(clone);
    if(window.FlamewalkerCanonicalProfileV33&&window.FlamewalkerCanonicalProfileV33.load){
      pending=window.FlamewalkerCanonicalProfileV33.load(Boolean(force)).then(function(p){profileCache=p;return clone(p);}).finally(function(){pending=null;});
      return pending;
    }
    pending=fetch(PROFILE_URL,{cache:'no-store'}).then(function(r){
      if(!r.ok)throw new Error('Canonical profile fetch failed: '+r.status);
      return r.json();
    }).then(function(p){
      if(!p||p.version!=='3.3_UNIVERSAL')throw new Error('Unexpected canonical profile version');
      profileCache=p;
      window.FLAMEWALKER_CANONICAL_PROFILE=clone(p);
      return clone(p);
    }).finally(function(){pending=null;});
    return pending;
  }
  function canonicalHandoffProfile(p){
    p=p||profileCache||window.FLAMEWALKER_CANONICAL_PROFILE||{};
    var tropical=(p.astrology&&p.astrology.tropical_placidus)||{};
    return {
      schema:'ace_mind_canonical_esoteric_profile_handoff',
      version:p.version,
      sealed_date:p.sealed_date,
      status:p.status,
      identity:clone(p.identity||{}),
      astrology:{
        primary_method:p.astrology&&p.astrology.primary_method,
        tropical_placidus:{
          source:tropical.source,
          zodiac:tropical.zodiac,
          house_system:tropical.house_system,
          angles:compactAngles(tropical.angles),
          planets:compactPlanets(tropical.planets),
          houses:compactHouses(tropical.houses)
        },
        sidereal_fagan_bradley:clone((p.astrology&&p.astrology.sidereal_fagan_bradley)||{})
      },
      bazi:clone(p.bazi||{}),
      mayan:clone(p.mayan||{}),
      numerology:clone(p.numerology||{}),
      app_projection:clone(p.app_projection||{}),
      interpretation_governance:clone(p.interpretation_governance||{})
    };
  }
  function currentTiming(out){
    out=out||{};
    return {
      selected_date:out.active_day || (out.day&&out.day.id) || (typeof activeDate!=='undefined'?activeDate:null),
      generated_at:out.generated_at || new Date().toISOString(),
      day_summary:clone(out.day_summary||out.day||{}),
      convergence:clone(out.convergence||{}),
      current_transits:clone(out.personal_aspect_events||out.natal_transits||out.transits||{}),
      ephemeris:clone(out.ephemeris||{}),
      bazi:clone((out.convergence&&out.convergence.bazi)||{}),
      numerology:clone((out.convergence&&out.convergence.numerology)||{}),
      mayan:clone((out.convergence&&out.convergence.mayan)||{}),
      body:clone(out.body||{}),
      supplements:clone(out.supplements||{}),
      domains:clone(out.domains||out.top_domains||{}),
      grounding:clone(out.grounding||{}),
      supplement_policy:clone(out.supplement_governance||out.supplement_policy||{})
    };
  }
  function missingWarnings(out,p){
    var w=[];
    if(!p||!p.version)w.push('canonical profile missing');
    if(!out)w.push('payload missing');
    else{
      if(!out.convergence)w.push('daily convergence missing');
      if(!out.day_summary&&!out.day)w.push('day summary missing');
      if(!out.supplements)w.push('supplement packet missing');
      if(!out.personal_aspect_events&&!out.natal_transits&&!out.transits)w.push('explicit current transit/aspect array absent; using convergence astrology text when available');
      if(!out.ephemeris)w.push('ephemeris source object absent; use embedded ACE Mind day astrology source/fallback');
    }
    return w;
  }
  function attach(out,p){
    if(!out||typeof out!=='object')return out;
    out.canonical_esoteric_profile=canonicalHandoffProfile(p);
    out.canonical_profile_snapshot=window.FlamewalkerCanonicalProfileV33&&window.FlamewalkerCanonicalProfileV33.summary?window.FlamewalkerCanonicalProfileV33.summary(p):{
      version:p&&p.version,
      birth_time_local:p&&p.identity&&p.identity.birth_time_local,
      ascendant:p&&p.app_projection&&p.app_projection.ascendant,
      bazi_hour:p&&p.app_projection&&p.app_projection.baziHour,
      life_path:p&&p.numerology&&p.numerology.life_path
    };
    out.current_esoteric_timing=currentTiming(out);
    out.calculation_sources={
      canonical_profile:'shared/data/flamewalker-canonical-esoteric-profile-v3-3.json',
      canonical_profile_version:p&&p.version,
      app_runtime:'ace-mind.html',
      daily_engine:'ACE Mind day engine + embedded ephemeris/fallback anchors',
      selected_date:out.current_esoteric_timing.selected_date,
      doctrine:'permanent natal systems separate from temporary timing overlays'
    };
    out.missing_data_warnings=missingWarnings(out,p);
    out.handoff_rule='Use canonical_esoteric_profile for permanent identity/natal structure. Use current_esoteric_timing for selected-date transits, BaZi, numerology, Mayan, body, supplements, and domains. Do not collapse the four Mayan tracks.';
    return out;
  }
  function install(p){
    profileCache=p||profileCache;
    try{window.ACE_CANONICAL_PROFILE=canonicalHandoffProfile(profileCache);}catch(e){}
    try{
      if(typeof state!=='undefined'&&state){
        state.canonicalProfile={version:profileCache.version,sealed_date:profileCache.sealed_date,source:'shared/data/flamewalker-canonical-esoteric-profile-v3-3.json'};
        if(profileCache.astrology&&profileCache.astrology.tropical_placidus){
          state.natal=state.natal||{};
          state.natal.canonical_esoteric_profile_version=profileCache.version;
          state.natal.planets=clone(profileCache.astrology.tropical_placidus.planets||{});
          state.natal.angles=clone(profileCache.astrology.tropical_placidus.angles||{});
          state.natal.houses=clone(profileCache.astrology.tropical_placidus.houses||{});
          state.natal.bazi=clone(profileCache.bazi||{});
          state.natal.mayan=clone(profileCache.mayan||{});
          state.natal.numerology=clone(profileCache.numerology||{});
        }
      }
    }catch(e){}
    try{
      if(typeof buildBridgePayload==='function'&&!buildBridgePayload.__canonicalHandoffV1){
        var baseBridge=buildBridgePayload;
        buildBridgePayload=function(){return attach(baseBridge.apply(this,arguments)||{},profileCache);};
        buildBridgePayload.__canonicalHandoffV1=true;
      }
    }catch(e){console.warn('Canonical handoff bridge wrapper failed',e);}
    try{
      if(typeof buildPayload==='function'&&!buildPayload.__canonicalHandoffV1){
        var basePayload=buildPayload;
        buildPayload=function(){
          var raw=basePayload.apply(this,arguments);
          try{
            var obj=JSON.parse(raw);
            attach(obj,profileCache);
            var text=JSON.stringify(obj,null,2);
            return text.length>42000?text.slice(0,41900)+'\n/* canonical payload truncated at safe handoff limit */':text;
          }catch(e){return raw;}
        };
        buildPayload.__canonicalHandoffV1=true;
      }
    }catch(e){console.warn('Canonical AI button payload wrapper failed',e);}
    try{
      if(typeof updateLens==='function'&&!updateLens.__canonicalHandoffV1){
        var baseLens=updateLens;
        updateLens=function(){
          var out=baseLens.apply(this,arguments);
          try{
            var el=document.getElementById('lensPre');
            if(el){var obj=JSON.parse(el.textContent||'{}');attach(obj,profileCache);el.textContent=JSON.stringify(obj,null,2);}
          }catch(e){}
          return out;
        };
        updateLens.__canonicalHandoffV1=true;
      }
    }catch(e){}
    window.ACE_MIND_CANONICAL_HANDOFF_V1={ok:true,version:VERSION,profile_version:profileCache&&profileCache.version,at:new Date().toISOString()};
    window.dispatchEvent(new CustomEvent('ace-mind:canonical-handoff-ready',{detail:clone(window.ACE_MIND_CANONICAL_HANDOFF_V1)}));
    try{if(typeof saveState==='function')saveState();}catch(e){}
    return window.ACE_MIND_CANONICAL_HANDOFF_V1;
  }
  function ensure(force){return load(Boolean(force)).then(function(p){return install(p);});}

  window.AceMindCanonicalHandoffV1={version:VERSION,loadProfile:load,canonicalHandoffProfile:canonicalHandoffProfile,attach:attach,install:install,ensure:ensure};

  function start(){ensure(true).catch(function(e){console.warn('ACE Mind canonical handoff binding failed',e);window.ACE_MIND_CANONICAL_HANDOFF_V1={ok:false,error:String(e&&e.message||e),at:new Date().toISOString()};});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else setTimeout(start,0);
})();
