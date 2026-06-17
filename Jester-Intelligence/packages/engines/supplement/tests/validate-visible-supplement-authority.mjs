import assert from 'node:assert/strict';
import { buildVisibleSupplementModel } from '../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-model.mjs';

const registry={supplements:[
  {id:'nr',name:'NR',frequency:{priorityTier:'constitutional'}},
  {id:'nmn',name:'NMN',frequency:{priorityTier:'constitutional'}},
  {id:'nmnh',name:'NMN-H',frequency:{priorityTier:'constitutional'}},
  {id:'tmg',name:'TMG',frequency:{priorityTier:'maintenance'}},
  {id:'magnesium_citrate',name:'Magnesium Citrate',frequency:{priorityTier:'maintenance'}},
  {id:'shilajit',name:'Shilajit',frequency:{priorityTier:'constitutional'}},
  {id:'spermidine',name:'Spermidine',frequency:{priorityTier:'governed'}},
  {id:'spirulina',name:'Spirulina',frequency:{priorityTier:'governed'}},
  {id:'cordyceps',name:'Cordyceps',frequency:{priorityTier:'conditional'}}
]};

const diagnostics=Object.fromEntries(registry.supplements.map(item=>[item.id,{
  esotericLabel:item.id==='nr'?'Strong':'Compatible',
  esotericScalar:item.id==='nr'?.7:.5,
  bodyPermission:'clear',
  frequencyState:'optional',
  frequencyUrgency:.2,
  pairingState:'complete'
}]));

const record={
  date:'2026-06-17',
  diagnostics,
  selected:[{
    atom:{primaryId:'nr',memberIds:['magnesium_citrate','nr','tmg']},
    slot:'morning',
    memberSlots:{magnesium_citrate:'morning',nr:'morning',tmg:'morning'},
    primaryReason:'frequency',
    marginalUtilityAtAdmission:.61
  },{
    atom:{primaryId:'shilajit',memberIds:['shilajit']},
    slot:'morning',memberSlots:{shilajit:'morning'},primaryReason:'operational'
  }],
  residual:[
    {id:'nmn',reason:'complete'},
    {id:'spirulina',reason:'residual'}
  ],
  held:[
    {id:'nmnh',reason:'rotation sibling due (nr)'},
    {id:'spermidine',reason:'min gap not reached (spermidine)'},
    {id:'cordyceps',reason:'below marginal threshold'}
  ],
  excluded:[]
};

const model=buildVisibleSupplementModel(record,registry);
assert.equal(model.authority,'INDIVIDUAL_OPTIMIZER');
assert.equal(model.nadPrimary,'nr');
assert.ok(model.selected.some(row=>row.id==='nr'&&row.action==='TAKE TODAY'));
assert.ok(model.selected.some(row=>row.id==='tmg'&&row.action==='REQUIRED PAIR'));
assert.ok(model.selected.some(row=>row.id==='magnesium_citrate'&&row.action==='REQUIRED PAIR'));
assert.equal(model.selected.filter(row=>['nr','nmn','nmnh'].includes(row.id)&&row.primary).length,1);
assert.ok(!model.selected.some(row=>row.id==='nmn'));
assert.equal(model.notToday.find(row=>row.id==='nmn').action,'TARGET COMPLETE');
assert.equal(model.notToday.find(row=>row.id==='spirulina').action,'RESIDUAL ACTIVE');
assert.equal(model.notToday.find(row=>row.id==='spermidine').action,'COOLING DOWN');
assert.equal(model.notToday.find(row=>row.id==='nmnh').action,'ROTATION HOLD');
assert.equal(model.selected.find(row=>row.id==='shilajit').action,'TAKE TODAY');
assert.ok(!/HIGHLIGHT|SUPPORT/.test(JSON.stringify(model)));
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.esoteric,'Strong');
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.body,'clear');
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.frequency,'optional');
assert.equal(model.selected.find(row=>row.id==='nr').diagnostics.pairing,'complete');

const breach={...record,selected:[
  ...record.selected,
  {atom:{primaryId:'nmn',memberIds:['nmn','tmg','magnesium_citrate']},slot:'morning',memberSlots:{nmn:'morning',tmg:'morning',magnesium_citrate:'morning'},primaryReason:'frequency'}
]};
assert.throws(()=>buildVisibleSupplementModel(breach,registry),/NAD exclusivity breach/);

const notSelected={...record,selected:record.selected.filter(item=>item.atom.primaryId!=='shilajit'),held:[...record.held,{id:'shilajit',reason:'personal maximum reached (shilajit)'}]};
const notSelectedModel=buildVisibleSupplementModel(notSelected,registry);
assert.equal(notSelectedModel.notToday.find(row=>row.id==='shilajit').action,'WEEKLY LIMIT');

console.log(JSON.stringify({ok:true,checks:22,nad:model.nadPrimary,selected:model.selected.map(x=>x.id),notToday:model.notToday.map(x=>[x.id,x.action])},null,2));
