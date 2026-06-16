import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  sha256Hex,
  buildAtoms,
  materializeMembers,
  planSlots,
  stackQuality,
  mergeOptimizerConfig
} from '../index.mjs';

const registryPath = process.argv[2] ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const greenBody = Object.fromEntries(registry.bodySystems.map(axis => [axis, 'green']));

function dayField(tags, scalar=0.78) {
  return {
    astrology:{scalar,tags}, bazi:{scalar,tags}, numerology:{scalar,tags}, mayan:{scalar,tags}
  };
}

function inputFor({tags=['sun','mercury','fire','focus','vitality'], daySignals={career:1,study:.9,creative:.7,body:.5}, histories={}, body=greenBody, config={}}={}) {
  return {
    day:'2026-06-16', registry, daySignals,
    layers:{
      esoteric:evaluateEsotericRegistry(registry,dayField(tags)),
      body:evaluateBodyRegistry(registry,body),
      frequency:evaluateFrequencyRegistry(registry,'2026-06-16',histories),
      pairing:evaluatePairingRegistry(registry,[])
    },
    config
  };
}

assert.equal(sha256Hex('abc'), crypto.createHash('sha256').update('abc').digest('hex'));
assert.equal(sha256Hex(''), crypto.createHash('sha256').update('').digest('hex'));

const input=inputFor();
const out1=optimize(input);
const out2=optimize(JSON.parse(JSON.stringify(input)));
assert.deepEqual(out1,out2);
assert.equal(out1.determinismHash,out2.determinismHash);
assert.match(out1.determinismHash,/^[0-9a-f]{64}$/);

const selectedMembers=new Set(out1.selected.flatMap(x=>x.atom.memberIds));
const selectedPrimaries=out1.selected.map(x=>x.atom.primaryId);
assert.ok(!selectedPrimaries.includes('ashwagandha'));
assert.ok(!selectedPrimaries.includes('fadogia_agrestis'));
assert.ok(!selectedPrimaries.includes('turkesterone'));
assert.ok(out1.excluded.some(x=>x.id==='ashwagandha'));
assert.ok(out1.excluded.some(x=>x.id==='fadogia_agrestis'));
assert.ok(out1.excluded.some(x=>x.id==='turkesterone'));

const nadPrimaries=selectedPrimaries.filter(id=>['nr','nmn','nmnh'].includes(id));
assert.ok(nadPrimaries.length<=1);
if(nadPrimaries.length){
  assert.ok(selectedMembers.has('tmg'));
  assert.ok(selectedMembers.has('magnesium_citrate'));
  const nadRecord=out1.selected.find(x=>x.atom.primaryId===nadPrimaries[0]);
  assert.ok(nadRecord.atom.memberIds.includes('tmg'));
  assert.ok(nadRecord.atom.memberIds.includes('magnesium_citrate'));
}

for(const rec of out1.selected){
  assert.ok(rec.primaryReason);
  assert.ok(Number.isFinite(rec.marginalUtilityAtAdmission));
  for(const slot of Object.values(rec.memberSlots)) assert.ok(['morning','afternoon','night'].includes(slot));
}
for(const rec of out1.held) assert.ok(rec.reason);
for(const rec of out1.residual) assert.ok(rec.reason);

const config=mergeOptimizerConfig();
const {atoms}=buildAtoms(input,config);
const nrAtom=atoms.find(a=>a.primaryId==='nr');
assert.deepEqual(nrAtom.memberIds,['magnesium_citrate','nr','tmg']);
assert.equal(materializeMembers([nrAtom]).members.length,3);
assert.ok(planSlots(materializeMembers([nrAtom]).members,config).ok);
assert.ok(Number.isFinite(stackQuality([nrAtom],config)));

