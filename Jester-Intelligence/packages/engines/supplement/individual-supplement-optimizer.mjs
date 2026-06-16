import { canonicalize, clamp, quantize, stableUnique } from './contracts.mjs';
import { buildAtoms, materializeMembers } from './atom-builder.mjs';
import { planSlots } from './slot-planner.mjs';
import { mergeOptimizerConfig } from './optimizer-config.mjs';
import { sha256Hex } from './sha256.mjs';

const HOLD_PRIORITY = [
  'critical data missing','body hold','personal maximum reached','min gap not reached','residual active',
  'mandatory companion unavailable','pairing conflict','slot full','class full',
  'burden ceiling','rotation sibling due','target at risk','below marginal threshold','trimmed for smallest set','low esoteric fit'
];

function stableAtomList(atoms) {
  return [...atoms].sort((a,b)=>a.sortKey.localeCompare(b.sortKey));
}

function classCount(members, className, config) {
  const aliases = new Set([className, ...(config.CLASS_ALIASES?.[className] ?? [])]);
  return members.filter(m => (m.classes ?? []).some(c => aliases.has(c))).length;
}

function relationMatches(token, member) {
  return token === member.id || (member.classes ?? []).includes(token);
}

function sameDayConflict(a, b) {
  return (a.pairing?.avoidSameDay ?? []).some(token => relationMatches(token, b))
    || (b.pairing?.avoidSameDay ?? []).some(token => relationMatches(token, a));
}

function bodyContributions(members, key, minimum) {
  const systems = new Map();
  for (const member of members) {
    for (const [system, raw] of Object.entries(member.body?.[key] ?? {})) {
      const value = Number(raw ?? 0);
      if (value < minimum) continue;
      if (!systems.has(system)) systems.set(system, []);
      systems.get(system).push({ memberId: member.id, value });
    }
  }
  for (const values of systems.values()) values.sort((a,b)=>b.value-a.value || a.memberId.localeCompare(b.memberId));
  return systems;
}

function benefitQuality(members, config) {
  const systems = bodyContributions(members, 'benefits', config.MIN_MEANINGFUL_BENEFIT);
  let total = 0;
  for (const values of systems.values()) {
    values.forEach((item,index) => {
      const factor = config.DIMINISHING_RETURNS[Math.min(index, config.DIMINISHING_RETURNS.length-1)] ?? 0;
      total += item.value * factor;
    });
  }
  return clamp(total / Number(config.BENEFIT_NORMALIZER));
}

function burdenPenalty(members, config) {
  const systems = bodyContributions(members, 'burdens', config.MIN_MEANINGFUL_BURDEN);
  let total = 0;
  for (const values of systems.values()) {
    values.forEach((item,index) => {
      const factor = config.BURDEN_ESCALATION[Math.min(index, config.BURDEN_ESCALATION.length-1)]
        ?? config.BURDEN_ESCALATION.at(-1) ?? 1;
      total += item.value * factor;
    });
  }
  return total / Number(config.BURDEN_NORMALIZER);
}

function staticValue(atom, config) {
  const w = config.WEIGHTS;
  return Number(w.W_ESO)*atom.esoteric.scalar
    + Number(w.W_OP)*atom.operational
    + Number(w.W_FREQ)*Number(atom.frequency.urgency ?? 0)
    + Number(w.W_CONF)*atom.confidence;
}

export function stackQuality(atoms, configInput = {}) {
  const config = mergeOptimizerConfig(configInput);
  const materialized = materializeMembers(atoms);
  const staticTotal = atoms.reduce((sum,atom)=>sum+staticValue(atom,config),0);
  const balance = Number(config.WEIGHTS.W_BAL) * benefitQuality(materialized.members,config);
  const burden = burdenPenalty(materialized.members,config);
  const complexity = (atoms.length * (atoms.length + 1) / 2) * Number(config.COMPLEXITY_PENALTY_PER_ATOM ?? 0);
  return quantize(staticTotal + balance - burden - complexity, config.QUANTIZE);
}

function criticalGate(atom) {
  return atom.criticalMissing.length ? `critical data missing (${atom.criticalMissing.join(', ')})` : null;
}

