#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(here, "supplement-registry.manifest.v1.json"), "utf8"));
const errors = [];
const fail = (m) => errors.push(m);
const requiredAxes = ["heart","brain","nervous","sleep","liver","gut","immune","muscle_back","skin_connective","endocrine","energy_mito"];
const requiredDomains = ["career","study","social","leisure","love","creative","spirit","body","money"];
const statuses = new Set(["active","caution_sensitive","manual_research","personal_exclusion","unavailable"]);
const automation = new Set(["eligible","conditional","manual_only","excluded"]);
const refFields = ["required_companions","preferred_pairs","avoid_same_day","avoid_same_slot","redundant_with"];

const supplements = [];
for (const rel of manifest.shards) {
  const full = path.join(here, rel);
  if (!fs.existsSync(full)) {
    fail(`Missing shard ${rel}`);
    continue;
  }
  const shard = JSON.parse(fs.readFileSync(full, "utf8"));
  if (shard.schema_version !== manifest.schema_version) fail(`${rel}: schema version mismatch`);
  supplements.push(...shard.supplements);
}
const ids = supplements.map((s) => s.id);
const idSet = new Set(ids);
if (ids.length !== manifest.expected_supplement_count) fail(`Expected ${manifest.expected_supplement_count} supplements, found ${ids.length}`);
if (ids.length !== idSet.size) fail("Duplicate supplement ids");
const byId = Object.fromEntries(supplements.map((s) => [s.id, s]));

for (const s of supplements) {
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(s.id)) fail(`${s.id}: invalid id`);
  if (!statuses.has(s.personal_status)) fail(`${s.id}: invalid personal_status`);
  if (!automation.has(s.automation_policy)) fail(`${s.id}: invalid automation_policy`);
  if (s.frequency.target_uses_7d > s.frequency.max_uses_7d) fail(`${s.id}: target exceeds max`);
  if (["excluded","manual_only"].includes(s.automation_policy) && s.frequency.max_uses_7d !== 0) fail(`${s.id}: non-automatic item max must be zero`);
  for (const axis of requiredAxes) {
    const benefit = s.body_vectors.benefit[axis];
    const burden = s.body_vectors.burden[axis];
    if (!Number.isInteger(benefit) || benefit < 0 || benefit > 3) fail(`${s.id}: invalid benefit ${axis}`);
    if (!Number.isInteger(burden) || burden < 0 || burden > 3) fail(`${s.id}: invalid burden ${axis}`);
  }
  for (const domain of requiredDomains) {
    const v = s.domain_affinity[domain];
    if (typeof v !== "number" || v < 0 || v > 1) fail(`${s.id}: invalid domain ${domain}`);
  }
  for (const field of refFields) {
    for (const ref of s.pairing[field]) if (!idSet.has(ref)) fail(`${s.id}: unknown ${field} ref ${ref}`);
  }
}
for (const nad of ["nr","nmn","nmnh"]) {
  const req = new Set(byId[nad].pairing.required_companions);
  if (!req.has("tmg") || !req.has("magnesium_citrate")) fail(`${nad}: missing mandatory companions`);
}
if (byId.ashwagandha.automation_policy !== "excluded") fail("Ashwagandha must remain excluded");
for (const id of ["fadogia_agrestis","turkesterone"]) if (byId[id].automation_policy !== "manual_only") fail(`${id} must remain manual_only`);
if (byId.shilajit.frequency.target_uses_7d !== 2 || byId.shilajit.frequency.max_uses_7d !== 2) fail("Shilajit must be exactly 2/week");
if (byId.lion_mane.frequency.target_uses_7d < 3) fail("Lion's Mane must target at least 3/week");
for (const id of ["spermidine","spirulina"]) if (byId[id].frequency.target_uses_7d !== 2) fail(`${id} must target 2/week`);
if (byId.cordyceps.frequency.target_mode !== "conditional") fail("Cordyceps must be conditional");
if (manifest.groups.nad_booster_triad.group_target_uses_7d !== 5) fail("NAD group target must be 5/week");
if (manifest.groups.night_calm_triad.max_members_same_night !== 1) fail("Night calm triad must be one per night");

const canonical = JSON.stringify({ manifest, supplements: [...supplements].sort((a,b)=>a.id.localeCompare(b.id)) });
const hash = crypto.createHash("sha256").update(canonical).digest("hex");
if (errors.length) {
  console.error(errors.map((e) => `ERROR: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Registry valid: ${supplements.length} supplements across ${manifest.shards.length} shards`);
console.log(`SHA-256: ${hash}`);
