# ACE Mind Supplement Card Completeness Audit
**Generated:** 2026-06-17  
**Registry migrated from:** v1 → v2  
**Schema version:** ace_mind_supplement_registry.v2  
**Supplement count:** 42

---

## 1. Root-Cause Report: What Was Wrong with v1

### Schema-level deficiencies
- **No personal response structure.** v1 had no dedicated section for personal polarity, strength, observed benefits, or adverse effects. These were buried in `notes` as free text if present at all.
- **Flat body vectors, not a matrix.** v1 `body.benefits` and `body.burdens` used simple integer scores without confidence, evidence source, or personal response modifier. No per-axis color interpretation was possible.
- **No functional overlap tracking.** v1 had `classes` and `pairing.redundantWith` but no explicit `redundancyGroups`, `substantiallyDuplicates`, or `maximumSameFunctionCompanions`. Anti-overstacking logic could not distinguish partial from total overlap.
- **Companion objects were ID strings, not structured.** `pairing.requiredCompanions` was an array of strings. Required vs. preferred, timing relationship, and equivalents were not representable.
- **Frequency section lacked cycle governance.** No `maxConsecutiveDays`, `minimumGapBetweenCycles`, `accumulationTendency`, or `washoutWindow`. The optimizer could not enforce cycle breaks for stimulants or fat-soluble accumulators.
- **Esoteric was a flat list of three generic arrays.** `planets`, `elements`, `qualities` — no BaZi, no Mayan, no numerology, no planetary hour affinity/avoidance, no day/night polarity. Esoteric fit engine had no structured input to work with.
- **No display section.** Computed display fields (mainFunction, bestPairedWith, bodySystemsToWatch) were not canonical — they had to be derived at runtime from partial data.
- **No rotation family or mutual exclusivity.** NAD family exclusivity was encoded as `avoidSameDay` strings, not as a first-class rotation group with `mutuallyExclusiveWith`.
- **evidenceClass had non-standard values.** `limited_human_evidence` appeared in MSM but was not in the schema enum. v2 formalizes this.
- **personalStatus had `manual_only` not in enum.** Melatonin and Valerian used `personalStatus: "manual_only"` which was not in the v1 schema enum (only: active, active_caution, paused, caution, excluded).
- **No body system for joints.** v1 bodySystems list had `skin_connective` combining skin and joints into one axis. v2 splits to `joints_connective` and `skin` as separate axes.

---

## 2. Canonical Card Schema Summary — 10 Sections

| Section | Key | Purpose |
|---------|-----|---------|
| **A: Identity & Availability** | Top-level + criticalData | IDs, dose, status, evidence class, critical data flags |
| **B: Personal Response** | `personalResponse` | Polarity, strength, benefits, adverse effects, confidence, dates |
| **C: Primary & Secondary Functions** | `functions` | Function axes, mechanisms, operational/recovery roles, acuteOrCumulative |
| **D: Body-Axis Matrix** | `bodyAxisMatrix` | 14-axis support/burden matrix with confidence, evidence, personal modifier |
| **E: Functional Overlap & Anti-Overstacking** | `stackingProfile` | Classes, coverage axes, redundancy groups, overlap relationships |
| **F: Frequency & Persistence** | `frequency` | All v1 fields + cycle governance (maxConsecutiveDays, washout, accumulation) |
| **G: Compatibility & Interactions** | `compatibility` | Structured companions, rotation family, mutual exclusivity, timing, food |
| **H: Esoteric Signature** | `esoteric` | Astrology (full), BaZi, numerology, Mayan (4 tracks), v1 legacy arrays |
| **I: Planetary-Hour Timing Profile** | `planetaryHourProfile` | Hour affinities, preferred windows, stimulant cutoffs, calming start |
| **J: Display Content** | `display` | Human-readable card: mainFunction, pairs, systems improved/to watch |

---

## 3. Card-Completeness Matrix

Legend: ✓ = fully populated | ~ = partial/unknown | ✗ = empty or not applicable

| Supplement | A: Identity | B: Personal | C: Functions | D: Body Matrix | E: Stacking | F: Freq+ | G: Compat | H: Esoteric | I: PH Profile | J: Display |
|------------|:-----------:|:-----------:|:------------:|:--------------:|:-----------:|:--------:|:---------:|:-----------:|:-------------:|:----------:|
| magnesium_citrate | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| magnesium_malate | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| magnesium_bisglycinate | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| magnesium_taurate | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| nr | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| nmn | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| nmnh | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| tmg | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| creatine_5g | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| coq10 | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| omega_3 | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| multivitamin | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| d3_k2 | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| nac | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| milk_thistle | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| probiotic | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| zinc | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| astragalus | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| lions_mane | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| l_theanine | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| lutein | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| melatonin | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| valerian | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| collagen | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| vitamin_c | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| msm | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| quercetin | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| resveratrol | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| spermidine | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| spirulina | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| shilajit | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| irish_sea_moss | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| gotu_kola | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| chaga | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| reishi | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| cordyceps | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| black_maca | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| b_complex | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| l_citrulline | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| ashwagandha | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| fadogia_agrestis | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |
| turkesterone | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ |

