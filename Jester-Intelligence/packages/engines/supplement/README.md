# ACE Mind Supplement Engine — Commit 1

This package is the canonical data foundation for the Individual Supplement Optimizer.

## Scope

Commit 1 adds only:

- a 42-item canonical registry;
- normalized aliases;
- personal automation status;
- frequency and persistence metadata;
- mandatory, preferred and conflicting relationships;
- body benefit and burden vectors;
- nine-domain affinities;
- esoteric affinity metadata;
- JSON Schemas;
- a dependency-free cross-record validator.

It does **not** change the live ACE Mind recommendation engine. The legacy seven-bundle system remains active until the shadow-mode migration passes.

## Canonical constraints encoded

- Exactly one NAD booster per NAD day.
- NAD group target: five days per week.
- NR, NMN and NMN-H rotate equally across a 21-day horizon.
- Every NAD booster requires TMG and magnesium citrate.
- Lion's Mane target: at least three uses per week unless vetoed.
- Shilajit target: exactly two uses per week when permitted.
- Spermidine and Spirulina target: two uses per week.
- Cordyceps is conditional on physical-energy need and is never gated by a legacy bundle.
- NAC and/or Milk Thistle form a near-daily liver-cover group.
- B-Complex belongs primarily to non-NAD days.
- L-Theanine, Melatonin and Valerian form a one-per-night rotation group.
- Ashwagandha is excluded from automatic selection.
- Fadogia Agrestis and Turkesterone are manual-research items.
- Morning / afternoon / night caps are 4 / 4 / 3.

## Interpretation boundaries

Body vectors are governance heuristics on a 0–3 scale. They are not clinical measurements.

Persistence classes are conservative scheduling bands, not asserted pharmacokinetic half-lives.

Esoteric affinities are symbolic ranking metadata. They can rank already-permitted candidates but can never create biological permission.

Unknown dose, medication, laboratory or product-quality data become hard holds only where `critical_data_fields` marks them critical.

## Validate

```bash
node Jester-Intelligence/packages/engines/supplement/validate-registry.mjs
```

## Next commit

Commit 2 builds four orthogonal engines:

1. esoteric fit;
2. biological permission and body vectors;
3. frequency and persistence;
4. pairing and compatibility.

None of those engines may overwrite another layer's label.
