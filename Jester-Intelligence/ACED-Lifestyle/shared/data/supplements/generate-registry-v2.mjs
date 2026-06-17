#!/usr/bin/env node
// Generator: produces supplement-registry.v2.json from supplement-registry.v1.json
// Run: node generate-registry-v2.mjs

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v1Path = path.join(__dirname, 'supplement-registry.v1.json');
const v2Path = path.join(__dirname, 'supplement-registry.v2.json');

const v1 = JSON.parse(fs.readFileSync(v1Path, 'utf8'));

// ---- registry-level function axes ----
const FUNCTION_AXES = [
  'mitochondrial_energy','physical_energy','cognition','memory','focus',
  'nervous_system_calming','sleep_initiation','sleep_maintenance',
  'liver_support','methylation','antioxidant_support',
  'heart_circulation','nitric_oxide','muscle_back_support',
  'joints_connective_tissue','skin','gut_digestion',
  'immune_modulation','endocrine_hormonal','libido',
  'respiratory_support','eyes','longevity_cellular_repair',
  'autophagy','inflammation_modulation'
];

// ---- v2 body systems: add joints_connective, keep skin_connective as alias ----
const BODY_SYSTEMS_V2 = [...v1.bodySystems, 'joints_connective'];

// ---- per-supplement enrichment data ----
// Each entry: { functions, bodyAxes, esotericSignature, planetaryHourProfile, stackingProfile, display }
const ENRICHMENT = {
  magnesium_citrate: {
    functions: { mitochondrial_energy: 0.3, gut_digestion: 0.5, nervous_system_calming: 0.4, muscle_back_support: 0.3, methylation: 0.2 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Mercury'], elements: ['Water','Earth'], planetaryHourAffinity: ['Moon','Mercury'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [2, 6], constructiveQualities: ['buffer','balance'] },
      mayan: { dreamspell: 'White Mirror', tzolkinCholQij: 'Etznab' }
    },
    stackingProfile: { functionalClasses: ['mineral_magnesium','nad_companion','gut_buffer'] },
    display: { colorHint: 'blue', priorityBadge: 'companion' }
  },
  magnesium_malate: {
    functions: { mitochondrial_energy: 0.7, physical_energy: 0.5, muscle_back_support: 0.5, focus: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Mercury'], elements: ['Earth','Fire'], planetaryHourAffinity: ['Mars','Mercury'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [1, 9], constructiveQualities: ['drive','ATP'] },
      mayan: { dreamspell: 'Red Earth', tzolkinCholQij: 'Caban' }
    },
    stackingProfile: { functionalClasses: ['mineral_magnesium','energy_support','muscle_support'] },
    display: { colorHint: 'orange', priorityBadge: 'core' }
  },
  magnesium_bisglycinate: {
    functions: { nervous_system_calming: 0.8, sleep_initiation: 0.6, sleep_maintenance: 0.5, muscle_back_support: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Venus'], elements: ['Water','Earth'], planetaryHourAffinity: ['Moon','Venus'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['calm','rest'] },
      mayan: { dreamspell: 'White Wind', tzolkinCholQij: 'Ik' }
    },
    stackingProfile: { functionalClasses: ['mineral_magnesium','nervous_support','sleep_support'] },
    display: { colorHint: 'blue', priorityBadge: 'rest' }
  },
  magnesium_taurate: {
    functions: { heart_circulation: 0.8, nervous_system_calming: 0.6, sleep_initiation: 0.4, muscle_back_support: 0.2 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Venus','Moon'], elements: ['Water','Earth'], planetaryHourAffinity: ['Venus','Moon'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [2, 6], constructiveQualities: ['heart','calm'] },
      mayan: { dreamspell: 'White Dog', tzolkinCholQij: 'Oc' }
    },
    stackingProfile: { functionalClasses: ['mineral_magnesium','heart_support','taurine_source'] },
    display: { colorHint: 'green', priorityBadge: 'heart' }
  },
  nr: {
    functions: { mitochondrial_energy: 0.9, cognition: 0.7, longevity_cellular_repair: 0.8, methylation: 0.6, focus: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Mercury'], elements: ['Fire','Air'], planetaryHourAffinity: ['Sun','Mercury'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [1, 3, 9], constructiveQualities: ['vitality','renewal','NAD'] },
      mayan: { dreamspell: 'Yellow Sun', tzolkinCholQij: 'Ahau' }
    },
    stackingProfile: { functionalClasses: ['nad_booster','nad_precursor','cellular_repair','methylation_driver'] },
    display: { colorHint: 'gold', priorityBadge: 'constitutional' }
  },
  nmn: {
    functions: { mitochondrial_energy: 0.9, longevity_cellular_repair: 0.9, cognition: 0.6, methylation: 0.5, focus: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Saturn'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Sun','Saturn'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer'] },
      numerology: { resonantNumbers: [1, 8], constructiveQualities: ['longevity','cellular','NAD'] },
      mayan: { dreamspell: 'Yellow Star', tzolkinCholQij: 'Lamat' }
    },
    stackingProfile: { functionalClasses: ['nad_booster','nad_precursor','cellular_repair','methylation_driver'] },
    display: { colorHint: 'gold', priorityBadge: 'constitutional' }
  },
  nmnh: {
    functions: { mitochondrial_energy: 0.95, longevity_cellular_repair: 0.9, cognition: 0.7, methylation: 0.6, focus: 0.6 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Mercury','Mars'], elements: ['Fire','Air'], planetaryHourAffinity: ['Sun','Mercury'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [1, 3], constructiveQualities: ['high_voltage','NAD','activation'] },
      mayan: { dreamspell: 'Yellow Warrior', tzolkinCholQij: 'Cib' }
    },
    stackingProfile: { functionalClasses: ['nad_booster','nad_precursor','cellular_repair','methylation_driver','high_voltage'] },
    display: { colorHint: 'gold', priorityBadge: 'constitutional' }
  },
  tmg: {
    functions: { methylation: 0.9, liver_support: 0.5, heart_circulation: 0.3, cognition: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mercury','Moon'], elements: ['Water','Earth'], planetaryHourAffinity: ['Mercury','Moon'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [3, 6], constructiveQualities: ['methylation','donation','homocysteine'] },
      mayan: { dreamspell: 'White Mirror', tzolkinCholQij: 'Etznab' }
    },
    stackingProfile: { functionalClasses: ['methylation_support','nad_companion','liver_support'] },
    display: { colorHint: 'blue', priorityBadge: 'companion' }
  },
  creatine_5g: {
    functions: { physical_energy: 0.9, muscle_back_support: 0.8, cognition: 0.5, focus: 0.4, mitochondrial_energy: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Sun'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Mars','Sun'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [1, 9], constructiveQualities: ['strength','ATP','drive'] },
      mayan: { dreamspell: 'Red Serpent', tzolkinCholQij: 'Chicchan' }
    },
    stackingProfile: { functionalClasses: ['atp_support','muscle_support','cognitive_energy'] },
    display: { colorHint: 'red', priorityBadge: 'core' }
  },
  coq10: {
    functions: { mitochondrial_energy: 0.9, heart_circulation: 0.8, antioxidant_support: 0.7, physical_energy: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Venus'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Sun','Venus'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer'] },
      numerology: { resonantNumbers: [1, 6], constructiveQualities: ['spark','heart','mitochondria'] },
      mayan: { dreamspell: 'Yellow Sun', tzolkinCholQij: 'Ahau' }
    },
    stackingProfile: { functionalClasses: ['mitochondrial_support','heart_support','fat_soluble','antioxidant'] },
    display: { colorHint: 'gold', priorityBadge: 'core' }
  },
  omega_3: {
    functions: { heart_circulation: 0.8, inflammation_modulation: 0.8, cognition: 0.6, joints_connective_tissue: 0.5, skin: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Neptune','Venus'], elements: ['Water','Air'], planetaryHourAffinity: ['Venus','Moon'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['flow','heart','inflammation'] },
      mayan: { dreamspell: 'Blue Hand', tzolkinCholQij: 'Manik' }
    },
    stackingProfile: { functionalClasses: ['anti_inflammatory','heart_support','fat_soluble','dha_epa'] },
    display: { colorHint: 'blue', priorityBadge: 'core' }
  },
  multivitamin: {
    functions: { immune_modulation: 0.4, mitochondrial_energy: 0.3, methylation: 0.3, cognition: 0.2 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Jupiter'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Sun','Jupiter'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'balanced', seasonalAffinity: ['all'] },
      numerology: { resonantNumbers: [5], constructiveQualities: ['baseline','spectrum','foundation'] },
      mayan: { dreamspell: 'Yellow Human', tzolkinCholQij: 'Eb' }
    },
    stackingProfile: { functionalClasses: ['baseline_support','broad_spectrum'] },
    display: { colorHint: 'yellow', priorityBadge: 'baseline' }
  },
  d3_k2: {
    functions: { immune_modulation: 0.8, heart_circulation: 0.5, joints_connective_tissue: 0.5, skin: 0.3, inflammation_modulation: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Saturn'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Sun','Saturn'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','winter'] },
      numerology: { resonantNumbers: [1, 4], constructiveQualities: ['solar','bone','immune'] },
      mayan: { dreamspell: 'Yellow Seed', tzolkinCholQij: 'Kan' }
    },
    stackingProfile: { functionalClasses: ['fat_soluble','immune_support','bone_support'] },
    display: { colorHint: 'yellow', priorityBadge: 'core' }
  },
  nac: {
    functions: { liver_support: 0.8, antioxidant_support: 0.7, respiratory_support: 0.6, immune_modulation: 0.4, gut_digestion: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Moon'], elements: ['Water','Earth'], planetaryHourAffinity: ['Saturn','Moon'] },
      bazi: { primaryElement: 'Metal', energeticDirection: 'inward', seasonalAffinity: ['autumn','winter'] },
      numerology: { resonantNumbers: [4, 7], constructiveQualities: ['detox','glutathione','clearing'] },
      mayan: { dreamspell: 'White Wind', tzolkinCholQij: 'Ik' }
    },
    stackingProfile: { functionalClasses: ['liver_support','glutathione_precursor','respiratory_support','antioxidant'] },
    display: { colorHint: 'silver', priorityBadge: 'cleanse' }
  },
  milk_thistle: {
    functions: { liver_support: 0.9, antioxidant_support: 0.6, inflammation_modulation: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Moon'], elements: ['Water','Earth'], planetaryHourAffinity: ['Saturn','Moon'] },
      bazi: { primaryElement: 'Wood', energeticDirection: 'inward', seasonalAffinity: ['spring','autumn'] },
      numerology: { resonantNumbers: [4, 6], constructiveQualities: ['liver','regeneration','clearing'] },
      mayan: { dreamspell: 'White Worldbridger', tzolkinCholQij: 'Cimi' }
    },
    stackingProfile: { functionalClasses: ['liver_support','silymarin','antioxidant'] },
    display: { colorHint: 'green', priorityBadge: 'cleanse' }
  },
  probiotic: {
    functions: { gut_digestion: 0.9, immune_modulation: 0.7, inflammation_modulation: 0.4, nervous_system_calming: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Mercury'], elements: ['Earth','Water'], planetaryHourAffinity: ['Moon','Mercury'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'balanced', seasonalAffinity: ['all'] },
      numerology: { resonantNumbers: [2, 6], constructiveQualities: ['microbiome','balance','gut'] },
      mayan: { dreamspell: 'Blue Monkey', tzolkinCholQij: 'Chuen' }
    },
    stackingProfile: { functionalClasses: ['gut_support','microbiome','immune_modulator'] },
    display: { colorHint: 'green', priorityBadge: 'baseline' }
  },
  zinc: {
    functions: { immune_modulation: 0.8, endocrine_hormonal: 0.5, skin: 0.6, antioxidant_support: 0.4, libido: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Saturn'], elements: ['Earth','Fire'], planetaryHourAffinity: ['Mars','Saturn'] },
      bazi: { primaryElement: 'Metal', energeticDirection: 'outward', seasonalAffinity: ['autumn'] },
      numerology: { resonantNumbers: [1, 4], constructiveQualities: ['immunity','testosterone','wound_healing'] },
      mayan: { dreamspell: 'Red Serpent', tzolkinCholQij: 'Chicchan' }
    },
    stackingProfile: { functionalClasses: ['mineral_zinc','immune_support','skin_support','testosterone_support'] },
    display: { colorHint: 'silver', priorityBadge: 'core' }
  },
  astragalus: {
    functions: { immune_modulation: 0.8, longevity_cellular_repair: 0.6, inflammation_modulation: 0.5, physical_energy: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Jupiter','Saturn'], elements: ['Earth','Wood'], planetaryHourAffinity: ['Jupiter','Saturn'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'balanced', seasonalAffinity: ['spring','all'] },
      numerology: { resonantNumbers: [8, 6], constructiveQualities: ['longevity','immune','adaptogen'] },
      mayan: { dreamspell: 'Blue Eagle', tzolkinCholQij: 'Men' }
    },
    stackingProfile: { functionalClasses: ['immune_modulator','adaptogen_like','longevity'] },
    display: { colorHint: 'green', priorityBadge: 'core' }
  },
  lions_mane: {
    functions: { cognition: 0.9, memory: 0.9, focus: 0.7, nervous_system_calming: 0.4, longevity_cellular_repair: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mercury','Moon'], elements: ['Air','Water'], planetaryHourAffinity: ['Mercury','Moon'] },
      bazi: { primaryElement: 'Wood', energeticDirection: 'outward', seasonalAffinity: ['spring','autumn'] },
      numerology: { resonantNumbers: [3, 7], constructiveQualities: ['neural','growth','NGF'] },
      mayan: { dreamspell: 'Blue Storm', tzolkinCholQij: 'Cauac' }
    },
    stackingProfile: { functionalClasses: ['cognitive_mushroom','ngf_support','neural_plasticity'] },
    display: { colorHint: 'purple', priorityBadge: 'constitutional' }
  },
  l_theanine: {
    functions: { nervous_system_calming: 0.8, focus: 0.7, sleep_initiation: 0.4, cognition: 0.5, stress_resilience: 0.6 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Mercury'], elements: ['Water','Air'], planetaryHourAffinity: ['Moon','Venus'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','spring'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['calm','focus','alpha_wave'] },
      mayan: { dreamspell: 'White Wind', tzolkinCholQij: 'Ik' }
    },
    stackingProfile: { functionalClasses: ['nervous_support','calm_focus','amino_acid'] },
    display: { colorHint: 'light_blue', priorityBadge: 'core' }
  },
  lutein: {
    functions: { eyes: 0.9, antioxidant_support: 0.6, cognition: 0.3, skin: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Mercury'], elements: ['Fire','Air'], planetaryHourAffinity: ['Sun','Mercury'] },
      bazi: { primaryElement: 'Wood', energeticDirection: 'balanced', seasonalAffinity: ['spring','summer'] },
      numerology: { resonantNumbers: [1, 3], constructiveQualities: ['vision','macular','carotenoid'] },
      mayan: { dreamspell: 'Yellow Human', tzolkinCholQij: 'Eb' }
    },
    stackingProfile: { functionalClasses: ['eye_support','fat_soluble','antioxidant','carotenoid'] },
    display: { colorHint: 'yellow', priorityBadge: 'core' }
  },
  melatonin: {
    functions: { sleep_initiation: 0.9, sleep_maintenance: 0.7, antioxidant_support: 0.5, nervous_system_calming: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Neptune'], elements: ['Water'], planetaryHourAffinity: ['Moon'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['sleep','circadian','pineal'] },
      mayan: { dreamspell: 'White Mirror', tzolkinCholQij: 'Etznab' }
    },
    stackingProfile: { functionalClasses: ['sleep_hormone','circadian_regulator','antioxidant'] },
    display: { colorHint: 'dark_blue', priorityBadge: 'rest' }
  },
  valerian: {
    functions: { sleep_initiation: 0.8, nervous_system_calming: 0.7, sleep_maintenance: 0.6 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Saturn'], elements: ['Water','Earth'], planetaryHourAffinity: ['Moon','Saturn'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter'] },
      numerology: { resonantNumbers: [2, 4], constructiveQualities: ['sedation','GABA','rest'] },
      mayan: { dreamspell: 'Blue Night', tzolkinCholQij: 'Akbal' }
    },
    stackingProfile: { functionalClasses: ['sleep_sedative','gaba_support','nervous_support'] },
    display: { colorHint: 'dark_blue', priorityBadge: 'rest' }
  },
  collagen: {
    functions: { joints_connective_tissue: 0.9, skin: 0.8, muscle_back_support: 0.5, gut_digestion: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Venus','Saturn'], elements: ['Earth'], planetaryHourAffinity: ['Venus','Saturn'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'balanced', seasonalAffinity: ['all'] },
      numerology: { resonantNumbers: [4, 6], constructiveQualities: ['structure','repair','collagen'] },
      mayan: { dreamspell: 'Red Earth', tzolkinCholQij: 'Caban' }
    },
    stackingProfile: { functionalClasses: ['tissue_repair','skin_support','joint_support','protein'] },
    display: { colorHint: 'peach', priorityBadge: 'repair' }
  },
  vitamin_c: {
    functions: { antioxidant_support: 0.9, immune_modulation: 0.8, skin: 0.6, joints_connective_tissue: 0.5, inflammation_modulation: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Sun','Venus'], elements: ['Fire','Air'], planetaryHourAffinity: ['Sun','Venus'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: [ { resonantNumbers: [1, 3], constructiveQualities: ['immunity','ascorbic','brightening'] } ],
      mayan: { dreamspell: 'Yellow Star', tzolkinCholQij: 'Lamat' }
    },
    stackingProfile: { functionalClasses: ['antioxidant','immune_support','collagen_cofactor'] },
    display: { colorHint: 'orange', priorityBadge: 'core' }
  },
  msm: {
    functions: { joints_connective_tissue: 0.8, skin: 0.6, inflammation_modulation: 0.6, muscle_back_support: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Mars'], elements: ['Earth'], planetaryHourAffinity: ['Saturn','Mars'] },
      bazi: { primaryElement: 'Metal', energeticDirection: 'inward', seasonalAffinity: ['autumn'] },
      numerology: { resonantNumbers: [4, 8], constructiveQualities: ['sulfur','connective','repair'] },
      mayan: { dreamspell: 'White Worldbridger', tzolkinCholQij: 'Cimi' }
    },
    stackingProfile: { functionalClasses: ['sulfur_compound','joint_support','anti_inflammatory'] },
    display: { colorHint: 'silver', priorityBadge: 'repair' }
  },
  quercetin: {
    functions: { immune_modulation: 0.7, inflammation_modulation: 0.8, antioxidant_support: 0.7, gut_digestion: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Jupiter','Venus'], elements: ['Air','Earth'], planetaryHourAffinity: ['Jupiter','Venus'] },
      bazi: { primaryElement: 'Wood', energeticDirection: 'outward', seasonalAffinity: ['spring','autumn'] },
      numerology: { resonantNumbers: [3, 6], constructiveQualities: ['anti_inflammatory','polyphenol','histamine'] },
      mayan: { dreamspell: 'Blue Hand', tzolkinCholQij: 'Manik' }
    },
    stackingProfile: { functionalClasses: ['polyphenol','anti_inflammatory','immune_modulator','antihistamine'] },
    display: { colorHint: 'green', priorityBadge: 'core' }
  },
  resveratrol: {
    functions: { longevity_cellular_repair: 0.8, antioxidant_support: 0.7, heart_circulation: 0.6, inflammation_modulation: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Venus','Jupiter'], elements: ['Fire','Water'], planetaryHourAffinity: ['Venus','Jupiter'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','autumn'] },
      numerology: { resonantNumbers: [3, 9], constructiveQualities: ['longevity','grape','sirtuin'] },
      mayan: { dreamspell: 'Yellow Sun', tzolkinCholQij: 'Ahau' }
    },
    stackingProfile: { functionalClasses: ['polyphenol','longevity','sirtuin_activator','antioxidant'] },
    display: { colorHint: 'purple', priorityBadge: 'longevity' }
  },
  spermidine: {
    functions: { autophagy: 0.9, longevity_cellular_repair: 0.9, cognition: 0.5, inflammation_modulation: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Pluto'], elements: ['Earth','Water'], planetaryHourAffinity: ['Saturn'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [4, 8], constructiveQualities: ['autophagy','renewal','longevity'] },
      mayan: { dreamspell: 'White Wizard', tzolkinCholQij: 'Ix' }
    },
    stackingProfile: { functionalClasses: ['autophagy_activator','longevity','cellular_renewal'] },
    display: { colorHint: 'dark_purple', priorityBadge: 'constitutional' }
  },
  spirulina: {
    functions: { antioxidant_support: 0.7, immune_modulation: 0.6, physical_energy: 0.5, gut_digestion: 0.3, mitochondrial_energy: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Neptune','Sun'], elements: ['Water','Fire'], planetaryHourAffinity: ['Sun','Neptune'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'balanced', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [3, 7], constructiveQualities: ['green','chlorophyll','alkaline'] },
      mayan: { dreamspell: 'Blue Eagle', tzolkinCholQij: 'Men' }
    },
    stackingProfile: { functionalClasses: ['green_food','antioxidant','immune_support','protein_rich'] },
    display: { colorHint: 'green', priorityBadge: 'baseline' }
  },
  shilajit: {
    functions: { mitochondrial_energy: 0.8, longevity_cellular_repair: 0.7, endocrine_hormonal: 0.5, physical_energy: 0.6, cognition: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Sun'], elements: ['Earth','Fire'], planetaryHourAffinity: ['Saturn','Sun'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'outward', seasonalAffinity: ['all'] },
      numerology: { resonantNumbers: [4, 8], constructiveQualities: ['mineral','primordial','vitality'] },
      mayan: { dreamspell: 'Red Earth', tzolkinCholQij: 'Caban' }
    },
    stackingProfile: { functionalClasses: ['mineral_complex','mitochondrial_support','adaptogen','fulvic_acid'] },
    display: { colorHint: 'dark', priorityBadge: 'constitutional' }
  },
  irish_sea_moss: {
    functions: { gut_digestion: 0.7, immune_modulation: 0.5, joints_connective_tissue: 0.4, skin: 0.4, endocrine_hormonal: 0.3 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Neptune'], elements: ['Water'], planetaryHourAffinity: ['Moon','Neptune'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'balanced', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['mineral','mucosal','iodine'] },
      mayan: { dreamspell: 'White Dog', tzolkinCholQij: 'Oc' }
    },
    stackingProfile: { functionalClasses: ['mucosal_support','mineral_dense','iodine_source','gut_support'] },
    display: { colorHint: 'teal', priorityBadge: 'baseline' }
  },
  gotu_kola: {
    functions: { cognition: 0.7, nervous_system_calming: 0.6, skin: 0.5, joints_connective_tissue: 0.4, memory: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mercury','Saturn'], elements: ['Earth','Water'], planetaryHourAffinity: ['Mercury','Saturn'] },
      bazi: { primaryElement: 'Wood', energeticDirection: 'balanced', seasonalAffinity: ['spring','summer'] },
      numerology: { resonantNumbers: [3, 7], constructiveQualities: ['neural','connective','ayurveda'] },
      mayan: { dreamspell: 'Blue Monkey', tzolkinCholQij: 'Chuen' }
    },
    stackingProfile: { functionalClasses: ['cognitive_herb','nervous_support','connective_tissue'] },
    display: { colorHint: 'green', priorityBadge: 'core' }
  },
  chaga: {
    functions: { antioxidant_support: 0.9, immune_modulation: 0.8, inflammation_modulation: 0.6, longevity_cellular_repair: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Pluto'], elements: ['Earth','Water'], planetaryHourAffinity: ['Saturn'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [4, 8], constructiveQualities: ['adaptogen','antioxidant','ancient'] },
      mayan: { dreamspell: 'White Wizard', tzolkinCholQij: 'Ix' }
    },
    stackingProfile: { functionalClasses: ['immune_mushroom','antioxidant','adaptogen'] },
    display: { colorHint: 'dark', priorityBadge: 'immune' }
  },
  reishi: {
    functions: { immune_modulation: 0.9, nervous_system_calming: 0.7, sleep_initiation: 0.5, inflammation_modulation: 0.6, longevity_cellular_repair: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Moon','Saturn'], elements: ['Water','Earth'], planetaryHourAffinity: ['Moon','Saturn'] },
      bazi: { primaryElement: 'Water', energeticDirection: 'inward', seasonalAffinity: ['winter','autumn'] },
      numerology: { resonantNumbers: [2, 7], constructiveQualities: ['adaptogen','calm','spirit'] },
      mayan: { dreamspell: 'White Mirror', tzolkinCholQij: 'Etznab' }
    },
    stackingProfile: { functionalClasses: ['immune_mushroom','adaptogen','nervous_support','longevity'] },
    display: { colorHint: 'red_dark', priorityBadge: 'immune' }
  },
  cordyceps: {
    functions: { physical_energy: 0.9, respiratory_support: 0.8, endocrine_hormonal: 0.5, mitochondrial_energy: 0.6, libido: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Sun'], elements: ['Fire','Air'], planetaryHourAffinity: ['Mars','Sun'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [1, 9], constructiveQualities: ['stamina','oxygen','athletic'] },
      mayan: { dreamspell: 'Red Dragon', tzolkinCholQij: 'Imix' }
    },
    stackingProfile: { functionalClasses: ['immune_mushroom','physical_performance','respiratory_support','stimulant'] },
    display: { colorHint: 'orange', priorityBadge: 'performance' }
  },
  black_maca: {
    functions: { endocrine_hormonal: 0.8, libido: 0.9, physical_energy: 0.6, cognition: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Venus'], elements: ['Earth','Fire'], planetaryHourAffinity: ['Mars','Venus'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'outward', seasonalAffinity: ['spring','summer'] },
      numerology: { resonantNumbers: [1, 6], constructiveQualities: ['libido','fertility','drive'] },
      mayan: { dreamspell: 'Red Serpent', tzolkinCholQij: 'Chicchan' }
    },
    stackingProfile: { functionalClasses: ['endocrine_caution','libido_support','adaptogen'] },
    display: { colorHint: 'dark_red', priorityBadge: 'caution' }
  },
  b_complex: {
    functions: { methylation: 0.8, cognition: 0.7, mitochondrial_energy: 0.6, focus: 0.6, physical_energy: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mercury','Sun'], elements: ['Air','Fire'], planetaryHourAffinity: ['Mercury','Sun'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer','spring'] },
      numerology: { resonantNumbers: [3, 1], constructiveQualities: ['B_vitamins','methylation','neural'] },
      mayan: { dreamspell: 'Yellow Human', tzolkinCholQij: 'Eb' }
    },
    stackingProfile: { functionalClasses: ['b_vitamins','methylation_driver','cognitive_energy'] },
    display: { colorHint: 'yellow', priorityBadge: 'core' }
  },
  l_citrulline: {
    functions: { nitric_oxide: 0.9, heart_circulation: 0.7, physical_energy: 0.7, muscle_back_support: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Venus'], elements: ['Fire','Water'], planetaryHourAffinity: ['Mars','Sun'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer'] },
      numerology: { resonantNumbers: [1, 9], constructiveQualities: ['nitric_oxide','pump','circulation'] },
      mayan: { dreamspell: 'Red Dragon', tzolkinCholQij: 'Imix' }
    },
    stackingProfile: { functionalClasses: ['nitric_oxide_support','circulation','physical_performance','amino_acid'] },
    display: { colorHint: 'red', priorityBadge: 'performance' }
  },
  ashwagandha: {
    functions: { nervous_system_calming: 0.8, endocrine_hormonal: 0.6, sleep_initiation: 0.5, physical_energy: 0.4, cognition: 0.4 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Saturn','Mars'], elements: ['Earth','Fire'], planetaryHourAffinity: ['Saturn','Mars'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'balanced', seasonalAffinity: ['all'] },
      numerology: { resonantNumbers: [4, 8], constructiveQualities: ['adaptogen','cortisol','root'] },
      mayan: { dreamspell: 'White Wizard', tzolkinCholQij: 'Ix' }
    },
    stackingProfile: { functionalClasses: ['adaptogen','liver_caution','nervous_support','endocrine'] },
    display: { colorHint: 'brown', priorityBadge: 'caution' }
  },
  fadogia_agrestis: {
    functions: { endocrine_hormonal: 0.7, libido: 0.8 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars'], elements: ['Fire'], planetaryHourAffinity: ['Mars'] },
      bazi: { primaryElement: 'Fire', energeticDirection: 'outward', seasonalAffinity: ['summer'] },
      numerology: { resonantNumbers: [1], constructiveQualities: ['testosterone','drive','manual'] },
      mayan: { dreamspell: 'Red Serpent', tzolkinCholQij: 'Chicchan' }
    },
    stackingProfile: { functionalClasses: ['endocrine_caution','testosterone_support','manual_research'] },
    display: { colorHint: 'dark_red', priorityBadge: 'manual_only' }
  },
  turkesterone: {
    functions: { muscle_back_support: 0.8, physical_energy: 0.7, endocrine_hormonal: 0.5 },
    esotericSignature: {
      astrology: { primaryPlanets: ['Mars','Saturn'], elements: ['Fire','Earth'], planetaryHourAffinity: ['Mars'] },
      bazi: { primaryElement: 'Earth', energeticDirection: 'outward', seasonalAffinity: ['summer'] },
      numerology: { resonantNumbers: [1, 4], constructiveQualities: ['anabolic','muscle','manual'] },
      mayan: { dreamspell: 'Red Serpent', tzolkinCholQij: 'Chicchan' }
    },
    stackingProfile: { functionalClasses: ['endocrine_caution','anabolic','muscle_support','manual_research'] },
    display: { colorHint: 'dark_red', priorityBadge: 'manual_only' }
  }
};

