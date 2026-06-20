# ACE Mind Jester Audit v2.1 route update

Date: 2026-06-20
Repository: flamewalker-runtime
Scope: ACE Mind routing, manifests, wrapper, and service worker only

## Intent

ACE Mind canonical runtime was replaced manually at:

`Jester-Intelligence/ACED-Lifestyle/ace-mind.html`

This migration records the surrounding route and PWA identity updates needed so all ACE Mind doors point to the same canonical runtime build.

## Build stamp

`ace-mind-jester-audit-v2-1-20260620`

## Files updated

- `Jester-Intelligence/ACED-Lifestyle/apps/ace-mind/index.html`
  - Kept as redirect compatibility entry.
  - Updated redirect/cache stamp to the new build.

- `Jester-Intelligence/ACED-Lifestyle/manifest.json`
  - Kept ACE Mind PWA identity.
  - Updated `start_url` and icon cache stamps.

- `Jester-Intelligence/ACED-Lifestyle/manifest-ace-mind.webmanifest`
  - Kept separate ACE Mind install manifest.
  - Updated `start_url` and icon cache stamps.

- `Jester-Intelligence/ACED-Lifestyle/apps/ace-mind/manifest.webmanifest`
  - Kept nested app scope and redirect-door behavior.
  - Updated icon cache stamps and description.

- `Jester-Intelligence/ACED-Lifestyle/app-ace-mind.html`
  - Kept iframe wrapper behavior.
  - Updated iframe target cache stamp.

- `Jester-Intelligence/ACED-Lifestyle/ace-mind-sw.js`
  - Bumped service worker version.
  - Updated notification target URL.
  - Added explicit build stamp to version response.

## Files intentionally not changed

- `Jester-Intelligence/ACED-Lifestyle/ace-mind.html`
  - Already replaced manually before this migration.

- `Jester-Intelligence/ACED-Lifestyle/manifest-aced-lifestyle.json`
  - ACED Lifestyle remains a separate installable PWA.

- `Jester-Intelligence/ACED-Lifestyle/install-aced-lifestyle.html`
  - ACED Lifestyle installer remains separate.

- Root `manifest.webmanifest` and root `service-worker.js`
  - Flamewalker Runtime shell identity remains separate.

## Test checklist

1. Open `Jester-Intelligence/ACED-Lifestyle/ace-mind.html?v=ace-mind-jester-audit-v2-1-20260620`.
2. Confirm ACE Mind renders.
3. Trigger Jester Audit via `#jester-audit`, 5 taps, long press, or Ctrl+Alt+J.
4. Export audit JSON and confirm no false truncation failure.
5. Open `Jester-Intelligence/ACED-Lifestyle/apps/ace-mind/` and confirm it redirects to ACE Mind.
6. Open `Jester-Intelligence/ACED-Lifestyle/app-ace-mind.html` and confirm the iframe wrapper loads the new build.
7. Reinstall or refresh the ACE Mind PWA if Android keeps an old cached shell.
8. Confirm ACED Lifestyle remains separately installable and opens independently.
