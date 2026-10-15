# ACE Mind private Drive synchronization v1

## Release status

The app implementation can be deployed independently of Google provisioning.
**Real Drive synchronization is not activated until the owner configures a
Google Web OAuth client and authorizes the app on each device.** An empty client
ID shows the setup screen, not a false Connected or Synced status. Automated
integration tests use a labeled Google Identity/Drive test double; they do not
claim a real Google login. The Google Cloud console was unavailable from the
implementation environment, so project/client provisioning requires the owner.

## One-time Google configuration

1. Open https://console.cloud.google.com/apis/credentials in your own browser.
2. Choose your Google Cloud project and enable **Google Drive API**.
3. Configure the Google Auth Platform consent app. For personal testing, add the
   Google account you will use on all devices as a test user. Request only
   `https://www.googleapis.com/auth/drive.appdata`, a non-sensitive scope.
4. Create an OAuth client of type **Web application**. Add this exact authorized
   JavaScript origin: `https://manuelruiferreira-byte.github.io`.
   No redirect URL is required for the Google Identity Services token popup.
5. Copy the **public client ID** ending in `.apps.googleusercontent.com`. Never
   copy a client secret into the app, repository, a chat, or a screenshot.
6. In ACE Mind, tap **Sync**, expand **One-time Google setup**, paste that public
   ID and save. Repeat with the same ID on your other devices. The owner can
   alternatively publish the public ID once in `shared/sync/config-v1.js` so all
   devices receive it automatically. A client ID is public configuration, not a
   credential.
7. Tap **Connect Google Drive** on each device and select the same account.
   Google's consent allows ACE Mind to store private app data. Then test a
   checkbox on the phone and **Sync now** on the tablet.

App-data is hidden from the Drive file browser and other Drive apps. Removing
ACE Mind's authorization/app data in Drive is different from uninstalling its
Android home-screen PWA. Do not remove Drive app data if you want cloud recovery.
No paid server or client secret is required by this implementation. API quotas
and Google account availability still apply.

Official references:
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/workspace/drive/api/guides/appdata
- https://developers.google.com/workspace/drive/api/reference/rest/v3/about/get

## What synchronizes

The whitelist contains supplement taken states, notes, practice checkboxes,
body observations and journal logs. Supplement event logs merge as a union;
the displayed taken list is rebuilt from checkbox truth. Different fields and
dates merge independently. Clearing a note or unticking is a real update.
Earlier UI journal truncation never deletes cloud history.

Natal/profile data, scores, rankings, forecasts, block-policy caches, browser
navigation, device location/preferences, OAuth credentials and AI payloads are
excluded. The resonance engine imports no sync module, so its baseline remains
unchanged. Notes and journals may be personal; the Connect screen states what
will be uploaded to the owner's private Google Drive.

## Conflict and offline rules

Each device writes immutable batches with unique UUIDs to Drive app-data.
Devices never read/modify/write one shared mutable JSON file. Concurrent writes
therefore cannot erase the other device's batch. HTTP acknowledgement loss can
produce a duplicate batch; merging is idempotent.

Each field has a hybrid timestamp `(milliseconds, logical counter, device UUID)`.
A causally observed edit advances the logical timestamp even if the local clock
moves backward. Concurrent edits to the same field use timestamp order, then
UUID order; different fields are retained. This is a deterministic conflict
rule, not a guarantee of real-time order when disconnected clocks disagree.
All batches retain earlier note versions in the underlying history. There is
no automatic cloud-history compaction or destructive reset in v1.

Local batches persist before upload. Received batches are cached locally. The
app polls every 30 seconds while visible, syncs on online/return events and
debounces local edits by one second. A manual Sync now button is available.
Closed/backgrounded Android PWAs cannot guarantee continuous execution. An
actively edited text field is not replaced during a remote refresh; received
state applies after editing finishes.

Access tokens stay in memory only. On reload or token expiry the app asks for
Google authorization again through a user gesture. Disconnect drops the token
but preserves local and cloud data. Each browser's data is bound to its first
linked Google account; a different-account authorization is rejected before
upload. Use a separate browser profile for a different account. Offline data
and pending batches need that same browser storage to survive until uploaded.

Storage and quota errors remain visible; they do not report Synced. Export
before clearing browser storage if pending changes matter. Existing manual
Export/Import and deterministic version migration remain supported.

## Verification

`node --test tests/ace-resonance/sync.test.cjs` covers merge order/idempotence,
concurrent edits, unticking/deletion, clock rollback, journal preservation,
legacy seeding, whitelist and schema validation, unchanged forecasts, pagination,
append requests and API failures.

`node tests/ace-resonance/sync-browser.cjs` runs two separate browser contexts
against an in-memory Google test double. It tests checkbox propagation,
independent offline edits, reconnect convergence, lost upload acknowledgements,
expired sessions, account isolation, reload recovery and token non-persistence.
The existing forecast/browser/mobile/reinstall regressions also run.

A real signed-in phone/tablet check remains necessary after OAuth provisioning.
