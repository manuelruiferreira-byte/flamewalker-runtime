import assert from 'node:assert/strict';
import {
  extractActualHistory,
  readVisibleSupplementNames,
  buildLiveContext
} from '../../../../ACED-Lifestyle/shared/optimizer/live-context-adapter.mjs';

const registry={
  bodySystems:['nervous','heart','sleep','liver','gut','muscles_back'],
  supplements:[
    {id:'nr',name:'NR',aliases:['Nicotinamide Riboside']},
    {id:'nmn',name:'NMN',aliases:[]},
    {id:'spermidine',name:'Spermidine',aliases:[]},
    {id:'spirulina',name:'Spirulina',aliases:[]},
    {id:'shilajit',name:'Shilajit',aliases:[]}
  ]
};

const history=extractActualHistory({suppLog:{
  '2026-06-15':{
    taken:['NR'],
    events:[
      {name:'NR',ticked:true},
      {name:'NMN',ticked:true},
      {name:'NMN',ticked:false}
    ]
  },
  '2026-06-16':{
    events:[
      {name:'Spermidine',ticked:true},
      {name:'Spermidine',ticked:false},
      {name:'Spirulina',ticked:true}
    ]
  }
}},registry);
assert.deepEqual(history.nr,['2026-06-15']);
assert.equal(history.nmn,undefined,'taken list must override stale tick events');
assert.equal(history.spermidine,undefined,'last untick must win in event fallback');
assert.deepEqual(history.spirulina,['2026-06-16']);

const nodes=[
  {getAttribute:key=>key==='data-supp'?'NR':null},
  {getAttribute:key=>key==='data-optimizer-supp'?'Shilajit':null},
  {getAttribute:key=>key==='data-supp'?'NR':null}
];
const root={querySelectorAll:()=>nodes};
assert.deepEqual(readVisibleSupplementNames(root),['NR','Shilajit']);

const day={
  id:'2026-06-17',
  verified:true,
  focusHint:'physical movement and career',
  astrology:{focus:'Mars activation'},
  bazi:{element:'Fire'},
  mayan:{archetype:'Blue Storm'},
  ptrm:'ACTIVE',
  personalDay:3,
  block:4
};
const snapshot={
  active_day:'2026-06-16',
  supplements:['NMN','Spermidine'],
  day_summary:{focus:'old snapshot',block:2,supplement_mode:'ALIGNED'},
  domains:{body:{score:.9}}
};
const context=buildLiveContext({
  snapshot,
  state:{suppLog:{'2026-06-15':{taken:['NR']}}},
  registry,
  day,
  bodySummary:{states:{nervous:'green',heart:'orange',sleep:'green',liver:'green',gut:'green',back:'green'}},
  visibleNames:['NR','Shilajit'],
  fallbackDate:'2026-06-18'
});
assert.equal(context.date,'2026-06-17','live selected day must override stale mirror date');
assert.deepEqual(context.legacy.itemIds,['nr','shilajit']);
assert.equal(context.bodyState.heart,'orange');
assert.equal(context.bodyState.muscles_back,'green');
assert.deepEqual(context.histories.nr,['2026-06-15']);
assert.ok(context.dayField.astrology.tags.includes('mars'));
assert.ok(context.daySignals.body>=.76);
assert.ok(context.daySignals.career>=.76);
assert.equal('fullState' in context,false);

assert.throws(()=>buildLiveContext({registry,day:{}}),/selected day unavailable/);

console.log(JSON.stringify({ok:true,checks:17,date:context.date,legacy:context.legacy.itemIds,history},null,2));
