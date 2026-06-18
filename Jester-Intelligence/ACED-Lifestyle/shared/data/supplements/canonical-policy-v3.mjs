// ACE Mind canonical supplement policy v3.
// Source: user-authorized 42-row table, 2026-06-18.
// This layer preserves existing card intelligence, then applies the newer
// conservative rules as the authoritative conflict-resolution overlay.

const POLICY_VERSION = 'ace_mind_supplement_policy.v3.2026-06-18';

const TABLE = Object.freeze({
  magnesium_citrate:{numerology:[70,7],bazi:['己','Earth','Yin'],persistence:'Endogenous magnesium pool',maximumFrequency:'Conditional',rule:'One primary magnesium form daily. Prefer for bowel support. Calculate total elemental magnesium.',timeWindows:['morning','afternoon']},
  magnesium_malate:{numerology:[55,1],bazi:['丙','Fire','Yang'],persistence:'Endogenous magnesium pool',maximumFrequency:'Conditional',rule:'Daytime magnesium option. Do not automatically combine with every other magnesium form.',timeWindows:['morning','afternoon']},
  magnesium_bisglycinate:{numerology:[93,3],bazi:['癸','Water','Yin'],persistence:'Endogenous magnesium pool',maximumFrequency:'Conditional',rule:'Evening relaxation option. May support one primary sleep intervention.',timeWindows:['night']},
  magnesium_taurate:{numerology:[62,8],bazi:['丁','Fire','Yin'],persistence:'Magnesium pool; taurine short-lived',maximumFrequency:'Conditional',rule:'Cardiovascular or evening option. Avoid clustering with reishi and L-citrulline when blood pressure is low.',timeWindows:['afternoon','night']},
  nr:{numerology:[14,5],bazi:['丙','Fire','Yang'],persistence:'Rapid metabolism; downstream metabolites last longer',maximumFrequency:'One NAD precursor per selected day',rule:'Never combine automatically with NMN or NMNH.',timeWindows:['morning']},
  nmn:{numerology:[14,5],bazi:['丙','Fire','Yang'],persistence:'Rapid conversion to NAD metabolites',maximumFrequency:'One NAD precursor per selected day',rule:'Never combine automatically with NR or NMNH.',timeWindows:['morning']},
  tmg:{numerology:[13,4],bazi:['戊','Earth','Yang'],persistence:'Several hours',maximumFrequency:'Conditional',rule:'Optional methyl support for an NAD day. Not automatically compulsory.',timeWindows:['morning','afternoon']},
  creatine_5g:{numerology:[51,6],bazi:['戊','Earth','Yang'],persistence:'Plasma hours; muscle stores much longer',maximumFrequency:'Up to daily',rule:'Core support. Caffeine is not an automatic conflict.',timeWindows:['morning','afternoon']},
  coq10:{numerology:[18,9],bazi:['丙','Fire','Yang'],persistence:'About 30–35 hours',maximumFrequency:'Conditional',rule:'Take with a meal containing dietary fat.',timeWindows:['morning','afternoon'],requiresFood:true},
  omega_3:{numerology:[26,8],bazi:['癸','Water','Yin'],persistence:'Long lipid incorporation',maximumFrequency:'Conditional',rule:'Take with food. Flag high cumulative bleeding-risk combinations.',timeWindows:['morning','afternoon','night'],requiresFood:true},
  multivitamin:{numerology:[55,1],bazi:['己','Earth','Yin'],persistence:'Nutrient-dependent',maximumFrequency:'Conditional',rule:'Do not automatically combine with B-complex. Count overlapping vitamins and minerals.',timeWindows:['morning'],requiresFood:true},
  d3_k2:{numerology:[11,11],bazi:['丙','Fire','Yang'],persistence:'D3 weeks; MK-7 days',maximumFrequency:'Dose-dependent',rule:'Take with food. Frequency must reflect the actual dose and vitamin D status.',timeWindows:['morning','afternoon'],requiresFood:true},
  nac:{numerology:[9,9],bazi:['辛','Metal','Yin'],persistence:'About 5–6 hours',maximumFrequency:'Conditional / frequent',rule:'On NAD or hormesis days, place approximately 4–6 hours after the morning selection.',timeWindows:['afternoon','night']},
  milk_thistle:{numerology:[48,3],bazi:['乙','Wood','Yin'],persistence:'Several hours',maximumFrequency:'Rotate',rule:'Use on a low-complexity herbal day.',timeWindows:['afternoon','night'],rotate:true},
  probiotic:{numerology:[53,8],bazi:['己','Earth','Yin'],persistence:'Strain-dependent',maximumFrequency:'Up to daily',rule:'Separate from antibiotics and concentrated antimicrobial products when practical.',timeWindows:['morning','night']},
  zinc:{numerology:[25,7],bazi:['庚','Metal','Yang'],persistence:'Plasma hours',maximumFrequency:'Conditional',rule:'Count zinc already present in the multivitamin. Separate large zinc and magnesium doses.',timeWindows:['afternoon','night'],requiresFood:true},
  astragalus:{numerology:[29,11],bazi:['甲','Wood','Yang'],persistence:'Uncertain',maximumFrequency:'Rotate',rule:'Immune-support option. Do not select automatically every day.',timeWindows:['morning','afternoon'],rotate:true},
  lions_mane:{numerology:[39,3],bazi:['乙','Wood','Yin'],persistence:'Human kinetics uncertain',maximumFrequency:'Conditional / frequent',rule:'Cognition and learning support. Monitor allergy or digestive response.',timeWindows:['morning','afternoon']},
  l_theanine:{numerology:[43,7],bazi:['癸','Water','Yin'],persistence:'About 1–2 hours',maximumFrequency:'As needed',rule:'Calm-focus or sleep support. Supporting aid, not an excuse for a large sedative stack.',timeWindows:['afternoon','night']},
  lutein:{numerology:[27,9],bazi:['乙','Wood','Yin'],persistence:'Days to weeks in tissues',maximumFrequency:'Conditional',rule:'Take with food containing some fat.',timeWindows:['morning','afternoon'],requiresFood:true},
  collagen:{numerology:[33,33],bazi:['己','Earth','Yin'],persistence:'Peptides and amino acids for several hours',maximumFrequency:'Up to daily',rule:'Can accompany MSM, vitamin C and other protein sources.',timeWindows:['morning','afternoon','night']},
  vitamin_c:{numerology:[37,1],bazi:['甲','Wood','Yang'],persistence:'About 2 hours',maximumFrequency:'Conditional',rule:'Prefer later in the day on NAD, resveratrol or exercise-hormesis days.',timeWindows:['afternoon','night']},
  msm:{numerology:[9,9],bazi:['庚','Metal','Yang'],persistence:'Several hours',maximumFrequency:'Conditional / frequent',rule:'Natural partner for collagen and structural support.',timeWindows:['afternoon','night']},
  quercetin:{numerology:[49,4],bazi:['乙','Wood','Yin'],persistence:'Metabolites may persist many hours',maximumFrequency:'Rotate',rule:'May accompany resveratrol. Avoid combining with an unnecessarily large botanical selection.',timeWindows:['morning','afternoon'],rotate:true},
  resveratrol:{numerology:[54,9],bazi:['甲','Wood','Yang'],persistence:'Parent short-lived; metabolites longer',maximumFrequency:'Rotate',rule:'Morning hormesis option. Place high-dose vitamin C and NAC later.',timeWindows:['morning'],rotate:true,requiresFood:true},
  spermidine:{numerology:[58,4],bazi:['癸','Water','Yin'],persistence:'Not firmly established',maximumFrequency:'Rotate',rule:'Must not remain permanently green. Selection requires a current-day reason.',timeWindows:['morning','afternoon'],rotate:true,permanentHighlightAllowed:false},
  spirulina:{numerology:[47,11],bazi:['癸','Water','Yin'],persistence:'Biomass, not conventional drug kinetics',maximumFrequency:'Rotate',rule:'Choose only one of spirulina, sea moss or shilajit per day.',timeWindows:['morning','afternoon'],rotate:true},
  irish_sea_moss:{numerology:[55,1],bazi:['癸','Water','Yin'],persistence:'Iodine effects outlast plasma clearance',maximumFrequency:'Rotate',rule:'Choose only one mineral-biomass product daily. Require known iodine and contaminant quality.',timeWindows:['morning'],rotate:true},
  cordyceps:{numerology:[45,9],bazi:['丙','Fire','Yang'],persistence:'Cordycepin short-lived; extracts vary',maximumFrequency:'Conditional / frequent',rule:'Physical-energy option. Prefer morning or early afternoon.',timeWindows:['morning','afternoon']},
  b_complex:{numerology:[36,9],bazi:['丙','Fire','Yang'],persistence:'Vitamin-dependent',maximumFrequency:'Rotate',rule:'Prefer non-NAD days conservatively. Do not automatically combine with multivitamin.',timeWindows:['morning'],rotate:true,requiresFood:true},
  l_citrulline:{numerology:[54,9],bazi:['丙','Fire','Yang'],persistence:'About 1–2 hours',maximumFrequency:'Activity days',rule:'Use for exertion or vascular support. No mandatory weekly endothelial rest.',timeWindows:['morning','afternoon']},
  nmnh:{numerology:[22,22],bazi:['丙','Fire','Yang'],persistence:'Human profile still developing',maximumFrequency:'One NAD precursor per selected day',rule:'Active NAD option. Never combine automatically with NMN or NR.',timeWindows:['morning']},
  shilajit:{numerology:[34,7],bazi:['戊','Earth','Yang'],persistence:'Extract-dependent',maximumFrequency:'About 2× weekly',rule:'Use tested product. Do not place on the same day as sea moss or spirulina.',timeWindows:['morning'],frequency:{targetUses7d:2,maxUses7d:2,minimumGapHours:48}},
  gotu_kola:{numerology:[30,3],bazi:['乙','Wood','Yin'],persistence:'Active compounds persist for hours',maximumFrequency:'Maximum 1× per rolling 7 days',rule:'Manual weekly rotation. Do not cluster with the other four weekly-capped herbs. Use on a low-complexity botanical day.',timeWindows:['afternoon','night'],weeklyLimited:true,manualOnly:true},
  chaga:{numerology:[20,2],bazi:['辛','Metal','Yin'],persistence:'Unknown',maximumFrequency:'Rotate',rule:'Avoid automatic daily use. Flag kidney, oxalate and bleeding-risk contexts.',timeWindows:['afternoon','night'],rotate:true},
  reishi:{numerology:[41,5],bazi:['癸','Water','Yin'],persistence:'Extract-dependent',maximumFrequency:'Maximum 1× per rolling 7 days',rule:'Manual weekly rotation. Do not cluster with Gotu Kola, Ashwagandha, Fadogia or Turkesterone. Monitor low-pressure symptoms.',timeWindows:['night'],weeklyLimited:true,manualOnly:true},
  black_maca:{numerology:[20,2],bazi:['戊','Earth','Yang'],persistence:'Human kinetics uncertain',maximumFrequency:'Rotate',rule:'Never use on the same day as Fadogia or Turkesterone.',timeWindows:['morning'],rotate:true},
  melatonin:{numerology:[40,4],bazi:['癸','Water','Yin'],persistence:'About 30–60 minutes immediate release',maximumFrequency:'As needed',rule:'One primary sleep aid. Do not automatically combine with valerian and ashwagandha.',timeWindows:['night']},
  valerian:{numerology:[37,1],bazi:['癸','Water','Yin'],persistence:'Constituents generally short-lived',maximumFrequency:'As needed',rule:'Primary sleep aid when selected. Avoid alcohol and large sedative combinations.',timeWindows:['night']},
  fadogia_agrestis:{numerology:[69,6],bazi:['丙','Fire','Yang'],persistence:'Human kinetics unknown',maximumFrequency:'Maximum 1× per rolling 7 days',rule:'Manual only. Never selected automatically. Do not use with maca, Turkesterone or Ashwagandha on the same day.',timeWindows:['morning'],weeklyLimited:true,manualOnly:true},
  turkesterone:{numerology:[54,9],bazi:['甲','Wood','Yang'],persistence:'Human kinetics insufficiently established',maximumFrequency:'Maximum 1× per rolling 7 days',rule:'Manual weekly rotation. Do not combine with Fadogia or black maca. Do not permanently highlight.',timeWindows:['afternoon'],weeklyLimited:true,manualOnly:true,permanentHighlightAllowed:false},
  ashwagandha:{numerology:[42,6],bazi:['己','Earth','Yin'],persistence:'Extract-dependent',maximumFrequency:'Maximum 1× per rolling 7 days',rule:'Manual only because of previous liver concern. Never combine with both valerian and melatonin. Do not cluster with the other weekly-capped herbs.',timeWindows:['night'],weeklyLimited:true,manualOnly:true}
});

