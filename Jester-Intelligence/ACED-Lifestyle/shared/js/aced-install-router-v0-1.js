/* ACED Install Router v0.2
   Routes launcher/tree cards to isolated sibling PWA scopes outside ACED-Lifestyle.
   No app logic mutation. Router only rewrites launch links.
*/
(function acedInstallRouterV02(){
  'use strict';
  if(window.__ACED_INSTALL_ROUTER_V02__)return;
  window.__ACED_INSTALL_ROUTER_V02__=true;
  const VERSION='aced-install-router-v0.2-isolated-scopes';
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
  function routeFor(id, fallback){return ROUTES[String(id||'').toLowerCase()]||fallback||'#';}
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
  function installLaunchPatch(){
    try{
      if(typeof window.launchApp==='function'&&!window.launchApp.__acedInstallRouterV02Wrapped){
        const base=window.launchApp;
        window.launchApp=function patchedLaunchAppV02(id){
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
        window.launchApp.__acedInstallRouterV02Wrapped=true;
      }
    }catch(e){}
  }
  function boot(){
    rewriteLinks(document);
    installLaunchPatch();
    setTimeout(()=>{rewriteLinks(document);installLaunchPatch();},400);
    setTimeout(()=>{rewriteLinks(document);installLaunchPatch();},1200);
    try{console.log('ACED Install Router active:',VERSION);}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
