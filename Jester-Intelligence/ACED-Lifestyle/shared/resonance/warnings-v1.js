/* Informational warnings only. Never imported by the scoring engine. */
(function(root){'use strict';
const sources={magnesium:'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',valerian:'https://ods.od.nih.gov/factsheets/Valerian-HealthProfessional/',ashwagandha:'https://www.nccih.nih.gov/health/ashwagandha',melatonin:'https://www.nccih.nih.gov/health/melatonin-what-you-need-to-know',vitaminK:'https://ods.od.nih.gov/factsheets/VitaminK-Consumer/'};
const groups=[
 {ids:['magnesium_citrate','magnesium_malate','magnesium_bisglycinate','magnesium_taurate'],reason:'These forms add to total elemental magnesium. Duplicate doses can increase adverse effects; kidney impairment increases risk.',evidence:'Documented cumulative ingredient risk; product dose matters',source:sources.magnesium},
 {ids:['melatonin','valerian','ashwagandha'],reason:'Potential additive drowsiness. Review before combining; consider choosing one. Exact combination evidence is limited.',evidence:'Potential interaction, not a proven interaction for every pair',source:sources.valerian},
 {ids:['nr','nmn','nmnh'],reason:'Overlapping NAD precursor use. Combined human safety and added benefit are uncertain.',evidence:'Uncertain overlap, not a documented contraindication',source:null},
 {ids:['multivitamin','b_complex','zinc','d3_k2'],reason:'Check labels for duplicate vitamins and minerals and total doses.',evidence:'Ingredient overlap depends on the actual formulations',source:null},
 {ids:['irish_sea_moss','spirulina','shilajit'],reason:'Verify ingredients, iodine content where applicable, and independent contaminant testing. These products are not interchangeable.',evidence:'Product-quality precaution; no blanket pairwise interaction established',source:null},
 {ids:['fadogia_agrestis','turkesterone','black_maca'],reason:'Human evidence for these combinations is limited. Review uncertainty before combining.',evidence:'Uncertain association; former schedule exclusion is not medical evidence',source:null}
];
const individual={
 ashwagandha:[{reason:'Rare liver injury reports; thyroid and autoimmune conditions, sedatives, immunosuppressants and some other medicines require review. Avoid during pregnancy and breastfeeding.',evidence:'NCCIH safety information',source:sources.ashwagandha}],
 valerian:[{reason:'Avoid combining with alcohol or sedatives because of possible additive sedation. Long-term safety remains uncertain.',evidence:'NIH safety precaution',source:sources.valerian}],
 melatonin:[{reason:'Medication review matters, especially with anticoagulants or epilepsy treatment. May cause daytime drowsiness.',evidence:'NCCIH safety information',source:sources.melatonin}],
 d3_k2:[{reason:'Vitamin K can seriously interact with warfarin and similar vitamin-K antagonists. Review the product and medicines before use.',evidence:'Documented medication interaction',source:sources.vitaminK}],
 fadogia_agrestis:[{reason:'Human safety and effective dosing are not established by this app. An esoteric score provides no evidence of safety.',evidence:'Evidence gap',source:null}],
 turkesterone:[{reason:'Human safety evidence and product composition require review; resonance is not clinical evidence.',evidence:'Evidence gap',source:null}],
 irish_sea_moss:[{reason:'Iodine content may vary. Review thyroid conditions, medicines, product dose and contaminant testing.',evidence:'Product-dependent precaution',source:null}],
 chaga:[{reason:'Review kidney disease, oxalate exposure and medicines affecting bleeding. Product-specific assessment is needed.',evidence:'Precaution; individual risk is not quantified here',source:null}]
};
function forItem(id){const out=(individual[id]||[]).map(x=>({...x}));if(id.startsWith('magnesium_'))out.push({reason:'Magnesium can reduce absorption of certain antibiotics and bisphosphonates. Medication-specific spacing is needed; kidney impairment increases toxicity risk.',evidence:'Documented medication interaction and contraindication context',source:sources.magnesium});return out;}
function combinations(rows,takenIds=[]){const selected=new Set(takenIds),ranked=new Map(rows.map(x=>[x.id,x]));return groups.flatMap(g=>{const items=g.ids.map(id=>ranked.get(id)).filter(Boolean);const strong=items.filter(x=>x.score>=70),taken=items.filter(x=>selected.has(x.id));if(strong.length<2&&taken.length<2)return [];return [{...g,items:(taken.length>=2?taken:strong).map(x=>({id:x.id,name:x.name,score:x.score})),trigger:taken.length>=2?'selected combination':'strongly scoring combination'}];});}
const api={VERSION:'warnings-1',forItem,combinations};if(typeof module==='object')module.exports=api;else root.ACEWarnings=api;
})(globalThis);