const miniRegistry={supplements:[
  {id:'comp',name:'Comp',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',criticalData:{},frequency:{targetUses7d:7,maxUses7d:7,minimumGapHours:0},timeWindows:['morning'],classes:[],body:{benefits:{liver:1},burdens:{}},domains:{body:1},pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}},
  {id:'a',name:'A',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',criticalData:{},frequency:{targetUses7d:1,maxUses7d:2,minimumGapHours:0},timeWindows:['morning'],classes:[],body:{benefits:{brain:1},burdens:{}},domains:{study:1},pairing:{requiredCompanions:['comp'],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}},
  {id:'b',name:'B',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',criticalData:{},frequency:{targetUses7d:1,maxUses7d:2,minimumGapHours:0},timeWindows:['afternoon'],classes:[],body:{benefits:{muscles_back:1},burdens:{}},domains:{body:1},pairing:{requiredCompanions:['comp'],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}}
]};
const layer=(id)=>({[id]:{scalar:.8,label:'Strong'}});
const miniInput={day:'2026-06-16',registry:miniRegistry,daySignals:{study:1,body:1},layers:{
  esoteric:{...layer('a'),...layer('b'),...layer('comp')},
  body:{a:{label:'clear'},b:{label:'clear'},comp:{label:'clear'}},
  frequency:{a:{state:'due',urgency:1,minGapMet:true,usesThisWindow:0,targetUses7d:1,maxUses7d:2,daysLeftInWindow:1},b:{state:'due',urgency:1,minGapMet:true,usesThisWindow:0,targetUses7d:1,maxUses7d:2,daysLeftInWindow:1},comp:{state:'optional',urgency:.2,minGapMet:true,usesThisWindow:0,targetUses7d:7,maxUses7d:7,daysLeftInWindow:6}},
  pairing:{a:{state:'companion_required'},b:{state:'companion_required'},comp:{state:'complete'}}
},config:{MIN_MARGINAL_UTILITY:0.01,QUALITY_MARGIN:0,COMPLEXITY_PENALTY_PER_ATOM:0}};
const miniAtoms=buildAtoms(miniInput,mergeOptimizerConfig(miniInput.config)).atoms;
const aAtom=miniAtoms.find(x=>x.primaryId==='a');
const bAtom=miniAtoms.find(x=>x.primaryId==='b');
const shared=materializeMembers([aAtom,bAtom]);
assert.equal(shared.members.filter(x=>x.id==='comp').length,1);
assert.deepEqual(shared.dependencyRefs.comp,['a','b']);

const physical=optimize(inputFor({tags:['mars','fire','wood','stamina','movement'],daySignals:{body:1,career:.6,leisure:.5},config:{MIN_MARGINAL_UTILITY:.05}}));
const cordVisible=physical.selected.some(x=>x.atom.primaryId==='cordyceps')
  || physical.held.some(x=>x.id==='cordyceps')
  || physical.residual.some(x=>x.id==='cordyceps')
  || physical.excluded.some(x=>x.id==='cordyceps');
assert.ok(cordVisible);

const redBody={...greenBody,nervous:'red',sleep:'red',heart:'orange'};
const heldPhysical=optimize(inputFor({tags:['mars','fire','wood','stamina','movement'],daySignals:{body:1},body:redBody,config:{MIN_MARGINAL_UTILITY:.05}}));
assert.ok(heldPhysical.held.some(x=>x.id==='cordyceps' && x.reason.startsWith('body hold')));

const slotTotals={morning:0,afternoon:0,night:0};
const uniqueSelectedMembers=new Map();
for(const rec of out1.selected){
  for(const [id,slot] of Object.entries(rec.memberSlots)) uniqueSelectedMembers.set(id,slot);
}
for(const slot of uniqueSelectedMembers.values()) slotTotals[slot]+=1;
assert.ok(slotTotals.morning<=4 && slotTotals.afternoon<=4 && slotTotals.night<=3);
assert.ok(out1.selected.length < 12);

const criticalRegistry={supplements:[{
  id:'quality_probe',name:'Quality Probe',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',
  criticalData:{productVerified:false},criticalRequirements:['productVerified'],frequency:{targetUses7d:1,maxUses7d:1,minimumGapHours:0},
  timeWindows:['morning'],classes:[],body:{benefits:{body:1},burdens:{}},domains:{body:1},
  pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}
}]};
const criticalInput={day:'2026-06-16',registry:criticalRegistry,daySignals:{body:1},layers:{
  esoteric:{quality_probe:{scalar:1,label:'Prime'}},body:{quality_probe:{label:'clear',benefitVec:{body:1},burdenVec:{}}},
  frequency:{quality_probe:{state:'due',urgency:1,minGapMet:true,usesThisWindow:0,targetUses7d:1,maxUses7d:1,daysLeftInWindow:1}},
  pairing:{quality_probe:{state:'complete'}}
},config:{MIN_MARGINAL_UTILITY:0}};
const criticalOut=optimize(criticalInput);
assert.ok(criticalOut.held.some(x=>x.id==='quality_probe' && x.reason.startsWith('critical data missing')));

const smallRegistry={supplements:[
  {id:'strong',name:'Strong',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',criticalData:{},frequency:{targetUses7d:1,maxUses7d:2,minimumGapHours:0},timeWindows:['morning'],classes:[],body:{benefits:{brain:3},burdens:{}},domains:{study:3},pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}},
  {id:'tiny',name:'Tiny',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',criticalData:{},frequency:{targetUses7d:0,maxUses7d:2,minimumGapHours:0},timeWindows:['afternoon'],classes:[],body:{benefits:{brain:.3},burdens:{}},domains:{leisure:.1},pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{}}
]};
const smallInput={day:'2026-06-16',registry:smallRegistry,daySignals:{study:1},layers:{
  esoteric:{strong:{scalar:1,label:'Prime'},tiny:{scalar:.05,label:'Discordant'}},
  body:{strong:{label:'clear',benefitVec:{brain:3},burdenVec:{}},tiny:{label:'clear',benefitVec:{brain:.3},burdenVec:{}}},
  frequency:{strong:{state:'due',urgency:1,minGapMet:true,usesThisWindow:0,targetUses7d:1,maxUses7d:2,daysLeftInWindow:1},tiny:{state:'optional',urgency:0,minGapMet:true,usesThisWindow:0,targetUses7d:0,maxUses7d:2,daysLeftInWindow:6}},
  pairing:{strong:{state:'complete'},tiny:{state:'complete'}}
},config:{MIN_MARGINAL_UTILITY:0.01,QUALITY_MARGIN:.08}};
const smallOut=optimize(smallInput);
assert.deepEqual(smallOut.selected.map(x=>x.atom.primaryId),['strong']);
assert.ok(smallOut.held.some(x=>x.id==='tiny'));

console.log(JSON.stringify({ok:true,selected:out1.selected.length,held:out1.held.length,residual:out1.residual.length,excluded:out1.excluded.length,hash:out1.determinismHash,checks:40},null,2));