function bodyGate(atom, layers) {
  for (const member of atom.members) {
    const label = layers?.body?.[member.id]?.label ?? (member.id === atom.primaryId ? atom.body?.label : null);
    if (label === 'excluded' || label === 'hold') return `body hold (${member.id})`;
  }
  return null;
}

function frequencyGate(atom, layers) {
  for (const member of atom.members) {
    const f = layers?.frequency?.[member.id];
    if (!f) continue;
    if (f.state === 'excluded' || f.state === 'manual_only') return `body hold (${member.id})`;
    if (Number(f.usesThisWindow ?? 0) >= Number(f.maxUses7d ?? Infinity)) return `personal maximum reached (${member.id})`;
    if (f.minGapMet === false || f.state === 'cooling_down') return `min gap not reached (${member.id})`;
    if (f.state === 'residual') return `residual active (${member.id})`;
  }
  return null;
}

function rotationFairnessGate(atom, input) {
  if (!(atom.classes ?? []).includes('nad_booster')) return null;
  if (atom.frequency?.state !== 'complete') return null;

  const dueSiblings = [...(input.registry?.supplements ?? [])]
    .filter(s => s.id !== atom.primaryId && (s.classes ?? []).includes('nad_booster'))
    .filter(s => {
      const f = input.layers?.frequency?.[s.id];
      const b = input.layers?.body?.[s.id];
      if (!f || ['excluded', 'manual_only', 'cooling_down'].includes(f.state)) return false;
      if (f.minGapMet === false) return false;
      if (['hold', 'excluded'].includes(b?.label)) return false;
      return Number(f.usesThisWindow ?? 0) < Number(f.targetUses7d ?? 0);
    })
    .map(s => s.id)
    .sort();

  return dueSiblings.length ? `rotation sibling due (${dueSiblings.join(', ')})` : null;
}

function pairingGate(atom, materializedMembers) {
  const memberIds = new Set(atom.memberIds);
  for (const required of atom.requiredCompanionIds) if (!memberIds.has(required)) return `mandatory companion unavailable (${required})`;
  const all = [...materializedMembers, ...atom.members].sort((a,b)=>a.id.localeCompare(b.id));
  for (let i=0;i<all.length;i++) for (let j=i+1;j<all.length;j++) {
    if (sameDayConflict(all[i],all[j])) return `pairing conflict (${all[i].id}, ${all[j].id})`;
  }
  return null;
}

function classGate(members, config) {
  for (const [name,cap] of Object.entries(config.CLASS_CAPS).sort(([a],[b])=>a.localeCompare(b))) {
    if (classCount(members,name,config) > Number(cap)) return `class full (${name})`;
  }
  return null;
}

function burdenGate(members, config) {
  const systems = bodyContributions(members,'burdens',config.MIN_BURDEN_FOR_CEILING);
  for (const [system,values] of [...systems.entries()].sort(([a],[b])=>a.localeCompare(b))) {
    if (values.length >= Number(config.BURDEN_HARD_CEILING)) return `burden ceiling (${system})`;
  }
  return null;
}

export function admissible(atom, stack, input, configInput = {}) {
  const config = mergeOptimizerConfig(configInput);
  const existing = materializeMembers(stack);
  const candidate = materializeMembers([...stack, atom]);
  const gates = [
    criticalGate(atom),
    bodyGate(atom,input.layers),
    frequencyGate(atom,input.layers),
    rotationFairnessGate(atom,input),
    pairingGate(atom,existing.members),
    classGate(candidate.members,config),
    burdenGate(candidate.members,config)
  ].filter(Boolean);
  if (gates.length) return { ok:false, reason:gates[0], allReasons:gates };
  const slots = planSlots(candidate.members,config);
  if (!slots.ok) return { ok:false, reason:'slot full', allReasons:['slot full'] };
  return { ok:true, slotPlan:slots.slotPlan, slotCounts:slots.slotCounts, dependencyRefs:candidate.dependencyRefs };
}

