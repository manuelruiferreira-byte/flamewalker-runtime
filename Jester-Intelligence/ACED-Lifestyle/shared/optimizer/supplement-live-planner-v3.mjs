import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  optimize,
  addDays,
  mondayOf
} from '../../../packages/engines/supplement/index.mjs?v=20260617-3';
import {
  buildDaySignals,
  buildEsotericDayField,
  normalizeBodyState,
  extractTakenHistory,
  legacySnapshot,
  sanitizeShadowContext
} from './shadow-context-adapter.mjs?v=20260617-3';

function cloneHistories(histories={}){
  return Object.fromEntries(Object.entries(histories).map(([id,dates])=>[id,[...new Set(dates??[])].sort()]));
}

function historiesThrough(histories={},date){
  return Object.fromEntries(Object.entries(histories).map(([id,dates])=>[id,(dates??[]).filter(d=>d<=date).sort()]));
}

function selectedMembers(output={}){
  return [...new Set((output.selected??[]).flatMap(item=>item?.atom?.memberIds??[]))].sort();
}

function appendProjected(histories,output,date){
  for(const id of selectedMembers(output)){
    const list=histories[id]??=[];
    if(!list.includes(date))list.push(date);
    list.sort();
  }
}

function maximumCarryDays(registry={}){
  let hours=24;
  for(const supplement of registry.supplements??[]){
    const f=supplement.frequency??{};
    hours=Math.max(hours,Number(f.minimumGapHours??0),Number(f.residualWindowHours??0));
  }
  return Math.max(1,Math.min(14,Math.ceil(hours/24)));
}

function runtimeDay(date,getDay){
  const day=getDay(date);
  if(!day||typeof day!=='object')throw new Error(`day field unavailable for ${date}`);
  return {...day,id:date};
}

function runtimeGuidance(day,getGuidance){
  const guidance=getGuidance(day);
  return guidance&&typeof guidance==='object'?guidance:{};
}

export function computeSupplementDay({date,registry,histories,getDay,getGuidance,getBodySummary,config={}}){
  const day=runtimeDay(date,getDay);
  const guidance=runtimeGuidance(day,getGuidance);
  const bodySummary=getBodySummary(date)??{};
  const context=sanitizeShadowContext({
    date,
    daySignals:buildDaySignals(day,guidance),
    dayField:buildEsotericDayField(day),
    bodyState:normalizeBodyState(bodySummary,registry.bodySystems??[]),
    histories:historiesThrough(histories,date),
    legacy:legacySnapshot(day,guidance,registry)
  });
  const layers={
    esoteric:evaluateEsotericRegistry(registry,context.dayField),
    body:evaluateBodyRegistry(registry,context.bodyState),
    frequency:evaluateFrequencyRegistry(registry,date,context.histories),
    pairing:evaluatePairingRegistry(registry,[])
  };
  const output=optimize({day:date,registry,daySignals:context.daySignals,layers,config});
  return {date,day,guidance,bodySummary,context,layers,output};
}

export function planSupplementDate({date,today,state={},registry,getDay,getGuidance,getBodySummary,config={}}){
  const actualAll=extractTakenHistory(state,registry);
  const actual=historiesThrough(actualAll,today);
  const projected=cloneHistories(actual);
  const projectionTrail=[];
  const isFuture=date>today;

  if(isFuture){
    const carryDays=maximumCarryDays(registry);
    const localStart=addDays(mondayOf(date),-carryDays);
    let cursor=localStart>today?localStart:today;
    while(cursor<date){
      const step=computeSupplementDay({date:cursor,registry,histories:projected,getDay,getGuidance,getBodySummary,config});
      appendProjected(projected,step.output,cursor);
      projectionTrail.push({date:cursor,memberIds:selectedMembers(step.output),hash:step.output.determinismHash});
      cursor=addDays(cursor,1);
    }
  }

  const finalRun=computeSupplementDay({
    date,
    registry,
    histories:isFuture?projected:actualAll,
    getDay,
    getGuidance,
    getBodySummary,
    config
  });

  return {
    ...finalRun,
    histories:isFuture?projected:actualAll,
    historyMode:isFuture?'projected':'actual',
    projectionTrail,
    actualHistories:actualAll
  };
}
