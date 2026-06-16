# Commit 6 note

The shadow reporter is deterministic, sanitized, diagnostic-only, and permanently returns `activationStatus: BLOCKED_BY_POLICY`. It reads only the dedicated shadow ledger, exposes `latest()`, `history()`, and asynchronous `report()`, and does not mutate the live selector, cards, Lens, or ACE Mind state.
