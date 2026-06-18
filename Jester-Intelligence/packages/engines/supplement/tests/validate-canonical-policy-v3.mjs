import fs from 'node:fs';
import { DEFAULT_ESOTERIC_CONFIG, evaluateEsotericFit, evaluateFrequencyPersistence, addDays } from '../index.mjs';
import { applyCanonicalSupplementPolicy, CANONICAL_SUPPLEMENT_TABLE, CANONICAL_EXCLUSION_GROUPS, POLICY_VERSION } from '../../../../../ACED-Lifestyle/shared/data/supplements/canonical-policy-v3.mjs';

const rawPath=new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json',import.meta.url).pathname;
const rendererPath=new URL('../../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-renderer.mjs',import.meta.url).pathname;
const livePath=new URL('../../../../../ACED-Lifestyle/shared/optimizer/ace-mind-optimizer-live-v2.mjs',import.meta.url).pathname;
const profilePath=new URL('../../../../../ACED-Lifestyle/shared/js/flamewalker-canonical-profile-v3-3.js',import.meta.url).pathname;
const firewallPath=new URL('../../../../../ACED-Lifestyle/shared/optimizer/legacy-supplement-firewall.mjs',import.meta.url).pathname;

const registry=applyCanonicalSupplementPolicy(JSON.parse(fs.readFileSync(rawPath,'utf8')));
const byId=new Map(registry.supplements.map(card=>[card.id,card]));
let passed=0,failed=0;
const failures=[];
function assert(ok,msg){if(ok)passed++;else{failed++;failures.push(msg);console.error('FAIL:',msg);}}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}

assert(registry.policyVersion===POLICY_VERSION,'policy version applied');
assert(registry.supplements.length===42,'exactly 42 cards');
assert(Object.keys(CANONICAL_SUPPLEMENT_TABLE).length===42,'table has 42 rows');

for(const [id,policy] of Object.entries(CANONICAL_SUPPLEMENT_TABLE)){
  const card=byId.get(id);
  assert(Boolean(card),`${id} exists`);
  if(!card)continue;
  assert(same([card.esotericSignature.numerology.numerologySum,card.esotericSignature.numerology.numerologyRoot],policy.numerology),`${id} numerology exact`);
  assert(same([card.esotericSignature.bazi.dayMasterStem,card.esotericSignature.bazi.primaryElement,card.esotericSignature.bazi.polarity],policy.bazi),`${id} BaZi exact`);
  assert(same(card.timeWindows,policy.timeWindows),`${id} practical timing exact`);
  assert(card.protocolPolicy.conservativeRule===policy.rule,`${id} conservative rule exact`);
}

const weekly=['ashwagandha','reishi','gotu_kola','fadogia_agrestis','turkesterone'];
for(const id of weekly){
  const card=byId.get(id);
  assert(card.autoSelection==='manual_only',`${id} manual only`);
  assert(card.frequency.maxUses7d===1,`${id} max one per rolling seven days`);
  assert(card.frequency.rollingWindowDays===7,`${id} rolling window seven`);
  assert(card.frequency.automaticFrequencyBoost===false,`${id} no frequency boost`);
  assert(card.frequency.missedWeekRequiresMakeup===false,`${id} no makeup`);
  assert(card.frequency.permanentHighlightAllowed===false,`${id} no permanent highlight`);
}

for(const [id,members] of Object.entries(CANONICAL_EXCLUSION_GROUPS)){
  const group=registry.mutualExclusionGroups.find(group=>group.id===id);
  assert(Boolean(group),`${id} group exists`);
  assert(same(group?.members,members),`${id} group exact`);
  for(const member of members){
    const avoid=new Set(byId.get(member)?.pairing?.avoidSameDay??[]);
    for(const other of members)if(other!==member)assert(avoid.has(other),`${member} avoids ${other}`);
  }
}

for(const id of ['nr','nmn','nmnh']){
  const card=byId.get(id);
  assert(!(card.pairing.requiredCompanions??[]).includes('tmg'),`${id} does not require TMG`);
  assert((card.pairing.preferredPairs??[]).includes('tmg'),`${id} keeps TMG optional`);
}
assert(byId.get('shilajit').frequency.maxUses7d===2,'Shilajit max twice weekly');
assert(byId.get('spermidine').frequency.permanentHighlightAllowed===false,'Spermidine not permanently highlighted');
assert(same(DEFAULT_ESOTERIC_CONFIG.SYSTEM_WEIGHTS,{numerology:.5,bazi:.3,astrology:.12,mayan:.08}),'numerology-first weights');

const probe={id:'probe',name:'Probe',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',esotericSignature:{numerology:{numerologySum:14,numerologyRoot:5,resonantNumbers:[5]},bazi:{dayMasterStem:'丙',primaryElement:'Fire',polarity:'Yang'},astrology:{primaryPlanets:['Sun'],elements:['Fire'],planetaryHourAffinity:[]},mayan:{dreamspell:'Yellow Sun'}}};
const high=evaluateEsotericFit(probe,{numerology:{scalar:.9,tags:['14','5']},bazi:{scalar:.9,tags:['丙','fire','yang']},astrology:{scalar:.2,tags:['moon']},mayan:{scalar:.2,tags:['mirror']}});
assert(high.convergenceLabel==='High','numerology plus BaZi is High');
assert(high.authorityOrder[0]==='numerology'&&high.authorityOrder[1]==='bazi','authority order exposed');

let eligible=0;
for(let i=0;i<7;i++)if(evaluateFrequencyPersistence(byId.get('shilajit'),addDays('2026-06-15',i),[]).calendarEligible)eligible++;
assert(eligible===2,'Shilajit has two eligible rotation days');
for(let i=0;i<7;i++)assert(evaluateFrequencyPersistence(byId.get('resveratrol'),addDays('2026-06-15',i),[]).urgency===0,'Rotate card has no deadline boost');

const renderer=fs.readFileSync(rendererPath,'utf8');
const live=fs.readFileSync(livePath,'utf8');
const profile=fs.readFileSync(profilePath,'utf8');
const firewall=fs.readFileSync(firewallPath,'utf8');
assert(renderer.includes('optimizer-visible-model-v2.mjs'),'renderer uses v2 model');
assert(renderer.includes('data-practical-timing')&&renderer.includes('MutationObserver'),'practical timing protected');
assert(!/planetaryHour|planetary hour/i.test(renderer),'planetary clock cannot own timing labels');
assert(live.includes('waitForCanonicalProfile')&&live.includes('applyCanonicalSupplementPolicy'),'runtime waits for profile and policy');
assert(renderer.includes('legacy-supplement-firewall.mjs'),'renderer loads firewall');
assert(firewall.includes("setGlobalFunction('renderClubs'"),'legacy renderClubs firewalled');
assert(!profile.includes('supplementBlocksV41')&&!profile.includes('installAceMindSupplementsV41'),'profile bridge has no block installer');
assert(profile.includes("supplementAuthority:'canonical-42-card-policy-v3'"),'profile declares card authority');

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if(failures.length){for(const failure of failures)console.log(' -',failure);process.exit(1);}
