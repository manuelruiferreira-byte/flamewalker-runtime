/* User-state CRDT. Never imported by the resonance engine. */
(function(root){'use strict';
const SCHEMA='ace-user-sync-1',MAPS=['supp','notes','practices','bodyPlan','bodyLog'];
const safe=k=>typeof k==='string'&&!['__proto__','constructor','prototype'].includes(k);
function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
function flatten(state){
 const out=Object.create(null),put=(field,key,value)=>{if(safe(key))out[JSON.stringify([field,key])]=value;};
 for(const field of MAPS)for(const [key,value]of Object.entries(state[field]||{}))put(field,key,value);
 for(const log of state.logs||[])put('logs',canonical(log),log);
 for(const [date,log]of Object.entries(state.suppLog||{}))for(const event of log.events||[])put('suppEvents',date+'__'+canonical(event),{date,event});
 return out;
}
function valid(op){
 if(!op||!Array.isArray(op.stamp)||op.stamp.length!==3||!Number.isSafeInteger(op.stamp[0])||!Number.isSafeInteger(op.stamp[1])||op.stamp[0]<0||op.stamp[1]<0||typeof op.stamp[2]!=='string'||op.stamp[2].length>100)return false;
 let p;try{p=JSON.parse(op.key);}catch{return false;}
 if(!Array.isArray(p)||p.length!==2||!safe(p[1])||![...MAPS,'logs','suppEvents'].includes(p[0])||op.key.length>30000||typeof op.deleted!=='boolean')return false;
 if(op.deleted)return true;
 if(['supp','practices'].includes(p[0]))return typeof op.value==='boolean';
 if(p[0]==='notes')return typeof op.value==='string'&&op.value.length<=100000;
 if(p[0]==='bodyPlan')return ['green','yellow','orange','red'].includes(op.value);
 return op.value&&typeof op.value==='object'&&!Array.isArray(op.value)&&JSON.stringify(op.value).length<=100000;
}
function compare(a,b){for(let i=0;i<3;i++){if(a.stamp[i]!==b.stamp[i])return a.stamp[i]<b.stamp[i]?-1:1;}const x=canonical(a),y=canonical(b);return x<y?-1:x>y?1:0;}
function merge(...sets){const out=Object.create(null);for(const set of sets)for(const op of Object.values(set||{})){if(!valid(op))throw Error('Unsupported or invalid sync record');if(!out[op.key]||compare(out[op.key],op)<0)out[op.key]=op;}return out;}
function diff(before,after,records,actor,now,seed=false){
 const changes=Object.create(null);let wall=seed?0:Math.max(0,Math.floor(now)),logical=0;
 if(!seed)for(const op of Object.values(records)){if(op.stamp[0]>wall){wall=op.stamp[0];logical=op.stamp[1]+1;}else if(op.stamp[0]===wall)logical=Math.max(logical,op.stamp[1]+1);}
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(canonical(before[key])===canonical(after[key]))continue;
  if(!Object.hasOwn(after,key)&&['logs','suppEvents'].includes(JSON.parse(key)[0]))continue; // Journals append; old UI pruning never deletes cloud history.
  const op={key,stamp:[wall,logical++,actor],deleted:!Object.hasOwn(after,key)};
  if(!op.deleted)op.value=after[key];
  if(!valid(op))throw Error('Local data is too large or unsupported for sync');changes[key]=op;
 }
 return changes;
}
function apply(state,records){
 const out=JSON.parse(JSON.stringify(state));for(const f of MAPS)out[f]={...(out[f]||{})};out.logs=[...(out.logs||[])];out.suppLog=out.suppLog||{};
 const logs=new Map(out.logs.map(x=>[canonical(x),x]));
 for(const op of Object.values(records)){
  const [field,key]=JSON.parse(op.key);
  if(MAPS.includes(field)){if(op.deleted)delete out[field][key];else out[field][key]=op.value;}
  else if(field==='logs'){if(op.deleted)logs.delete(key);else logs.set(key,op.value);}
  else if(!op.deleted){const {date,event}=op.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!event||typeof event!=='object')throw Error('Invalid supplement event');const log=out.suppLog[date]||{};const events=new Map((log.events||[]).map(x=>[canonical(x),x]));events.set(canonical(event),event);out.suppLog[date]={...log,events:[...events.values()].sort((a,b)=>canonical(a).localeCompare(canonical(b)))};}
 }
 out.logs=[...logs.values()].sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||canonical(a).localeCompare(canonical(b)));
 for(const date of new Set([...Object.keys(out.suppLog),...Object.keys(out.supp).map(k=>k.slice(0,10))])){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;out.suppLog[date]={...(out.suppLog[date]||{}),taken:Object.keys(out.supp).filter(k=>k.startsWith(date+'__')&&out.supp[k]).map(k=>k.slice(12)).sort()};}
 out.body=out.bodyPlan;return out;
}
function batch(id,ops){return {schema:SCHEMA,id,records:ops};}
function readBatch(data){if(!data||data.schema!==SCHEMA||typeof data.id!=='string'||!data.records||Array.isArray(data.records)||Object.keys(data.records).length>10000)throw Error('Unknown Drive sync schema');if(data.sourceIds&&(!Array.isArray(data.sourceIds)||data.sourceIds.length>10000||data.sourceIds.some(x=>typeof x!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(x))))throw Error('Invalid batch source IDs');return merge(data.records);}
const api={SCHEMA,MAPS,canonical,flatten,merge,diff,apply,batch,readBatch,valid};if(typeof module==='object')module.exports=api;else root.ACEUserSync=api;
})(globalThis);
