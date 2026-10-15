/* Canonical migration. Existing measurements are inputs, never browser state. */
(function(root){'use strict';
const VERSION='3.4_ORACLE/1';
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function migrate(natal,record){
 const p=clone(natal);
 p.version=VERSION;
 p.provenance={documentVersion:'3.4 ORACLE',sha256:'ffc60eb6d2f498af6ed246629f98ea98ba0ab6f81fe935deb850dc5122badeec',verification:'Source transcription and internal consistency audit; no new independent ephemeris verification',supersession:'DOCX governs v3.4 corrections; source-sealed tables govern conflicting prose'};
 p.oracle={version:'oracle-methodology-1',baseline:'neutral',independentFamilies:true,duplicatedEvidence:'bounded, not stacked as independent proof',languageModelAuthority:false,calibration:'New empirical weights require a new engine version; never rewrite archived forecasts',marker001:'Preserved in owner source document as a pre-outcome research record, excluded from public runtime and daily scoring',transitPeriods:'Source-transcribed multi-month windows retained in owner document, excluded from exact daily scoring because boundaries are approximate'};
 p.planets.neptune.motion='stationary_direct';
 p.planets.neptune.stationary=true;
 // Recompute numeric longitudes from the existing source-sealed display strings.
 // No new personal measurement literals are published by this migration.
 const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
 for(const collection of [p.planets,p.angles,p.houses])for(const point of Object.values(collection||{})){
  const s=point.display||'',m=s.match(/(\d+)°(\d+)[′'](\d+)[″"]/),sign=signs.findIndex(x=>s.includes(x));
  if(m&&sign>=0)point.lon=sign*30+Number(m[1])+Number(m[2])/60+Number(m[3])/3600;
 }
 p.source={...p.source,seal:VERSION,method:'Source-sealed tropical Placidus; v3.4 correction applied; interpretation is symbolic'};
 p.measurements=clone(record); // Preserve DATA-1.1 provenance, including inactive chambers.
 p.measurements.meta={...p.measurements.meta,version:VERSION,predecessor:'DATA-1.1'};
 // The archived record is untouched; the active copy has the source-motion correction.
 const visit=x=>{if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(k.toLowerCase()==='neptune'&&v&&typeof v==='object'&&!Array.isArray(v)){v.motion='Stationary (D)';}visit(v);}};
 visit(p.measurements.tropical_natal);
 if(Array.isArray(p.measurements.tropical_natal?.planets?.Neptune))p.measurements.tropical_natal.planets.Neptune[2]='Stationary (D)';
 p.calendar={timezone:'Europe/Brussels',reference:'00:00 UTC on the selected calendar date',personalDayBoundary:'calendar-midnight'};
 p.engine_policy={order:'date → canonical inputs → versioned symbolic formula',supplement_authority:'User selection only; warnings never alter scores'};
 p.migration={from:'DATA-1.1 / v3.3',to:VERSION,source:'Owner-supplied v3.4 ORACLE document',corrections:['Neptune motion: stationary direct'],retained:['Source-sealed natal geometry','BaZi pillars','Four distinct Mayan counts','Compound numerology','DATA-1.1 source chambers'],inactive:['Unverified sidereal offset arithmetic','Conflicting interpretive prose','Approximate transit window boundaries','Pending chambers'],oracle:'Deterministic calculation and explanations; no retrospective forecast rewriting'};
 return freeze(p);
}
const api={VERSION,migrate,freeze};if(typeof module==='object')module.exports=api;else root.ACECanonical=api;
})(globalThis);