function dominantReason(atom, stackBefore, config) {
  const w = config.WEIGHTS;
  const terms = [
    ['esoteric',Number(w.W_ESO)*atom.esoteric.scalar],
    ['operational',Number(w.W_OP)*atom.operational],
    ['frequency',Number(w.W_FREQ)*Number(atom.frequency.urgency ?? 0)],
    ['confidence',Number(w.W_CONF)*atom.confidence]
  ];
  const before = materializeMembers(stackBefore).members;
  const after = materializeMembers([...stackBefore,atom]).members;
  terms.push(['balance',Number(w.W_BAL)*(benefitQuality(after,config)-benefitQuality(before,config))]);
  terms.sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  return terms[0][0];
}

function bestAdmission(pool, stack, input, config) {
  const currentQ = stackQuality(stack,config);
  const candidates = [];
  for (const atom of stableAtomList(pool.filter(x=>!stack.some(y=>y.id===x.id)))) {
    const gate = admissible(atom,stack,input,config);
    if (!gate.ok) continue;
    const mu = quantize(stackQuality([...stack,atom],config)-currentQ,config.QUANTIZE);
    candidates.push({ atom, mu, gate });
  }
  candidates.sort((a,b)=>b.mu-a.mu || a.atom.sortKey.localeCompare(b.atom.sortKey));
  return candidates[0] ?? null;
}

function deadlineMetrics(atom, config) {
  const f = atom.frequency ?? {};
  const tier = f.priorityTier ?? atom.primary?.frequency?.priorityTier ?? 'maintenance';
  const tierRank = Number(config.FREQUENCY_PRIORITY_RANK?.[tier] ?? 0);
  const usesRemaining = Math.max(0, Number(f.targetUses7d ?? 0) - Number(f.usesThisWindow ?? 0));
  const opportunities = Number.isFinite(Number(f.eligibleOpportunitiesRemaining))
    ? Number(f.eligibleOpportunitiesRemaining)
    : Number(f.daysLeftInWindow ?? 99);
  const slack = opportunities - usesRemaining;
  return { tier, tierRank, usesRemaining, opportunities, slack };
}

function conditionalNeedTriggered(atom, config) {
  const tier = atom.frequency?.priorityTier ?? atom.primary?.frequency?.priorityTier ?? 'maintenance';
  if (tier !== 'conditional') return false;
  if (Number(atom.frequency?.usesThisWindow ?? 0) >= Number(atom.frequency?.maxUses7d ?? Infinity)) return false;
  return atom.operational >= Number(config.CONDITIONAL_NEED_MIN_OPERATIONAL ?? 0.75)
    && atom.esoteric.scalar >= Number(config.CONDITIONAL_NEED_MIN_ESOTERIC ?? 0.64);
}

function reservationProtected(atom, input, config) {
  return deadlineProtected(atom) || conditionalNeedTriggered(atom, config);
}

function reserveDeadlines(pool, input, config) {
  const stack = [];
  const admissions = new Map();
  const candidates = stableAtomList(pool)
    .map(atom => {
      const metrics = deadlineMetrics(atom, config);
      const deadline = metrics.tierRank >= Number(config.DEADLINE_RESERVATION_MIN_RANK ?? 2)
        && metrics.usesRemaining > 0
        && metrics.slack <= 0;
      const conditional = conditionalNeedTriggered(atom, config);
      return { atom, metrics, deadline, conditional };
    })
    .filter(x => x.deadline || x.conditional)
    .sort((a,b) =>
      Number(b.deadline) - Number(a.deadline)
      || b.metrics.tierRank - a.metrics.tierRank
      || a.metrics.slack - b.metrics.slack
      || Number(b.atom.frequency?.urgency ?? 0) - Number(a.atom.frequency?.urgency ?? 0)
      || a.atom.sortKey.localeCompare(b.atom.sortKey)
    );

  for (const { atom, conditional } of candidates) {
    const gate = admissible(atom, stack, input, config);
    if (!gate.ok) continue;
    const mu = quantize(stackQuality([...stack, atom], config) - stackQuality(stack, config), config.QUANTIZE);
    admissions.set(atom.id, { marginalUtilityAtAdmission: mu, primaryReason: conditional ? 'operational' : 'frequency' });
    stack.push(atom);
    stack.sort((a,b)=>a.sortKey.localeCompare(b.sortKey));
  }
  return { stack, admissions };
}

