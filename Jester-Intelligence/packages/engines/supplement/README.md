# ACE Mind Supplement Layer Engines v1

Commit 2 of the Individual Supplement Optimizer programme.

These four engines are pure, deterministic, and orthogonal:

1. `esoteric-fit-engine.mjs` produces only symbolic fit (`Prime` through `Discordant`).
2. `body-permission-engine.mjs` produces only biological permission and body vectors.
3. `frequency-persistence-engine.mjs` produces only due/residual/cooling/complete state and urgency.
4. `pairing-compatibility-engine.mjs` resolves mandatory groups and conflicts.

No engine selects a daily stack. Commit 3 consumes these outputs.

## Invariants

- Body state never changes the esoteric label.
- Esoteric fit never unlocks an excluded, held, cooling, maximum-reached, or conflicting candidate.
- Frequency urgency uses a convex deadline pressure curve.
- Required companions are canonical registry ids and recursive cycles are rejected.
- Same-day conflicts are treated symmetrically even when only one registry record declares the edge.
- Every function is clock-free and I/O-free. Dates and histories are explicit inputs.
- Outputs are JSON-serializable and stably ordered.

## Validation

```bash
node tests/validate-layer-engines.mjs ../../../../ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json
```

The body benefit/burden vectors and esoteric correspondences are governance heuristics. They are not clinical measurements or proof of efficacy.
