import fs from 'node:fs';

const file='Jester-Intelligence/ACED-Lifestyle/ace-mind.html';
const source=fs.readFileSync(file,'utf8');
const lines=source.split(/\r?\n/);
const terms=[
  'fwFreezeBlock','aceFreezeSelectedBlock','persistAssignment','blockHistory',
  'finalBlock','blockAssignment','theonBlockSelection','renderClubs','suppLog.block',
  'Block 1','Block 2','Block 3','Block 4','Block 5','Block 6','Block 7','Block 8','Block 9',
  'Loading supplement optimizer…','Loading supplement optimizer...'
];
const report={file,totalLines:lines.length,terms:{},functions:[]};
for(const term of terms){
  const hits=[];
  for(let i=0;i<lines.length;i++)if(lines[i].includes(term))hits.push({line:i+1,text:lines[i].trim().slice(0,280)});
  report.terms[term]=hits;
}
for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if(m&&/(Block|block|Clubs|Supp|supp)/.test(m[1]))report.functions.push({name:m[1],line:i+1});
}
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ace-mind-supplement-runtime-audit.json',JSON.stringify(report,null,2));
console.log('ACE_MIND_SUPPLEMENT_RUNTIME_AUDIT');
console.log(`totalLines=${report.totalLines}`);
for(const term of terms){
  const hits=report.terms[term];
  const first=hits.slice(0,12).map(hit=>hit.line).join(',');
  console.log(`${term}=${hits.length}${first?` lines:${first}`:''}`);
}
console.log(`functions=${report.functions.map(item=>`${item.name}@${item.line}`).join(',')}`);