function greedyBuild(pool,input,config,initialStack=[],initialAdmissions=new Map()) {
  const stack=[...initialStack].sort((a,b)=>a.sortKey.localeCompare(b.sortKey));
  const admissions=new Map(initialAdmissions);
  while (true) {
    const best=bestAdmission(pool,stack,input,config);
    if (!best || best.mu < Number(config.MIN_MARGINAL_UTILITY)) break;
    const reason=dominantReason(best.atom,stack,config);
    admissions.set(best.atom.id,{ marginalUtilityAtAdmission:best.mu, primaryReason:reason });
    stack.push(best.atom);
    stack.sort((a,b)=>a.sortKey.localeCompare(b.sortKey));
  }
  return {stack,admissions};
}

function localRepair(stack,pool,input,config,admissions) {
  let current=[...stack];
  for (let round=0;round<Number(config.LOCAL_SWAP_ROUNDS);round++) {
    const currentQ=stackQuality(current,config);
    const swaps=[];
    for (const a of stableAtomList(current)) {
      if (reservationProtected(a,input,config)) continue;
      for (const b of stableAtomList(pool.filter(x=>!current.some(y=>y.id===x.id)))) {
        const candidate=current.filter(x=>x.id!==a.id).concat(b).sort((x,y)=>x.sortKey.localeCompare(y.sortKey));
        const gate=admissibleStack(candidate,input,config);
        if (!gate.ok) continue;
        const delta=quantize(stackQuality(candidate,config)-currentQ,config.QUANTIZE);
        if (delta>config.QUANTIZE) swaps.push({a,b,candidate,delta});
      }
    }
    swaps.sort((x,y)=>y.delta-x.delta || x.a.sortKey.localeCompare(y.a.sortKey) || x.b.sortKey.localeCompare(y.b.sortKey));
    if (!swaps.length) break;
    const best=swaps[0];
    current=best.candidate;
    admissions.delete(best.a.id);
    admissions.set(best.b.id,{marginalUtilityAtAdmission:best.delta,primaryReason:dominantReason(best.b,current.filter(x=>x.id!==best.b.id),config)});
  }
  return current;
}

function admissibleStack(stack,input,config) {
  const members=materializeMembers(stack).members;
  for (const atom of stack) {
    const gates=[criticalGate(atom),bodyGate(atom,input.layers),frequencyGate(atom,input.layers),rotationFairnessGate(atom,input)].filter(Boolean);
    if (gates.length) return {ok:false,reason:gates[0]};
  }
  for (let i=0;i<members.length;i++) for (let j=i+1;j<members.length;j++) {
    if (sameDayConflict(members[i],members[j])) return {ok:false,reason:`pairing conflict (${members[i].id}, ${members[j].id})`};
  }
  const classReason=classGate(members,config); if(classReason)return {ok:false,reason:classReason};
  const burdenReason=burdenGate(members,config); if(burdenReason)return {ok:false,reason:burdenReason};
  const slots=planSlots(members,config); if(!slots.ok)return {ok:false,reason:'slot full'};
  return {ok:true,...slots};
}

function deadlineProtected(atom) {
  const f=atom.frequency ?? {};
  const remaining=Math.max(0,Number(f.targetUses7d??0)-Number(f.usesThisWindow??0));
  const opportunities=Number.isFinite(Number(f.eligibleOpportunitiesRemaining))?Number(f.eligibleOpportunitiesRemaining):Number(f.daysLeftInWindow??99);
  const slack=opportunities-remaining;
  return f.state==='due' && remaining>0 && slack<=0;
}

function trimToSmallest(stack,input,config,admissions,trimmed) {
  let current=[...stack];
  while (true) {
    const q=stackQuality(current,config);
    const options=[];
    for (const atom of stableAtomList(current)) {
      if (reservationProtected(atom,input,config)) continue;
      const candidate=current.filter(x=>x.id!==atom.id);
      const gate=admissibleStack(candidate,input,config);
      if (!gate.ok) continue;
      const loss=quantize(q-stackQuality(candidate,config),config.QUANTIZE);
      if (loss < Number(config.QUALITY_MARGIN)) options.push({atom,candidate,loss});
    }
    options.sort((a,b)=>a.loss-b.loss || a.atom.sortKey.localeCompare(b.atom.sortKey));
    if (!options.length) break;
    const drop=options[0];
    current=drop.candidate;
    admissions.delete(drop.atom.id);
    trimmed.set(drop.atom.id,'trimmed for smallest set');
  }
  return current;
}

