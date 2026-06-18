import { clamp, stableUnique } from './contracts.mjs';
import { resolveRequiredGroup } from './pairing-compatibility-engine.mjs';

function byId(registry) {
  return new Map((registry?.supplements ?? []).map(s => [s.id, s]));
}

function sumVectors(members, key, bodyLayers = {}) {
  const out = {};
  const layerKey = key === 'benefits' ? 'benefitVec' : 'burdenVec';
  for (const member of members) {
    for (const [axis, value] of Object.entries(bodyLayers?.[member.id]?.[layerKey] ?? member.body?.[key] ?? {})) {
      out[axis] = (out[axis] ?? 0) + Number(value ?? 0);
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a],[b]) => a.localeCompare(b)));
}

function normalizedDomainScore(daySignals = {}, affinity = {}) {
  let weighted = 0;
  let total = 0;
  for (const domain of Object.keys(affinity).sort()) {
    const a = Math.max(0, Number(affinity[domain] ?? 0));
    weighted += a * clamp(daySignals?.[domain] ?? 0);
    total += a;
  }
  return total > 0 ? clamp(weighted / total) : 0;
}

function confidenceFor(supplement, config) {
  const status = Number(config.CONFIDENCE.personalStatus?.[supplement.personalStatus] ?? 0.45);
  const evidence = Number(config.CONFIDENCE.evidenceClass?.[supplement.evidenceClass] ?? 0.45);
  const data = supplement.criticalData ?? {};
  const unknown = config.CRITICAL_DATA_FIELDS.filter(field => data[field] === false).length;
  let confidence = (status + evidence) / 2 - unknown * Number(config.CONFIDENCE.unknownDataPenalty ?? 0);
  if ((supplement.classes ?? []).includes('quality_sensitive') && data.productVerified === false) {
    confidence -= Number(config.CONFIDENCE.qualitySensitivePenalty ?? 0);
  }
  return clamp(confidence);
}

function criticalMissing(supplement) {
  const required = supplement.criticalRequirements ?? supplement.criticalData?.requiredFields ?? [];
  return [...required].filter(field => supplement.criticalData?.[field] !== true).sort();
}

export function buildAtoms(input, config) {
  const registry = input?.registry ?? {};
  const index = byId(registry);
  const atoms = [];
  const excluded = [];

  for (const supplement of [...(registry.supplements ?? [])].sort((a,b)=>a.id.localeCompare(b.id))) {
    if (!supplement.available) {
      excluded.push({ id: supplement.id, reason: 'unavailable' });
      continue;
    }
    if (supplement.autoSelection === 'excluded') {
      excluded.push({ id: supplement.id, reason: 'personal exclusion' });
      continue;
    }
    if (supplement.autoSelection === 'manual_only') {
      excluded.push({ id: supplement.id, reason: 'manual only' });
      continue;
    }

    let memberIds;
    try {
      memberIds = resolveRequiredGroup(supplement.id, registry);
    } catch (error) {
      excluded.push({ id: supplement.id, reason: `invalid mandatory group: ${error.message}` });
      continue;
    }
    const rawMembers = memberIds.map(id => index.get(id)).filter(Boolean);
    if (rawMembers.length !== memberIds.length || rawMembers.some(m => !m.available || m.autoSelection === 'excluded')) {
      excluded.push({ id: supplement.id, reason: 'mandatory companion unavailable or excluded' });
      continue;
    }
    const members = rawMembers.map(member => {
      const layer = input.layers?.body?.[member.id] ?? {};
      return {
        ...member,
        body: {
          benefits: { ...(layer.benefitVec ?? member.body?.benefits ?? {}) },
          burdens: { ...(layer.burdenVec ?? member.body?.burdens ?? {}) }
        },
        bodyPermission: layer.label ?? 'conditional'
      };
    });

    const eso = input.layers?.esoteric?.[supplement.id] ?? { scalar: 0, label: 'Discordant', components:{} };
    const freq = input.layers?.frequency?.[supplement.id] ?? { urgency: 0, state: 'optional', minGapMet: true };
    const body = input.layers?.body?.[supplement.id] ?? { label: 'conditional' };
    const pairing = input.layers?.pairing?.[supplement.id] ?? { state: 'complete' };

    atoms.push(Object.freeze({
      id: `atom:${supplement.id}`,
      sortKey: `atom:${supplement.id}`,
      primaryId: supplement.id,
      primary: supplement,
      memberIds: [...memberIds].sort(),
      members: [...members].sort((a,b)=>a.id.localeCompare(b.id)),
      requiredCompanionIds: memberIds.filter(id => id !== supplement.id).sort(),
      classes: stableUnique(members.flatMap(m => m.classes ?? [])),
      benefitVec: sumVectors(members, 'benefits', input.layers?.body),
      burdenVec: sumVectors(members, 'burdens', input.layers?.body),
      esoteric: {
        scalar: clamp(eso.scalar ?? 0),
        label: eso.label ?? 'Discordant',
        convergenceLabel: eso.convergenceLabel ?? 'None',
        authorityOrder: [...(eso.authorityOrder ?? ['numerology','bazi','astrology','mayan'])],
        primaryScalar: clamp(eso.primaryScalar ?? eso.components?.numerology?.scalar ?? 0),
        secondaryScalar: clamp(eso.secondaryScalar ?? eso.components?.bazi?.scalar ?? 0),
        components: { ...(eso.components ?? {}) }
      },
      operational: normalizedDomainScore(input.daySignals, supplement.domains),
      frequency: { ...freq },
      body: { ...body },
      pairing: { ...pairing },
      confidence: confidenceFor(supplement, config),
      criticalMissing: criticalMissing(supplement),
      domainAffinity: { ...(supplement.domains ?? {}) }
    }));
  }
  return { atoms: atoms.sort((a,b)=>a.sortKey.localeCompare(b.sortKey)), excluded: excluded.sort((a,b)=>a.id.localeCompare(b.id)) };
}

export function materializeMembers(atoms = []) {
  const map = new Map();
  const dependencies = new Map();
  for (const atom of [...atoms].sort((a,b)=>a.sortKey.localeCompare(b.sortKey))) {
    for (const member of atom.members) {
      if (!map.has(member.id)) map.set(member.id, member);
      if (!dependencies.has(member.id)) dependencies.set(member.id, new Set());
      dependencies.get(member.id).add(atom.primaryId);
    }
  }
  return {
    members: [...map.values()].sort((a,b)=>a.id.localeCompare(b.id)),
    dependencyRefs: Object.fromEntries([...dependencies.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,refs])=>[id,[...refs].sort()]))
  };
}