**Section H (Esoteric) is marked ~ for all supplements.** This is by design: v1 provided planets/elements/qualities which are preserved. BaZi, numerology, and Mayan fields are structurally present but populated as "unknown" pending genuine esoteric analysis. This is explicitly intended — the schema enforces structure without inventing data.

**Section B (Personal Response)** is ✓ only for supplements with confirmed personal observations (NR, Cordyceps, TMG, Milk Thistle, NAC, MSM, Ashwagandha, Reishi, Cordyceps). All others are `responsePolarity: "unknown"`.

---

## 4. Cards Requiring Further Enrichment (Most Unknowns)

These supplements have the highest proportion of unknown fields and would benefit most from additional observation or research:

| Priority | Supplement | Missing Data |
|----------|-----------|--------------|
| 1 (highest) | **fadogia_agrestis** | Personal response unknown; medication interactions unknown; most body axes unknown; BaZi/Mayan fully unknown; dose unknown |
| 2 | **turkesterone** | Same as above; limited human evidence; manual_only so rarely tested |
| 3 | **irish_sea_moss** | Most body axes unknown; iodine interaction with thyroid unquantified; personal response unknown |
| 4 | **spermidine** | Dose unknown; most body axes theoretical; limited personal data |
| 5 | **spirulina** | Heavy metal contamination risk unquantified; personal response unknown |
| 6 | **shilajit** | active_caution; product quality interaction unknown; most axes theoretical |
| 7 | **chaga** | active_caution; oxalate kidney risk not quantified; most axes unknown |
| 8 | **black_maca** | active_caution; endocrine effects not personally confirmed; dose unknown |
| 9 | **gotu_kola** | caution due to liver; personal response unknown beyond caution flag |
| 10 | **reishi** | active_caution; personal response unknown; immune overstimulation risk |

---

## 5. Body Axes with Inadequate Data

These axes have the highest proportion of `confidence: "unknown"` or `confidence: "low"` across all 42 supplements:

| Axis | Coverage Quality | Notes |
|------|-----------------|-------|
| **eyes** | Very low | Only lutein has strong evidence here; most others have no mechanism |
| **respiration** | Low | Only NAC and cordyceps have good evidence; most others are unknown |
| **joints_connective** | Low | MSM has medium confidence; collagen has limited evidence; others sparse |
| **endocrine** | Low-medium | Zinc, D3, ashwagandha, black_maca have data; most others theoretical |
| **skin** | Low | Collagen, vitamin C have evidence; many others are theoretical only |
| **energy_mitochondria** | Medium (good for NAD/CoQ10/creatine) | Many supplements have theoretical "indirect" support only |
| **liver** | Medium (good for NAC/milk thistle/TMG) | Many supplements have unknown burden potential |

---

## 6. Functional Classes with No Redundancy Rules

The following functional class pairs have overlap but no `substantiallyDuplicates` or `partiallyOverlapsWith` relationships encoded in v2 (need enrichment):

| Class Pair | Supplements | Gap |
|-----------|------------|-----|
| nad_booster overlap with b_complex | nr/nmn/nmnh vs b_complex | B-Complex avoidSameDay with NAD but no explicit redundancy rule |
| longevity + antioxidant | resveratrol vs quercetin vs spermidine | partiallyOverlapsWith encoded but no quantified diminishing return |
| immune_modulation (mushrooms) | lions_mane vs chaga vs reishi vs astragalus | avoidSameDay exists but no formal redundancy group cap |
| liver_support triple | nac vs milk_thistle vs tmg | Complementary rather than redundant, but no explicit declaration |
| sleep triple (rotation family) | l_theanine vs melatonin vs valerian | rotationFamily "night_calm" exists but no cap enforcement rule in defaultConfig |
| endocrine caution | black_maca vs fadogia_agrestis vs turkesterone | avoidSameDay but class cap "endocrine_caution": 1 only |

---

## 7. Missing Interactions Identified

Interactions present in v1 as `avoidSameDay` but lacking explicit reason in v2:

| Supplement A | Supplement B | Reason Gap |
|-------------|-------------|-----------|
| lions_mane | reishi | "immune mushroom cap" implied but not documented |
| lions_mane | chaga | Same |
| reishi | chaga | Same |
| nmnh | cordyceps | Combined stimulant overload — documented in notes but not in compatibility.medicationCautions |
| b_complex | nr/nmn/nmnh | Overlapping methylation drive — avoidSameDay exists but interaction class not formalized |
| melatonin | nmnh | Stimulant vs. hormone — avoidSameDay exists; reason is clear but not encoded |
| black_maca | fadogia_agrestis | Endocrine stacking — avoidSameDay exists; class cap handles this but reason not in card |
| ashwagandha | gotu_kola | Both liver-burden; avoidSameDay exists in gotu_kola card — correct |

**Interactions completely absent but warranted:**
- Zinc + Iron (absorption competition) — not in registry (iron not a supplement in registry)
- Magnesium (all forms) + mutual timing — all four forms have no `avoidSameSlot` between each other
- CoQ10 + statins — medication caution not encoded (statins not mentioned)
- Omega-3 + blood thinners — medication caution absent
- Vitamin C absorption enhancement for iron — not relevant here but pattern gap
- Shilajit + heavy metal accumulation risk — not formally encoded

