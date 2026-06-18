import assert from 'node:assert/strict';
import { buildVisibleSupplementModel } from '../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-model-v2.mjs';

const registry={policyVersion:'ace_mind_supplement_policy.v3.2026-06-18',supplements:[
  {id:'nr',name:'NR',frequency:{priorityTier:'constitutional'},protocolPolicy:{conservativeRule:'One NAD precursor per selected day.'}},
  {id:'nmn',name:'NMN',frequency:{priorityTier:'constitutional'}},
  {id:'nmnh',name:'NMNH',frequency:{priorityTier:'constitutional'}},
  {id:'tmg',name:'TMG',frequency:{priorityTier:'maintenance'},protocolPolicy:{conservativeRule:'Optional methyl support.'}},
  {id:'magnesium_citrate',name:'Magnesium Citrate',frequency:{priorityTier:'maintenance'}},
  {id:'shilajit',name:'Shilajit',frequency:{priorityTier:'constitutional'}},
  {id:'spermidine',name:'Spermidine',frequency:{priorityTier:'governed'}},
  {id:'spirulina',name:'Spirulina',frequency:{priorityTier:'governed'}},
  {id:'cordyceps',name:'Cordyceps',frequency:{priorityTier:'conditional'}},
  {id:'reishi',name:'Reishi',frequency:{priorityTier:'conditional'}}
]};

const diagnostics=Object.fromEntries(registry.supplements.map(item=>[item.id,{
  esotericLabel:item.id==='nr'?'Strong':'Compatible',
  convergenceLabel:item.id==='nr'?'High':'Low',
  esotericScalar:item.id==='nr'?.75:.5,
  numerologyScalar:item.id==='nr'?.9:.5,
  baziScalar:item.id==='nr'?.75:.5,
  bodyPermission:'clear',frequencyState:'optional',frequencyUrgency:.2,
  calendarEligible:true,pairingState:'complete',policyVersion:registry.policyVersion
}]));

const record={
  date:'2026-06-18',policyVersion:registry.policyVersion,diagnostics,
  selected:[
    {atom:{primaryId:'nr',memberIds:['magnesium_citrate','nr']},slot:'morning',memberSlots:{magnesium_citrate:'morning',nr:'morning'},primaryReason:'esoteric'},
    {atom:{primaryId:'shilajit',memberIds:['shilajit']},slot:'morning',memberSlots:{shilajit:'morning'},primaryReason:'operational'}
  ],
  residual:[{id:'nmn',reason:'complete'},{id:'spirulina',reason:'residual'}],
  held:[
    {id:'nmnh',reason:'rotation day not selected'},
    {id:'spermidine',reason:'min gap not reached (spermidine)'},
    {id:'cordyceps',reason:'below marginal threshold'},
    {id:'reishi',reason:'manual-only'}
  ],excluded:[]
};

const model=buildVisibleSupplementModel(record,registry);
assert.equal(model.authority,'CANONICAL_42_CARD_POLICY_V3');
assert.equal(model.policyVersion,registry.policyVersion);
assert.equal(model.nadPrimary,'nr');
assert.equal(model.selected.filter(row=>['nr','nmn','nmnh'].includes(row.id)).length,1);
assert.ok(model.selected.some(row=>row.id==='nr'&&row.action==='TAKE TODAY'));
assert.ok(model.selected.some(row=>row.id==='magnesium_citrate'&&row.action==='REQUIRED PAIR'));
assert.ok(!model.selected.some(row=>row.id==='tmg'),'TMG remains optional and is not injected');
assert.equal(model.notToday.find(row=>row.id==='nmn').action,'TARGET COMPLETE');
assert.equal(model.notToday.find(row=>row.id==='spirulina').action,'RESIDUAL ACTIVE');
assert.equal(model.notToday.find(row=>row.id==='spermidine').action,'COOLING DOWN');
assert.equal(model.notToday.find(row=>row.id==='nmnh').action,'ROTATION HOLD');
assert.equal(model.notToday.find(row=>row.id==='reishi').action,'MANUAL ONLY');
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.convergence,'High');
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.numerologyScalar,.9);
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.baziScalar,.75);
assert.ok(!/HIGHLIGHT|SUPPORT|OPTIMAL/.test(JSON.stringify(model)));

const primaryBreach={...record,selected:[...record.selected,{atom:{primaryId:'nmn',memberIds:['nmn']},slot:'morning',memberSlots:{nmn:'morning'},primaryReason:'frequency'}]};
assert.throws(()=>buildVisibleSupplementModel(primaryBreach,registry),/NAD exclusivity breach/);
const hiddenBreach={...record,selected:[...record.selected,{atom:{primaryId:'shilajit',memberIds:['nmn','shilajit']},slot:'morning',memberSlots:{nmn:'morning',shilajit:'morning'},primaryReason:'operational'}]};
assert.throws(()=>buildVisibleSupplementModel(hiddenBreach,registry),/NAD exclusivity breach/);

console.log(JSON.stringify({ok:true,authority:model.authority,policyVersion:model.policyVersion,nad:model.nadPrimary,selected:model.selected.map(row=>row.id)},null,2));
