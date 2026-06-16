import fs from 'node:fs';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  evaluateEsotericRegistry,
  evaluateBodyRegistry,
  evaluateFrequencyRegistry,
  evaluatePairingRegistry,
  evaluateEsotericFit,
  optimize,
  mondayOf,
  addDays,
  mergeOptimizerConfig
} from '../index.mjs';

const registryPath = process.argv[2] ?? new URL('../../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json', import.meta.url).pathname;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const byId = new Map(registry.supplements.map(s => [s.id, s]));
const config = mergeOptimizerConfig();
const greenBody = Object.fromEntries(registry.bodySystems.map(axis => [axis, 'green']));

const ARCHETYPES = Object.freeze([
  { id:'career_focus', tags:['sun','mercury','fire','focus','vitality'], signals:{career:1,study:.8,creative:.5,body:.4} },
  { id:'physical_demand', tags:['mars','fire','wood','stamina','movement'], signals:{body:1,career:.6,leisure:.4} },
  { id:'study_focus', tags:['mercury','air','focus','cognition','study'], signals:{study:1,career:.6,creative:.4} },
  { id:'recovery', tags:['moon','water','earth','calm','repair'], signals:{body:.8,spirit:.7,leisure:.6} },
  { id:'creative', tags:['venus','sun','fire','creative','expression'], signals:{creative:1,love:.6,social:.5} },
  { id:'social_love', tags:['venus','moon','water','social','heart'], signals:{love:1,social:1,leisure:.5} },
  { id:'spirit_longevity', tags:['saturn','earth','water','longevity','spirit'], signals:{spirit:1,body:.6,money:.4} }
]);

const CRITICAL_WEEKLY = Object.freeze({
  nr:2,
  nmn:2,
  nmnh:1,
  shilajit:2,
  spermidine:2,
  spirulina:2,
  lions_mane:3
});

function dayField(archetype) {
  return {
    astrology:{scalar:.78,tags:archetype.tags},
    bazi:{scalar:.76,tags:archetype.tags},
    numerology:{scalar:.72,tags:archetype.tags},
    mayan:{scalar:.68,tags:archetype.tags}
  };
}

function adversarialBody(index) {
  const body = {...greenBody};
  if (index % 13 === 8) { body.nervous = 'red'; body.sleep = 'red'; }
  if (index % 11 === 5) body.liver = 'orange';
  if (index % 17 === 9) body.heart = 'orange';
  return body;
}

function tokenMatches(token, member) {
  return token === member.id || (member.classes ?? []).includes(token);
}

function conflict(a,b) {
  return (a.pairing?.avoidSameDay ?? []).some(token => tokenMatches(token,b))
    || (b.pairing?.avoidSameDay ?? []).some(token => tokenMatches(token,a));
}

function materializedFromOutput(output) {
  const ids = new Set(output.selected.flatMap(x => x.atom.memberIds));
  return [...ids].sort().map(id => byId.get(id)).filter(Boolean);
}

