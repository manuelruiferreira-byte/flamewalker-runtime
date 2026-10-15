# ACE Mind update and Android reinstall

Production GitHub Pages entry:
https://manuelruiferreira-byte.github.io/flamewalker-runtime/Jester-Intelligence/ACED-Lifestyle/ace-mind.html?v=ace-resonance-1.0.0

Deployment is from the repository's main branch through GitHub Pages. The
connected Netlify Jester site builds a different repository and must not be used
for this application. A working URL alone does not prove the new build is live;
verify the visible `ace-resonance-1.0.0` and profile `3.4_ORACLE/1` banner.

1. In the existing ACE Mind app, tap **Export**. Keep the JSON in Downloads and
   copy it somewhere safe. Phone and tablet may have different local records;
   export each device separately. Never post this file publicly.
2. Open the production link in Chrome while online. Close old ACE Mind windows
   and reopen. Confirm the engine/profile banner and all 42 supplement cards.
   Ordinary updates retain the same storage key and do not erase journals.
3. For a full reinstall, remove the old home-screen app, then open the same link
   in Chrome and select **Install app** or **Add to Home screen**. Use the same
   Android browser/profile (personal versus work) if retaining its local data.
4. If an old build persists, first confirm your export exists, then clear that
   site's stored data/cache in Chrome and reopen the link. Clearing site data
   erases local records and may affect other apps on the same GitHub Pages
   origin. Avoid it unless needed; normal service-worker update purges only
   the application's delivery caches.
5. Tap **Import**, choose that device's JSON backup, and verify notes and taken
   checkboxes. Reopen 19 October 2026 to check the unchanged forecast.

The regression test exports real browser state, clears storage/cache and
service-worker registration, reloads, imports the JSON and verifies notes,
logs, legacy forecasts and the new canonical hash. This models data recovery;
it does not assert that an actual Samsung device was operated remotely.