// Build bodyAxes from v1 body.benefits/burdens
function buildBodyAxes(supplement) {
  const benefits = supplement.body?.benefits ?? {};
  const burdens = supplement.body?.burdens ?? {};
  const axes = new Set([...Object.keys(benefits), ...Object.keys(burdens)]);
  const result = {};
  for (const axis of axes) {
    result[axis] = {
      supportStrength: Number(benefits[axis] ?? 0),
      burdenStrength: Number(burdens[axis] ?? 0),
      confidence: 0.7
    };
  }
  return result;
}

// Build planetaryHourProfile stub
function buildPlanetaryHourProfile(supplement, enrichment) {
  const esoSig = enrichment?.esotericSignature;
  const planets = esoSig?.astrology?.primaryPlanets ?? supplement.esoteric?.planets ?? [];
  return {
    primaryPlanets: planets.slice(0, 2),
    peakHours: 'unknown',
    notes: 'unknown'
  };
}

// Explicit personal response polarity per supplement.
// Values: strongly_positive | positive | neutral | mixed | negative | unknown
const RESPONSE_POLARITY = {
  nr: 'strongly_positive',
  nmn: 'positive',
  nmnh: 'strongly_positive',
  cordyceps: 'strongly_positive',
  lions_mane: 'strongly_positive',
  shilajit: 'strongly_positive',
  creatine_5g: 'strongly_positive',
  magnesium_citrate: 'positive',
  magnesium_malate: 'positive',
  magnesium_bisglycinate: 'positive',
  magnesium_taurate: 'positive',
  tmg: 'positive',
  coq10: 'positive',
  omega_3: 'positive',
  multivitamin: 'neutral',
  d3_k2: 'positive',
  nac: 'positive',
  milk_thistle: 'positive',
  probiotic: 'positive',
  zinc: 'positive',
  astragalus: 'positive',
  l_theanine: 'positive',
  lutein: 'positive',
  melatonin: 'neutral',
  valerian: 'neutral',
  collagen: 'positive',
  vitamin_c: 'positive',
  msm: 'positive',
  quercetin: 'positive',
  resveratrol: 'positive',
  spermidine: 'positive',
  spirulina: 'positive',
  irish_sea_moss: 'neutral',
  gotu_kola: 'positive',
  chaga: 'positive',
  reishi: 'positive',
  black_maca: 'mixed',
  b_complex: 'positive',
  l_citrulline: 'positive',
  ashwagandha: 'negative',
  fadogia_agrestis: 'unknown',
  turkesterone: 'unknown'
};