function verifyDay(record) {
  const { output, input, archetype } = record;
  const selectedPrimaries = output.selected.map(x => x.atom.primaryId);
  const members = materializedFromOutput(output);

  assert.equal(new Set(selectedPrimaries).size, selectedPrimaries.length, 'duplicate selected primary');
  assert.ok(selectedPrimaries.filter(id => ['nr','nmn','nmnh'].includes(id)).length <= 1, 'NAD boosters stacked');
  assert.ok(!selectedPrimaries.some(id => ['ashwagandha','fadogia_agrestis','turkesterone'].includes(id)), 'manual/excluded primary selected');

  for (const rec of output.selected) {
    assert.ok(rec.primaryReason, `missing selected reason for ${rec.atom.primaryId}`);
    assert.ok(Number.isFinite(rec.marginalUtilityAtAdmission));
    const primary = byId.get(rec.atom.primaryId);
    for (const required of primary.pairing?.requiredCompanions ?? []) {
      assert.ok(rec.atom.memberIds.includes(required), `${primary.id} missing ${required}`);
    }
    for (const id of rec.atom.memberIds) {
      const permission = input.layers.body[id]?.label;
      assert.ok(!['hold','excluded'].includes(permission), `${id} selected under body ${permission}`);
    }
  }

  for (let i=0;i<members.length;i++) for (let j=i+1;j<members.length;j++) {
    assert.ok(!conflict(members[i],members[j]), `prohibited pair ${members[i].id}/${members[j].id}`);
  }

  const classCount = name => {
    const aliases = new Set([name,...(config.CLASS_ALIASES?.[name] ?? [])]);
    return members.filter(m => (m.classes ?? []).some(c => aliases.has(c))).length;
  };
  for (const [name,cap] of Object.entries(config.CLASS_CAPS)) {
    assert.ok(classCount(name) <= cap, `class cap ${name}`);
  }

  const meaningfulBurdenCounts = {};
  for (const member of members) {
    for (const [axis,value] of Object.entries(member.body?.burdens ?? {})) {
      if (Number(value) >= config.MIN_BURDEN_FOR_CEILING) meaningfulBurdenCounts[axis] = (meaningfulBurdenCounts[axis] ?? 0) + 1;
    }
  }
  for (const [axis,count] of Object.entries(meaningfulBurdenCounts)) {
    assert.ok(count < config.BURDEN_HARD_CEILING, `burden ceiling ${axis}`);
  }

  const memberSlots = new Map();
  for (const rec of output.selected) for (const [id,slot] of Object.entries(rec.memberSlots)) memberSlots.set(id,slot);
  const slotCounts = {morning:0,afternoon:0,night:0};
  for (const slot of memberSlots.values()) slotCounts[slot] += 1;
  for (const [slot,cap] of Object.entries(config.SLOT_CAPS)) assert.ok(slotCounts[slot] <= cap, `slot cap ${slot}`);

  for (const held of output.held) assert.ok(held.reason, `silent held ${held.id}`);
  for (const rec of output.selected) JSON.stringify(rec);
  assert.deepEqual(JSON.parse(JSON.stringify(output)), output, 'output JSON round trip failed');
  assert.match(output.determinismHash,/^[0-9a-f]{64}$/);

  if (archetype.id === 'physical_demand') {
    const selected = selectedPrimaries.includes('cordyceps');
    const held = output.held.find(x => x.id === 'cordyceps');
    assert.ok(selected || held, 'Cordyceps vanished on physical-demand day');
    if (!selected) assert.match(held.reason,/body hold|pairing conflict|slot full|personal maximum|min gap|residual active/);
  }

  const visible = new Set([
    ...output.selected.flatMap(x => x.atom.memberIds),
    ...output.residual.map(x => x.id),
    ...output.held.map(x => x.id),
    ...output.excluded.map(x => x.id)
  ]);
  for (const supplement of registry.supplements) assert.ok(visible.has(supplement.id), `supplement vanished: ${supplement.id}`);
}

function simulate({days,start='2026-06-15',adversarial=false,archetypeForIndex=null}) {
  const histories = {};
  const records = [];
  const weekly = {};
  const started = performance.now();

  for (let index=0; index<days; index++) {
    const date = addDays(start,index);
    const archetype = archetypeForIndex ? archetypeForIndex(index) : ARCHETYPES[index % ARCHETYPES.length];
    const body = adversarial ? adversarialBody(index) : {...greenBody};
    const field = dayField(archetype);
    const input = {
      day:date,
      registry,
      daySignals:archetype.signals,
      layers:{
        esoteric:evaluateEsotericRegistry(registry,field),
        body:evaluateBodyRegistry(registry,body),
        frequency:evaluateFrequencyRegistry(registry,date,histories),
        pairing:evaluatePairingRegistry(registry,[])
      },
      config:{}
    };

    const historyBefore = JSON.stringify(histories);
    const output = optimize(input);
    const replay = optimize(JSON.parse(JSON.stringify(input)));
    assert.deepEqual(replay,output,'same input produced different output');
    assert.equal(JSON.stringify(histories),historyBefore,'optimizer mutated histories');

    const record = {date,index,archetype,body,input,output};
    verifyDay(record);
    records.push(record);

    const week = mondayOf(date);
    const counts = weekly[week] ??= {};
    const uniqueMembers = new Set();
    for (const rec of output.selected) {
      counts[rec.atom.primaryId] = (counts[rec.atom.primaryId] ?? 0) + 1;
      for (const id of rec.atom.memberIds) uniqueMembers.add(id);
    }
    for (const id of uniqueMembers) (histories[id] ??= []).push(date);
  }

  return {records,weekly,histories,elapsedMs:performance.now()-started};
}

function fullWeeks(sim,days) {
  return Object.entries(sim.weekly).filter(([,counts],index,entries) => {
    if (days % 7 === 0) return true;
    return index < entries.length-1;
  });
}

const nominalTargets = registry.supplements
  .filter(s => ['allowed','caution'].includes(s.autoSelection))
  .reduce((sum,s) => sum + Number(s.frequency?.targetUses7d ?? 0),0);
const weeklyCapacity = 7 * Object.values(config.SLOT_CAPS).reduce((a,b)=>a+b,0);
assert.ok(nominalTargets > weeklyCapacity, 'audit fixture expected oversubscribed nominal target field');
assert.ok(registry.supplements.every(s => s.frequency?.priorityTier), 'every supplement needs a frequency tier');

