import fs from 'node:fs';
import { DEFAULT_ESOTERIC_CONFIG, evaluateFrequencyPersistence, addDays } from '../index.mjs';
import { applyCanonicalSupplementPolicy, CANONICAL_SUPPLEMENT_TABLE, CANONICAL_EXCLUSION_GROUPS, POLICY_VERSION } from '../../../../ACED-Lifestyle/shared/data/supplements/canonical-policy-v3.mjs';

const root='../../../../ACED-Lifestyle/';
const path=name=>new URL(root+name,import.meta.url).pathname;
const registry=applyCanonicalSupplementPolicy(JSON.parse(fs.readFileSync(path('shared/data/supplements/supplement-registry.v2.json'),'utf8')));
const byId=new Map(registry.supplements.map(card=>[card.id,card]));
let passed=0,failed=0;
const failures=[];
const assert=(ok,msg)=>{if(ok)passed++;else{failed++;failures.push(msg);console.error('FAIL:',msg);}};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

assert(registry.policyVersion===POLICY_VERSION,'policy version');
assert(registry.supplements.length===42,'42 cards');
assert(Object.keys(CANONICAL_SUPPLEMENT_TABLE).length===42,'42 policy rows');

for(const [id,policy] of Object.entries(CANONICAL_SUPPLEMENT_TABLE)){
  const card=byId.get(id);
  assert(Boolean(card),`${id} exists`);
  if(!card)continue;
  const num=card.esotericSignature?.numerology??{};
  const bazi=card.esotericSignature?.bazi??{};
  assert(same([num.numerologySum,num.numerologyRoot],policy.numerology),`${id} numerology`);
  assert(same([bazi.dayMasterStem,bazi.primaryElement,bazi.polarity],policy.bazi),`${id} bazi`);
  assert(same(card.timeWindows,policy.timeWindows),`${id} timing`);
  assert(card.protocolPolicy?.conservativeRule===policy.rule,`${id} rule`);
}

for(const id of CANONICAL_EXCLUSION_GROUPS.weekly_limited_herbs){
  const card=byId.get(id);
  assert(card.autoSelection==='manual_only',`${id} manual`);
  assert(card.frequency.maxUses7d===1,`${id} max1`);
  assert(card.frequency.rollingWindowDays===7,`${id} rolling7`);
  assert(card.frequency.automaticFrequencyBoost===false,`${id} no boost`);
  assert(card.frequency.missedWeekRequiresMakeup===false,`${id} no makeup`);
  assert(card.frequency.permanentHighlightAllowed===false,`${id} no highlight`);
}

for(const [id,members] of Object.entries(CANONICAL_EXCLUSION_GROUPS)){
  const group=registry.mutualExclusionGroups.find(item=>item.id===id);
  assert(group?.maxPerDay===1,`${id} max one`);
  assert(same(group?.members,members),`${id} members`);
  for(const member of members){
    const avoid=new Set(byId.get(member)?.pairing?.avoidSameDay??[]);
    for(const other of members)if(other!==member)assert(avoid.has(other),`${member} avoids ${other}`);
  }
}

for(const id of ['nr','nmn','nmnh']){
  const card=byId.get(id);
  assert(!(card.pairing.requiredCompanions??[]).includes('tmg'),`${id} TMG optional`);
  assert((card.pairing.preferredPairs??[]).includes('tmg'),`${id} TMG preferred`);
}
assert(byId.get('shilajit').frequency.maxUses7d===2,'shilajit max2');
assert(byId.get('spermidine').frequency.permanentHighlightAllowed===false,'spermidine not permanent');
assert(same(DEFAULT_ESOTERIC_CONFIG.SYSTEM_WEIGHTS,{numerology:.5,bazi:.3,astrology:.12,mayan:.08}),'esoteric weights');

let shilajitDays=0;
for(let i=0;i<7;i++)if(evaluateFrequencyPersistence(byId.get('shilajit'),addDays('2026-06-15',i),[]).calendarEligible)shilajitDays++;
assert(shilajitDays===2,'shilajit two rotation days');
for(let i=0;i<7;i++)assert(evaluateFrequencyPersistence(byId.get('resveratrol'),addDays('2026-06-15',i),[]).urgency===0,'rotate no urgency');

const renderer=fs.readFileSync(path('shared/optimizer/optimizer-visible-renderer.mjs'),'utf8');
const live=fs.readFileSync(path('shared/optimizer/ace-mind-optimizer-live-v2.mjs'),'utf8');
const profile=fs.readFileSync(path('shared/js/flamewalker-canonical-profile-v3-3.js'),'utf8');
const serviceWorker=fs.readFileSync(path('ace-mind-sw.js'),'utf8');
assert(renderer.includes('optimizer-visible-model-v2.mjs'),'v2 model');
assert(renderer.includes('data-practical-timing')&&renderer.includes('MutationObserver'),'timing protected');
assert(!/planetaryHour|planetary hour/i.test(renderer),'no clock ownership');
assert(live.includes('waitForCanonicalProfile')&&live.includes('applyCanonicalSupplementPolicy'),'profile and policy first');
assert(!renderer.includes('legacy-supplement-firewall.mjs'),'renderer does not load legacy firewall');
assert(!profile.includes('supplementBlocksV41')&&!profile.includes('installAceMindSupplementsV41'),'no block installer');
assert(profile.includes("supplementAuthority:'canonical-42-card-policy-v3'"),'card authority declared');
assert(profile.includes('ensureOptimizerRuntime')&&profile.includes('profile-watchdog'),'optimizer watchdog present');
assert(profile.includes('canonical-import-failed'),'optimizer import failure becomes visible');
assert(serviceWorker.includes('25.4.1-canonical-card-policy')||serviceWorker.includes('canonical-card-policy'),'service worker version advanced');
assert(serviceWorker.includes('/shared/data/supplements/')&&serviceWorker.includes('flamewalker-canonical-profile-v3-3.js'),'canonical policy and profile bypass stale cache');
assert(serviceWorker.includes('url.pathname.endsWith("/ace-mind.html")')||serviceWorker.includes('ace-mind.html'),'HTML shell bypasses stale cache');

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if(failures.length){for(const item of failures)console.log(' -',item);process.exit(1);}
