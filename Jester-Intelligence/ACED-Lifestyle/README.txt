THEON Analyst PWA assets

Upload these files into the same GitHub folder as theon-analyst.html:

- theon-analyst-manifest.json
- theon-analyst-sw.js
- shared/assets/logos/theon-analyst.png
- shared/assets/logos/theon-analyst-192.png
- shared/assets/logos/theon-analyst-512.png

Add this in the <head> of theon-analyst.html:
<link rel="manifest" href="./theon-analyst-manifest.json" />
<meta name="theme-color" content="#02040a" />
<meta name="mobile-web-app-capable" content="yes" />

Add this before </body> or inside your existing script block:
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./theon-analyst-sw.js'));
}
</script>

If the app file name is different, edit start_url in the manifest and THEON_ANALYST_ASSETS in the service worker.