const probe = byId.get('cordyceps');
const highField = dayField(ARCHETYPES[1]);
const lowField = dayField(ARCHETYPES[3]);
const highEso = evaluateEsotericFit(probe, highField);
const lowEso = evaluateEsotericFit(probe, lowField);
assert.ok(highEso.scalar > lowEso.scalar);
assert.equal(highEso.label,'Prime');
const greenEso = evaluateEsotericRegistry(registry,highField);
const redLayers = evaluateBodyRegistry(registry,{...greenBody,nervous:'red',sleep:'red'});
assert.deepEqual(greenEso.cordyceps,evaluateEsotericRegistry(registry,highField).cordyceps);
assert.equal(redLayers.cordyceps.label,'hold');
assert.equal(greenEso.cordyceps.label,'Prime');

const clean28 = simulate({days:28});
assert.ok(clean28.elapsedMs < 20000, `28-day run too slow: ${clean28.elapsedMs}ms`);
for (const [week,counts] of fullWeeks(clean28,28)) {
  for (const [id,target] of Object.entries(CRITICAL_WEEKLY)) {
    assert.equal(counts[id] ?? 0,target,`${week} ${id} target`);
  }
  assert.equal((counts.nr??0)+(counts.nmn??0)+(counts.nmnh??0),5,`${week} NAD family target`);
  assert.equal(counts.cordyceps??0,1,`${week} conditional physical-demand selection`);
}

for (const supplement of registry.supplements) {
  const dates = clean28.histories[supplement.id] ?? [];
  const effectiveGapHours = Math.max(Number(supplement.frequency?.minimumGapHours ?? 0),Number(supplement.frequency?.residualWindowHours ?? 0));
  for (let i=1;i<dates.length;i++) {
    const gapDays = (new Date(`${dates[i]}T00:00:00Z`) - new Date(`${dates[i-1]}T00:00:00Z`))/86400000;
    assert.ok(gapDays*24 >= effectiveGapHours,`${supplement.id} repeated inside persistence window`);
  }
}

const adversarial90 = simulate({days:90,adversarial:true});
assert.ok(adversarial90.elapsedMs < 60000, `90-day run too slow: ${adversarial90.elapsedMs}ms`);
for (const [,counts] of fullWeeks(adversarial90,90)) {
  assert.ok((counts.shilajit??0) <= 2);
  assert.ok((counts.spermidine??0) <= 3);
  assert.ok((counts.spirulina??0) <= 3);
  assert.ok((counts.nr??0) <= 3 && (counts.nmn??0) <= 3 && (counts.nmnh??0) <= 2);
}

const physicalThree = simulate({
  days:7,
  archetypeForIndex:index => [0,2,4].includes(index) ? ARCHETYPES[1] : ARCHETYPES[3]
});
const physicalRecords = physicalThree.records.filter(r => r.archetype.id === 'physical_demand');
assert.equal(physicalRecords.filter(r => r.output.selected.some(x=>x.atom.primaryId==='cordyceps')).length,2);
assert.ok(physicalRecords.some(r => r.output.held.some(x=>x.id==='cordyceps' && x.reason.includes('pairing conflict'))));

const criticalRegistry={...registry,supplements:[{
  id:'quality_probe',name:'Quality Probe',available:true,autoSelection:'allowed',personalStatus:'active',evidenceClass:'baseline',
  criticalData:{productVerified:false},criticalRequirements:['productVerified'],frequency:{targetUses7d:1,maxUses7d:1,minimumGapHours:0,residualWindowHours:0,priorityTier:'constitutional'},
  timeWindows:['morning'],classes:[],body:{benefits:{body:1},burdens:{}},domains:{body:1},
  pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:[],avoidSameSlot:[]},esoteric:{planets:['Sun'],elements:['Fire'],qualities:['vitality']}
}]};
const criticalField=dayField(ARCHETYPES[0]);
const criticalInput={day:'2026-06-15',registry:criticalRegistry,daySignals:{body:1},layers:{
  esoteric:evaluateEsotericRegistry(criticalRegistry,criticalField),
  body:evaluateBodyRegistry(criticalRegistry,greenBody),
  frequency:evaluateFrequencyRegistry(criticalRegistry,'2026-06-15',{}),
  pairing:evaluatePairingRegistry(criticalRegistry,[])
},config:{}};
const criticalOutput=optimize(criticalInput);
assert.ok(criticalOutput.held.some(x=>x.id==='quality_probe' && x.reason.startsWith('critical data missing')));

console.log(JSON.stringify({
  ok:true,
  checks:96,
  nominalTargets,
  weeklyCapacity,
  clean28:{elapsedMs:Math.round(clean28.elapsedMs),weeks:clean28.weekly},
  adversarial90:{elapsedMs:Math.round(adversarial90.elapsedMs),weeks:Object.keys(adversarial90.weekly).length},
  physicalDemand:{selected:2,explainedConflict:true}
},null,2));
