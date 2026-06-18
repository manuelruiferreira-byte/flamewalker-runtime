/* ACE Mind Service Worker v25.8.0
   Performance transform for ACE Mind v7 supplement engine.
   Purpose: keep canonical ace-mind.html intact in repo while serving a patched,
   faster runtime response: day/guidance caches, lazy alternatives, lazy Year Map,
   duplicate-render suppression, and active-chamber day updates.
*/

const ACE_MIND_SW_VERSION = "25.8.0-performance-transform-20260618";
const CACHE_PREFIX = "ace-mind-cache-";
const PERF_REPLACEMENTS = [["const PATCH_VERSION='ace-supplement-card-repair-v7-single-timing-clubs-2026-06-18';", "const PATCH_VERSION='ace-supplement-card-repair-v8-performance-cache-2026-06-18';", "version"], ["try{state.blockHistory={}; if(typeof render==='function')render(); console.log('ACE Mind Card-Only Bridge active:',PATCH_VERSION);}catch(e){}", "try{state.blockHistory={}; console.log('ACE Mind Card-Only Bridge active:',PATCH_VERSION);}catch(e){}", "suppress-card-bridge-render"], ["  saveState();\n  render();\n  if(!opts.keepYearMapOpen){", "  saveState();\n  try{\n    if(typeof aceRenderActiveDateFast==='function')aceRenderActiveDateFast();\n    else render();\n  }catch(e){try{render();}catch(_){}}\n  if(!opts.keepYearMapOpen){", "fast-setday"], ["  const WEEKLY_DAILY_CAP=12;\n  const WEEKLY_PLAN_CACHE={};\n\n  function isoWeekStart(iso){", "  const WEEKLY_DAILY_CAP=12;\n  const WEEKLY_PLAN_CACHE={};\n  const ACE_DAY_PACKET_CACHE={};\n  const ACE_SCORE_CACHE={};\n  const ACE_TIMING_LAYER_CACHE={};\n  const ACE_BODY_STATE_CACHE={};\n  const ACE_CACHE_LIMIT=96;\n\n  function aceTrimCache(obj,limit){\n    try{\n      const keys=Object.keys(obj||{});\n      if(keys.length<=limit)return;\n      keys.slice(0,keys.length-limit).forEach(k=>delete obj[k]);\n    }catch(e){}\n  }\n  function aceBodyHash(){\n    try{return JSON.stringify(state&&state.body?state.body:{});}catch(e){return 'body';}\n  }\n  function aceCacheKey(iso){return String(iso||brusselsISODate()).slice(0,10)+'__'+aceBodyHash();}\n  function aceGetDayPacket(iso){\n    const key=aceCacheKey(iso);\n    if(ACE_DAY_PACKET_CACHE[key])return ACE_DAY_PACKET_CACHE[key];\n    const d=fwEngineDay(String(iso||brusselsISODate()).slice(0,10));\n    const g=deriveGuidanceV23(d);\n    const pkt={d,g,at:Date.now()};\n    ACE_DAY_PACKET_CACHE[key]=pkt;\n    aceTrimCache(ACE_DAY_PACKET_CACHE,ACE_CACHE_LIMIT);\n    return pkt;\n  }\n  function aceSeasonalLayersCached(iso){\n    const key=String(iso||brusselsISODate()).slice(0,10);\n    if(ACE_TIMING_LAYER_CACHE[key])return ACE_TIMING_LAYER_CACHE[key];\n    const layers=seasonalLayersForDate(key);\n    ACE_TIMING_LAYER_CACHE[key]=layers;\n    aceTrimCache(ACE_TIMING_LAYER_CACHE,ACE_CACHE_LIMIT);\n    return layers;\n  }\n  function aceStateForDateCached(iso){\n    const key=aceCacheKey(iso);\n    if(ACE_BODY_STATE_CACHE[key])return ACE_BODY_STATE_CACHE[key];\n    const out=stateForDate(String(iso||brusselsISODate()).slice(0,10));\n    ACE_BODY_STATE_CACHE[key]=out;\n    aceTrimCache(ACE_BODY_STATE_CACHE,ACE_CACHE_LIMIT);\n    return out;\n  }\n  function aceScoredForDate(iso){\n    const key=aceCacheKey(iso);\n    if(ACE_SCORE_CACHE[key])return ACE_SCORE_CACHE[key];\n    const pkt=aceGetDayPacket(iso);\n    const scored=CARDS.map(card=>scoreCard(card,pkt.d,pkt.g)).sort((a,b)=>b.score-a.score);\n    ACE_SCORE_CACHE[key]=scored;\n    aceTrimCache(ACE_SCORE_CACHE,ACE_CACHE_LIMIT);\n    return scored;\n  }\n  function aceIdle(fn,delay){\n    try{\n      if('requestIdleCallback' in window)return requestIdleCallback(fn,{timeout:delay||1200});\n    }catch(e){}\n    return setTimeout(fn,delay||160);\n  }\n  function acePrewarmSupplementWeeks(seedIso){\n    const seed=String(seedIso||activeDate||brusselsISODate()).slice(0,10);\n    const seeds=[seed, addDays(seed,-7), addDays(seed,7)];\n    seeds.forEach((iso,i)=>aceIdle(()=>{try{buildWeeklyEsotericPlan(iso);}catch(e){console.warn('ACE supplement prewarm skipped',iso,e);}},260+i*260));\n  }\n\n  function isoWeekStart(iso){", "cache-block"], ["const layers=seasonalLayersForDate(iso);", "const layers=aceSeasonalLayersCached(iso);", "seasonal-cache"], ["const bg=bodyGate(card,stateForDate(d.id));", "const bg=bodyGate(card,aceStateForDateCached(d.id));", "body-cache"], ["      for(const iso of dates){\n        try{\n          const wd=fwEngineDay(iso), wg=deriveGuidanceV23(wd);\n          scoredByDate[iso]=CARDS.map(card=>scoreCard(card,wd,wg)).sort((a,b)=>b.score-a.score);\n          byDate[iso]=[];\n        }catch(e){scoredByDate[iso]=[];byDate[iso]=[];}\n      }", "      for(const iso of dates){\n        try{\n          aceGetDayPacket(iso);\n          scoredByDate[iso]=aceScoredForDate(iso);\n          byDate[iso]=[];\n        }catch(e){scoredByDate[iso]=[];byDate[iso]=[];}\n      }", "weekly-loop-cache"], ["const scored=(plan.scoredByDate[d.id]||CARDS.map(card=>scoreCard(card,d,g))).slice().sort((a,b)=>b.score-a.score);", "const scored=(plan.scoredByDate[d.id]||aceScoredForDate(d.id)).slice().sort((a,b)=>b.score-a.score);", "model-score-cache"], ["  window.aceBuildSupplementCardModel=buildSupplementModel;\n  renderClubs=function(d,g){", "  window.aceRenderSuppAlternatives=function(details,date){\n    try{\n      if(!details||!details.open)return;\n      const box=details.querySelector('[data-alt-list]');\n      if(!box||box.dataset.rendered==='1')return;\n      const pkt=aceGetDayPacket(date);\n      const model=buildSupplementModel(pkt.d,pkt.g);\n      box.dataset.rendered='1';\n      box.innerHTML=model.held.length?model.held.map(x=>renderItem(x,pkt.d.id,false)).join(''):'<div class=\"tiny\">No alternatives held for this date.</div>';\n      try{if(typeof fwUpdateTimingBadges==='function')fwUpdateTimingBadges();}catch(e){}\n    }catch(e){try{details.querySelector('[data-alt-list]').innerHTML='<div class=\"tiny\">Alternatives unavailable: '+html(e.message||e)+'</div>';}catch(_){} }\n  };\n  window.aceBuildSupplementCardModel=buildSupplementModel;\n  renderClubs=function(d,g){", "lazy-alts-function"], ["    root.innerHTML=supplementSummary(d,g,model)+renderGroups(model.selected,d.id,true)+`<details class=\"supp-group\"><summary class=\"supp-head\">Not today / alternatives · ${model.held.length}</summary>${model.held.map(x=>renderItem(x,d.id,false)).join('')}</details>`;", "    root.innerHTML=supplementSummary(d,g,model)+renderGroups(model.selected,d.id,true)+`<details class=\"supp-group\" ontoggle=\"this.open&&window.aceRenderSuppAlternatives&&window.aceRenderSuppAlternatives(this,'${html(d.id)}')\"><summary class=\"supp-head\">Not today / alternatives · ${model.held.length}</summary><div data-alt-list=\"1\"><div class=\"tiny\" style=\"padding:10px 4px;color:var(--muted)\">Open to render alternatives only when needed.</div></div></details>`;", "lazy-alts-dom"], ["    try{if(typeof fwUpdateTimingBadges==='function')fwUpdateTimingBadges();}catch(e){}\n  };\n  renderDayRail=function(){", "    try{if(typeof fwUpdateTimingBadges==='function')fwUpdateTimingBadges();}catch(e){}\n  };\n  window.aceRenderActiveDateFast=function(){\n    try{\n      const grid=document.getElementById('grid-'+activeChamber);\n      if(!grid){render();return;}\n      const pkt=aceGetDayPacket(activeDate||brusselsISODate());\n      renderDayRail();\n      if(activeChamber==='spades')renderSpades(pkt.d,pkt.g);\n      else if(activeChamber==='clubs')renderClubs(pkt.d,pkt.g);\n      else if(activeChamber==='diamonds')renderDiamonds(pkt.d,pkt.g);\n      else if(activeChamber==='hearts')renderHearts(pkt.d,pkt.g);\n      else if(activeChamber==='jester')renderJester(pkt.d,pkt.g);\n      else if(activeChamber==='temporal')renderTemporal(pkt.d,pkt.g);\n      setChamber(activeChamber,false,true);\n      safeHeaderLogo();\n    }catch(e){render();}\n  };\n  renderDayRail=function(){", "active-fast-function"], ["  renderDayRail=function(){\n    const d=day();", "  renderDayRail=function(){\n    const d=(typeof aceGetDayPacket==='function'?aceGetDayPacket(activeDate||brusselsISODate()).d:day());", "dayrail-cache"], ["  renderDayRail=function(){\n    const d=day();", "  renderDayRail=function(){\n    const d=(typeof aceGetDayPacket==='function'?aceGetDayPacket(activeDate||brusselsISODate()).d:day());", "dayrail-cache"], ["        try{\n          const d=fwEngineDay(isoDate), g=deriveGuidanceV23(d), m=buildSupplementModel(d,g);\n          const strong=m.selected.filter(x=>x.score>=.74).length;\n          cls=strong>=3?'green':m.selected.length>=4?'yellow':m.selected.length?'orange':'red';\n          title=`${isoDate} · ${m.selected.length} card candidates`;\n        }catch(e){cls='orange'}", "        try{\n          const obj=fwEngineDay(isoDate);\n          cls=typeof fwYearMapStatusFastV2524==='function'?fwYearMapStatusFastV2524(obj):'green';\n          title=`${isoDate} · lightweight day marker`;\n        }catch(e){cls='orange'}", "yearmap-light-cells"], ["const d=fwEngineDay(sel), g=deriveGuidanceV23(d), model=buildSupplementModel(d,g);", "const pkt=aceGetDayPacket(sel), d=pkt.d, g=pkt.g, model=buildSupplementModel(d,g);", "yearmap-preview-cache"], ["    saveState();\n    render();\n  };", "    saveState();\n    try{\n      const pkt=aceGetDayPacket(date);\n      renderClubs(pkt.d,pkt.g);\n    }catch(e){try{render();}catch(_){} }\n  };", "tick-fast-render"], ["  try{\n    state.blockHistory={};", "  try{\n    if(typeof setChamber==='function'&&!window.__ACE_FAST_CHAMBER_RENDER_V8__){\n      window.__ACE_FAST_CHAMBER_RENDER_V8__=true;\n      const baseSetChamberV8=setChamber;\n      setChamber=function(id,save,fromHistory){\n        const out=baseSetChamberV8.apply(this,arguments);\n        try{\n          if(typeof aceRenderActiveDateFast==='function'&&!fromHistory){\n            const pkt=aceGetDayPacket(activeDate||brusselsISODate());\n            if(activeChamber==='spades')renderSpades(pkt.d,pkt.g);\n            else if(activeChamber==='clubs')renderClubs(pkt.d,pkt.g);\n            else if(activeChamber==='diamonds')renderDiamonds(pkt.d,pkt.g);\n            else if(activeChamber==='hearts')renderHearts(pkt.d,pkt.g);\n            else if(activeChamber==='jester')renderJester(pkt.d,pkt.g);\n            else if(activeChamber==='temporal')renderTemporal(pkt.d,pkt.g);\n          }\n        }catch(e){}\n        return out;\n      };\n    }\n  }catch(e){}\n  try{\n    state.blockHistory={};", "wrap-setchamber"], ["window.ACE_SUPPLEMENT_POLICY_V4={patch:PATCH_VERSION,", "window.ACE_SUPPLEMENT_POLICY_V4={patch:PATCH_VERSION,performance:'day-packet-cache+lazy-alternatives+lazy-year-map',", "policy-perf"], ["  try{render();}catch(e){console.error('ACE supplement card repair render failed',e);}", "  try{if(typeof appInitialized==='undefined'||appInitialized)render();}catch(e){console.error('ACE supplement card repair render failed',e);}\n  try{acePrewarmSupplementWeeks(activeDate||brusselsISODate());}catch(e){}", "final-render-prewarm"]];

