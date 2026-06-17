import assert from 'node:assert/strict';
import fs from 'node:fs';
const text=fs.readFileSync(new URL('../../../../ACED-Lifestyle/shared/optimizer/optimizer-visible-renderer.mjs',import.meta.url),'utf8');
assert.ok(text.includes('fwComputeTimingBadge'));
assert.ok(text.includes('data-timing-name'));
assert.ok(text.includes('fwUpdateTimingBadges'));
console.log(JSON.stringify({ok:true,checks:3},null,2));
