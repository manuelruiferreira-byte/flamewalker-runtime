import { evaluateEsotericFit, DEFAULT_ESOTERIC_CONFIG } from '../esoteric-fit-engine.mjs';

let passed=0,failed=0;
const failures=[];
function assert(ok,msg){if(ok)passed++;else{failed++;failures.push(msg);console.error('FAIL:',msg);}}

const supplement={
  id:'probe',name:'Probe',
  esotericSignature:{
    numerology:{numerologySum:14,numerologyRoot:5,resonantNumbers:[5],constructiveQualities:['renewal']},
    bazi:{dayMasterStem:'Bing',primaryElement:'Fire',polarity:'Yang',energeticDirection:'outward',seasonalAffinity:['summer']},
    astrology:{primaryPlanets:['Sun'],elements:['Fire'],planetaryHourAffinity:[]},
    mayan:{dreamspell:'Yellow Sun'}
  }
};
const high=tags=>({scalar:.9,tags});
const low=()=>({scalar:0,tags:['unrelated']});
const run=(numerology,bazi,astrology,mayan)=>evaluateEsotericFit(supplement,{numerology,bazi,astrology,mayan});

assert(JSON.stringify(DEFAULT_ESOTERIC_CONFIG.SYSTEM_WEIGHTS)===JSON.stringify({numerology:.5,bazi:.3,astrology:.12,mayan:.08}),'weights are numerology first and BaZi second');
assert(run(high(['14','5']),high(['Bing','Fire','Yang']),high(['Sun','Fire']),low()).convergenceLabel==='Golden','numerology + BaZi + support = Golden');
assert(run(high(['14','5']),high(['Bing','Fire','Yang']),low(),low()).convergenceLabel==='High','numerology + BaZi = High');
assert(run(high(['14','5']),low(),high(['Sun','Fire']),low()).convergenceLabel==='Medium','numerology + support = Medium');
assert(run(high(['14','5']),low(),low(),low()).convergenceLabel==='Low','numerology alone = Low');
assert(run(low(),high(['Bing','Fire','Yang']),high(['Sun','Fire']),low()).convergenceLabel==='Low','BaZi + support cannot outrank missing numerology');
assert(run(low(),high(['Bing','Fire','Yang']),low(),low()).convergenceLabel==='None','BaZi alone = None');

const result=run(high(['14','5','renewal']),high(['Bing','Fire','Yang']),high(['Sun','Fire']),low());
assert(result.authorityOrder[0]==='numerology'&&result.authorityOrder[1]==='bazi','authority order exposed');
assert(result.primaryScalar===result.components.numerology.scalar,'primary scalar is numerology');
assert(result.secondaryScalar===result.components.bazi.scalar,'secondary scalar is BaZi');
assert(result.components.bazi.matchedTags.includes('bing'),'BaZi stem matched');
assert(result.components.bazi.matchedTags.includes('yang'),'BaZi polarity matched');
assert(result.components.numerology.matchedTags.includes('14'),'compound numerology matched');
assert(result.components.numerology.matchedTags.includes('5'),'numerology root matched');

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if(failures.length){for(const failure of failures)console.log(' -',failure);process.exit(1);}
