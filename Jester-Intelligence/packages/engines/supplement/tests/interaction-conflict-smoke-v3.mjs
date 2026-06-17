import assert from 'node:assert/strict';
import { evaluatePairingRegistry } from '../pairing-compatibility-engine.mjs';

const registry={supplements:[
  {id:'a',name:'A',available:true,autoSelection:'allowed',classes:['alpha'],pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:['b'],avoidSameSlot:[],redundantWith:[]}},
  {id:'b',name:'B',available:true,autoSelection:'allowed',classes:['beta'],pairing:{requiredCompanions:[],preferredPairs:[],avoidSameDay:['a'],avoidSameSlot:[],redundantWith:[]}}
]};
const map=evaluatePairingRegistry(registry,['a','b']);
assert.equal(map.a.state,'conflict');
assert.equal(map.b.state,'conflict');
console.log(JSON.stringify({ok:true,checks:2},null,2));
