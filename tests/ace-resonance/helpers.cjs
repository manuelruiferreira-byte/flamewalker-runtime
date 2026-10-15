const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const app=path.resolve(__dirname,'../../Jester-Intelligence/ACED-Lifestyle');
const source=fs.readFileSync(app+'/ace-mind.html','utf8');
const C=require(app+'/shared/resonance/canonical-v1.js');
function profile(){const a=source.indexOf('const FW_MEASUREMENT_RECORD ='),b=source.indexOf('\n',a);const record=vm.runInNewContext(source.slice(a,b)+';FW_MEASUREMENT_RECORD');const c=source.indexOf('const FW_NATAL_PROFILE ='),d=source.indexOf('\nconst ANCHORS',c);return vm.runInNewContext(source.slice(c,d)+';FW_NATAL_PROFILE',{ACECanonical:C,FW_MEASUREMENT_RECORD:record});}
module.exports={app,source,profile};
