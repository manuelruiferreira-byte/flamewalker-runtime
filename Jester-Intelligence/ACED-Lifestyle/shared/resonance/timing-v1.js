/* Separate approximate solar timing. Fixed reference location, no device geolocation. */
(function(root){'use strict';
const E=typeof module==='object'?require('./engine-v1.js'):root.ACEResonance;
const LOCATION=Object.freeze({lat:50.85,lon:4.35,label:'Brussels reference',timezone:'Europe/Brussels',version:'brussels-reference-1'});
const planets=['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'],rulers=[3,6,2,5,1,4,0],rad=Math.PI/180;
const mod=(n,m)=>(n%m+m)%m;
function solar(date,location=LOCATION){
 const ms=E.dateValue(date),year=Number(date.slice(0,4));
 if(!Number.isFinite(location.lat)||!Number.isFinite(location.lon)||Math.abs(location.lat)>90||Math.abs(location.lon)>180)throw Error('Invalid reference coordinates');
 const day=Math.round((ms-E.dateValue(year+'-01-01'))/86400000)+1;
 const leap=year%4===0&&(year%100!==0||year%400===0),gamma=2*Math.PI/(leap?366:365)*(day-1);
 const eq=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
 const dec=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
 const cosH=Math.cos(90.833*rad)/(Math.cos(location.lat*rad)*Math.cos(dec))-Math.tan(location.lat*rad)*Math.tan(dec);
 if(Math.abs(cosH)>1)return null;
 const ha=Math.acos(cosH)/rad,noon=720-4*location.lon-eq;
 return {rise:ms+(noon-4*ha)*60000,set:ms+(noon+4*ha)*60000};
}
function local(utc){
 // Pin EU post-1996 DST rules instead of relying on device timezone databases.
 const d=new Date(utc),year=d.getUTCFullYear();
 const lastSunday=m=>{const x=new Date(Date.UTC(year,m+1,0,1));x.setUTCDate(x.getUTCDate()-x.getUTCDay());return x.getTime();};
 const summer=utc>=lastSunday(2)&&utc<lastSunday(9),offset=summer?120:60;
 const shifted=new Date(utc+offset*60000).toISOString();
 return {date:shifted.slice(0,10),time:shifted.slice(11,16),zone:summer?'CEST':'CET',utcOffset:summer?'+02:00':'+01:00',timezone:'Europe/Brussels'};
}
function hours(date,location=LOCATION){
 const ms=E.dateValue(date),year=Number(date.slice(0,4));
 if(year<1996||year>2099)return {date,status:'unavailable: timing range 1996–2099',hours:[],location};
 const today=solar(date,location),tomorrow=solar(new Date(ms+86400000).toISOString().slice(0,10),location);
 if(!today||!tomorrow)return {date,status:'unavailable: sunrise or sunset absent',hours:[],location};
 const startIndex=rulers[new Date(ms).getUTCDay()],out=[];
 for(let i=0;i<24;i++){
  const start=i<12?today.rise+(today.set-today.rise)*i/12:today.set+(tomorrow.rise-today.set)*(i-12)/12;
  const end=i<12?today.rise+(today.set-today.rise)*(i+1)/12:today.set+(tomorrow.rise-today.set)*(i-11)/12;
  const a=Math.round(start/60000)*60000,b=Math.round(end/60000)*60000;
  out.push({planet:planets[mod(startIndex+i,7)],startUTC:new Date(a).toISOString(),endUTC:new Date(b).toISOString(),start:local(a),end:local(b),period:i<12?'day':'night'});
 }
 return {date,status:'approximate solar calculation, rounded to minute',method:'NOAA fractional-year solar approximation; 90.833° zenith; fixed EU DST rules',location,hours:out};
}
function recommendation(date,card,location=LOCATION){const h=hours(date,location);const matches=h.hours.filter(x=>(card.planets||[]).includes(x.planet)&&x.start.date===date);const preferred=(card.windows||[]).includes('night')?'night':'day';return {date,status:h.status,location,window:matches.find(x=>x.period===preferred)||matches[0]||null};}
function isNow(window,clockMs){return !!window&&Number.isFinite(clockMs)&&clockMs>=Date.parse(window.startUTC)&&clockMs<Date.parse(window.endUTC);}
const api={LOCATION,solar,local,hours,recommendation,isNow};if(typeof module==='object')module.exports=api;else root.ACETiming=api;
})(globalThis);
