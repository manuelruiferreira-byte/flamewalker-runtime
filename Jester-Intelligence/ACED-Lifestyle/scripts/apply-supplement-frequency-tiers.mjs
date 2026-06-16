#!/usr/bin/env node
import fs from 'node:fs';

const path = process.argv[2] || 'Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json';
const registry = JSON.parse(fs.readFileSync(path, 'utf8'));
const tierById = Object.freeze({
  nr:'constitutional',
  nmn:'constitutional',
  nmnh:'constitutional',
  shilajit:'constitutional',
  lions_mane:'constitutional',
  spermidine:'governed',
  spirulina:'governed',
  cordyceps:'conditional'
});

if (!Array.isArray(registry.supplements) || registry.supplements.length !== 42) {
  throw new Error(`Expected canonical 42-supplement registry, got ${registry.supplements?.length ?? 'invalid'}`);
}

for (const supplement of registry.supplements) {
  supplement.frequency ||= {};
  supplement.frequency.priorityTier = tierById[supplement.id] ?? 'maintenance';
  if (['nr','nmn','nmnh'].includes(supplement.id)) {
    supplement.frequency.rotationGroup = 'nad_booster';
    supplement.frequency.groupTargetUses7d = 5;
  } else {
    delete supplement.frequency.rotationGroup;
    delete supplement.frequency.groupTargetUses7d;
  }
}

fs.writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  ok:true,
  registryId:registry.registryId,
  supplements:registry.supplements.length,
  tiers:Object.fromEntries(registry.supplements.map(s=>[s.id,s.frequency.priorityTier]))
}, null, 2));
