#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  buildShadowReport,
  SHADOW_ACTIVATION_STATUS,
  SHADOW_REPORT_VERSION,
  LOW_AGREEMENT_THRESHOLD
} from '../../../../ACED-Lifestyle/shared/optimizer/shadow-report.mjs';

const checks=[];
function check(name,fn){fn();checks.push(name);}
function row({key,date='2026-06-16',createdAt='2026-06-16T08:00:00.000Z',overlap=[],legacyOnly=[],optimizerOnly=[],extra={}}){
  return {
    key,date,createdAt,
    comparison:{overlap,legacyOnly,optimizerOnly,jaccard:0.9999,sameSet:false,legacyCount:999,optimizerCount:999},
    ...extra
  };
}

check('empty ledger behavior',()=>{
  const report=buildShadowReport([]);
  assert.equal(report.reportVersion,SHADOW_REPORT_VERSION);
  assert.equal(report.sampleCount,0);
  assert.equal(report.distinctDateCount,0);
  assert.deepEqual(report.distinctDates,[]);
  assert.equal(report.firstRecordTimestamp,null);
  assert.equal(report.latestRecordTimestamp,null);
  assert.equal(report.sameSetRate,0);
  assert.equal(report.meanJaccard,0);
  assert.equal(report.medianJaccard,0);
  assert.ok(report.failureModes.includes('NO_VALID_SAMPLES'));
});

check('one-record behavior',()=>{
  const report=buildShadowReport([row({key:'one',overlap:['nr','tmg']})]);
  assert.equal(report.sampleCount,1);
  assert.equal(report.sameSetCount,1);
  assert.equal(report.sameSetRate,1);
  assert.equal(report.meanJaccard,1);
  assert.equal(report.medianJaccard,1);
  assert.equal(report.meanLegacyItemCount,2);
  assert.equal(report.meanOptimizerItemCount,2);
});

const records=[
  row({key:'a',date:'2026-06-14',createdAt:'2026-06-14T08:00:00Z',overlap:['nr','tmg']}),
  row({key:'b',date:'2026-06-15',createdAt:'2026-06-15T08:00:00Z',overlap:['tmg'],legacyOnly:['milk_thistle'],optimizerOnly:['nac']}),
  row({key:'c',date:'2026-06-16',createdAt:'2026-06-16T08:00:00Z',legacyOnly:['zinc','milk_thistle'],optimizerOnly:['cordyceps']})
];
const aggregate=buildShadowReport(records);

check('multiple-record aggregation',()=>{
  assert.equal(aggregate.sampleCount,3);
  assert.equal(aggregate.sameSetCount,1);
  assert.equal(aggregate.sameSetRate,0.3333);
  assert.equal(aggregate.meanJaccard,0.4444);
  assert.equal(aggregate.medianJaccard,0.3333);
  assert.equal(aggregate.lowAgreementThreshold,LOW_AGREEMENT_THRESHOLD);
  assert.equal(aggregate.lowAgreementCount,2);
  assert.equal(aggregate.meanLegacyItemCount,2);
  assert.equal(aggregate.meanOptimizerItemCount,1.6667);
});

check('distinct-date counting',()=>{
  assert.equal(aggregate.distinctDateCount,3);
  assert.deepEqual(aggregate.distinctDates,['2026-06-14','2026-06-15','2026-06-16']);
  assert.equal(aggregate.firstRecordTimestamp,'2026-06-14T08:00:00.000Z');
  assert.equal(aggregate.latestRecordTimestamp,'2026-06-16T08:00:00.000Z');
});

check('top optimizer-only and legacy-only counts',()=>{
  assert.deepEqual(aggregate.legacyOnlySupplementFrequency,[
    {id:'milk_thistle',count:2},{id:'zinc',count:1}
  ]);
  assert.deepEqual(aggregate.optimizerOnlySupplementFrequency,[
    {id:'cordyceps',count:1},{id:'nac',count:1}
  ]);
  assert.deepEqual(aggregate.overlapSupplementFrequency,[
    {id:'tmg',count:2},{id:'nr',count:1}
  ]);
});

check('recent summaries deterministic',()=>{
  assert.deepEqual(aggregate.recentComparisonSummaries.map(item=>item.date),['2026-06-16','2026-06-15','2026-06-14']);
  assert.equal(aggregate.recentComparisonSummaries[0].legacyOnlyCount,2);
  assert.equal(aggregate.recentComparisonSummaries[0].optimizerOnlyCount,1);
});

check('duplicate record handling',()=>{
  const early=row({key:'dup',createdAt:'2026-06-16T07:00:00Z',overlap:['nr']});
  const late=row({key:'dup',createdAt:'2026-06-16T09:00:00Z',legacyOnly:['nr'],optimizerOnly:['nmn']});
  const report=buildShadowReport([late,early]);
  assert.equal(report.sampleCount,1);
  assert.equal(report.duplicateRecordCount,1);
  assert.equal(report.latestRecordTimestamp,'2026-06-16T09:00:00.000Z');
  assert.equal(report.meanJaccard,0);
  assert.ok(report.failureModes.includes('DUPLICATE_RECORDS_COLLAPSED'));
});

check('malformed record exclusion',()=>{
  const report=buildShadowReport([
    row({key:'valid'}),
    null,
    {key:'bad-date',date:'2026-99-99',createdAt:'x',comparison:{}},
    row({key:'overlap-conflict',overlap:['nr'],legacyOnly:['nr']})
  ]);
  assert.equal(report.sampleCount,1);
  assert.equal(report.malformedRecordCount,3);
  assert.ok(report.failureModes.includes('MALFORMED_RECORDS_EXCLUDED'));
});

check('deterministic sorting and digest',()=>{
  const forward=buildShadowReport(records);
  const reverse=buildShadowReport([...records].reverse());
  assert.deepEqual(forward,reverse);
  assert.match(forward.deterministicDigest,/^[a-f0-9]{64}$/);
});

check('activation remains blocked by policy',()=>{
  for(const report of [buildShadowReport([]),aggregate,buildShadowReport(Array.from({length:50},(_,index)=>row({key:`x${index}`,date:`2026-06-${String((index%20)+1).padStart(2,'0')}`})))]){
    assert.equal(report.activationStatus,SHADOW_ACTIVATION_STATUS);
    assert.equal(report.activationStatus,'BLOCKED_BY_POLICY');
    assert.equal(report.authority,'diagnostic_only');
    assert.ok(report.failureModes.includes('ACTIVATION_BLOCKED_BY_POLICY'));
    assert.ok(report.failureModes.includes('REPORT_HAS_NO_SELECTION_AUTHORITY'));
  }
});

check('private fields do not leak into report',()=>{
  const secret='DO_NOT_LEAK_PRIVATE_SENTINEL';
  const report=buildShadowReport([row({
    key:'privacy',
    overlap:['nr'],
    extra:{notes:secret,fullState:{secret},patchHistory:[secret],aiPayload:{secret},privateFields:{secret},selected:[{secret}]}
  })]);
  const encoded=JSON.stringify(report);
  for(const forbidden of [secret,'notes','fullState','patchHistory','aiPayload','privateFields','selected','held','excluded','inputHash','optimizerHash']){
    assert.equal(encoded.includes(forbidden),false,`report leaked ${forbidden}`);
  }
});

console.log(JSON.stringify({ok:true,checks:checks.length,names:checks},null,2));
