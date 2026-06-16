import { stableUnique } from './contracts.mjs';

function allowedSlots(member, config) {
  const declared = stableUnique(member.timeWindows ?? []);
  const all = [...config.SLOT_ORDER];
  if (declared.includes('flex') || !declared.length) return all;
  const allowed = declared.filter(slot => all.includes(slot));
  return allowed.length ? allowed : all;
}

function tokenMatches(token, member) {
  return token === member.id || (member.classes ?? []).includes(token);
}

function sameSlotConflict(a, b) {
  return (a.pairing?.avoidSameSlot ?? []).some(token => tokenMatches(token, b))
    || (b.pairing?.avoidSameSlot ?? []).some(token => tokenMatches(token, a));
}

export function planSlots(members, config) {
  const ordered = [...members].sort((a,b) => {
    const d = allowedSlots(a, config).length - allowedSlots(b, config).length;
    return d || a.id.localeCompare(b.id);
  });
  const counts = Object.fromEntries(config.SLOT_ORDER.map(slot => [slot, 0]));
  const assigned = new Map();
  const inSlot = Object.fromEntries(config.SLOT_ORDER.map(slot => [slot, []]));

  function place(index) {
    if (index >= ordered.length) return true;
    const member = ordered[index];
    for (const slot of allowedSlots(member, config)) {
      if ((counts[slot] ?? 0) >= Number(config.SLOT_CAPS?.[slot] ?? 0)) continue;
      if (inSlot[slot].some(other => sameSlotConflict(member, other))) continue;
      assigned.set(member.id, slot);
      counts[slot] += 1;
      inSlot[slot].push(member);
      if (place(index + 1)) return true;
      inSlot[slot].pop();
      counts[slot] -= 1;
      assigned.delete(member.id);
    }
    return false;
  }

  if (!place(0)) return { ok: false, reason: 'slot full or same-slot conflict', slotPlan: null };
  return {
    ok: true,
    slotPlan: Object.fromEntries([...assigned.entries()].sort(([a],[b])=>a.localeCompare(b))),
    slotCounts: Object.fromEntries(Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)))
  };
}
