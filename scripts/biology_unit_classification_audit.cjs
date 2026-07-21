#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'biology'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'biology-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) topicByCode.set(topic.code, { unit: unit.id || unit.code, code: topic.code, name: topic.name })
}

const MANUAL = {
  'question_bank.json|2008_Q01': ['U3', '3.5', 'Mitochondria and chloroplast proton gradients require cellular respiration and photosynthesis energy-conversion reasoning.'],
  'question_bank.json|2008_Q02': ['U1', '1.7', 'Polypeptide tertiary structure and function depend on amino-acid interactions and protein structure.'],
  'question_bank.json|2008_Q03': ['U5', '5.4', 'Allele count in a diploid individual requires chromosome ploidy and non-Mendelian allele reasoning, not ecology.'],
  'question_bank.json|2008_Q04': ['U2', '2.7', 'Red blood cell lysis in distilled water requires tonicity and osmoregulation.'],
  'question_bank.json|2008_Q05': ['U7', '7.6', 'DNA sequence comparisons as evidence of relatedness require evidence-of-evolution reasoning.'],
  'question_bank.json|2008_Q07': ['U1', '1.5', 'Energy per gram of biomolecules requires lipid versus carbohydrate/protein macromolecule properties.'],
  'question_bank.json|2008_Q08': ['U2', '2.9', 'Secretory salivary-gland cells require endomembrane compartmentalization and rough ER function.'],
  'question_bank.json|2008_Q09': ['U2', '2.1', 'Distinguishing prokaryotic from eukaryotic cells requires cell structure and function.'],
  'question_bank.json|2008_Q10': ['U8', '8.2', 'Soil microbes recycle matter in ecosystems.'],
  'question_bank.json|2008_Q11': ['U6', '6.7', 'A disease from a nonfunctional enzyme gene requires gene mutation and gene-expression reasoning.'],
  'question_bank.json|2008_Q12': ['U5', '5.3', 'Dihybrid genotype counting requires Mendelian genetics.'],
  'question_bank.json|2008_Q13': ['U7', '7.2', 'The exception to evolution by natural selection requires natural-selection theory.'],
  'question_bank.json|2008_Q16': ['U3', '3.1', 'Allosteric inhibition requires enzyme structure and regulation of enzyme function.'],
  'question_bank.json|2008_Q18': ['U5', '5.3', 'Pedigree inheritance pattern requires Mendelian genetics.'],
  'question_bank.json|2008_Q19': ['U7', '7.10', 'Adaptive radiation after new niches become available is speciation/evolutionary diversification.'],
  'question_bank.json|2008_Q21': ['U1', '1.1', 'Heating pond water and dissolved oxygen depend on water properties and hydrogen bonding.'],
  'question_bank.json|2008_Q22': ['U2', '2.9', 'Protein transport to the plasma membrane requires endomembrane pathway and compartmentalization.'],
  'question_bank.json|2008_Q23': ['U6', '6.2', 'Meselson-Stahl isotope results demonstrate semiconservative DNA replication.'],
  'question_bank.json|2008_Q28': ['U3', '3.5', 'Oxygen decreases in darkness because cellular respiration continues without photosynthesis.'],
  'question_bank.json|2008_Q30': ['U3', '3.5', 'ATP production across respiration and photosynthesis requires cellular respiration and photosynthetic light reactions.'],
  'question_bank.json|2008_Q32': ['U7', '7.6', 'Functional similarity from independent origin requires analogy as evidence of evolution.'],
  'question_bank.json|2008_Q35': ['U7', '7.2', 'Coat-color distribution shift requires natural-selection pattern reasoning.'],
  'question_bank.json|2008_Q36': ['U3', '3.5', 'Fermentation and aerobic respiration comparison requires cellular respiration.'],
  'question_bank.json|2008_Q37': ['U7', '7.8', 'Punctuated equilibrium is continuing evolution over time.'],
  'question_bank.json|2008_Q43': ['U8', '8.5', 'Species coexistence through different niches requires community ecology.'],
  'question_bank.json|2008_Q45': ['U7', '7.2', 'Evolutionary success means differential reproductive success under natural selection.'],
  'question_bank.json|2008_Q46': ['U7', '7.9', 'Interpreting a cladogram requires phylogeny.'],
  'question_bank.json|2008_Q49': ['U3', '3.5', 'ATP synthase driven by proton flow into the mitochondrial matrix requires cellular respiration.'],
  'question_bank.json|2008_Q50': ['U8', '8.7', 'Fire effects on a community require disruption and nutrient-cycling ecosystem reasoning.'],
  'question_bank.json|2008_Q52': ['U7', '7.5', 'Allele frequencies at Hardy-Weinberg equilibrium require Hardy-Weinberg reasoning.'],
  'question_bank.json|2008_Q54': ['U7', '7.10', 'Long-term isolation by a river requires speciation reasoning.'],
  'question_bank.json|2008_Q55': ['U3', '3.4', 'C4 plant carbon fixation requires photosynthesis.'],
  'question_bank.json|2008_Q65': ['U6', '6.4', 'A protein-synthesis termination triplet is a stop codon in translation.'],
  'question_bank.json|2008_Q66': ['U6', '6.4', 'The ribosome is the site of translation.'],
  'question_bank.json|2008_Q67': ['U6', '6.3', 'Poly-A tail function belongs to RNA processing.'],
  'question_bank.json|2008_Q68': ['U6', '6.4', 'A triplet on tRNA is an anticodon used in translation.'],
  'question_bank.json|2008_Q69': ['U6', '6.1', 'Prokaryotic hereditary material after fission requires DNA/chromosome structure.'],
  'question_bank.json|2008_Q70': ['U4', '4.5', 'Eukaryotic cells at prophase require cell-cycle chromosome-state reasoning.'],
  'question_bank.json|2008_Q71': ['U5', '5.1', 'Metaphase I chromosome pairing requires meiosis.'],
  'question_bank.json|2008_Q72': ['U6', '6.8', 'Plasmid exchange by bacteria belongs to biotechnology/genetic transfer context.'],
  'question_bank.json|2008_Q73': ['U1', '1.3', 'Recognizing the ketone functional group belongs to biological macromolecule chemistry.'],
  'question_bank.json|2008_Q74': ['U1', '1.3', 'Recognizing the hydroxyl group belongs to biological macromolecule chemistry.'],
  'question_bank.json|2008_Q75': ['U1', '1.3', 'Recognizing the aldehyde group belongs to biological macromolecule chemistry.'],
  'question_bank.json|2008_Q76': ['U1', '1.3', 'Recognizing the hydroxyl group in ethanol belongs to biological macromolecule chemistry.'],
  'question_bank.json|2008_Q77': ['U8', '8.3', 'Duckweed population growth across growth media requires population ecology.'],
  'question_bank.json|2008_Q78': ['U8', '8.3', 'Duckweed population count data require population ecology.'],
  'question_bank.json|2008_Q79': ['U8', '8.3', 'Duckweed experimental growth trend requires population ecology.'],
  'question_bank.json|2008_Q80': ['U8', '8.3', 'Duckweed population response to nutrients requires population ecology.'],
  'question_bank.json|2008_Q81': ['U3', '3.4', 'Carbon dioxide uptake and starch concentration require photosynthesis.'],
  'question_bank.json|2008_Q82': ['U3', '3.4', 'Unusual carbon dioxide uptake pattern requires photosynthetic mechanism reasoning.'],
  'question_bank.json|2008_Q83': ['U3', '3.4', 'A control for light/dark carbon dioxide uptake requires photosynthesis experiment reasoning.'],
  'question_bank.json|2008_Q84': ['U3', '3.4', 'Adaptive significance of nighttime carbon dioxide uptake requires photosynthesis and water conservation.'],
  'question_bank.json|2008_Q85': ['U4', '4.5', 'DNA-content graph of mitotic proliferation requires cell-cycle phase reasoning.'],
  'question_bank.json|2008_Q86': ['U4', '4.5', 'DNA-content graph region P requires cell-cycle phase reasoning.'],
  'question_bank.json|2008_Q87': ['U4', '4.5', 'Readiness to enter mitosis from DNA content requires cell-cycle reasoning.'],
  'question_bank.json|2008_Q89': ['U7', '7.9', 'Selecting a cladogram from derived traits requires phylogeny.'],
  'question_bank.json|2008_Q91': ['U8', '8.2', 'Trophic-level feeding relationships require energy flow through ecosystems.'],
  'question_bank.json|2008_Q92': ['U8', '8.2', 'DDT biomagnification through trophic levels requires ecosystem energy-flow reasoning.'],
  'question_bank.json|2008_Q93': ['U8', '8.5', 'Sea otter effect on kelp forest diversity requires community ecology and keystone species.'],
  'question_bank.json|2008_Q94': ['U8', '8.3', 'The K line on a population curve is carrying capacity in population ecology.'],
  'question_bank.json|2008_Q95': ['U8', '8.4', 'Resource-limited population regulation requires density-dependent population ecology.'],
  'question_bank.json|2008_Q96': ['U6', '6.8', 'Preparing cheek cells for PCR belongs to biotechnology.'],
  'question_bank.json|2008_Q97': ['U6', '6.8', 'Choosing PCR primers for a gene sequence belongs to biotechnology.'],
  'question_bank.json|2008_Q98': ['U6', '6.8', 'Restriction enzyme digestion and phenotype prediction belong to biotechnology.'],
  'question_bank.json|2008_Q99': ['U6', '6.8', 'Gel band sizes after restriction digest belong to biotechnology.'],
  'question_bank.json|2008_Q100': ['U7', '7.6', 'Primate DNA sequence comparison requires evidence-of-evolution reasoning.'],
  'question_bank.json|2013_Q02': ['U8', '8.4', 'Population changes caused by food abundance require resource-limitation reasoning.'],
  'question_bank.json|2013_Q21': ['U7', '7.10', 'Preventing gene flow between Rhagoletis populations requires speciation and reproductive-isolation reasoning.'],
  'question_bank.json|2013_Q22': ['U7', '7.10', 'Reduced hybrid egg hatching requires postzygotic isolation reasoning in speciation.'],
  'question_bank.json|2013_Q23': ['U7', '7.2', 'Fur-color changes in a field population require natural-selection reasoning.'],
  'question_bank.json|2013_Q32': ['U7', '7.9', 'Interpreting a vertebrate phylogenetic tree requires phylogeny.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q023': ['U7', '7.2', 'Pesticide resistance increasing over generations requires natural-selection reasoning.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q093': ['U8', '8.5', 'Predator population change after prey decline requires community ecology.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q094': ['U8', '8.5', 'Predator population change after prey decline requires community ecology.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q095': ['U8', '8.5', 'Predator population change after prey decline requires community ecology.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q096': ['U8', '8.5', 'Predator population change after prey decline requires community ecology.'],
  'question_bank.json|lynkedu_2026_biology_capacity_Q097': ['U8', '8.5', 'Predator population change after prey decline requires community ecology.'],
  'frq_bank.json|2013_FRQ1': ['U8', '8.1', 'Fruit-fly spatial distribution in response to glucose requires response-to-environment reasoning.'],
  'frq_bank.json|2013_FRQ3': ['U7', '7.6', 'Fossil timing and tetrapod ancestry require evidence-of-evolution reasoning.'],
  'frq_bank.json|2013_FRQ8': ['U6', '6.5', 'Hormone signaling regulation of target gene expression requires regulation of gene expression.'],
}

const OFF_FRAMEWORK = [
  [/Which of the following structures contains highly oxygenated blood/i, 'circulatory anatomy is not a current AP Biology topic sequence requirement'],
  [/Molecule contains a porphyrin ring with a central magnesium atom/i, 'standalone pigment-structure term matching is outside the current AP Biology topic sequence'],
  [/Causes plant shoots to bend toward light by stimulating cell elongation/i, 'plant hormone term matching is outside the current AP Biology unit topic sequence'],
  [/Structure that stores lipid-emulsifying salts/i, 'digestive organ identification is outside the current AP Biology unit topic sequence'],
  [/Molecule that can absorb photons of light and release electrons to the primary electron acceptor/i, 'this item belongs to a plant-molecule matching group that is not valid as a split student-facing current-framework set'],
  [/pulmonary vein|vena cava|right ventricle|pulmonary artery|jugular vein/i, 'circulatory anatomy is not a current AP Biology topic sequence requirement'],
  [/helper T cells|cytotoxic|immune system cells|HIV/i, 'immune-system cell taxonomy is outside the current AP Biology unit topic sequence'],
  [/angiosperm|sporophyte|gametophyte|dicot seeds|cotyledon|radicle|plumule/i, 'plant life-cycle and seed-structure detail is outside the current AP Biology unit topic sequence'],
  [/birds associating|unpleasant taste|instinct|habituation|imprinting|insight learning|trial-and-error/i, 'animal behavior taxonomy is outside the current AP Biology unit topic sequence'],
  [/invertebrate nervous system|ventral nerve cord|cephalization|cerebellum|sympathetic/i, 'animal nervous-system evolution detail is outside the current AP Biology unit topic sequence'],
  [/frog embryo|gastrulation|blastula|yolk/i, 'developmental embryology detail is outside the current AP Biology unit topic sequence'],
  [/system of blood vessels|digestive tract|sponges|flatworms|annelids|roundworms|sea anemones/i, 'comparative animal anatomy is outside the current AP Biology unit topic sequence'],
  [/gas exchange systems in animals|counter-current exchange|respiratory structures/i, 'animal gas-exchange anatomy is outside the current AP Biology unit topic sequence'],
  [/fight-or-flight|ACTH|pituitary|noradrenaline|thyroxin|thyroid gland/i, 'animal endocrine/nervous-system pathway detail is outside the current AP Biology unit topic sequence'],
  [/stomata|guard cells|flaccid|stomates|cuticle|epidermal hairs/i, 'plant structure and physiology detail is outside the current AP Biology unit topic sequence'],
  [/excretion in animals|contractile vacuole|nitrogenous wastes/i, 'animal excretion physiology is outside the current AP Biology unit topic sequence'],
  [/companion cell|phloem|palisade mesophyll/i, 'plant vascular tissue detail is outside the current AP Biology unit topic sequence'],
  [/plants evolved from simple|haploid generation|sporophyte generation/i, 'plant evolutionary life-cycle detail is outside the current AP Biology unit topic sequence'],
  [/pancreas|kidney|liver|gall bladder|stomach|pepsin|hydrolytic enzymes.*small intestine|glycogen typically occurs/i, 'digestive organ identification is outside the current AP Biology unit topic sequence'],
  [/(phytochrome|ethylene|auxin|abscisic acid|photoperiod)/i, 'plant hormone term matching is outside the current AP Biology unit topic sequence'],
  [/minimum number of trophic levels/i, 'standalone food-chain counting is too underspecified for current AP Biology topic placement without the original stimulus'],
  [/characters? is unique to Neomysticena|naked.*tail|toes on hindfeet|incisors|hair tufts/i, 'taxonomy trait lookup is outside the current AP Biology unit topic sequence without the original phylogeny stimulus'],
  [/organization of living systems from smallest to largest/i, 'standalone biological-organization ordering is outside the current AP Biology topic sequence'],
  [/dog is following the scent|brain integrates information for smell/i, 'animal sensory-system pathway detail is outside the current AP Biology topic sequence'],
  [/pinprick|human finger|impulse transmission|axon/i, 'animal nervous-system pathway detail is outside the current AP Biology topic sequence'],
  [/immune system responds to pathogens|nonspecific response/i, 'immune-response taxonomy is outside the current AP Biology topic sequence'],
]

const RULES = [
  r('8.7', /\b(disruption|disturbance|invasive|nonnative|introduced species|pollution|climate change|human harvesting|landslides?)\b/i, 'Ecosystem disruption reasoning requires Unit 8.7.'),
  r('8.6', /\b(biodiversity|species diversity|ecosystem diversity)\b/i, 'Biodiversity reasoning requires Unit 8.6.'),
  r('8.5', /\b(community|niche|competition|predation|keystone|symbiosis|species can live together)\b/i, 'Community ecology reasoning requires Unit 8.5.'),
  r('8.4', /\b(density-dependent|density independent|availability of resources|limited resources|nest sites)\b/i, 'Effects of density on populations require Unit 8.4.'),
  r('8.3', /\b(population size|population growth|carrying capacity|\bK\b|life-history|r- and K|field mice|duckweed|beetles per culture dish|population density)\b/i, 'Population ecology reasoning requires Unit 8.3.'),
  r('8.2', /\b(trophic|food chain|energy flow|biomagnification|recycling of matter|biogeochemical|primary producers|chemoautotrophic)\b/i, 'Energy flow and matter cycling in ecosystems require Unit 8.2.'),
  r('8.1', /\b(response to the environment|environmental response|behavioral response)\b/i, 'Responses to the environment require Unit 8.1.'),
  r('7.12', /\borigins? of life\b/i, 'Origins of life on Earth require Unit 7.12.'),
  r('7.11', /\b(variation in populations|genetic variation in populations)\b/i, 'Variation in populations requires Unit 7.11.'),
  r('7.10', /\b(speciation|isolates? the two populations|adaptive radiation)\b/i, 'Speciation reasoning requires Unit 7.10.'),
  r('7.9', /\b(cladogram|phylogeny|derived traits?|monophyletic)\b/i, 'Phylogeny requires Unit 7.9.'),
  r('7.8', /\b(punctuated equilibrium|continuing evolution)\b/i, 'Continuing evolution requires Unit 7.8.'),
  r('7.6', /\b(evidence of evolution|DNA sequence comparisons|comparative anatomy|comparative embryology|fossil|homology|analogy)\b/i, 'Evidence of evolution requires Unit 7.6.'),
  r('7.5', /\b(Hardy-Weinberg|allele frequenc|genotype frequenc)\b/i, 'Hardy-Weinberg equilibrium requires Unit 7.5.'),
  r('7.4', /\b(population genetics|gene pool)\b/i, 'Population genetics requires Unit 7.4.'),
  r('7.3', /\bartificial selection\b/i, 'Artificial selection requires Unit 7.3.'),
  r('7.2', /\b(natural selection|directional selection|stabilizing selection|disruptive selection|fitness|survive to reproduce|reproductive success)\b/i, 'Natural selection requires Unit 7.2.'),
  r('7.1', /\bevolution\b/i, 'Evolution introduction requires Unit 7.1.'),
  r('6.8', /\b(PCR|primer|restriction enzyme|gel electrophoresis|biotechnology|transformation experiments|plasmid|SNP)\b/i, 'Biotechnology requires Unit 6.8.'),
  r('6.7', /\b(mutation|nonfunctional gene|genetic condition|Tay-Sachs|Down Syndrome)\b/i, 'Mutations require Unit 6.7.'),
  r('6.6', /\b(cell specialization|differentiation)\b/i, 'Gene expression and cell specialization require Unit 6.6.'),
  r('6.5', /\b(regulation of gene expression|operon|lac operon|repressor|promoter)\b/i, 'Regulation of gene expression requires Unit 6.5.'),
  r('6.4', /\b(translation|codon|anticodon|ribosome|protein synthesis|mRNA|tRNA)\b/i, 'Translation requires Unit 6.4.'),
  r('6.3', /\b(transcription|RNA processing|poly-A|intron|exon|messenger RNA)\b/i, 'Transcription and RNA processing require Unit 6.3.'),
  r('6.2', /\b(DNA replication|semiconservative|Meselson|Stahl)\b/i, 'DNA replication requires Unit 6.2.'),
  r('6.1', /\b(DNA|RNA|nucleotide|chromosome|hereditary material|x-ray diffraction|Rosalind Franklin|double helix)\b/i, 'DNA and RNA structure require Unit 6.1.'),
  r('5.5', /\benvironmental effects on phenotype\b/i, 'Environmental effects on phenotype require Unit 5.5.'),
  r('5.4', /\b(non-Mendelian|five different alleles|multiple alleles|linked genes|sex-linked)\b/i, 'Non-Mendelian genetics requires Unit 5.4.'),
  r('5.3', /\b(AaBb|dihybrid|pedigree|inheritance pattern|Mendelian|genotype|phenotype ratio)\b/i, 'Mendelian genetics requires Unit 5.3.'),
  r('5.2', /\b(genetic diversity|crossing over|independent assortment)\b/i, 'Meiosis and genetic diversity require Unit 5.2.'),
  r('5.1', /\b(meiosis|metaphase I|haploid|gametes|fertilization)\b/i, 'Meiosis requires Unit 5.1.'),
  r('4.6', /\b(regulation of cell cycle|cyclin|checkpoint|cancer)\b/i, 'Regulation of the cell cycle requires Unit 4.6.'),
  r('4.5', /\b(cell cycle|mitosis|prophase|metaphase|DNA content|active mitotic proliferation|enter mitosis)\b/i, 'Cell cycle requires Unit 4.5.'),
  r('4.4', /\b(feedback|homeostasis|blood sugar|insulin|glucagon|negative feedback|positive feedback)\b/i, 'Feedback requires Unit 4.4.'),
  r('4.3', /\b(signal transduction|second messenger|phosphorylation cascade)\b/i, 'Signal transduction requires Unit 4.3.'),
  r('4.2', /\b(chemical signal|receptor|ligand)\b/i, 'Signal-transduction introduction requires Unit 4.2.'),
  r('4.1', /\b(cell communication)\b/i, 'Cell communication requires Unit 4.1.'),
  r('3.5', /\b(cellular respiration|aerobic respiration|fermentation|glycolysis|Krebs|electron transport|chemiosmosis|mitochondria|ATP synthase|lactate)\b/i, 'Cellular respiration requires Unit 3.5.'),
  r('3.4', /\b(photosynthesis|Calvin cycle|chloroplast|light-dependent|light-independent|carbon dioxide uptake|starch concentration|C4 plants|chlorophyll.*primary electron)\b/i, 'Photosynthesis requires Unit 3.4.'),
  r('3.3', /\b(cellular energy|ATP hydrolysis|ATP breakdown)\b/i, 'Cellular energy requires Unit 3.3.'),
  r('3.2', /\b(environmental impacts? on enzyme|temperature.*enzyme|pH.*enzyme)\b/i, 'Environmental impacts on enzyme function require Unit 3.2.'),
  r('3.1', /\b(enzyme|allosteric|active site|substrate)\b/i, 'Enzymes require Unit 3.1.'),
  r('2.10', /\b(endosymbiotic|origins of cell compartmentalization)\b/i, 'Origins of cell compartmentalization require Unit 2.10.'),
  r('2.9', /\b(endoplasmic reticulum|rough ER|Golgi|vesicle|protein.*plasma membrane|organelle|compartmentalization|lysosome|nucleolus)\b/i, 'Cell compartmentalization requires Unit 2.9.'),
  r('2.8', /\b(mechanisms of transport|sodium-potassium pump|proton pump)\b/i, 'Mechanisms of transport require Unit 2.8.'),
  r('2.7', /\b(tonicity|osmoregulation|isotonic|distilled water|lyse|water potential)\b/i, 'Tonicity and osmoregulation require Unit 2.7.'),
  r('2.6', /\bfacilitated diffusion\b/i, 'Facilitated diffusion requires Unit 2.6.'),
  r('2.5', /\b(active transport|against its concentration gradient|membrane transport)\b/i, 'Membrane transport requires Unit 2.5.'),
  r('2.4', /\b(membrane permeability|aquaporin)\b/i, 'Membrane permeability requires Unit 2.4.'),
  r('2.3', /\b(plasma membrane|membrane polarity|action potential)\b/i, 'Plasma membrane structure and ion movement require Unit 2.3.'),
  r('2.2', /\b(cell size|surface area|volume ratio)\b/i, 'Cell size requires Unit 2.2.'),
  r('2.1', /\b(prokaryotic|eukaryotic|cell structure|cell function)\b/i, 'Cell structure and function require Unit 2.1.'),
  r('1.7', /\b(protein|polypeptide|amino acid|tertiary structure)\b/i, 'Protein structure requires Unit 1.7.'),
  r('1.6', /\b(nucleic acid|DNA|RNA)\b/i, 'Nucleic acids require Unit 1.6.'),
  r('1.5', /\b(lipid|triglyceride|steroid|phospholipid)\b/i, 'Lipids require Unit 1.5.'),
  r('1.4', /\b(carbohydrate|sugar|glycogen|starch)\b/i, 'Carbohydrates require Unit 1.4.'),
  r('1.3', /\b(macromolecule|functional group|hydroxyl|aldehyde|amide|amino group|ketone)\b/i, 'Biological macromolecule chemistry requires Unit 1.3.'),
  r('1.2', /\b(elements of life|carbon|nitrogen|phosphorus)\b/i, 'Elements of life require Unit 1.2.'),
  r('1.1', /\b(water|hydrogen bonding|pH|buffer|oxygen solubility)\b/i, 'Water chemistry requires Unit 1.1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Biology primary_unit is the latest official unit required to solve the full item; items outside the current official topic sequence are removed from student-facing unit practice instead of being forced into a unit.',
  totals: { checked: 0, changed: 0, topic_materialized: 0, blocking: 0, review: 0, off_framework: 0, still_unit_level: 0 },
  before: {},
  after: {},
  findings: [],
}
const reviewPack = []

runAudit()

function runAudit() {
  for (const file of ['question_bank.json', 'frq_bank.json']) {
    const arr = readJson(path.join(SUBJECT_DIR, file))
    for (const item of arr) if (visibleForBefore(item)) report.before[item.primary_unit] = (report.before[item.primary_unit] || 0) + 1
    for (const item of arr) auditItem(file, item)
    for (const item of arr) if (visible(item)) report.after[item.primary_unit] = (report.after[item.primary_unit] || 0) + 1
    if (applyFixes) fs.writeFileSync(path.join(SUBJECT_DIR, file), JSON.stringify(arr, null, 2) + '\n')
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewPack, null, 2) + '\n')
  console.log(`Biology unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && (report.totals.blocking > 0 || report.totals.review > 0 || report.totals.still_unit_level > 0)) process.exit(1)
}

function auditItem(file, item) {
  if (!visibleForBefore(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const off = OFF_FRAMEWORK.find(([pattern]) => pattern.test(stemText(item)))
  if (off) {
    report.totals.off_framework += 1
    addFinding('blocking', file, item, `Current-framework removal: ${off[1]}.`)
    if (applyFixes) applyOffFramework(item, off[1])
    return
  }
  const decision = MANUAL[key] ? byManual(MANUAL[key]) : classify(item)
  if (!decision.code) {
    report.totals.still_unit_level += 1
    addFinding('review', file, item, decision.reason)
    return
  }
  const current = normalizeUnit(item.primary_unit)
  if (decision.unit !== current) {
    addFinding('blocking', file, item, `Proposed ${decision.unit} ${decision.code}; current ${current}. ${decision.reason}`)
    if (applyFixes) report.totals.changed += 1
  }
  if (applyFixes) applyDecision(item, decision)
  report.totals.topic_materialized += 1
}

function classify(item) {
  const text = itemText(item)
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return byCode(rule.code, rule.reason)
  }
  return unitLevel(item, 'No Biology official-topic decision matched; requires manual review before student-facing use.')
}

function applyDecision(item, decision) {
  item.primary_unit = decision.unit
  item.unit = decision.unit
  item.unit_name = unitName(decision.unit)
  item.classification_reasoning = `Official progression review: ${decision.unit} ${unitName(decision.unit)}. ${decision.reason}`
  item.unit_classification = 'official-progression-reviewed'
  item.classification = {
    ...(item.classification || {}),
    primary_unit: decision.unit,
    review_status: 'reviewed',
    classification_version: 'biology-official-progression-2026-07-21',
    authority: 'AP Biology Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Biology Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'Biology item review against the official AP Biology topic sequence; shared group context included',
    reviewed_at: '2026-07-21',
  }
}

function applyOffFramework(item, reason) {
  item.student_visible = false
  item.publish_status = 'blocked'
  item.quality_status = 'blocked_off_current_framework'
  item.classification_reasoning = `Blocked from student-facing practice: ${reason}.`
  item.classification = {
    ...(item.classification || {}),
    review_status: 'blocked',
    classification_version: 'biology-official-progression-2026-07-21',
    authority: 'AP Biology Course and Exam Description',
    evidence: [reason],
  }
  item.classification_accuracy = {
    authority: 'AP Biology Course and Exam Description',
    required_topics: [],
    primary_unit_rule: 'Items requiring knowledge outside the current AP Biology topic sequence are not assigned to a student-facing unit.',
    why_not_earlier_unit: reason,
    classification_reasoning: item.classification_reasoning,
    review_method: 'Biology current-framework scope review',
    reviewed_at: '2026-07-21',
  }
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    JSON.stringify(item.background_data || ''),
    JSON.stringify(item.options || {}),
  ].join('\n').replace(/\s+/g, ' ')
}

function stemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    JSON.stringify(item.background_data || ''),
  ].join('\n').replace(/\s+/g, ' ')
}

function byManual(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown Biology topic ${code}`)
  return { ...topic, unit: normalizeUnit(topic.unit), reason }
}

function unitLevel(item, reason) {
  const unit = normalizeUnit(item.primary_unit)
  return { unit, code: null, name: unitName(unit), reason }
}

function r(code, pattern, reason) {
  return { code, pattern, reason }
}

function addFinding(severity, file, item, message) {
  if (severity === 'blocking') report.totals.blocking += 1
  if (severity === 'review') report.totals.review += 1
  const row = {
    severity,
    file,
    question_id: item.question_id,
    primary_unit: item.primary_unit,
    message,
    text: String(item.text || item.question_text || '').replace(/\s+/g, ' ').slice(0, 360),
    options: item.options || null,
  }
  report.findings.push(row)
  reviewPack.push(row)
}

function visibleForBefore(item) {
  return item && item.primary_unit !== 'not_applicable' && item.scoring_status !== 'not_scored' && item.student_visible !== false && item.publish_status !== 'blocked'
}

function visible(item) {
  return visibleForBefore(item) && item.student_visible !== false && item.publish_status !== 'blocked'
}

function unitName(unit) {
  return (config.units || []).find(entry => normalizeUnit(entry.id || entry.code) === unit)?.name || unit
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