function reasonPriority(reason) {
  const text=String(reason??'');
  const index=HOLD_PRIORITY.findIndex(prefix=>text.startsWith(prefix));
  return index<0?HOLD_PRIORITY.length:index;
}

function finalOmissionReason(atom,stack,input,config,trimmed) {
  if (trimmed.has(atom.id)) return trimmed.get(atom.id);
  const f=atom.frequency ?? {};
  if ((f.state==='residual' || f.state==='complete') && !conditionalNeedTriggered(atom,config)) return null;
  const gate=admissible(atom,stack,input,config);
  if (!gate.ok) return [...(gate.allReasons??[gate.reason])].sort((a,b)=>reasonPriority(a)-reasonPriority(b)||a.localeCompare(b))[0];
  const mu=quantize(stackQuality([...stack,atom],config)-stackQuality(stack,config),config.QUANTIZE);
  if (mu<Number(config.MIN_MARGINAL_UTILITY)) return atom.esoteric.scalar<0.2?'low esoteric fit':'below marginal threshold';
  const remaining=Math.max(0,Number(f.targetUses7d??0)-Number(f.usesThisWindow??0));
  if (remaining>Number(f.daysLeftInWindow??99)) return 'target at risk';
  return 'below marginal threshold';
}

function selectedRecord(atom,stack,admission,slotPlan) {
  const benefits=Object.entries(atom.benefitVec).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([k])=>k);
  const burdens=Object.entries(atom.burdenVec).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([k])=>k);
  return {
    atom:{id:atom.id,primaryId:atom.primaryId,memberIds:[...atom.memberIds]},
    slot:slotPlan[atom.primaryId]??null,
    memberSlots:Object.fromEntries(atom.memberIds.map(id=>[id,slotPlan[id]??null]).sort(([a],[b])=>a.localeCompare(b))),
    marginalUtilityAtAdmission:admission?.marginalUtilityAtAdmission??0,
    primaryReason:admission?.primaryReason??'balance',
    benefitAreas:benefits,
    burdenAreas:burdens
  };
}

export function optimize(input) {
  const config=mergeOptimizerConfig(input?.config??{});
  const {atoms,excluded}=buildAtoms(input,config);
  const reserved=reserveDeadlines(atoms,input,config);
  const {stack:greedy,admissions}=greedyBuild(atoms,input,config,reserved.stack,reserved.admissions);
  const repaired=localRepair(greedy,atoms,input,config,admissions);
  const trimmed=new Map();
  const stack=trimToSmallest(repaired,input,config,admissions,trimmed).sort((a,b)=>a.sortKey.localeCompare(b.sortKey));
  const finalGate=admissibleStack(stack,input,config);
  if(!finalGate.ok)throw new Error(`optimizer produced inadmissible stack: ${finalGate.reason}`);
  const selectedMemberIds=new Set(materializeMembers(stack).members.map(m=>m.id));

  const selected=stack.map(atom=>selectedRecord(atom,stack,admissions.get(atom.id),finalGate.slotPlan)).sort((a,b)=>a.atom.id.localeCompare(b.atom.id));
  const residual=[];
  const held=[];
  for(const atom of atoms){
    if(stack.some(x=>x.id===atom.id)||selectedMemberIds.has(atom.primaryId))continue;
    const state=atom.frequency?.state;
    const conditionalDemand=conditionalNeedTriggered(atom,config);
    if((state==='residual'||state==='complete')&&!conditionalDemand)residual.push({id:atom.primaryId,reason:state});
    else held.push({id:atom.primaryId,reason:finalOmissionReason(atom,stack,input,config,trimmed)});
  }
  residual.sort((a,b)=>a.id.localeCompare(b.id));
  held.sort((a,b)=>a.id.localeCompare(b.id));
  excluded.sort((a,b)=>a.id.localeCompare(b.id));
  const payload=canonicalize({selected,residual,held,excluded});
  const determinismHash=sha256Hex(JSON.stringify(payload));
  return Object.freeze({...payload,determinismHash});
}