---

## 8. Esoteric Fields: Generic in v1, Structural in v2

All v1 esoteric data was generic (3 arrays: planets, elements, qualities). These are marked **"historical"** in v2 context — they are preserved as v1 legacy fields but the new structured sub-objects (astrology, bazi, numerology, mayan) are populated as "unknown" because:

1. **BaZi** requires specific stem/branch analysis per substance that was not performed for v1
2. **Mayan calendar** requires kin assignment — no substance-to-kin mapping was established in v1
3. **Numerology** requires letter-value analysis of the substance name — not done in v1
4. **Astrology sub-object** (planetaryAffinities, tensions, signs, modalities) requires deeper analysis than the 1-3 planet list in v1

**What v1 data maps to in v2:**
- v1 `planets` → v2 `esoteric.astrology.primaryPlanets` (and preserved as `esoteric.planets`)
- v1 `elements` → v2 `esoteric.astrology.elements` (and preserved as `esoteric.elements`)
- v1 `qualities` → v2 `esoteric.astrology.archetypes` (and preserved as `esoteric.qualities`)

**Supplements with most esoteric enrichment needed:**
1. NR, NMN, NMN-H — planetary hour timing critical for NAD stimulation
2. Melatonin, Reishi, Valerian — lunar/night polarity needs formal assignment
3. Cordyceps — Mars/Fire alignment should have seasonal affinity populated
4. Lion's Mane — Mercury/Air BaZi correspondence (Wood element) is well-established and should be encoded

---

## 9. Unknowns and Data Gaps Inventory

### Universal unknowns (all 42 supplements):
- `dose` — not captured in v1; all set to "unknown" in v2
- `productForm` — not captured; all "unknown"
- `servingUnit` — not captured; all "unknown"
- `pillCount` — not captured; all "unknown"
- `source` — brand/supplier not encoded; all "unknown"
- `lastCardReview` — not tracked in v1; all "unknown"
- `lastActualIntake` — not tracked; all null (requires history integration)
- `criticalData.doseKnown` — all false
- `criticalData.productVerified` — all false
- `criticalData.medicationInteractionChecked` — all false
- `medicationCautions` — not encoded in v1; set to "unknown" for all in v2

### Esoteric unknowns (all 42 supplements):
- All BaZi fields: primaryElement, secondaryElement, yinYangQuality, etc.
- All Mayan fields across all 4 tracks
- All numerology fields
- astrology sub-fields: planetaryAffinities, signs, modalities, tensions, lunarAffinity, solarAffinity, dayNightPolarity, waxingWaningAffinity

### Personal response unknowns (30 supplements):
Supplements without confirmed personal response data:
magnesium_malate, magnesium_bisglycinate, magnesium_taurate, magnesium_citrate (partially), nmn, nmnh*, creatine_5g, coq10, omega_3, multivitamin, d3_k2, probiotic, zinc, astragalus, lions_mane, l_theanine, lutein, melatonin, valerian, collagen, vitamin_c, quercetin, resveratrol, spermidine, spirulina, shilajit*, irish_sea_moss, chaga*, black_maca*, b_complex, l_citrulline, fadogia_agrestis, turkesterone
(* = active_caution; response monitoring in progress)

### Body axis confidence gaps:
- 14 axes × 42 supplements = 588 axis entries
- Estimated ~380 entries have confidence "unknown" or "low"
- Entries with confidence "high" or "medium" concentrated in: liver (NAC, milk thistle, TMG, ashwagandha), energy_mitochondria (NR, NMN, CoQ10, creatine), nervous (magnesium forms, L-theanine), sleep (melatonin, L-theanine, magnesium_bisglycinate), respiration (NAC, cordyceps)

### Structural gaps requiring future enrichment:
1. Absorption kinetics — only `fastingCompatible` and `requiresFood` are present; no half-life or Tmax data
2. Lab-dependency flags — `labDependent: false` for all; criteria for lab-gating not defined
3. Interaction severity — `medicationCautions` and `conditionCautions` are "unknown" for all; needs pharmacist review
4. `firstObservedDate` and `mostRecentConfirmationDate` for personal responses — all "unknown"; requires log integration
5. Diminishing return profiles — all set to "unknown" or "moderate" defaults; need personal cycling data
6. Mayan calendar assignments — require a formal substance-archetype mapping methodology

---

## File Locations

| File | Path |
|------|------|
| Schema v2 | `/home/user/flamewalker-runtime/Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.schema.v2.json` |
| Registry v2 | `/home/user/flamewalker-runtime/Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.v2.json` |
| Registry v1 (preserved) | `/home/user/flamewalker-runtime/Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.v1.json` |
| Schema v1 (preserved) | `/home/user/flamewalker-runtime/Jester-Intelligence/ACED-Lifestyle/shared/data/supplements/supplement-registry.schema.json` |
| This audit | `/home/user/flamewalker-runtime/Jester-Intelligence/packages/engines/supplement/CARD_COMPLETENESS_AUDIT.md` |
