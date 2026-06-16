#!/usr/bin/env node
import fs from 'node:fs';

const path=process.argv[2]||'Jester-Intelligence/ACED-Lifestyle/ace-mind.html';
const tag='<script type="module" src="./shared/optimizer/ace-mind-optimizer-shadow.mjs"></script>';
const legacyPath='./shared/js/ace-mind-optimizer-shadow.mjs';
let html=fs.readFileSync(path,'utf8');

if(html.includes(legacyPath)){
  throw new Error(`Legacy optimizer shadow loader still present: ${legacyPath}`);
}

const occurrences=html.split(tag).length-1;
if(occurrences>1)throw new Error(`Expected at most one optimizer shadow loader, found ${occurrences}`);
if(occurrences===0){
  const index=html.lastIndexOf('</body>');
  if(index<0)throw new Error('Cannot install optimizer shadow loader: closing body tag not found');
  html=`${html.slice(0,index)}${tag}\n${html.slice(index)}`;
  fs.writeFileSync(path,html,'utf8');
}

const finalCount=html.split(tag).length-1;
if(finalCount!==1)throw new Error(`Optimizer shadow loader cardinality failure: ${finalCount}`);
console.log(JSON.stringify({ok:true,path,loader:tag,changed:occurrences===0},null,2));
