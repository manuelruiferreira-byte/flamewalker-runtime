/* ACED Install Router v0.3
   Routes launcher/tree cards to isolated sibling PWA scopes outside ACED-Lifestyle.
   Also normalizes ACE Prism branding to the canonical user-provided logo.
   No app logic mutation. Router only rewrites launch links and logo references.
*/
(function acedInstallRouterV03(){
  'use strict';
  if(window.__ACED_INSTALL_ROUTER_V03__)return;
  window.__ACED_INSTALL_ROUTER_V03__=true;
  const VERSION='aced-install-router-v0.3-prism-logo';
  const ROUTES={
    lifestyle:'../ACED-Lifestyle-App/',
    mind:'../ACE-Mind-App/',
    gravitic:'../ACE-Gravitic-App/',
    scholar:'../ACE-Scholar-App/',
    cluster:'../ACE-Cluster-App/',
    quantum:'../ACE-Quantum-App/',
    matrix:'../ACE-Matrix-App/',
    prism:'../ACE-Prism-App/',
    enchanted:'../ACE-Enchanted-App/',
    theon:'../THEON-Analyst-App/',
    analyst:'../THEON-Analyst-App/'
  };
  const PRISM_LOGO='../ACE-Prism-App/ace-prism-user-logo.svg?v=1.1.3';
  function routeFor(id,fallback){return ROUTES[String(id||'').toLowerCase()]||fallback||'#';}
  function rewriteLinks(root){
    root=root||document;
    try{
      root.querySelectorAll('[data-app-id]').forEach(el=>{
        const id=el.getAttribute('data-app-id');
        const url=routeFor(id,el.getAttribute('href')||'#');
        if(el.tagName==='A'){
          el.setAttribute('href',url);
          el.setAttribute('target','_top');
        }
      });
    }catch(e){}
  }
  function rewritePrismLogos(root){
    root=root||document;
    try{
      root.querySelectorAll('img').forEach(img=>{
        const src=img.getAttribute('src')||'';
        const alt=(img.getAttribute('alt')||'').toLowerCase();
        if(src.includes('ace-prism.png')||src.includes('ace-prism-icon.svg')||alt==='ace prism'){
          img.setAttribute('src',PRISM_LOGO);
          img.setAttribute('alt','ACE Prism');
        }
      });
    }catch(e){}
  }
  function installLaunchPatch(){
    try{
      if(typeof window.launchApp==='function'&&!window.launchApp.__acedInstallRouterV03Wrapped){
        const base=window.launchApp;
        window.launchApp=function patchedLaunchAppV03(id){
          const url=routeFor(id,null);
          if(url){
            try{
              if(window.state&&Array.isArray(window.state.logs)){window.state.logs.push({type:'launch',app:id,route:url,router:VERSION,at:new Date().toISOString()});}
              if(typeof window.saveState==='function')window.saveState();
            }catch(e){}
            window.top.location.href=url;
            return;
          }
          return base.apply(this,arguments);
        };
        window.launchApp.__acedInstallRouterV03Wrapped=true;
      }
    }catch(e){}
  }
  function refresh(){rewriteLinks(document);rewritePrismLogos(document);installLaunchPatch();}
  function boot(){
    refresh();
    setTimeout(refresh,400);
    setTimeout(refresh,1200);
    try{
      const observer=new MutationObserver(()=>rewritePrismLogos(document));
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
    try{console.log('ACED Install Router active:',VERSION);}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
