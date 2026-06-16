# ACE Mind Supplement Layer Engines v1

Commit 2 established four pure, deterministic, orthogonal layers:

1. `esoteric-fit-engine.mjs` produces only symbolic fit (`Prime` through `Discordant`).
2. `body-permission-engine.mjs` produces only biological permission and body vectors.
3. `frequency-persistence-engine.mjs` produces only due/residual/cooling/complete state and urgency.
4. `pairing-compatibility-engine.mjs` resolves mandatory groups and conflicts.

## Invariants

- Body state never changes the esoteric label.
- Esoteric fit never unlocks an excluded, held, cooling, maximum-reached, or conflicting candidate.
- Frequency urgency uses a convex deadline pressure curve.
- Required companions are canonical registry ids and recursive cycles are rejected.
- Same-day conflicts are treated symmetrically even when only one registry record declares the edge.
- Every function is clock-free and I/O-free. Dates and histories are explicit inputs.
- Outputs are JSON-serializable and stably ordered.

## Commit 3: Individual assembly optimizer

`individual-supplement-optimizer.mjs` consumes the four upstream layer maps and assembles a deterministic daily stack. It does not recalculate astrology, body permission, frequency, or pairing labels.

The assembly sequence is:

1. Build independent or mandatory-group atoms.
2. Exclude unavailable, personally excluded, and manual-only primaries.
3. Admit the highest positive marginal-utility atom under hard constraints.
4. Apply bounded whole-atom 1-to-1 local repair.
5. Trim weak atoms to the smallest near-equivalent stack.
6. Return selected, residual, held, and excluded buckets with a SHA-256 determinism hash.

Mandatory atoms are never split. Shared companions are materialized once and retain dependency references. Slot planning is deterministic and completed before admission. Every numerical weight is in `optimizer-config.mjs` and remains shadow-tuned rather than final.

## Validation

```bash
node tests/validate-layer-engines.mjs ../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json
node tests/validate-individual-optimizer.mjs ../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json
```

The body benefit/burden vectors and esoteric correspondences are governance heuristics. They are not clinical measurements or proof of efficacy.
