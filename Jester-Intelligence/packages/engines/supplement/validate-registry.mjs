#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const registryDir = path.join(here, "registry");
const errors = [];
const fail = (message) => errors.push(message);
const EXPECTED_COUNT = 42;
const SCHEMA_VERSION = "1.0.0";
const requiredAxes = ["heart","brain","nervous","sleep","liver","gut","immune","muscle_back","skin_connective","endocrine","energy_mito"];
const requiredDomains = ["career","study","social","leisure","love","creative","spirit","body","money"];
const statuses = new Set(["active","caution_sensitive","manual_research","personal_exclusion","unavailable"]);
const automation = new Set(["eligible","conditional","manual_only","excluded"]);
const refFields = ["required_companions","preferred_pairs","avoid_same_day","avoid_same_slot","redundant_with"];

const shardFiles = fs.readdirSync(registryDir).filter((name) => name.endsWith(".json")).sort();
const supplements = [];
for (const name of shardFiles) {
  const shard = JSON.parse(fs.readFileSync(path.join(registryDir, name), "utf8"));
  if (shard.schema_version !== SCHEMA_VERSION) fail(`${name}: schema version mismatch`);
  if (!Array.isArray(shard.supplements) || shard.supplements.length === 0) fail(`${name}: supplements must be a non-empty array`);
  supplements.push(...(shard.supplements || []));
}

const ids = supplements.map((item) => item.id);
const idSet = new Set(ids);
if (ids.length !== EXPECTED_COUNT) fail(`Expected ${EXPECTED_COUNT} supplements, found ${ids.length}`);
if (ids.length !== idSet.size) fail("Duplicate supplement ids");
const byId = Object.fromEntries(supplements.map((item) => [item.id, item]));

for (const item of supplements) {
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(item.id)) fail(`${item.id}: invalid id`);
  if (!statuses.has(item.personal_status)) fail(`${item.id}: invalid personal_status`);
  if (!automation.has(item.automation_policy)) fail(`${item.id}: invalid automation_policy`);
  if (item.frequency.target_uses_7d > item.frequency.max_uses_7d) fail(`${item.id}: target exceeds max`);
  if (["excluded","manual_only"].includes(item.automation_policy) && item.frequency.max_uses_7d !== 0) fail(`${item.id}: non-automatic item max must be zero`);
  for (const axis of requiredAxes) {
    const benefit = item.body_vectors.benefit[axis];
    const burden = item.body_vectors.burden[axis];
    if (!Number.isInteger(benefit) || benefit < 0 || benefit > 3) fail(`${item.id}: invalid benefit ${axis}`);
    if (!Number.isInteger(burden) || burden < 0 || burden > 3) fail(`${item.id}: invalid burden ${axis}`);
  }
  for (const domain of requiredDomains) {
    const value = item.domain_affinity[domain];
    if (typeof value !== "number" || value < 0 || value > 1) fail(`${item.id}: invalid domain ${domain}`);
  }
  for (const field of refFields) {
    for (const ref of item.pairing[field]) if (!idSet.has(ref)) fail(`${item.id}: unknown ${field} ref ${ref}`);
  }
}

for (const id of ["nr","nmn","nmnh"]) {
  const required = new Set(byId[id]?.pairing.required_companions || []);
  if (!required.has("tmg") || !required.has("magnesium_citrate")) fail(`${id}: missing mandatory companions`);
  if (!(byId[id]?.frequency.rotation_groups || []).includes("nad_booster_triad")) fail(`${id}: missing NAD rotation group`);
}
if (byId.ashwagandha?.automation_policy !== "excluded") fail("Ashwagandha must remain excluded");
for (const id of ["fadogia_agrestis","turkesterone"]) if (byId[id]?.automation_policy !== "manual_only") fail(`${id} must remain manual_only`);
if (byId.shilajit?.frequency.target_uses_7d !== 2 || byId.shilajit?.frequency.max_uses_7d !== 2) fail("Shilajit must be exactly 2/week");
if ((byId.lion_mane?.frequency.target_uses_7d || 0) < 3) fail("Lion's Mane must target at least 3/week");
for (const id of ["spermidine","spirulina"]) if (byId[id]?.frequency.target_uses_7d !== 2) fail(`${id} must target 2/week`);
if (byId.cordyceps?.frequency.target_mode !== "conditional") fail("Cordyceps must be conditional");
for (const id of ["l_theanine","melatonin","valerian"]) if (!(byId[id]?.frequency.rotation_groups || []).includes("night_calm_triad")) fail(`${id}: missing night calm rotation group`);

const policy = {
  schema_version: SCHEMA_VERSION,
  expected_count: EXPECTED_COUNT,
  time_caps: { morning: 4, afternoon: 4, night: 3 },
  nad_booster_group_target_uses_7d: 5,
  nad_rotation_horizon_days: 21,
  night_calm_max_members_same_night: 1,
  liver_cover_target_days_7d: 6
};
const canonical = JSON.stringify({ policy, supplements: [...supplements].sort((a,b) => a.id.localeCompare(b.id)) });
const hash = crypto.createHash("sha256").update(canonical).digest("hex");
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Registry valid: ${supplements.length} supplements across ${shardFiles.length} transparent shards`);
console.log(`SHA-256: ${hash}`);
