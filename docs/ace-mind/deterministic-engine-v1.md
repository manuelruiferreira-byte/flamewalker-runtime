# ACE Mind deterministic engine 1.0.0

## Contract and modules

`scoreSupplements(targetDate, canonicalProfile, engineVersion)` and
`scoreLifeDomains(targetDate, canonicalProfile, engineVersion)` live in
`shared/resonance/engine-v1.js`. Their only dependencies are the supplied date,
frozen canonical profile and frozen versioned reference module. They reject
unsupported engine/profile versions and invalid dates. Neither reads clock,
storage, network, DOM, consumption, body status, device settings or random values.

The selected YYYY-MM-DD is a Europe/Brussels calendar date. Astronomy uses
00:00 UTC on that date, consistently for past, present and future. No 09:00 hinge.
The reference ephemeris is the application's source-transcribed 2026 table,
attributed to Astrodienst/Swiss Ephemeris. Its transcription has not been
independently remeasured. Missing dates explicitly produce neutral transit and
lunar contributions, without reweighting or synthetic positions.

Modules separate canonical migration, reference data, calculation, timing,
warnings and presentation. User state remains in the existing storage schema.
The existing HTML orchestrates those modules and retains unrelated practices,
journals, exports, Jester routing and AI handoffs. Legacy source records remain
for provenance and older exports, but do not define the new ranked forecasts.

## Formula

For each card independently:

`score = round(clamp(50 + sum(weight[layer] * clamp(value[layer], -1, 1) / 2), 0, 100))`

| Layer | Weight | Mapping |
|---|---:|---|
| Numerology | 20 | 70% personal day, 15% natal life path, 15% expression; retain 11/22/33 when reducing; compound numbers recorded |
| BaZi | 20 | 80% date stem element, 15% natal Day Master element, 5% matching polarity |
| Mayan | 15 | 80% mean daily four-count affinity, 20% mean natal four-count affinity; seal 55%, tone 30%, color 15% |
| Transits | 20 | Major contacts to natal planets, 5° orb; conjunction +1, sextile +0.6, square -0.7, trine +0.8, opposition -0.7; linearly declining with orb and normalized by affinity |
| Lunar | 10 | 60% lunar sign element, 40% symbolic phase/tone-band affinity |
| Natal | 5 | Mean elemental affinity of eight natal planets; stationary motion weight 1.1 |
| Canonical modifiers | 10 | Bounded mean of established domain correspondence maps, never treating repeated symbolic geometry as independent empirical evidence |

These weights and valences are an explicit symbolic methodology, not measured
medical effects or scientifically calibrated probabilities. Raw astronomical
geometry and its symbolic interpretation are distinguished in explanations.
The four Mayan tracks retain the application's separate correlations and are
not asserted to be interchangeable historical calendars. The Oracle document's
calibration proposal is retained as a research method, not claimed validated.

Every contribution exposes weight, bounded value, points and explanation.
Round only at the final displayed integer, after six-decimal contribution
serialization. Rank descending, then canonical ASCII ID. Classification/color:
80+ High resonance, 65+ Resonant, 45+ Mixed resonance, otherwise Low resonance.
No classification grants or denies selection. All 42 supplements and all nine
domains are returned every date, including dates outside astronomy coverage.

## Removed authority

The visible forecast, background day builder and AI supplement ranking no longer
use weekly/rolling usage limits, seven-day counts, cooldowns, mandatory days,
NAD bundles, minimum weekly quotas, daily supplement caps, body vetoes/penalties,
automatic inclusions/exclusions, TAKE/HOLD/LOCKED eligibility, 75-point filters,
block rotation or distribution pressure. Life-domain scoring no longer applies
body/emotional state, work availability or weekday practical multipliers.
Earlier policy engines are historical source only, not imported by the page.
Notification reminders use explicit manual selections, never a hidden selection
policy. Practice/body observations remain separate from resonance.

## Timing and warnings

`timing-v1.js` uses fixed Brussels reference coordinates, the NOAA approximate
solar equations, unequal daylight/night planetary hours and the Chaldean order.
It does not use device geolocation. Each recommended window includes date,
local time and CET/CEST. EU DST rules are pinned for 1996–2099; unsupported timing
is explicit. Approximate solar times are not precision astronomical measurements.
A live NOW indicator is a separate comparison to a supplied clock.

`warnings-v1.js` cannot mutate engine scores. It distinguishes documented
medication/contraindication warnings, additive effects and uncertain associations.
Combination alerts show actual names and scores when both score at least 70 or
are both manually selected. This threshold affects alerts only, never visibility
or selection. Sources include NIH ODS and NCCIH. Scores are not evidence of
safety, effectiveness, dosage or a reason to take a supplement.

## Version migration and evidence

Profile `3.4_ORACLE/1`, engine `ace-resonance-1.0.0`, reference
`resonance-reference-1` form the baseline. This is an intentional one-time
migration from the mixed selector; it is not a freeze of old scores. PR #31's
snapshot-freeze approach is superseded by pure recomputation. Old recorded plans
remain exportable and are never used as the new source of truth.

Never edit released v1 reference/methodology files in place. Add a new explicit
version, preserve the old implementation and exports, document changes, and
rebaseline only that new version. Forecast exports contain engine/profile/
reference versions, scores and explanations. No silent overwrite of earlier
recorded forecasts is permitted. Browser caches are disposable delivery caches.

`tests/ace-resonance/baseline.json` records a SHA-256 over sorted-key canonical
JSON for the entire 19 October 2026 supplement/domain result. The regression
suite compares it under 14, 17 and 19 October clocks, both sides of 09:00,
state/cache changes, independent browsers and device timezones. Additional dates
include leap days, past/future years and both DST transitions.

Run:

```sh
node --test tests/ace-resonance/engine.test.cjs
npm install --no-save @playwright/test@1.61.1
npx playwright install --with-deps chromium firefox
node tests/ace-resonance/browser.cjs
```

Browser tests cover real checkbox interaction, body changes, navigation, reload,
cache clearing, complete lists, disabled controls, layout, manifest/icons, and
export followed by empty site storage and import. Physical Android installation
still requires confirmation on the user's device; browser emulation does not
claim to perform it.
