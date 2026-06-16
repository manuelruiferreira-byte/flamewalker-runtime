# ACE Mind Optimizer Shadow Mode

Commit 5 connects the audited Individual Supplement Optimizer to ACE Mind as a read-only observer.

## Authority boundary

The shadow observer has no authority over:

- the visible supplement block
- supplement cards or statuses
- body-state controls
- day selection
- tick history
- block locks
- local ACE Mind state
- AI handoff behavior

It reads the already-rendered `agent-state` mirror and the saved supplement tick history. It does not call `deriveGuidanceV23`, `fwEngineDay`, `blockFor`, or other app functions that may persist assignments.

## Operation

After each completed render, the observer:

1. Reads the current agent-safe day snapshot.
2. Normalizes body axes and actual-use history.
3. Runs the four orthogonal supplement layers.
4. Runs the audited individual optimizer.
5. Compares the optimizer set with the visible legacy block.
6. Stores the comparison in `ACE_MIND_OPTIMIZER_SHADOW_DB` using IndexedDB.
7. Dispatches `ace-mind:optimizer-shadow` with comparison metadata.

No shadow result is displayed or applied in Commit 5.

## Fail-open behavior

Any registry, browser-storage, parsing, or optimizer error is caught and logged. The live ACE Mind interface continues unchanged.

The local kill switch is:

```js
AceMindOptimizerShadow.disable()
```

Re-enable with:

```js
AceMindOptimizerShadow.enable()
```

The same switch can be set directly with localStorage key `ace_mind_optimizer_shadow_disabled` equal to `1`.

## Privacy

Stored records contain only the sanitized day field, optimizer result, legacy supplement set, comparison metrics, reasons, and deterministic hashes. Notes, full state exports, patch history, private AI payloads, and unrelated app data are not copied into the shadow database.

## Next gate

Commit 6 may expose a governed comparison report through Lens or export. The optimizer must remain non-authoritative until real shadow records are reviewed and activation criteria are explicitly approved.
