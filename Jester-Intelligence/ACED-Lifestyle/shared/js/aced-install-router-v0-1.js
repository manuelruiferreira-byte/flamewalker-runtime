/* ACED Install Router v0.1
   Separates app launch URLs so apps in the same folder can still install as distinct PWAs.
   No app logic mutation. Router only rewrites launcher links to install-shell pages.
*/
(function acedInstallRouterV01(){
  'use strict';
  if(window.__ACED_INSTALL_ROUTER_V01__)return;
  window.__ACED_INSTALL_ROUTER_V01__=true;
  const VERSION='aced-install-router-v0.1';
  const ROUTES={
    mind:'./app-ace-mind.html',
    gravitic:'./app-ace-gravitic.html',
    theon:'./app-theon-analyst.html',
    analyst:'./app-theon-analyst.html',
    lifestyle:'./app-aced-lifestyle.html'
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
      if(typeof window.launchApp==='function'&&!window.launchApp.__acedInstallRouterWrapped){
        const base=window.launchApp;
        window.launchApp=function patchedLaunchApp(id){
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
        window.launchApp.__acedInstallRouterWrapped=true;
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
