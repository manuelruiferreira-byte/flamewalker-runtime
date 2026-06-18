import fs from 'node:fs';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays
} from '../index.mjs';
import { applyCanonicalSupplementPolicy, CANONICAL_EXCLUSION_GROUPS } from '../../../../../ACED-Lifestyle/shared/data/supplements/canonical-policy-v3.mjs';

const rawPath=new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json',import.meta.url).pathname;
const registry=applyCanonicalSupplementPolicy(JSON.parse(fs.readFileSync(rawPath,'utf8')));
const green=Object.fromEntries(registry.bodySystems.map(axis=>[axis,'green']));
const roots=[1,2,3,4,5,6,7,8,9,11,22,33];
const bazi=[['甲','Wood','Yang'],['乙','Wood','Yin'],['丙','Fire','Yang'],['丁','Fire','Yin'],['戊','Earth','Yang'],['己','Earth','Yin'],['庚','Metal','Yang'],['辛','Metal','Yin'],['壬','Water','Yang'],['癸','Water','Yin']];
const domains=['career','study','social','leisure','love','creative','spirit','body','money'];
const weekly=new Set(CANONICAL_EXCLUSION_GROUPS.weekly_limited_herbs);
const histories={};
const sets=[];
let passed=0,failed=0;
const failures=[];
function assert(ok,msg){if(ok)passed++;else{failed++;failures.push(msg);console.error('FAIL:',msg);}}

for(let i=0;i<28;i++){
  const date=addDays('2026-06-15',i);
  const root=roots[i%roots.length];
  const [stem,element,polarity]=bazi[i%bazi.length];
  const dayField={
    numerology:{scalar:.9,tags:[String(root)]},
    bazi:{scalar:.86,tags:[stem,element,polarity]},
    astrology:{scalar:.68,tags:[i%2?'moon':'sun',element]},
    mayan:{scalar:.64,tags:[i%3?'white mirror':'yellow sun']}
  };
  const signals=Object.fromEntries(domains.map(domain=>[domain,.18]));
  signals[domains[i%domains.length]]=1;
  signals[domains[(i+3)%domains.length]]=.65;
  const layers={
    esoteric:evaluateEsotericRegistry(registry,dayField),
    body:evaluateBodyRegistry(registry,green),
    frequency:evaluateFrequencyRegistry(registry,date,histories),
    pairing:evaluatePairingRegistry(registry,[])
  };
  const out=optimize({day:date,registry,daySignals:signals,layers,config:{}});
  const ids=[...new Set(out.selected.flatMap(record=>record.atom.memberIds))].sort();
  const set=new Set(ids);
  sets.push(ids.join('|'));
  assert(ids.filter(id=>CANONICAL_EXCLUSION_GROUPS.nad_precursor.includes(id)).length<=1,`${date} one NAD maximum`);
  assert(ids.filter(id=>CANONICAL_EXCLUSION_GROUPS.primary_magnesium.includes(id)).length<=1,`${date} one magnesium maximum`);
  assert(ids.filter(id=>CANONICAL_EXCLUSION_GROUPS.mineral_biomass.includes(id)).length<=1,`${date} one mineral-biomass maximum`);
  assert(ids.every(id=>!weekly.has(id)),`${date} weekly manual herbs never auto-selected`);
  for(const id of set)(histories[id]??=[]).push(date);
}

const unique=new Set(sets);
assert(unique.size>=14,`at least 14 unique selections in 28 days (${unique.size})`);
let consecutiveDuplicates=0;
for(let i=1;i<sets.length;i++)if(sets[i]===sets[i-1])consecutiveDuplicates++;
assert(consecutiveDuplicates<=3,`at most three consecutive duplicates (${consecutiveDuplicates})`);
let triple=0;
for(let i=2;i<sets.length;i++)if(sets[i]===sets[i-1]&&sets[i]===sets[i-2])triple++;
assert(triple===0,`no three identical days in a row (${triple})`);

for(const [id,dates] of Object.entries(histories)){
  const card=registry.supplements.find(card=>card.id===id);
  if(!card)continue;
  for(let start=0;start<=21;start++){
    const a=addDays('2026-06-15',start);
    const b=addDays(a,6);
    const count=dates.filter(date=>date>=a&&date<=b).length;
    assert(count<=Number(card.frequency.maxUses7d??7),`${id} respects maxUses7d in ${a}..${b}`);
  }
}

console.log(`Unique sets: ${unique.size}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if(failures.length){for(const failure of failures)console.log(' -',failure);process.exit(1);}