// Build personalResponse from personalStatus
function buildPersonalResponse(supplement) {
  return {
    responsePolarity: RESPONSE_POLARITY[supplement.id] ?? (supplement.personalStatus === 'excluded' ? 'negative' : 'positive'),
    status: supplement.personalStatus ?? 'active',
    caution: supplement.autoSelection === 'caution' ? 'use_with_care' : null,
    notes: supplement.notes ?? 'unknown'
  };
}

// Build functions {primary, secondary} from a scalar function-axis map.
// primary: axes scoring >= 0.7, secondary: the rest (descending by score).
function buildFunctions(scalarMap) {
  const entries = Object.entries(scalarMap ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const primary = entries.filter(([, v]) => v >= 0.7).map(([k]) => k);
  const secondary = entries.filter(([, v]) => v < 0.7).map(([k]) => k);
  // Guarantee at least one primary if any function exists
  if (!primary.length && entries.length) {
    primary.push(entries[0][0]);
    const idx = secondary.indexOf(entries[0][0]);
    if (idx >= 0) secondary.splice(idx, 1);
  }
  return { primary, secondary, weights: scalarMap ?? {} };
}

const NAD_ROTATION = new Set(['nr', 'nmn', 'nmnh']);

// ---- Authoritative numerology (sum/root) from the supplement table ----
const NUMEROLOGY = {
  magnesium_citrate: [70, 7], magnesium_malate: [55, 1], magnesium_bisglycinate: [93, 3],
  magnesium_taurate: [62, 8], nr: [14, 5], nmn: [14, 5], tmg: [13, 4], creatine_5g: [51, 6],
  coq10: [18, 9], omega_3: [26, 8], multivitamin: [55, 1], d3_k2: [11, 11], nac: [9, 9],
  milk_thistle: [48, 3], probiotic: [53, 8], zinc: [25, 7], astragalus: [29, 11],
  lions_mane: [39, 3], l_theanine: [43, 7], lutein: [27, 9], collagen: [33, 33],
  vitamin_c: [37, 1], msm: [9, 9], quercetin: [49, 4], resveratrol: [54, 9],
  spermidine: [58, 4], spirulina: [47, 11], irish_sea_moss: [55, 1], cordyceps: [45, 9],
  b_complex: [36, 9], l_citrulline: [54, 9], nmnh: [22, 22], shilajit: [34, 7],
  gotu_kola: [30, 3], chaga: [20, 2], reishi: [41, 5], black_maca: [20, 2],
  melatonin: [40, 4], valerian: [37, 1], fadogia_agrestis: [69, 6], turkesterone: [54, 9],
  ashwagandha: [42, 6]
};

// ---- Authoritative BaZi day-master from the supplement table ----
// id -> [stem, element, polarity]
const BAZI = {
  magnesium_citrate: ['己', 'Earth', 'Yin'], magnesium_malate: ['丙', 'Fire', 'Yang'],
  magnesium_bisglycinate: ['癸', 'Water', 'Yin'], magnesium_taurate: ['丁', 'Fire', 'Yin'],
  nr: ['丙', 'Fire', 'Yang'], nmn: ['丙', 'Fire', 'Yang'], tmg: ['戊', 'Earth', 'Yang'],
  creatine_5g: ['戊', 'Earth', 'Yang'], coq10: ['丙', 'Fire', 'Yang'], omega_3: ['癸', 'Water', 'Yin'],
  multivitamin: ['己', 'Earth', 'Yin'], d3_k2: ['丙', 'Fire', 'Yang'], nac: ['辛', 'Metal', 'Yin'],
  milk_thistle: ['乙', 'Wood', 'Yin'], probiotic: ['己', 'Earth', 'Yin'], zinc: ['庚', 'Metal', 'Yang'],
  astragalus: ['甲', 'Wood', 'Yang'], lions_mane: ['乙', 'Wood', 'Yin'], l_theanine: ['癸', 'Water', 'Yin'],
  lutein: ['乙', 'Wood', 'Yin'], collagen: ['己', 'Earth', 'Yin'], vitamin_c: ['甲', 'Wood', 'Yang'],
  msm: ['庚', 'Metal', 'Yang'], quercetin: ['乙', 'Wood', 'Yin'], resveratrol: ['甲', 'Wood', 'Yang'],
  spermidine: ['癸', 'Water', 'Yin'], spirulina: ['癸', 'Water', 'Yin'], irish_sea_moss: ['癸', 'Water', 'Yin'],
  cordyceps: ['丙', 'Fire', 'Yang'], b_complex: ['丙', 'Fire', 'Yang'], l_citrulline: ['丙', 'Fire', 'Yang'],
  nmnh: ['丙', 'Fire', 'Yang'], shilajit: ['戊', 'Earth', 'Yang'], gotu_kola: ['乙', 'Wood', 'Yin'],
  chaga: ['辛', 'Metal', 'Yin'], reishi: ['癸', 'Water', 'Yin'], black_maca: ['戊', 'Earth', 'Yang'],
  melatonin: ['癸', 'Water', 'Yin'], valerian: ['癸', 'Water', 'Yin'], fadogia_agrestis: ['丙', 'Fire', 'Yang'],
  turkesterone: ['甲', 'Wood', 'Yang'], ashwagandha: ['己', 'Earth', 'Yin']
};

// ---- Weekly-limited herbs: max 1 use per rolling 7 days, no auto boost ----
const WEEKLY_LIMITED_HERBS = ['ashwagandha', 'reishi', 'gotu_kola', 'fadogia_agrestis', 'turkesterone'];
const WEEKLY_LIMITED_SET = new Set(WEEKLY_LIMITED_HERBS);

// ---- Per-day mutual-exclusion / anti-clustering rules from conservative rules ----
// "Choose only one of spirulina, sea moss or shilajit per day"
const MINERAL_BIOMASS = ['spirulina', 'irish_sea_moss', 'shilajit'];
// "One primary sleep aid": melatonin and valerian not auto-combined
const PRIMARY_SLEEP_AID = ['melatonin', 'valerian'];

// Build avoidSameDay additions: each member avoids the others in its group.
function buildAvoidAdditions() {
  const additions = {};
  const add = (id, others) => {
    if (!additions[id]) additions[id] = new Set();
    for (const o of others) if (o !== id) additions[id].add(o);
  };
  // Weekly-capped herbs must not cluster with each other on the same day.
  for (const id of WEEKLY_LIMITED_HERBS) add(id, WEEKLY_LIMITED_HERBS);
  // One mineral-biomass product per day.
  for (const id of MINERAL_BIOMASS) add(id, MINERAL_BIOMASS);
  // One primary sleep aid per day; both also avoid ashwagandha (sedative stack).
  for (const id of PRIMARY_SLEEP_AID) add(id, [...PRIMARY_SLEEP_AID, 'ashwagandha']);
  add('ashwagandha', PRIMARY_SLEEP_AID);
  // Black maca never same day as fadogia or turkesterone.
  add('black_maca', ['fadogia_agrestis', 'turkesterone']);
  add('fadogia_agrestis', ['black_maca']);
  add('turkesterone', ['black_maca']);
  return additions;
}
const AVOID_ADDITIONS = buildAvoidAdditions();

// Overlay authoritative numerology + BaZi day-master onto an esoteric signature.
function applyAuthoritativeEsoteric(esotericSignature, id) {
  const base = esotericSignature ? { ...esotericSignature } : {
    astrology: { primaryPlanets: [], elements: [], planetaryHourAffinity: [] },
    bazi: {}, numerology: {}, mayan: {}
  };
  const num = NUMEROLOGY[id];
  if (num) {
    const [sum, root] = num;
    base.numerology = {
      ...(base.numerology ?? {}),
      numerologySum: sum,
      numerologyRoot: root,
      resonantNumbers: [root, ...(root !== sum ? [] : [])],
      constructiveQualities: (base.numerology?.constructiveQualities ?? [])
    };
  }
  const bz = BAZI[id];
  if (bz) {
    const [stem, element, polarity] = bz;
    base.bazi = {
      ...(base.bazi ?? {}),
      dayMasterStem: stem,
      primaryElement: element,
      polarity,
      energeticDirection: base.bazi?.energeticDirection ?? 'balanced',
      seasonalAffinity: base.bazi?.seasonalAffinity ?? []
    };
  }
  return base;
}

// Apply the weekly-limited-herb governance to a frequency block.
function applyWeeklyLimited(frequency, id) {
  if (!WEEKLY_LIMITED_SET.has(id)) return frequency;
  return {
    ...frequency,
    // Auto-selectable members are capped at 1; manual/excluded members keep their
    // (already zero) target but still carry the cap as a documented guard.
    targetUses7d: Math.min(Number(frequency.targetUses7d ?? 0), 1),
    maxUses7d: 1,
    weeklyLimited: true,
    rollingWindowDays: 7,
    automaticFrequencyBoost: false,
    missedWeekRequiresMakeup: false,
    permanentHighlightAllowed: false
  };
}

// Merge anti-clustering avoidSameDay additions into a pairing block.
function applyAvoidAdditions(pairing, id) {
  const extra = AVOID_ADDITIONS[id];
  if (!extra || !extra.size) return pairing;
  const merged = [...new Set([...(pairing.avoidSameDay ?? []), ...extra])].sort();
  return { ...pairing, avoidSameDay: merged };
}

// Migrate a single supplement from v1 to v2
function migrateSupplementV2(s) {
  const enrichment = ENRICHMENT[s.id];

  // Fix vitamin_c numerology (was incorrectly array-wrapped)
  let esotericSignature = enrichment?.esotericSignature;
  if (s.id === 'vitamin_c' && esotericSignature) {
    esotericSignature = {
      ...esotericSignature,
      numerology: { resonantNumbers: [1, 3], constructiveQualities: ['immunity','ascorbic','brightening'] }
    };
  }
  // Overlay authoritative numerology + BaZi from the supplement table.
  esotericSignature = applyAuthoritativeEsoteric(esotericSignature, s.id);

  const frequency = applyWeeklyLimited(s.frequency, s.id);
  const pairing = applyAvoidAdditions(s.pairing, s.id);

  return {
    // Section A: Identity (v1 compat)
    id: s.id,
    name: s.name,
    aliases: s.aliases ?? [],
    productForm: 'unknown',
    dose: 'unknown',
    servingUnit: 'unknown',
    pillCount: 'unknown',
    available: s.available,
    personalStatus: s.personalStatus,
    evidenceClass: s.evidenceClass,
    autoSelection: s.autoSelection,
    source: 'unknown',
    lastCardReview: 'unknown',
    criticalData: s.criticalData,
    criticalRequirements: s.criticalRequirements ?? [],

    // Section B: Personal Response
    personalResponse: buildPersonalResponse(s),

    // Section C: Functions ({primary, secondary, weights})
    functions: buildFunctions(enrichment?.functions),
    // Top-level functional-axis list consumed by functional-overlap-engine
    functionalClasses: Object.keys(enrichment?.functions ?? {}),

    // NAD rotation family marker (constitutional mutual-exclusion group)
    ...(NAD_ROTATION.has(s.id) ? { rotationFamily: 'nad_booster' } : {}),

    // Section D: Body Axis Matrix (v2) + v1 compat body
    body: s.body,
    bodyAxes: buildBodyAxes(s),

    // Section E: Stacking Profile
    stackingProfile: enrichment?.stackingProfile ?? { functionalClasses: s.classes ?? [] },

    // Section F: Frequency (v1 compat + weekly-limited governance)
    frequency,
    timeWindows: s.timeWindows ?? ['morning'],
    requiresFood: s.requiresFood ?? false,

    // Section G: Compatibility (v1 compat + anti-clustering avoidSameDay)
    classes: s.classes ?? [],
    domains: s.domains ?? {},
    pairing,

    // Section H: Esoteric Signature (v2, authoritative numerology + BaZi) + v1 compat esoteric
    esoteric: s.esoteric,
    esotericSignature,

    // Section I: Planetary Hour Profile
    planetaryHourProfile: buildPlanetaryHourProfile(s, enrichment),

    // Section J: Display
    display: enrichment?.display ?? { colorHint: 'gray', priorityBadge: 'baseline' },

    notes: s.notes ?? ''
  };
}

const v2 = {
  schemaVersion: 'ace_mind_supplement_registry.v2',
  registryId: 'ace-mind-supplement-registry-v2-commit1',
  generatedAt: '2026-06-17',
  doctrine: 'Canonical supplement registry v2 for ACE Mind Individual Supplement Optimizer. Extends v1 with full personal response data, 14-axis body matrix, functional overlap tracking, esoteric signature structure, and planetary hour profile. Does not make medical claims.',
  bodySystems: BODY_SYSTEMS_V2,
  functionAxes: FUNCTION_AXES,
  lifeDomains: v1.lifeDomains,
  defaultConfig: {
    ...v1.defaultConfig,
    classCaps: {
      ...v1.defaultConfig.classCaps,
      immune_mushroom: 2
    }
  },
  // Governance group: rolling-7-day cap of 1, no automatic frequency boost,
  // no missed-week makeup, never permanently highlighted.
  weeklyLimitedHerbs: {
    members: [...WEEKLY_LIMITED_HERBS].sort(),
    maxUsesPerRolling7Days: 1,
    automaticFrequencyBoost: false,
    missedWeekRequiresMakeup: false,
    permanentHighlightAllowed: false
  },
  // Per-day mutual-exclusion groups (at most one member selected per day).
  mutualExclusionGroups: [
    { id: 'nad_precursor', members: ['nr', 'nmn', 'nmnh'], maxPerDay: 1 },
    { id: 'mineral_biomass', members: [...MINERAL_BIOMASS].sort(), maxPerDay: 1 },
    { id: 'primary_sleep_aid', members: [...PRIMARY_SLEEP_AID].sort(), maxPerDay: 1 },
    { id: 'weekly_limited_herbs', members: [...WEEKLY_LIMITED_HERBS].sort(), maxPerDay: 1 }
  ],
  supplements: v1.supplements.map(migrateSupplementV2)
};

fs.writeFileSync(v2Path, JSON.stringify(v2, null, 2), 'utf8');
const size = fs.statSync(v2Path).size;
console.log(`Written: ${v2Path}`);
console.log(`Size: ${(size / 1024).toFixed(1)} KB`);
console.log(`Supplements: ${v2.supplements.length}`);
console.log('OK');