const GROUPS = Object.freeze({
  primary_magnesium:['magnesium_citrate','magnesium_malate','magnesium_bisglycinate','magnesium_taurate'],
  nad_precursor:['nr','nmn','nmnh'],
  mineral_biomass:['spirulina','irish_sea_moss','shilajit'],
  primary_sleep_aid:['melatonin','valerian'],
  weekly_limited_herbs:['ashwagandha','reishi','gotu_kola','fadogia_agrestis','turkesterone']
});

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

function cloneRegistry(registry) {
  return typeof structuredClone === 'function'
    ? structuredClone(registry)
    : JSON.parse(JSON.stringify(registry));
}

function addAvoid(card, ids) {
  card.pairing ??= {};
  card.pairing.avoidSameDay=unique([...(card.pairing.avoidSameDay ?? []),...ids.filter(id=>id!==card.id)]);
}

function addAvoidSlot(card, ids) {
  card.pairing ??= {};
  card.pairing.avoidSameSlot=unique([...(card.pairing.avoidSameSlot ?? []),...ids.filter(id=>id!==card.id)]);
}

function applyGroupExclusion(cards, members) {
  for (const id of members) {
    const card=cards.get(id);
    if (card) addAvoid(card,members);
  }
}

export function applyCanonicalSupplementPolicy(inputRegistry = {}) {
  const registry=cloneRegistry(inputRegistry);
  const cards=new Map((registry.supplements ?? []).map(card=>[card.id,card]));

  for (const [id,policy] of Object.entries(TABLE)) {
    const card=cards.get(id);
    if (!card) throw new Error(`Canonical policy missing registry card: ${id}`);
    const [sum,root]=policy.numerology;
    const [stem,element,polarity]=policy.bazi;

    card.protocolPolicy={
      version:POLICY_VERSION,
      approximatePersistence:policy.persistence,
      maximumFrequency:policy.maximumFrequency,
      conservativeRule:policy.rule,
      practicalTimingAuthority:true,
      permanentHighlightAllowed:policy.permanentHighlightAllowed !== false
    };
    card.esotericSignature ??= {};
    card.esotericSignature.numerology={
      ...(card.esotericSignature.numerology ?? {}),
      numerologySum:sum,
      numerologyRoot:root,
      resonantNumbers:unique([root,...(card.esotericSignature.numerology?.resonantNumbers ?? [])])
    };
    card.esotericSignature.bazi={
      ...(card.esotericSignature.bazi ?? {}),
      dayMasterStem:stem,
      primaryElement:element,
      polarity
    };
    card.timeWindows=[...policy.timeWindows];
    if (typeof policy.requiresFood === 'boolean') card.requiresFood=policy.requiresFood;
    card.frequency={...(card.frequency ?? {}),...(policy.frequency ?? {})};

    if (policy.rotate) {
      card.frequency.automaticFrequencyBoost=false;
      card.frequency.missedWeekRequiresMakeup=false;
    }
    if (policy.weeklyLimited) {
      card.frequency={
        ...card.frequency,
        targetUses7d:0,
        maxUses7d:1,
        weeklyLimited:true,
        rollingWindowDays:7,
        automaticFrequencyBoost:false,
        missedWeekRequiresMakeup:false,
        permanentHighlightAllowed:false
      };
    }
    if (policy.manualOnly) card.autoSelection='manual_only';
    if (policy.permanentHighlightAllowed === false) {
      card.frequency.permanentHighlightAllowed=false;
      card.display={...(card.display ?? {}),permanentHighlightAllowed:false};
    }
  }

  for (const members of Object.values(GROUPS)) applyGroupExclusion(cards,members);

  // Newer policy supersedes the old automatic TMG-companion rule.
  for (const id of GROUPS.nad_precursor) {
    const card=cards.get(id);
    if (!card) continue;
    card.pairing ??= {};
    card.pairing.requiredCompanions=(card.pairing.requiredCompanions ?? []).filter(companion=>companion!=='tmg');
    card.pairing.preferredPairs=unique([...(card.pairing.preferredPairs ?? []),'tmg']);
  }

  // Conservative timing separation for antioxidants on NAD/hormesis mornings.
  for (const id of ['nac','vitamin_c']) {
    const card=cards.get(id);
    if (card) addAvoidSlot(card,['nr','nmn','nmnh','resveratrol']);
  }

  // Multivitamin and B-complex are alternatives, not an automatic pair.
  addAvoid(cards.get('multivitamin'),['b_complex']);
  addAvoid(cards.get('b_complex'),['multivitamin']);

  // Zinc and magnesium may share a day but not the same practical intake slot.
  for (const magnesium of GROUPS.primary_magnesium) {
    addAvoidSlot(cards.get('zinc'),[magnesium]);
    addAvoidSlot(cards.get(magnesium),['zinc']);
  }

  // Creatine has no automatic caffeine conflict.
  const creatine=cards.get('creatine_5g');
  if (creatine) {
    creatine.pairing.avoidSameDay=(creatine.pairing.avoidSameDay ?? []).filter(token=>!['caffeine','coffee'].includes(token));
    creatine.pairing.avoidSameSlot=(creatine.pairing.avoidSameSlot ?? []).filter(token=>!['caffeine','coffee'].includes(token));
  }

  registry.policyVersion=POLICY_VERSION;
  registry.policyAuthority='user-authorized 42-row conservative table';
  registry.weeklyLimitedHerbs={
    members:[...GROUPS.weekly_limited_herbs],
    maxUsesPerRolling7Days:1,
    automaticFrequencyBoost:false,
    missedWeekRequiresMakeup:false,
    permanentHighlightAllowed:false
  };
  registry.mutualExclusionGroups=Object.entries(GROUPS).map(([id,members])=>({id,members:[...members],maxPerDay:1}));
  return registry;
}

export { POLICY_VERSION, TABLE as CANONICAL_SUPPLEMENT_TABLE, GROUPS as CANONICAL_EXCLUSION_GROUPS };
