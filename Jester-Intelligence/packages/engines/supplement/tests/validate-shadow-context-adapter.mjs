import assert from 'node:assert/strict';
import {
  buildEsotericDayField,
  buildDaySignals,
  normalizeBodyState,
  extractTakenHistory,
  legacySnapshot,
  compareLegacyToOptimizer,
  sanitizeShadowContext,
  snapshotToContext
} from '../../../../ACED-Lifestyle/shared/optimizer/shadow-context-adapter.mjs';

const registry={
  bodySystems:['nervous','heart','sleep','liver','gut','muscles_back'],
  supplements:[
    {id:'nr',name:'NR',aliases:['Nicotinamide Riboside']},
    {id:'tmg',name:'TMG',aliases:[]},
    {id:'cordyceps',name:'Cordyceps',aliases:[]}
  ]
};
const day={
  id:'2026-06-16',
  verified:true,
  focusHint:'physical movement',
  ptrm:'ACTIVE',
  astrology:{focus:'Mars activation'},
  bazi:{element:'Fire',signature:'Fire Horse'},
  mayan:{dreamspell:{archetype:'Blue Storm'}},
  personalDay:3
};
const guidance={
  suppMode:'ALIGNED',
  c:{focus:'Body and career',body:{governor:'GREEN'}},
  life:{body:{score:.91},career:{favor:'green'}},
  block:{items:[['NR'],['TMG']]}
};

const field=buildEsotericDayField(day);
assert.ok(field.astrology.scalar>field.numerology.scalar);
assert.ok(field.astrology.tags.includes('mars'));

const signals=buildDaySignals(day,guidance);
assert.ok(signals.body>=.9);
assert.ok(signals.career>=.7);

const body=normalizeBodyState({
  states:{nervous:'green',heart:'orange',sleep:'red',liver:'yellow',gut:'green',back:'green'}
},registry.bodySystems);
assert.equal(body.heart,'orange');
assert.equal(body.sleep,'red');
assert.equal(body.muscles_back,'green');

const state={suppLog:{
  '2026-06-15':{taken:['NR'],events:[{name:'TMG',ticked:true}]},
  '2026-06-16':{events:[{name:'Cordyceps',ticked:true}]}
}};
const histories=extractTakenHistory(state,registry);
assert.deepEqual(histories.nr,['2026-06-15']);
assert.deepEqual(histories.tmg,['2026-06-15']);
assert.deepEqual(histories.cordyceps,['2026-06-16']);

const legacy=legacySnapshot(day,guidance,registry);
assert.deepEqual(legacy.itemIds,['nr','tmg']);

const comparison=compareLegacyToOptimizer(legacy,{
  selected:[{atom:{memberIds:['nr','tmg','cordyceps']}}]
});
assert.deepEqual(comparison.optimizerOnly,['cordyceps']);
assert.equal(comparison.legacyOnly.length,0);
assert.equal(comparison.sameSet,false);

const clean=sanitizeShadowContext({
  date:day.id,daySignals:signals,dayField:field,bodyState:body,histories,legacy,
  notes:'private',fullState:{secret:true}
});
assert.equal('notes'in clean,false);
assert.equal('fullState'in clean,false);

const snapshot={
  active_day:'2026-06-16',
  day,
  day_summary:{block:1,focus:'Body and career',supplement_mode:'ALIGNED'},
  convergence:{synthesis:'Mars movement field'},
  body:{states:{nervous:'green',heart:'orange',sleep:'red',liver:'yellow',gut:'green',back:'green'}},
  supplements:{items:[{name:'NR'},{name:'TMG'}]},
  domains:{body:{score:.91},career:{favor:'green'}},
  grounding:{movement:'Training walk',mantra:'One clean act'}
};
const fromSnapshot=snapshotToContext(snapshot,registry,state);
assert.equal(fromSnapshot.date,'2026-06-16');
assert.deepEqual(fromSnapshot.legacy.itemIds,['nr','tmg']);
assert.equal(fromSnapshot.bodyState.sleep,'red');
assert.ok(fromSnapshot.daySignals.body>=.9);
assert.equal('fullState'in fromSnapshot,false);

console.log(JSON.stringify({ok:true,checks:23},null,2));
