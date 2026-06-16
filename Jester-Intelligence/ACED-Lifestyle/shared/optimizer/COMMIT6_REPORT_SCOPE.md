# Commit 6 governed shadow reporting

Commit 6 aggregates only records already stored in `ACE_MIND_OPTIMIZER_SHADOW_DB`.

The report is deterministic, sanitized, diagnostic-only, and permanently returns `activationStatus: BLOCKED_BY_POLICY`. It has no supplement selection authority and does not alter visible cards, the legacy live selector, ACE Mind state, body state, navigation, ticks, or AI handoff behavior.

The browser API exposes `AceMindOptimizerShadow.latest()`, `AceMindOptimizerShadow.history()`, and asynchronous `AceMindOptimizerShadow.report()`.

No Lens mutation is included in this commit. Runtime reporting listens to `ace-mind:optimizer-shadow`, reads the dedicated IndexedDB ledger, and fails open to an empty governed report if reporting fails.
