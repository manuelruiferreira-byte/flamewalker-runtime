import { optimize as baseOptimize } from './individual-supplement-optimizer.mjs';
import { canonicalize, clamp } from './contracts.mjs';
import { mergeOptimizerConfig } from './optimizer-config.mjs';
import { sha256Hex } from './sha256.mjs';

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function operationalScore(daySignals = {}, affinity = {}) {
  let weighted=0;
  let total=0;
  for(const domain of Object.keys(affinity).sort()){
    const weight=Math.max(0,Number(affinity[domain]??0));
    weighted+=weight*clamp(daySignals?.[domain]??0);
    total+=weight;
  }
  return total>0?clamp(weighted/total):0;
}

function rotationOverride(card,input,config) {
  const eso=input.layers?.esoteric?.[card.id]??{};
  const numerology=Number(eso.primaryScalar??eso.components?.numerology?.scalar??0);
  const bazi=Number(eso.secondaryScalar??eso.components?.bazi?.scalar??0);
  const operational=operationalScore(input.daySignals,card.domains);
  const numStrong=numerology>=Number(config.ROTATION_OVERRIDE_NUMEROLOGY??0.82);
  const baziStrong=bazi>=Number(config.ROTATION_OVERRIDE_BAZI??0.64);
  const operationalStrong=operational>=Number(config.ROTATION_OVERRIDE_OPERATIONAL??0.82);
  return {
    allowed:numStrong&&(baziStrong||operationalStrong),
    numerology,bazi,operational
  };
}

function governRotation(input,config) {
  const governed=clone(input);
  governed.registry=clone(input.registry??{});
  const rotationHeld=new Map();

  for(const card of governed.registry.supplements??[]){
    const original=(input.registry?.supplements??[]).find(item=>item.id===card.id)??card;
    if(!['allowed','caution'].includes(original.autoSelection))continue;
    const frequency=input.layers?.frequency?.[card.id]??{};
    const target=Number(frequency.targetUses7d??card.frequency?.targetUses7d??0);
    if(target>=7||frequency.calendarEligible!==false)continue;
    const override=rotationOverride(original,input,config);
    if(override.allowed)continue;
    card.autoSelection='manual_only';
    rotationHeld.set(card.id,{
      id:card.id,
      reason:`rotation day not selected (numerology ${override.numerology.toFixed(2)}, BaZi ${override.bazi.toFixed(2)}, operational ${override.operational.toFixed(2)})`
    });
  }
  return {governed,rotationHeld};
}

export function optimize(input) {
  const config=mergeOptimizerConfig(input?.config??{});
  const {governed,rotationHeld}=governRotation(input,config);
  const base=baseOptimize(governed);
  if(!rotationHeld.size)return base;

  const held=[...(base.held??[])];
  const excluded=[];
  for(const record of base.excluded??[]){
    const rotation=rotationHeld.get(record.id);
    if(rotation)held.push(rotation);
    else excluded.push(record);
  }
  held.sort((a,b)=>a.id.localeCompare(b.id));
  excluded.sort((a,b)=>a.id.localeCompare(b.id));
  const payload=canonicalize({
    selected:base.selected??[],
    residual:base.residual??[],
    held,
    excluded
  });
  return Object.freeze({...payload,determinismHash:sha256Hex(JSON.stringify(payload))});
}
