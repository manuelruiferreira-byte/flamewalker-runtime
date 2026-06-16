import { canonicalize, sha256Hex } from '../../../packages/engines/supplement/index.mjs';

export const SHADOW_REPORT_VERSION='ace_mind_optimizer_shadow_report.v1';
export const SHADOW_ACTIVATION_STATUS='BLOCKED_BY_POLICY';
export const LOW_AGREEMENT_THRESHOLD=0.5;
export const RECENT_COMPARISON_LIMIT=12;

function round4(value){
  return Number(Number(value||0).toFixed(4));
}

function isPlainObject(value){
  return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}

function normalizeId(value){
  return String(value??'').trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

function stableIds(value){
  if(!Array.isArray(value))return null;
  return [...new Set(value.map(normalizeId).filter(Boolean))].sort();
}

function validIsoDate(value){
  const text=String(value??'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return null;
  const parsed=new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==text?null:text;
}

function validIsoTimestamp(value){
  const parsed=new Date(String(value??''));
  return Number.isNaN(parsed.getTime())?null:parsed.toISOString();
}

function disjoint(...groups){
  const seen=new Set();
  for(const group of groups){
    for(const id of group){
      if(seen.has(id))return false;
      seen.add(id);
    }
  }
  return true;
}

function normalizeRecord(record){
  if(!isPlainObject(record)||!isPlainObject(record.comparison))return null;
  const key=String(record.key??'').trim();
  const date=validIsoDate(record.date);
  const createdAt=validIsoTimestamp(record.createdAt);
  const overlap=stableIds(record.comparison.overlap);
  const legacyOnly=stableIds(record.comparison.legacyOnly);
  const optimizerOnly=stableIds(record.comparison.optimizerOnly);
  if(!key||!date||!createdAt||!overlap||!legacyOnly||!optimizerOnly)return null;
  if(!disjoint(overlap,legacyOnly,optimizerOnly))return null;
  const legacyCount=overlap.length+legacyOnly.length;
  const optimizerCount=overlap.length+optimizerOnly.length;
  const unionSize=overlap.length+legacyOnly.length+optimizerOnly.length;
  const jaccard=unionSize?round4(overlap.length/unionSize):1;
  return {
    key,
    date,
    createdAt,
    comparison:{
      overlap,
      legacyOnly,
      optimizerOnly,
      jaccard,
      sameSet:legacyOnly.length===0&&optimizerOnly.length===0,
      legacyCount,
      optimizerCount
    }
  };
}

function deterministicRecords(records){
  const input=Array.isArray(records)?records:[];
  const valid=input.map(normalizeRecord).filter(Boolean);
  valid.sort((a,b)=>a.key.localeCompare(b.key)||a.createdAt.localeCompare(b.createdAt)||
    JSON.stringify(canonicalize(a)).localeCompare(JSON.stringify(canonicalize(b))));
  const byKey=new Map();
  for(const record of valid)byKey.set(record.key,record);
  return {
    records:[...byKey.values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.key.localeCompare(b.key)),
    malformedRecordCount:input.length-valid.length,
    duplicateRecordCount:valid.length-byKey.size
  };
}

function mean(values){
  return values.length?round4(values.reduce((sum,value)=>sum+value,0)/values.length):0;
}

function median(values){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const middle=Math.floor(sorted.length/2);
  return round4(sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2);
}

function frequencyRows(records,field){
  const counts=new Map();
  for(const record of records){
    for(const id of record.comparison[field])counts.set(id,(counts.get(id)||0)+1);
  }
  return [...counts.entries()].map(([id,count])=>({id,count}))
    .sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
}

function recentSummaries(records){
  return [...records]
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.key.localeCompare(b.key))
    .slice(0,RECENT_COMPARISON_LIMIT)
    .map(record=>({
      recordId:sha256Hex(record.key).slice(0,16),
      date:record.date,
      createdAt:record.createdAt,
      sameSet:record.comparison.sameSet,
      jaccard:record.comparison.jaccard,
      legacyCount:record.comparison.legacyCount,
      optimizerCount:record.comparison.optimizerCount,
      overlapCount:record.comparison.overlap.length,
      legacyOnlyCount:record.comparison.legacyOnly.length,
      optimizerOnlyCount:record.comparison.optimizerOnly.length
    }));
}

function failureModes(sampleCount,lowAgreementCount,malformedRecordCount,duplicateRecordCount){
  const modes=['ACTIVATION_BLOCKED_BY_POLICY','REPORT_HAS_NO_SELECTION_AUTHORITY'];
  if(sampleCount===0)modes.push('NO_VALID_SAMPLES');
  if(sampleCount<7)modes.push('INSUFFICIENT_REAL_WORLD_EVIDENCE');
  if(lowAgreementCount>0)modes.push('LOW_AGREEMENT_OBSERVED');
  if(malformedRecordCount>0)modes.push('MALFORMED_RECORDS_EXCLUDED');
  if(duplicateRecordCount>0)modes.push('DUPLICATE_RECORDS_COLLAPSED');
  return modes;
}

export function buildShadowReport(inputRecords=[]){
  const {records,malformedRecordCount,duplicateRecordCount}=deterministicRecords(inputRecords);
  const jaccards=records.map(record=>record.comparison.jaccard);
  const sameSetCount=records.filter(record=>record.comparison.sameSet).length;
  const lowAgreementCount=records.filter(record=>record.comparison.jaccard<LOW_AGREEMENT_THRESHOLD).length;
  const distinctDates=[...new Set(records.map(record=>record.date))].sort();
  const report={
    reportVersion:SHADOW_REPORT_VERSION,
    activationStatus:SHADOW_ACTIVATION_STATUS,
    authority:'diagnostic_only',
    sampleCount:records.length,
    distinctDateCount:distinctDates.length,
    distinctDates,
    firstRecordTimestamp:records[0]?.createdAt??null,
    latestRecordTimestamp:records.at(-1)?.createdAt??null,
    sameSetCount,
    sameSetRate:records.length?round4(sameSetCount/records.length):0,
    meanJaccard:mean(jaccards),
    medianJaccard:median(jaccards),
    lowAgreementThreshold:LOW_AGREEMENT_THRESHOLD,
    lowAgreementCount,
    legacyOnlySupplementFrequency:frequencyRows(records,'legacyOnly'),
    optimizerOnlySupplementFrequency:frequencyRows(records,'optimizerOnly'),
    overlapSupplementFrequency:frequencyRows(records,'overlap'),
    meanLegacyItemCount:mean(records.map(record=>record.comparison.legacyCount)),
    meanOptimizerItemCount:mean(records.map(record=>record.comparison.optimizerCount)),
    recentComparisonSummaries:recentSummaries(records),
    malformedRecordCount,
    duplicateRecordCount,
    failureModes:failureModes(records.length,lowAgreementCount,malformedRecordCount,duplicateRecordCount)
  };
  const deterministicDigest=sha256Hex(JSON.stringify(canonicalize(report)));
  return Object.freeze({...report,deterministicDigest});
}
