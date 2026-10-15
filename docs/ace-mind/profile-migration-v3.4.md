# Canonical profile migration: DATA-1.1 / v3.3 → 3.4_ORACLE/1

The owner-supplied v3.4 ORACLE DOCX was read in full before migration. Source SHA-256:
`ffc60eb6d2f498af6ed246629f98ea98ba0ab6f81fe935deb850dc5122badeec`.
The attachment and private event details are deliberately not copied into this
public repository. The original DATA-1.1 record is retained as provenance;
`ACECanonical.migrate` creates the sole active profile copy.

## Before / after

| Field or chamber | Before | After / treatment |
|---|---|---|
| Profile authority | DATA-1.1 and v3.3 summaries | Versioned 3.4_ORACLE/1, DOCX correction takes precedence |
| Neptune source motion | Ordinary direct | Stationary direct in active natal and measurement records |
| Numeric tropical longitudes | Rounded numeric duplicates of exact display strings | Reconstructed from source-sealed degree/minute/second strings; no new measurement invented |
| Birth foundation, tropical angles, planet degrees, houses | Existing source-sealed tables | Retained; v3.4 explicitly preserves these sealed values |
| BaZi pillars and Day Master | Existing canonical pillars | Retained, no alternate birth-time calculation substituted |
| BaZi strength/health deficiencies | Interpretive legacy claims mixed into guidance | Not used as measured elemental deficiencies or health-score penalties |
| Four Mayan identities | Four distinct natal tracks | All retained separately and used as natal affinities; daily correlations explicitly identified |
| Numerology compound/master values | Existing canonical record | Retained; master-aware personal date uses calendar date, no today-only 09:00 transition |
| Declinations, lots, vertex, midpoints, stars, relocation, draconic, heliocentric and harmonics | Existing source chambers | Retained with provenance; established symbolic maps bounded as one modifier family |
| September transit periods | Newly supplied broad periods | Source preserved privately; approximate month boundaries not converted into fabricated daily ephemeris |
| Oracle methodology | New | Deterministic raw calculation, separate symbolic explanations, neutral baseline, versioned calibration and no LLM score authority |
| Oracle Marker 001 | New pre-outcome research record | Preserved in owner source document; private event context excluded from public runtime and score inputs |
| Previous recorded forecasts | Mixed selector records | Archived in state/export with original values; not silently relabeled as v1 forecasts |

## Conflicts resolved without merging contradictory measurements

- A Placidus house statement in narrative disagrees with the tabulated Pluto
  placement. Preserve the sealed table; do not import the narrative as a second
  placement. Whole-sign statements belong to their separate house system.
- A declination prose pairing disagrees with the tabulated pairing. Preserve the
  source table; do not count both as independent geometry.
- A draconic prose conjunction is unsupported by its coordinate table. Do not
  add that narrative aspect to the scoring geometry.
- The stated sidereal ayanamsa and the listed tropical-to-sidereal offsets differ
  slightly. Preserve the source records but leave this arithmetic inactive,
  rather than silently deriving a corrected sidereal chart.
- Approximate long-period windows are context, not exact daily position data.
- Experimental convergence/calibration is a hypothesis and method, not a claim
  that an event marker validates predictive accuracy.

The document describes its own sealed values as verified. This implementation
verifies transcription consistency and supersession, not a fresh independent
astronomical measurement of the entire natal chart. Source-transcribed geometry,
derived arithmetic and symbolic interpretation have separate labels.

## Baseline effect

The one-time change is intentional: the old body/frequency selector is replaced
by a new versioned equation. The forecast baseline is rebuilt once after the
profile correction. The same v1 profile and date then yield the same complete
output. The test suite checks active motion fields, archive preservation,
source-string precision, exact contribution arithmetic and canonical hashes.
Public test output and this report do not disclose birth identifiers or degrees.

`canonical-v1.js` has no duplicate personal measurement literals. It derives the
active immutable profile from the preserved source record, applies the explicit
correction, and passes that same profile to both pure functions. Tests parse
that real production profile instead of using a separate fixture.
