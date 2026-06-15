/* Flamewalker Canonical Esoteric Profile Bridge v3.3 UNIVERSAL
   Source of truth: shared/data/flamewalker-canonical-esoteric-profile-v3-3.json
   Purpose: replace obsolete birth-time/profile constants, expose machine-readable
   interpretation governance, and install the canonical ACE Mind supplement system v4.1.
*/
(function(){
  'use strict';
  if(window.FlamewalkerCanonicalProfileV33)return;

  var PROFILE_URL='./shared/data/flamewalker-canonical-esoteric-profile-v3-3.json';
  var SUPPLEMENT_VERSION='ACE-MIND-SUPPLEMENTS-v4.1-nine-domain-rotation';
  var cache=null;
  var pending=null;

  function clone(x){return JSON.parse(JSON.stringify(x));}
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
        true_node_default:true,
        permanent_timing_separation:true,
        interpretation_order:clone(p.interpretation_governance.mandatory_order),
        universal_domains:clone(p.interpretation_governance.universal_domains),
        forbidden_shortcuts:clone(p.interpretation_governance.forbidden_shortcuts),
        universal_meaning_first:true,
        vocation_is_one_domain_not_master_key:true,
        biography_is_manifestation_not_definition:true,
        body_veto_first:true
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
      interpretation_rule:'geometry -> universal meaning -> full-domain scan -> personal resonance -> current application'
    };
  }

  function installPayloadGovernance(p){
    try{
      if(typeof buildBridgePayload==='function'&&!buildBridgePayload.__canonicalV33){
        var base=buildBridgePayload;
        buildBridgePayload=function(){
          var out=base.apply(this,arguments)||{};
          out.canonical_esoteric_profile=profileSummary(p);
          out.interpretation_governance=clone(p.interpretation_governance);
          out.supplement_governance=window.ACE_MIND_SUPPLEMENT_V41||null;
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
              obj.supplement_governance=window.ACE_MIND_SUPPLEMENT_V41||null;
              el.textContent=JSON.stringify(obj,null,2);
            }
          }catch(_e){}
          return out;
        };
        updateLens.__canonicalV33=true;
      }
    }catch(e){console.warn('Canonical profile Lens bridge unavailable',e);}
  }

  function isoDayIndex(iso){
    try{return Math.floor(Date.parse(String(iso).slice(0,10)+'T00:00:00Z')/86400000);}catch(e){return 0;}
  }

  function nadFoundationForDate(iso){
    var day=isoDayIndex(iso);
    var weekday=(day+3)%7;
    if(weekday<0)weekday+=7;
    var week=Math.floor((day-isoDayIndex('2026-06-08'))/7);
    var phase=((week%3)+3)%3;
    var schedules=[
      ['NR','NMN','NMN-H',null,'NR',null,'NMN'],
      ['NMN-H','NR','NMN',null,'NMN-H',null,'NR'],
      ['NMN','NMN-H','NR',null,'NMN',null,'NMN-H']
    ];
    var booster=schedules[phase][weekday];
    if(booster){
      return {
        nad_day:true,
        booster:booster,
        phase:phase,
        items:[
          ['Magnesium Citrate','Waking · required magnesium partner for NAD day','M'],
          [booster,'AM with breakfast · rolling equalized NAD rotation','M'],
          ['TMG','AM · required methylation partner for NAD day','M']
        ]
      };
    }
    return {
      nad_day:false,
      booster:null,
      phase:phase,
      items:[['B-Complex','AM with food · non-NAD energy lane','M']]
    };
  }

  function supplementBlocksV41(){
    return {
      '1':{name:'Career · Executive Power',theme:'Career · sustained output, mitochondria, calm authority',magnesium:'Magnesium Malate',items:[
        ['Creatine 5g','AM · ATP / brain / muscle baseline','M'],
        ['CoQ10','AM with fat · mitochondrial and heart support','M'],
        ['Cordyceps','AM · physical work and endurance support','M'],
        ['Lion\'s Mane','AM · strategic cognition','M'],
        ['NAC','AM · liver / glutathione cover','M'],
        ['Omega-3','With fat · heart / nervous support','M'],
        ['L-Citrulline','AM or pre-activity · circulation support','M'],
        ['Probiotic','Distributed slot · gut baseline','M']
      ]},
      '2':{name:'Study · Neural Learning',theme:'Study · focus, memory, learning, cognitive repair',magnesium:'Magnesium Malate',items:[
        ['Lion\'s Mane','AM · learning and neuroplasticity','M'],
        ['L-Theanine','AM · calm focus rotation','M'],
        ['Creatine 5g','AM · brain ATP','M'],
        ['Lutein','With fat · eyes and brain axis','M'],
        ['NAC','AM · liver / glutathione buffer','M'],
        ['Omega-3','With fat · neural membrane support','M'],
        ['Spermidine','With food · cellular renewal lane','M'],
        ['Probiotic','Distributed slot · gut-brain baseline','M']
      ]},
      '3':{name:'Social · Communication Ease',theme:'Social · calm speech, flexible energy, relational presence',magnesium:'Magnesium Taurate',items:[
        ['L-Theanine','AM or before social demand · calm presence','M'],
        ['Lion\'s Mane','AM · verbal flexibility','M'],
        ['Cordyceps','AM · social stamina when physically demanding','M'],
        ['Omega-3','With fat · heart / nervous support','M'],
        ['Astragalus','AM · resilience support','M'],
        ['NAC','AM · liver cover','M'],
        ['Spirulina','With food · nutrient and recovery lane','M'],
        ['Probiotic','Distributed slot · gut baseline','M']
      ]},
      '4':{name:'Leisure · Nervous Recovery',theme:'Leisure · decompression, sleep, low-pressure restoration',magnesium:'Magnesium Bisglycinate',items:[
        ['Milk Thistle','PM · liver recovery','M'],
        ['Omega-3','With fat · anti-inflammatory support','M'],
        ['Collagen','Midday · tissue maintenance','M'],
        ['Vitamin C','Midday · collagen cofactor','M'],
        ['MSM','Midday · joints and connective tissue','M'],
        ['Melatonin','PM · rotate, do not stack automatically','M'],
        ['Valerian','PM · rotate with L-Theanine / Melatonin','M'],
        ['Probiotic','Distributed slot · gut recovery','M']
      ]},
      '5':{name:'Love · Heart and Vitality',theme:'Love · circulation, heart, embodied warmth, hormonal balance',magnesium:'Magnesium Taurate',items:[
        ['Black Maca','AM with food · vitality and drive','M'],
        ['L-Citrulline','AM or pre-activity · circulation support','M'],
        ['CoQ10','With fat · heart and mitochondrial support','M'],
        ['Omega-3','With fat · heart / skin support','M'],
        ['Zinc','PM with food · skin and hormonal support','M'],
        ['Astragalus','AM · resilience support','M'],
        ['Milk Thistle','PM · liver cover','M'],
        ['Collagen','Midday · skin and connective tissue','M']
      ]},
      '6':{name:'Creative · Vision and Flow',theme:'Creative · imagination, cognition, eyes, sustained flow',magnesium:'Magnesium Malate',items:[
        ['Lion\'s Mane','AM · creative cognition','M'],
        ['L-Theanine','AM · calm-flow rotation','M'],
        ['Lutein','With fat · eye / brain protection','M'],
        ['Creatine 5g','AM · brain ATP','M'],
        ['Resveratrol','With food · polyphenol lane','M'],
        ['Quercetin','Midday · polyphenol support','M'],
        ['Spermidine','With food · cellular renewal','M'],
        ['NAC','AM · liver cover','M']
      ]},
      '7':{name:'Spirit · Deep Regulation',theme:'Spirit · quiet attention, restoration, contemplative depth',magnesium:'Magnesium Bisglycinate',items:[
        ['L-Theanine','PM or contemplative window · calm rotation','M'],
        ['Reishi','PM · caution-only sleep / immune lane','H'],
        ['Gotu Kola','Midday · caution-only calm connective lane','H'],
        ['Ashwagandha','PM · caution-only emergency cortisol lane','H'],
        ['Milk Thistle','PM · liver cover','M'],
        ['Omega-3','With fat · nervous support','M'],
        ['Probiotic','Distributed slot · gut baseline','M'],
        ['Valerian','PM · rotate, do not stack automatically','M']
      ]},
      '8':{name:'Body · Tissue and Power',theme:'Body · joints, back, muscle, circulation, structural repair',magnesium:'Magnesium Malate',items:[
        ['Creatine 5g','AM or post-workout · power baseline','M'],
        ['Cordyceps','AM pre-activity · endurance support','M'],
        ['L-Citrulline','Pre-activity · circulation support','M'],
        ['Collagen','Post-activity · connective tissue','M'],
        ['Vitamin C','With collagen · synthesis cofactor','M'],
        ['MSM','Midday · lower-back and joint support','M'],
        ['NAC','AM · liver / glutathione cover','M'],
        ['Spirulina','With food · nutrient and recovery lane','M'],
        ['Milk Thistle','PM · liver cover','M']
      ]},
      '9':{name:'Money · Strategic Endurance',theme:'Money · patience, long-horizon cognition, disciplined energy',magnesium:'Magnesium Taurate',items:[
        ['Creatine 5g','AM · sustained mental energy','M'],
        ['Lion\'s Mane','AM · pattern recognition','M'],
        ['CoQ10','With fat · mitochondrial support','M'],
        ['Astragalus','AM · resilience support','M'],
        ['Shilajit','AM · mineral energy pulse · max twice weekly','M'],
        ['NAC','AM · liver cover','M'],
        ['Spermidine','With food · longevity lane','M'],
        ['Omega-3','With fat · heart / brain support','M']
      ]}
    };
  }

  function installAceMindSupplementsV41(){
    if(window.ACE_MIND_SUPPLEMENT_V41_APPLIED)return window.ACE_MIND_SUPPLEMENT_V41_APPLIED;
    try{
      if(typeof BLOCKS==='undefined'||typeof SUPPLEMENT_INTEL==='undefined')return null;
      var blocks=supplementBlocksV41();
      Object.keys(BLOCKS).forEach(function(k){delete BLOCKS[k];});
      Object.keys(blocks).forEach(function(k){BLOCKS[k]=clone(blocks[k]);});

      Object.assign(SUPPLEMENT_INTEL,{
        'Spermidine':{pair:['food','cellular renewal lane','non-heavy stack'],improves:['cellular repair','skin','nervous'],watch:['gut sensitivity','avoid unnecessary daily stacking'],avoid:['doubling with multiple long-tail longevity pulses']},
        'Spirulina':{pair:['food','hydration','repair days'],improves:['energy','skin','recovery'],watch:['gut','product quality'],avoid:['unverified or contaminated products']},
        'L-Citrulline':{pair:['water','movement','pre-activity'],improves:['heart','circulation','training','back'],watch:['blood pressure','gut'],avoid:['stacking with vasodilating medication without clinician review']},
        'Melatonin':{pair:['dark room','sleep routine','low stimulation'],improves:['sleep','nervous'],watch:['morning grogginess','vivid dreams'],avoid:['automatic daily use','stacking with Valerian/Reishi/Ashwagandha']},
        'Valerian':{pair:['PM','sleep routine','Magnesium Bisglycinate'],improves:['sleep','nervous'],watch:['morning grogginess','sedation'],avoid:['stacking with Melatonin/Reishi/Ashwagandha or alcohol']}
      });

      var baseBlockFor=(typeof blockFor==='function')?blockFor:null;
      blockFor=function(d){
        var id=String(d&&d.id||((typeof activeDate!=='undefined'&&activeDate)||new Date().toISOString().slice(0,10))).slice(0,10);
        var raw=BLOCKS[String(d&&d.block||1)]||BLOCKS['1'];
        var out=clone(raw);
        var foundation=nadFoundationForDate(id);
        var foundationItems=foundation.items.slice();
        if(!foundation.nad_day&&out.magnesium){foundationItems.unshift([out.magnesium,'Waking or PM · rotating non-NAD magnesium lane','M']);}
        out.items=foundationItems.concat(out.items||[]).slice(0,15);
        out.foundation=foundation;
        out.supplement_version=SUPPLEMENT_VERSION;
        return out;
      };
      blockFor.__supplementV41=true;
      blockFor.__previous=baseBlockFor;

      if(typeof TH7_BLOCK_FORM_POLICY!=='undefined'){
        TH7_BLOCK_FORM_POLICY.window_days=12;
        TH7_BLOCK_FORM_POLICY.max_per_window=2;
        TH7_BLOCK_FORM_POLICY.min_coverage=9;
        TH7_BLOCK_FORM_POLICY.seed_date='2026-06-09';
        TH7_BLOCK_FORM_POLICY.cycle=[1,2,3,4,5,6,7,8,9,1,2,3];
      }

      if(typeof th7BlockNum==='function'){
        th7BlockNum=function(c){
          var n=Number(c&&c.value);
          if(!Number.isFinite(n))n=Number(String(c&&c.id||'').replace(/\D/g,''));
          return (n>=1&&n<=9)?n:1;
        };
      }

      if(typeof th8StructuralBlockForDate==='function'){
        th8StructuralBlockForDate=function(iso){
          var cycle=(typeof TH7_BLOCK_FORM_POLICY!=='undefined'&&TH7_BLOCK_FORM_POLICY.cycle)||[1,2,3,4,5,6,7,8,9];
          var seed=(typeof TH7_BLOCK_FORM_POLICY!=='undefined'&&TH7_BLOCK_FORM_POLICY.seed_date)||'2026-06-09';
          var pos=((th7DateDiff(String(iso).slice(0,10),seed)%cycle.length)+cycle.length)%cycle.length;
          return cycle[pos]||1;
        };
      }

      if(typeof th7RecentBlockObjects==='function'){
        th7RecentBlockObjects=function(date,days){
          var out=[];
          var current=String(date||((typeof activeDate!=='undefined'&&activeDate)||new Date().toISOString().slice(0,10))).slice(0,10);
          for(var i=1;i<=Number(days||11);i++){
            var iso=typeof fwAddDaysISO==='function'?fwAddDaysISO(current,-i):new Date(Date.parse(current+'T00:00:00Z')-i*86400000).toISOString().slice(0,10);
            var bh=typeof state!=='undefined'&&state&&state.blockHistory&&state.blockHistory[iso];
            var sl=typeof state!=='undefined'&&state&&state.suppLog&&state.suppLog[iso];
            var actual=bh&&bh.finalBlock||sl&&sl.block;
            out.push({date:iso,block:Number(actual||th8StructuralBlockForDate(iso)),source:actual?'state':'nine-block-lattice'});
          }
          return out;
        };
      }

      if(typeof th7BlockFormFor==='function'){
        th7BlockFormFor=function(c,d){
          var b=th7BlockNum(c);
          var date=String(d&&d.id||((typeof activeDate!=='undefined'&&activeDate)||new Date().toISOString().slice(0,10))).slice(0,10);
          var historyDays=11;
          var recent=th7RecentBlockObjects(date,historyDays);
          var counts={1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
          recent.forEach(function(x){var n=Number(x&&x.block);if(n>=1&&n<=9)counts[n]++;});
          var count=counts[b]||0;
          var cycle=TH7_BLOCK_FORM_POLICY.cycle;
          var pos=((th7DateDiff(date,TH7_BLOCK_FORM_POLICY.seed_date)%cycle.length)+cycle.length)%cycle.length;
          var target=cycle[pos]||1;
          var would=Object.assign({},counts);would[b]=(would[b]||0)+1;
          var missingAfter=Object.keys(would).filter(function(k){return Number(would[k])===0;}).map(Number);
          var missingBefore=Object.keys(counts).filter(function(k){return Number(counts[k])===0;}).map(Number);
          var overCap=count>=TH7_BLOCK_FORM_POLICY.max_per_window;
          var allUsedAfter=missingAfter.length===0;
          var coverageDebt=counts[b]===0||b===target;
          var dist=Math.min(Math.abs(b-target),9-Math.abs(b-target));
          var cycleAffinity=typeof th5clamp==='function'?th5clamp(1-dist/4.5):Math.max(0,1-dist/4.5);
          var pressure=count/TH7_BLOCK_FORM_POLICY.max_per_window;
          var rotationScore=(typeof th5clamp==='function'?th5clamp:function(x){return Math.max(0,Math.min(1,x));})(.30*(counts[b]===0?1:.35)+.26*cycleAffinity+.24*(1-pressure)+.20*(allUsedAfter?1:(b===target?.86:.38)));
          var structuralStatus=overCap?'FORM_FORBIDDEN_MAX2_IN_12':b===target?'FORM_CYCLE_DUE':counts[b]===0?'FORM_COVERAGE_DUE':allUsedAfter?'FORM_STABLE':'FORM_WAIT_COVERAGE';
          return {policy:'all_9_domain_blocks_rotating + max2_in_12',history_days:historyDays,rolling_window_days:12,max_per_window:TH7_BLOCK_FORM_POLICY.max_per_window,block:b,recent:recent,counts_prior11:counts,counts:counts,missing_before:missingBefore,missing_blocks:missingAfter,count12:count,count10:count,coverage_debt:coverageDebt,all_blocks_seen:allUsedAfter,over_cap:overCap,cycle_target:target,cycle_due:b===target,cycle_affinity:typeof th5round==='function'?th5round(cycleAffinity):cycleAffinity,rotation_score:typeof th5round==='function'?th5round(rotationScore):rotationScore,structural_status:structuralStatus,hard_fail:overCap,reason:overCap?'Block '+b+' would exceed max two uses in current plus prior 11 days':b===target?'Block '+b+' is the nine-domain cycle target for '+date:counts[b]===0?'Block '+b+' fills nine-domain coverage debt':'Block '+b+' allowed by nine-domain rotation'};
        };
      }

      if(typeof th5candidateSet==='function'){
        th5candidateSet=function(d,g,baseStack){
          var prisms=theonBuildPFPPrisms(d,g);
          var domainScores={};
          ACE_THEON_DOMAINS.forEach(function(k){domainScores[k]=baseStack&&baseStack.domains&&baseStack.domains[k]?baseStack.domains[k].score:th5clamp((g.life&&g.life[k]&&g.life[k].score)||0);});
          var arr=[];
          ACE_THEON_DOMAINS.forEach(function(k){arr.push(th5makeDomainCandidate(k,d,g,prisms));});
          [1,2,3,4,5,6,7,8,9].forEach(function(n){arr.push(th5makeBlockCandidate(n,baseStack));});
          if(typeof ACE_THEON_PRACTICE_MODELS==='object')Object.entries(ACE_THEON_PRACTICE_MODELS).forEach(function(entry){(entry[1]||[]).forEach(function(c){arr.push(th5makePracticeCandidate(entry[0],c));});});
          return {arr:arr,prisms:prisms,domainScores:domainScores};
        };
      }

      if(typeof fwSelectBlockV23Projection==='function'){
        fwSelectBlockV23Projection=function(isoDate,memory){
          var date=String(isoDate).slice(0,10);
          var bz=fwBaziDay(date),mayan=fwMayanDay(date),num=fwPtrmFull(date),astro=fwAstroPositions(date);
          var conv=compileConvergence({bazi:{element:bz.element,signature:bz.signature,pillar:bz.pillar},mayan:{dreamspell:mayan.dreamspell,dsColor:mayan.dsColor,dsTone:mayan.dsTone,tzolkin:mayan.tzolkin},astrology:astro,personalDay:num.pd,iso:date});
          var scores={},recent=memory||[],eligible=[];
          for(var b=1;b<=9;b++){if(typeof BLOCK_MANUAL_ONLY!=='undefined'&&BLOCK_MANUAL_ONLY[b])continue;scores[b]=scoreBlockField(b,conv,{}).blockScore;}
          for(var n=1;n<=9;n++){
            if(typeof BLOCK_MANUAL_ONLY!=='undefined'&&BLOCK_MANUAL_ONLY[n])continue;
            var cd=fwBlockCooldownDays(n);
            if(recent.slice(-cd).some(function(x){return Number(x.block)===n;}))continue;
            if(recent.length&&Number(recent[recent.length-1].block)===n)continue;
            eligible.push(n);
          }
          if(!eligible.length)return th8StructuralBlockForDate(date);
          return eligible.sort(function(a,b){return scores[b]-scores[a];})[0];
        };
      }

      if(typeof th7BlockFormHtml==='function'){
        th7BlockFormHtml=function(s){
          try{
            var rows=(s.byCategory.block||[]).slice(0,9).map(function(x){var f=x.form||{},cls=f.hard_fail?'pill-stop':f.coverage_debt?'pill-action':'pill-clear';return '<div class="row"><div><div class="row-title">Block '+escapeHtml(x.value)+' · '+escapeHtml(f.structural_status||'FORM NA')+' · '+escapeHtml(x.mcg&&x.mcg.decision)+'</div><div class="row-note">count12 '+escapeHtml(f.count12||0)+' · missing '+escapeHtml((f.missing_blocks||[]).join(','))+' · cycle target '+escapeHtml(f.cycle_target)+' · form '+escapeHtml(f.rotation_score)+' · score '+escapeHtml(x.score)+'</div></div><span class="pill '+cls+'">'+escapeHtml(f.hard_fail?'FORBID':f.coverage_debt?'DUE':'OK')+'</span></div>';}).join('');
            return '<div class="focus-title" style="margin-top:12px">Nine-Domain Supplement Form</div><div class="small" style="margin-top:6px">All nine life-domain blocks remain represented. No block may exceed two uses in a rolling twelve-day window.</div>'+rows;
          }catch(e){return '';}
        };
      }

      if(typeof th5blockRisk==='function'){
        th5blockRisk=function(blockNum){
          var block=BLOCKS[String(blockNum)]||{},risk=.06,high=0,total=0;
          (block.items||[]).forEach(function(it){total++;if(it[2]==='H')high++;if(/NR|NMN|NMN-H|Cordyceps|Shilajit|L-Citrulline|B-Complex/i.test(String(it[0]||'')))risk+=.012;});
          return th5clamp(risk+high*.07+Math.max(0,total-10)*.006);
        };
      }

      if(typeof fwBMExplicitSupplementScore==='function'){
        var oldScore=fwBMExplicitSupplementScore;
        fwBMExplicitSupplementScore=function(name){
          var n=fwBMNormName(name).toLowerCase();
          var y=Object.fromEntries(FW_BODY_SCORE_AXES.map(function(a){return [a,'yellow'];}));
          var set=function(o){return Object.assign({},y,o);};
          var custom={
            'nmn-h':set({liver:'blue',heart:'blue',nervous:'blue',sleep:'yellow',gut:'yellow',eyes:'blue'}),
            'cordyceps':set({heart:'blue',sleep:'yellow',nervous:'blue',back:'blue',liver:'yellow'}),
            'shilajit':set({liver:'yellow',gut:'yellow',heart:'blue',nervous:'blue',back:'blue'}),
            'l-citrulline':set({heart:'blue',back:'blue',nervous:'yellow',gut:'yellow'}),
            'spermidine':set({liver:'blue',skin:'blue',nervous:'blue',gut:'yellow'}),
            'spirulina':set({liver:'blue',skin:'blue',back:'blue',gut:'yellow'}),
            'melatonin':set({sleep:'green',nervous:'blue',heart:'yellow'}),
            'valerian':set({sleep:'green',nervous:'blue',heart:'yellow',gut:'yellow'})
          };
          for(var k in custom)if(n===k||n.indexOf(k)>=0||k.indexOf(n)>=0)return custom[k];
          return oldScore(name);
        };
      }

      window.ACE_MIND_SUPPLEMENT_V41={
        version:SUPPLEMENT_VERSION,
        blocks:9,
        domains:['career','study','social','leisure','love','creative','spirit','body','money'],
        nad_days_per_week:5,
        nad_rotation:'three-week equalized NR/NMN/NMN-H cycle',
        nad_pairing:['Magnesium Citrate','TMG'],
        non_nad:'B-Complex',
        caution_only:['Reishi','Ashwagandha','Gotu Kola'],
        max_items_per_block:15,
        installed_at:new Date().toISOString()
      };
      window.ACE_MIND_SUPPLEMENT_V41_APPLIED=clone(window.ACE_MIND_SUPPLEMENT_V41);
      if(typeof fwGuidanceCacheClearV2524==='function')fwGuidanceCacheClearV2524();
      if(typeof render==='function')render();
      console.info('ACE Mind supplement system installed',SUPPLEMENT_VERSION);
      return clone(window.ACE_MIND_SUPPLEMENT_V41_APPLIED);
    }catch(e){
      console.warn('ACE Mind supplement v4.1 install failed',e);
      window.ACE_MIND_SUPPLEMENT_V41_APPLIED={ok:false,version:SUPPLEMENT_VERSION,error:String(e&&e.message||e),at:new Date().toISOString()};
      return clone(window.ACE_MIND_SUPPLEMENT_V41_APPLIED);
    }
  }

  function applyAceMind(p){
    p=p||cache;
    if(!p)throw new Error('Canonical profile not loaded');
    var natal=aceMindNatal(p);
    try{
      state.natal=natal;
      state.canonicalProfile={version:p.version,sealed_date:p.sealed_date,profile_id:natal.profile_id};
      installAceMindSupplementsV41();
      if(typeof FW_AXIS_CACHE!=='undefined'&&FW_AXIS_CACHE&&FW_AXIS_CACHE.yearScan)FW_AXIS_CACHE.yearScan={};
      if(typeof fwGuidanceCacheClearV2524==='function')fwGuidanceCacheClearV2524();
      if(typeof saveState==='function')saveState();
      installPayloadGovernance(p);
      if(typeof render==='function')render();
      window.ACE_MIND_CANONICAL_PROFILE_APPLIED={ok:true,version:p.version,profile_id:natal.profile_id,supplements:SUPPLEMENT_VERSION,at:new Date().toISOString()};
      return clone(window.ACE_MIND_CANONICAL_PROFILE_APPLIED);
    }catch(e){
      window.ACE_MIND_CANONICAL_PROFILE_APPLIED={ok:false,version:p.version,error:String(e&&e.message||e),at:new Date().toISOString()};
      throw e;
    }
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
    summary:profileSummary,applyAceMind:applyAceMind,applyCluster:applyCluster,
    applyInvestment:applyInvestment,installAceMindSupplementsV41:installAceMindSupplementsV41,
    supplementVersion:SUPPLEMENT_VERSION
  };
})();
