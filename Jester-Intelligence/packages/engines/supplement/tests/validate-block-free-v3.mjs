import fs from 'node:fs';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays
} from '../index.mjs';
import { applyCanonicalSupplementPolicy } from '../../../../ACED-Lifestyle/shared/data/supplements/canonical-policy-v3.mjs';

const root='../../../../ACED-Lifestyle/';
const path=name=>new URL(root+name,import.meta.url).pathname;
const sourcePath=process.argv[2]??path('shared/data/supplements/supplement-registry.v2.json');
const registry=applyCanonicalSupplementPolicy(JSON.parse(fs.readFileSync(sourcePath,'utf8')));
const live=fs.readFileSync(path('shared/optimizer/ace-mind-optimizer-live-v2.mjs'),'utf8');
const renderer=fs.readFileSync(path('shared/optimizer/optimizer-visible-renderer.mjs'),'utf8');
const firewall=fs.readFileSync(path('shared/optimizer/legacy-supplement-firewall.mjs'),'utf8');
const profile=fs.readFileSync(path('shared/js/flamewalker-canonical-profile-v3-3.js'),'utf8');
const app=fs.readFileSync(path('ace-mind.html'),'utf8');

let passed=0,failed=0;
const failures=[];
function assert(ok,msg){if(ok)passed++;else{failed++;failures.push(msg);console.error('FAIL:',msg);}}
const BLOCK_KEYS=new Set(['block','blockId','selectedBlock','blockAssignment','blockName','blockNumber','finalBlock','supplementBlock']);
function hasBlockField(value,depth=0){
  if(!value||typeof value!=='object'||depth>12)return false;
  for(const [key,item] of Object.entries(value)){
    if(BLOCK_KEYS.has(key))return true;
    if(hasBlockField(item,depth+1))return true;
  }
  return false;
}

const green=Object.fromEntries(registry.bodySystems.map(axis=>[axis,'green']));
const histories={};
const hashes=[];
const roots=[1,3,5,7,9,11,22];
const elements=['Wood','Fire','Earth','Metal','Water','Fire','Earth'];
for(let i=0;i<7;i++){
  const date=addDays('2026-06-15',i);
  const dayField={
    numerology:{scalar:.9,tags:[String(roots[i])]},
    bazi:{scalar:.84,tags:[elements[i],i%2?'Yin':'Yang']},
    astrology:{scalar:.65,tags:[i%2?'Moon':'Sun',elements[i]]},
    mayan:{scalar:.62,tags:[i%2?'White Mirror':'Yellow Sun']}
  };
  const layers={
    esoteric:evaluateEsotericRegistry(registry,dayField),
    body:evaluateBodyRegistry(registry,green),
    frequency:evaluateFrequencyRegistry(registry,date,histories),
    pairing:evaluatePairingRegistry(registry,[])
  };
  const out=optimize({day:date,registry,daySignals:{career:i%2?1:.3,study:i%3?1:.3,body:i%2?.4:1,creative:i%3===0?1:.3},layers,config:{}});
  assert(!hasBlockField(out),`${date} optimizer output has no block fields`);
  const ids=[...new Set(out.selected.flatMap(item=>item.atom.memberIds))];
  assert(ids.filter(id=>['nr','nmn','nmnh'].includes(id)).length<=1,`${date} one NAD maximum`);
  for(const id of ids)(histories[id]??=[]).push(date);
  hashes.push(out.determinismHash);
}
assert(new Set(hashes).size>1,'selected-day outputs vary');

assert(app.includes('ace-mind-optimizer-live-v2.mjs'),'app loads canonical live optimizer');
assert(live.includes('applyCanonicalSupplementPolicy'),'live runtime applies 42-card policy');
assert(live.includes('waitForCanonicalProfile'),'live runtime waits for canonical profile');
assert(!/groupSupps\(|g\.block\.items/.test(live),'live optimizer contains no block renderer');
assert(renderer.includes('legacy-supplement-firewall.mjs'),'renderer loads legacy firewall');
assert(renderer.includes('CANONICAL 42-CARD')||renderer.includes('canonical 42-card'),'renderer declares card authority');
assert(!/Block \$\{model\.|supplement block/i.test(renderer),'renderer emits no block label');
assert(renderer.includes('.year-block-label,.alt-block-card')&&renderer.includes('.remove()'),'stale block UI is removed');
assert(firewall.includes("setGlobalFunction('renderClubs'"),'legacy renderClubs is replaced');
assert(firewall.includes("'aceFreezeSelectedBlock','fwFreezeBlock','persistAssignment'"),'legacy block writers are disabled');
assert(firewall.includes('state.blockHistory={}'),'legacy block history is scrubbed');
assert(firewall.includes("delete record.block")&&firewall.includes("delete record.blockAssignment"),'exportable block state is scrubbed');
assert(!profile.includes('supplementBlocksV41'),'profile bridge contains no supplement blocks');
assert(!profile.includes('installAceMindSupplementsV41'),'profile bridge cannot install supplement blocks');
assert(profile.includes('blocks:false'),'profile bridge declares blocks disabled');

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if(failures.length){for(const failure of failures)console.log(' -',failure);process.exit(1);}
