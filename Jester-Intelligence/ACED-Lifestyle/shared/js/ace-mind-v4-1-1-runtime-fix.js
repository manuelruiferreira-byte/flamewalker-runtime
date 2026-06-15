/* ACE Mind v4.1.1 runtime seal
   Purpose: preserve the NAD foundation after THEON finishes block selection and
   make day-selector taps responsive without changing the selected-day logic.
*/
(function(){
  'use strict';
  if(window.ACE_MIND_V411_RUNTIME_FIX)return;

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function isoDayIndex(iso){try{return Math.floor(Date.parse(String(iso).slice(0,10)+'T00:00:00Z')/86400000);}catch(e){return 0;}}
  function foundationForDate(iso){
    var day=isoDayIndex(iso),weekday=(day+3)%7;
    if(weekday<0)weekday+=7;
    var week=Math.floor((day-isoDayIndex('2026-06-08'))/7),phase=((week%3)+3)%3;
    var schedules=[
      ['NR','NMN','NMN-H',null,'NR',null,'NMN'],
      ['NMN-H','NR','NMN',null,'NMN-H',null,'NR'],
      ['NMN','NMN-H','NR',null,'NMN',null,'NMN-H']
    ];
    var booster=schedules[phase][weekday];
    return booster?{
      nad_day:true,booster:booster,phase:phase,
      items:[
        ['Magnesium Citrate','Waking · required magnesium partner for NAD day','M'],
        [booster,'AM with breakfast · rolling equalized NAD rotation','M'],
        ['TMG','AM · required methylation partner for NAD day','M']
      ]
    }:{nad_day:false,booster:null,phase:phase,items:[['B-Complex','AM with food · non-NAD energy lane','M']]};
  }
  function normName(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  function sealBlock(d,block){
    var id=String(d&&d.id||window.activeDate||new Date().toISOString().slice(0,10)).slice(0,10);
    var raw=block||((typeof BLOCKS!=='undefined'&&BLOCKS[String(d&&d.block||1)])||{});
    var out=clone(raw||{}),foundation=foundationForDate(id),front=foundation.items.slice();
    if(!foundation.nad_day&&out.magnesium)front.unshift([out.magnesium,'Waking or PM · rotating non-NAD magnesium lane','M']);
    var seen={};
    out.items=front.concat(out.items||[]).filter(function(it){var k=normName(it&&it[0]);if(!k||seen[k])return false;seen[k]=true;return true;}).slice(0,15);
    out.foundation=foundation;
    out.supplement_version='ACE-MIND-SUPPLEMENTS-v4.1.1-foundation-seal';
    return out;
  }
  function ensureFoundationStatuses(d,g){
    try{
      if(!d||!g||!g.block||!g.block.foundation)return;
      d.blockAssignment=d.blockAssignment||{};
      var list=Array.isArray(d.blockAssignment.itemStatuses)?d.blockAssignment.itemStatuses.slice():[];
      var by={};list.forEach(function(x){by[normName(x&&x.name)]=true;});
      var mode=String(g.suppMode||'ALIGNED').toUpperCase();
      (g.block.foundation.items||[]).forEach(function(it){
        var name=it[0],key=normName(name);if(by[key])return;
        var booster=/^(NR|NMN|NMN-H)$/i.test(name);
        var status=mode==='LOCKED'?(booster?'LOCKED':'YELLOW'):mode==='CONDITIONAL'?(booster?'YELLOW':'ALLOWED'):'ALLOWED';
        list.push({name:name,status:status,score:status==='ALLOWED'?0.72:status==='YELLOW'?0.52:0.2,label:booster?'NAD rotation · body veto applies':'Required NAD partner',reasonTrail:['v4.1.1 final foundation seal','NAD partner set preserved after THEON block selection'],consensus:'FOUNDATION'});
      });
      d.blockAssignment.itemStatuses=list;
    }catch(e){}
  }
  function installDeriveSeal(){
    if(typeof deriveGuidanceV23!=='function'||deriveGuidanceV23.__v411FoundationSeal)return;
    var base=deriveGuidanceV23;
    deriveGuidanceV23=function(d){
      var g=base.apply(this,arguments);
      try{if(g){g.block=sealBlock(d,g.block);g.nadFoundation=clone(g.block.foundation);ensureFoundationStatuses(d,g);}}catch(e){console.warn('ACE Mind v4.1.1 foundation seal failed',e);}
      return g;
    };
    deriveGuidanceV23.__v411FoundationSeal=true;
    deriveGuidanceV23.__previous=base;
    try{if(typeof fwGuidanceCacheClearV2524==='function')fwGuidanceCacheClearV2524();}catch(e){}
  }
  function installSupplementIntel(){
    try{
      if(typeof SUPPLEMENT_INTEL==='undefined')return;
      Object.assign(SUPPLEMENT_INTEL,{
        'NR':{pair:['Magnesium Citrate','TMG','breakfast or light food','hydration'],improves:['cellular energy','mental clarity','mitochondrial support'],watch:['sleep activation','methylation demand','liver/body veto'],avoid:['another NAD booster the same day','late dosing when stimulating']},
        'NMN':{pair:['Magnesium Citrate','TMG','breakfast or light food','hydration'],improves:['cellular energy','repair signalling','mitochondrial support'],watch:['sleep activation','methylation demand','liver/body veto'],avoid:['another NAD booster the same day','late dosing when stimulating']},
        'NMN-H':{pair:['Magnesium Citrate','TMG','breakfast or light food','hydration'],improves:['clean cellular energy','repair signalling','mitochondrial support'],watch:['strong response','methylation demand','liver/body veto'],avoid:['another NAD booster the same day','stacking on a compromised body day']},
        'Magnesium Citrate':{pair:['NR, NMN, or NMN-H on NAD days','water','morning or tolerated timing'],improves:['magnesium support','bowel regularity','NAD-day tolerance'],watch:['loose stool','dose sensitivity'],avoid:['doubling multiple magnesium forms without need']},
        'TMG':{pair:['NR, NMN, or NMN-H','food if preferred','hydration'],improves:['methylation support','homocysteine handling','NAD-day balance'],watch:['individual stimulation or gut response'],avoid:['unnecessary duplicate methyl donors']},
        'B-Complex':{pair:['non-NAD day','food','morning'],improves:['energy metabolism','non-NAD foundation'],watch:['stimulation','bright urine is expected'],avoid:['late dosing if it disturbs sleep']}
      });
    }catch(e){}
  }
  function installFastDaySelector(){
    if(typeof setDay!=='function'||setDay.__v411Fast)return;
    var serial=0,raf=0;
    setDay=function(dateOrIndex,opts){
      opts=opts||{};
      var target,idx=0;
      if(typeof dateOrIndex==='number'){
        idx=typeof validIndex==='function'?validIndex(dateOrIndex):dateOrIndex;
        var legacy=typeof ANCHORS!=='undefined'&&ANCHORS[idx];target=legacy&&legacy.id||brusselsISODate();
      }else{
        target=String(dateOrIndex||brusselsISODate()).slice(0,10);
        idx=typeof ANCHORS!=='undefined'?ANCHORS.findIndex(function(x){return x.id===target;}):-1;
        if(idx<0)idx=0;
      }
      if(target===activeDate&&!opts.force)return;
      activeDate=target;activeIdx=idx;state.activeDate=target;state.activeIdx=idx;
      var token=++serial;
      try{
        document.querySelectorAll('#dayRail .day-btn').forEach(function(btn){btn.classList.toggle('active',String(btn.getAttribute('onclick')||'').indexOf("'"+target+"'")>=0);});
        var panel=document.querySelector('.day-panel');if(panel)panel.style.opacity='.72';
      }catch(e){}
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(function(){
        if(token!==serial)return;
        try{render();}finally{
          try{saveState();}catch(e){}
          try{var panel=document.querySelector('.day-panel');if(panel)panel.style.opacity='1';}catch(e){}
          if(!opts.keepYearMapOpen){
            try{document.getElementById('dayRail')&&document.getElementById('dayRail').querySelector('.day-btn.active')&&document.getElementById('dayRail').querySelector('.day-btn.active').scrollIntoView({inline:'center',block:'nearest',behavior:'auto'});}catch(e){}
          }
        }
      });
    };
    setDay.__v411Fast=true;
  }
  function install(){
    installSupplementIntel();
    installDeriveSeal();
    installFastDaySelector();
    window.ACE_MIND_V411_RUNTIME_FIX={ok:true,version:'4.1.1',installed_at:new Date().toISOString()};
    try{if(typeof fwGuidanceCacheClearV2524==='function')fwGuidanceCacheClearV2524();if(typeof render==='function')render();}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
  else setTimeout(install,0);
})();
