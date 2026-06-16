#!/usr/bin/env node
import fs from 'node:fs';

const file = process.argv[2] || 'Jester-Intelligence/ACED-Lifestyle/ace-mind.html';
const marker = 'id="ace-mind-optimizer-shadow-loader"';
const tag = '<script type="module" id="ace-mind-optimizer-shadow-loader" src="./shared/js/ace-mind-optimizer-shadow.mjs"></script>';
let html = fs.readFileSync(file, 'utf8');

if (html.includes(marker)) {
  console.log(JSON.stringify({ ok:true, changed:false, file, marker }, null, 2));
  process.exit(0);
}

if (!html.includes('</body>')) {
  throw new Error(`Cannot install shadow loader: missing </body> in ${file}`);
}

html = html.replace('</body>', `${tag}\n</body>`);
fs.writeFileSync(file, html, 'utf8');
console.log(JSON.stringify({ ok:true, changed:true, file, marker }, null, 2));
