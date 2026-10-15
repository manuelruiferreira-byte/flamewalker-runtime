/* Pure, versioned date engine. No clock, storage, network, UI or consumption inputs. */
(function(root){'use strict';
const R=typeof module==='object'?require('./reference-v1.js'):root.ACEReference;
const VERSION='ace-resonance-1.0.0';
const WEIGHTS=Object.freeze({numerology:20,bazi:20,mayan:15,transits:20,lunar:10,natal:5,canonical:10});
const mod=(x,n)=>(x%n+n)%n, clamp=x=>Math.max(-1,Math.min(1,x)), round=x=>Math.round(x*1e6)/1e6;
const seals=['Dragon','Wind','Night','Seed','Serpent','Worldbridger','Hand','Star','Moon','Dog','Monkey','Human','Skywalker','Wizard','Eagle','Warrior','Earth','Mirror','Storm','Sun'];
const colors=['Red','White','Blue','Yellow'];
const stemElements=['Wood','Wood','Fire','Fire','Earth','Earth','Metal','Metal','Water','Water'];
const astroElements=['Fire','Earth','Air','Water'];
function dateValue(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Explicit YYYY-MM-DD required');const n=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');return n;}
function reduce(n){while(n>9&&![11,22,33].includes(n))n=String(n).split('').reduce((s,c)=>s+Number(c),0);return n;}
function rootNumber(n){while(n>9)n=String(n).split('').reduce((s,c)=>s+Number(c),0);return n;}
function kin(n){n=mod(n-1,260)+1;return {kin:n,tone:mod(n-1,13)+1,seal:seals[mod(n-1,20)],color:colors[mod(n-1,4)]};}
function factors(date,p){
 const ms=dateValue(date),[year,month,day]=date.split('-').map(Number);
 if(!p||p.version!=='3.4_ORACLE/1')throw Error('Canonical profile 3.4_ORACLE/1 required');
 const birthday=parseInt(p.numerology.birthday,10),attitude=parseInt(p.numerology.attitude_sun,10),birthMonth=attitude-birthday;
 if(!(birthday>=1&&birthday<=31&&birthMonth>=1&&birthMonth<=12))throw Error('Missing canonical numerology inputs');
 const pyRaw=birthMonth+birthday+reduce(String(year).split('').reduce((s,c)=>s+Number(c),0)),py=reduce(pyRaw),pmRaw=py+month,pm=reduce(pmRaw),pdRaw=pm+day,pd=reduce(pdRaw);
 const elapsed=Math.round((ms-dateValue('2026-05-29'))/86400000),stem=mod(9+elapsed,10),branch=mod(3+elapsed,12);
 // Preserve the established app's four separate daily correlations. Modern tracks
 // are explicitly ACE correlations, not claimed interchangeable with traditional GMT.
 const mayan={dreamspell:kin(171+elapsed),dna:kin(123+elapsed),cosmic:kin(147+elapsed),traditional:{tone:mod(9+elapsed,13)+1,seal:seals[mod(6+elapsed,20)]}};
 const eph=R.ephemeris.days[date]||null;
 return {date,timezone:'Europe/Brussels',astronomyReference:date+'T00:00:00Z',astronomyStatus:eph?'source-transcribed-2026':'unavailable-neutral-contribution',numerology:{pyRaw,py,pmRaw,pm,pdRaw,pd},bazi:{stem,branch,element:stemElements[stem],polarity:stem%2?'Yin':'Yang'},mayan,ephemeris:eph,lunarElongation:eph?round(mod(eph.moon-eph.sun,360)):null};
}
function angular(a,b){const d=mod(a-b,360);return Math.min(d,360-d);}
const aspects=[[0,1,'conjunction'],[60,.6,'sextile'],[90,-.7,'square'],[120,.8,'trine'],[180,-.7,'opposition']];
function transits(card,f,p){
 if(!f.ephemeris)return {value:0,detail:'Unavailable: no source ephemeris for this date. Neutral contribution; weights unchanged.',status:'unavailable'};
 const hits=[];
 for(const [name,affinity] of Object.entries(card.planets||{})){
  const key=name.toLowerCase(),n=p.planets[key];if(!n||!Number.isFinite(n.lon))continue;
  for(const transit of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']){
   const lon=f.ephemeris[transit];if(!Number.isFinite(lon))continue;
   const distance=angular(lon,n.lon);
   for(const [angle,valence,label] of aspects){const orb=Math.abs(distance-angle);if(orb<=5){hits.push({transit,natal:key,aspect:label,orb:round(orb),value:affinity*valence*(1-orb/5)});break;}}
  }
 }
 // A bounded average prevents aspect-count inflation or repeated-geometry stacking.
 const v=hits.length?hits.reduce((s,h)=>s+h.value,0)/Math.max(1,hits.reduce((s,h)=>s+Math.abs((card.planets||{})[h.natal[0].toUpperCase()+h.natal.slice(1)]||0),0)):0;
 return {value:clamp(v),detail:hits.length?hits.map(h=>`${h.transit} ${h.aspect} natal ${h.natal} (orb ${h.orb.toFixed(2)}°)`).join('; '):'No major transit contacts within 5°',status:'symbolic-from-source-geometry'};
}
function nativeCard(s){
 const sig=s.signature,el=sig.bazi.primaryElement,num=sig.numerology;
 const elements=Object.fromEntries((sig.astrology.elements||[]).map(e=>[e,.5]));elements[el]=1;
 return {domains:s.domains||[],elements,planets:Object.fromEntries((s.planets||[]).map(x=>[x,1])),numerology:Object.fromEntries([...new Set([...(num.resonantNumbers||[]),num.numerologyRoot])].filter(Number.isFinite).map(x=>[x,1])),tones:{},seals:{[String(sig.mayan.dreamspell||'').split(' ').slice(1).join(' ')]:1},colors:{},baziPolarity:sig.bazi.polarity};
}
function calculate(card,f,p){
 const n=f.numerology,lp=parseInt(p.numerology.life_path,10),expression=parseInt(p.numerology.expression,10);
 const lookup=(x)=>card.numerology?.[x]??card.numerology?.[rootNumber(x)]??0;
 const numerology=.7*lookup(n.pd)+.15*lookup(reduce(lp))+.15*lookup(reduce(expression));
 const masterElement=String(p.bazi.day_master).match(/Wood|Fire|Earth|Metal|Water/)?.[0];
 const bazi=.8*(card.elements?.[f.bazi.element]||0)+.15*(card.elements?.[masterElement]||0)+.05*(card.baziPolarity===f.bazi.polarity?1:0);
 const band=t=>t<=4?'initiation':t<=8?'radiance':t<=11?'release':'dissolution';
 const maya=Object.values(f.mayan).map(k=>.55*(card.seals?.[k.seal]||0)+.3*(card.tones?.[band(k.tone)]??lookup(k.tone))+.15*(card.colors?.[k.color]||0));
 const natalMaya=Object.values(p.measurements.mayan||{}).filter(x=>x&&typeof x==='object'&&Number.isFinite(x.tone));
 const mayaAffinity=k=>{const seal=seals.find(s=>String(k.sign||k.day_sign||'').includes(s));return .55*(card.seals?.[seal]||0)+.3*(card.tones?.[band(k.tone)]??lookup(k.tone))+.15*(card.colors?.[String(k.sign||'').split(' ')[0]]||0);};
 const mayan=.8*maya.reduce((s,x)=>s+x,0)/maya.length+.2*(natalMaya.length?natalMaya.reduce((s,k)=>s+mayaAffinity(k),0)/natalMaya.length:0);
 const tr=transits(card,f,p);
 const lunar=f.ephemeris?(.6*(card.elements?.[astroElements[Math.floor(f.ephemeris.moon/30)%4]]||0)+.4*(card.tones?.[band(Math.floor(f.lunarElongation/360*13)+1)]||0)):0;
 // Natal element affinity is geometric, not a health-deficiency diagnosis.
 const natalPoints=['sun','moon','mercury','venus','mars','jupiter','saturn','neptune'];
 let total=0,weight=0;
 for(const key of natalPoints){const pt=p.planets[key];if(!pt)continue;const w=pt.stationary?1.1:1;total+=w*(card.elements?.[astroElements[Math.floor(pt.lon/30)%4]]||0);weight+=w;}
 const natal=weight?total/weight:0;
 const relevantDomains=card.domain?[card.domain]:(card.domains||[]);
 const activeModifiers=Object.entries(R.modifiers).filter(([key])=>p.measurements?.[key]);
 const canonical=activeModifiers.length?activeModifiers.reduce((sum,[key,map])=>sum+relevantDomains.reduce((sum,d)=>sum+(map[d]||0)/.02,0)/Math.max(1,relevantDomains.length),0)/activeModifiers.length:0;
 const values={numerology,bazi,mayan,transits:tr.value,lunar,natal,canonical};
 const details={canonical:'Bounded established symbolic maps (not independent evidence): '+activeModifiers.map(([key])=>key).join(', '),numerology:`Personal day ${n.pdRaw}/${n.pd}; compound/master-preserving method`,bazi:`Day element ${f.bazi.element}, ${f.bazi.polarity}; symbolic natal affinity`,mayan:'80% daily correlations, 20% canonical natal four-count affinities. '+Object.entries(f.mayan).map(([k,v])=>`${k}: ${v.seal}, tone ${v.tone}`).join('; '),transits:tr.detail,lunar:f.ephemeris?`Moon–Sun elongation ${f.lunarElongation.toFixed(2)}° at 00:00 UTC; symbolic phase affinity`:'Unavailable: no source ephemeris; neutral contribution',natal:'Source-sealed natal elemental affinities; stationary motion emphasis 1.1; no health-status input'};
 const contributions=Object.keys(WEIGHTS).map(layer=>({layer,weight:WEIGHTS[layer],value:round(clamp(values[layer])),points:round(WEIGHTS[layer]*clamp(values[layer])/2),explanation:details[layer],status:['lunar','transits'].includes(layer)&&!f.ephemeris?'unavailable':'symbolic'}));
 const score=Math.max(0,Math.min(100,Math.round(50+contributions.reduce((s,c)=>s+c.points,0))));
 return {score,classification:score>=80?'High resonance':score>=65?'Resonant':score>=45?'Mixed resonance':'Low resonance',color:score>=80?'#34d399':score>=65?'#93c5fd':score>=45?'#fde68a':'#91a3b9',contributions};
}
function stableRank(rows){return rows.slice().sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0)).map((x,i)=>({...x,rank:i+1}));}
function score(kind,date,p,version){if(version!==VERSION)throw Error('Unsupported engine version: '+version);const f=factors(date,p);const cards=kind==='supplements'?R.supplements.map(s=>({id:s.id,name:s.name,card:nativeCard(s)})):Object.entries(R.domains).map(([id,card])=>({id,name:({creative:'Creativity',spiritual:'Spirituality'})[id]||id[0].toUpperCase()+id.slice(1),card:{...card,domain:id}}));return {engineVersion:VERSION,profileVersion:p.version,referenceVersion:R.version,date,timezone:f.timezone,astronomyReference:f.astronomyReference,astronomyStatus:f.astronomyStatus,rows:stableRank(cards.map(s=>({id:s.id,name:s.name,...calculate(s.card,f,p)})))};}
function scoreSupplements(targetDate,canonicalProfile,engineVersion){return score('supplements',targetDate,canonicalProfile,engineVersion);}
function scoreLifeDomains(targetDate,canonicalProfile,engineVersion){return score('domains',targetDate,canonicalProfile,engineVersion);}
function canonicalize(x){if(Array.isArray(x))return '['+x.map(canonicalize).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonicalize(x[k])).join(',')+'}';return JSON.stringify(x);}
const api={VERSION,WEIGHTS,dateValue,factors,stableRank,canonicalize,scoreSupplements,scoreLifeDomains};if(typeof module==='object')module.exports=api;else root.ACEResonance=api;
})(globalThis);
