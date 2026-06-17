import assert from 'node:assert/strict';
import { buildVisibleSupplementModel } from '../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-model-v2.mjs';

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
const diagnostics=Object.fromEntries(registry.supplements.map(item=>[item.id,{esotericLabel:'Compatible',esotericScalar:.5,bodyPermission:'clear',frequencyState:'optional',frequencyUrgency:.2,pairingState:'complete'}]));
const record={date:'2026-06-17',diagnostics,selected:[
  {atom:{primaryId:'nr',memberIds:['magnesium_citrate','nr','tmg']},slot:'morning',memberSlots:{magnesium_citrate:'morning',nr:'morning',tmg:'morning'},primaryReason:'frequency'},
  {atom:{primaryId:'shilajit',memberIds:['shilajit']},slot:'morning',memberSlots:{shilajit:'morning'},primaryReason:'operational'}
],residual:[{id:'nmn',reason:'complete'},{id:'spirulina',reason:'residual'}],held:[{id:'nmnh',reason:'rotation sibling due (nr)'},{id:'spermidine',reason:'min gap not reached (spermidine)'},{id:'cordyceps',reason:'below marginal threshold'}],excluded:[]};
const model=buildVisibleSupplementModel(record,registry);
assert.equal(model.authority,'INDIVIDUAL_OPTIMIZER_V2');
assert.equal(model.nadPrimary,'nr');
assert.equal(model.selected.filter(row=>['nr','nmn','nmnh'].includes(row.id)).length,1);
assert.equal(model.notToday.find(row=>row.id==='spirulina').action,'RESIDUAL ACTIVE');
assert.equal(model.notToday.find(row=>row.id==='spermidine').action,'COOLING DOWN');
assert.ok(!/HIGHLIGHT|SUPPORT|OPTIMAL/.test(JSON.stringify(model)));
const primaryBreach={...record,selected:[...record.selected,{atom:{primaryId:'nmn',memberIds:['nmn','tmg','magnesium_citrate']},slot:'morning',memberSlots:{nmn:'morning',tmg:'morning',magnesium_citrate:'morning'},primaryReason:'frequency'}]};
assert.throws(()=>buildVisibleSupplementModel(primaryBreach,registry),/NAD exclusivity breach/);
const hiddenMemberBreach={...record,selected:[...record.selected,{atom:{primaryId:'shilajit',memberIds:['nmn','shilajit']},slot:'morning',memberSlots:{nmn:'morning',shilajit:'morning'},primaryReason:'operational'}]};
assert.throws(()=>buildVisibleSupplementModel(hiddenMemberBreach,registry),/NAD exclusivity breach/);
console.log(JSON.stringify({ok:true,checks:9,nad:model.nadPrimary,authority:model.authority},null,2));