function aceApplyPerformanceTransform(html) {
  let out = String(html || "");
  let applied = 0;
  const missed = [];
  for (const row of PERF_REPLACEMENTS) {
    const needle = row[0];
    const replacement = row[1];
    const label = row[2] || "replacement";
    if (out.includes(needle)) {
      out = out.replace(needle, replacement);
      applied++;
    } else {
      missed.push(label);
    }
  }
  const marker = `<script>window.ACE_MIND_SW_PERFORMANCE_PATCH={version:"${ACE_MIND_SW_VERSION}",applied:${applied},missed:${JSON.stringify(missed)}};<\/script>`;
  if (out.includes("</body>")) out = out.replace("</body>", marker + "\n</body>");
  return out;
}

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX))
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isAceMindHtml = url.pathname.endsWith("/ace-mind.html");
  if (isAceMindHtml) {
    event.respondWith(
      (async () => {
        const response = await fetch(request, { cache: "no-store" });
        const html = await response.text();
        const patched = aceApplyPerformanceTransform(html);
        const headers = new Headers(response.headers);
        headers.set("content-type", "text/html; charset=utf-8");
        headers.set("cache-control", "no-store, must-revalidate");
        headers.set("x-ace-mind-sw-version", ACE_MIND_SW_VERSION);
        return new Response(patched, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      })()
    );
    return;
  }

  const criticalAsset =
    url.pathname.endsWith("/shared/js/flamewalker-canonical-profile-v3-3.js") ||
    url.pathname.includes("/shared/optimizer/") ||
    url.pathname.includes("/shared/data/supplements/") ||
    url.pathname.includes("/packages/engines/supplement/");

  if (criticalAsset) {
    event.respondWith(fetch(request, { cache: "no-store" }));
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = "./ace-mind.html?v=2580-performance-transform-20260618";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        try {
          if (client.url.includes("ace-mind.html")) {
            await client.focus();
            return;
          }
        } catch (error) {}
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener("notificationclose", event => {
  // Reserved for future ACE Halo / Attention Garden.
});

self.addEventListener("message", event => {
  const data = event.data || {};

  if (data.type === "ACE_MIND_SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "ACE_MIND_VERSION_REQUEST") {
    event.source?.postMessage({
      type: "ACE_MIND_SW_VERSION",
      version: ACE_MIND_SW_VERSION,
      canonical: "./ace-mind.html",
      runtime: "./ace-mind.html",
      trace_store: "./shared/js/ace-mind-trace-store-v0-1.js",
      cache_mode: "performance-transform-network-no-store"
    });
  }
});
