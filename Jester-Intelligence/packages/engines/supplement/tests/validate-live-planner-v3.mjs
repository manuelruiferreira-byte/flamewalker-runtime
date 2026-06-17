import assert from 'node:assert/strict';
import { computeSupplementDay,planSupplementDate } from '../../../../ACED-Lifestyle/shared/optimizer/supplement-live-planner-v3.mjs';
import { evaluateFrequencyPersistence } from '../frequency-persistence-engine.mjs';

function supplement(id,name,planet,element,quality,domain){
  return {
    id,name,aliases:[],available:true,personalStatus:'active',evidenceClass:'baseline',autoSelection:'allowed',
    criticalData:{doseKnown:true,productVerified:true,medicationInteractionChecked:true,labDependent:true},
    frequency:{targetUses7d:2,maxUses7d:3,minimumGapHours:24,persistenceClass:'short',residualWindowHours:24,priorityTier:'maintenance'},
    timeWindows:['morning'],requiresFood:false,classes:['stimulant'],
    body:{benefits:{nervous:1},burdens:{}},domains:{[domain]:3},
    pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[],redundantWith:[]},
    esoteric:{planets:[planet],elements:[element],qualities:[quality]},notes:''
  };
}

const registry={
  bodySystems:['nervous'],
  supplements:[
    supplement('mars_item','Mars Item','Mars','Fire','movement','body'),
    supplement('venus_item','Venus Item','Venus','Earth','love','love')
  ]
};
const days={
  '2026-06-16':{id:'2026-06-16',weekday:'Tuesday',verified:true,astrology:{focus:'Mars activation',sun:'Sun 25 Gemini',moon:'Moon 2 Aries'},natalTransit:{top:[{transit_label:'Mars',natal_label:'Sun',aspect:'trine'}]},bazi:{element:'Fire',signature:'Fire Horse',pillar:'Fire Horse'},personalDay:9,ptrm:'9 COMPLETING',mayan:{dsColor:'Red',dsTone:9,dreamspell:{archetype:'Red Serpent',tone:9}}},
  '2026-06-19':{id:'2026-06-19',weekday:'Friday',verified:true,astrology:{focus:'Venus harmony',sun:'Sun 28 Gemini',moon:'Moon 8 Taurus'},natalTransit:{top:[{transit_label:'Venus',natal_label:'Moon',aspect:'sextile'}]},bazi:{element:'Earth',signature:'Earth Rabbit',pillar:'Earth Rabbit'},personalDay:6,ptrm:'6 BALANCED',mayan:{dsColor:'Yellow',dsTone:6,dreamspell:{archetype:'Yellow Star',tone:6}}}
};
const guidance=day=>day.id==='2026-06-16'?{life:{body:{score:1},love:{score:.05}},c:{focus:'Body movement'}}:{life:{body:{score:.05},love:{score:1}},c:{focus:'Love harmony'}};
const getDay=date=>days[date]??{...days['2026-06-16'],id:date};
const getGuidance=day=>guidance(day);
const getBodySummary=()=>({states:{nervous:'green'},allGreen:true});

const marsDay=computeSupplementDay({date:'2026-06-16',registry,histories:{},getDay,getGuidance,getBodySummary});
const venusDay=computeSupplementDay({date:'2026-06-19',registry,histories:{},getDay,getGuidance,getBodySummary});
assert.deepEqual(marsDay.output.selected.map(x=>x.atom.primaryId),['mars_item']);
assert.deepEqual(venusDay.output.selected.map(x=>x.atom.primaryId),['venus_item']);
assert.ok(marsDay.layers.esoteric.mars_item.convergenceCount>marsDay.layers.esoteric.venus_item.convergenceCount);
assert.ok(venusDay.layers.esoteric.venus_item.convergenceCount>venusDay.layers.esoteric.mars_item.convergenceCount);

const frequencyRecord={...registry.supplements[0],frequency:{targetUses7d:2,maxUses7d:2,minimumGapHours:0,residualWindowHours:0,priorityTier:'governed'}};
const maxed=evaluateFrequencyPersistence(frequencyRecord,'2026-06-17',['2026-06-15','2026-06-16']);
assert.equal(maxed.state,'complete');
assert.equal(maxed.usesThisWindow,2);
const due=evaluateFrequencyPersistence(frequencyRecord,'2026-06-21',[]);
assert.equal(due.state,'due');
assert.ok(due.urgency>=.55);
const lingering=evaluateFrequencyPersistence({...frequencyRecord,frequency:{...frequencyRecord.frequency,targetUses7d:3,maxUses7d:3,minimumGapHours:0,residualWindowHours:72}},'2026-06-17',['2026-06-16']);
assert.equal(lingering.state,'residual');
assert.equal(lingering.residualActive,true);

const sourceState={suppLog:{'2026-06-16':{taken:['Mars Item']}}};
const before=JSON.stringify(sourceState);
const future=planSupplementDate({date:'2026-06-19',today:'2026-06-17',state:sourceState,registry,getDay,getGuidance,getBodySummary});
assert.equal(future.historyMode,'projected');
assert.ok(future.projectionTrail.length>0);
assert.equal(JSON.stringify(sourceState),before);

console.log(JSON.stringify({ok:true,checks:13,mars:marsDay.output.selected.map(x=>x.atom.primaryId),venus:venusDay.output.selected.map(x=>x.atom.primaryId),projectionDays:future.projectionTrail.length},null,2));
