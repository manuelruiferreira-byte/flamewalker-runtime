# ACE Mind Supplement Registry v1

Commit 1 source of truth for the future Individual Supplement Optimizer.

## Scope

This commit adds data only. It does not alter live ACE Mind recommendations, retire the legacy seven-bundle selector, or implement optimizer logic.

## Encoded governance

- NR, NMN, and NMN-H are mutually exclusive NAD boosters.
- Each NAD booster requires TMG and Magnesium Citrate in the future optimizer.
- B-Complex is marked as non-NAD energy and conflicts with NAD boosters.
- Ashwagandha is excluded from automatic scheduling.
- Fadogia Agrestis and Turkesterone are manual research lanes only.
- Shilajit is active-caution and quality-sensitive.
- Reishi and Gotu Kola are active-caution.
- Cordyceps is a physical-performance candidate, not a generic endocrine default.
- Spermidine and Spirulina have governed weekly targets.
- L-Citrulline is included as a circulation / physical-performance candidate.

## Frequency priority tiers

The registry distinguishes four scheduling tiers:

- `constitutional`: personal protocol targets that the deadline scheduler protects when eligible, including the NAD 2/2/1 rotation, Shilajit, and Lion's Mane.
- `governed`: explicit weekly targets that receive deadline protection after constitutional needs, including Spermidine and Spirulina.
- `conditional`: demand-triggered candidates that may exceed their nominal target up to the maximum only when operational need and esoteric fit are both strong. Cordyceps uses this lane.
- `maintenance`: ordinary targets that guide urgency but do not become hard reservations.

The NAD family declares `rotationGroup: nad_booster` and `groupTargetUses7d: 5`. Individual targets remain NR 2, NMN 2, and NMN-H 1.

## Limitation

Benefit and burden vectors are scheduling heuristics, not medical measurements. Unknown dose, medication interactions, product composition, and lab-dependent constraints must be handled conservatively by later engines.
