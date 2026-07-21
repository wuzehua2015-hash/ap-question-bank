#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'environmental-science'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'apes-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) topicByCode.set(topic.code, { unit: unit.code || unit.id, code: topic.code, name: topic.name })
}

const MANUAL = {
  'question_bank.json|2008_Q77': ['U8', '8.9', 'Primary waste disposal method in the United States requires solid waste disposal.'],
  'question_bank.json|2008_Q80': ['U2', '2.5', 'Greater fire severity after wet winters requires natural-disruption and fuel-load reasoning.'],
  'question_bank.json|2008_Q89': ['U8', '8.15', 'Increased air travel leading to spread of disease requires infectious-disease reasoning.'],
  'question_bank.json|2008_Q98': ['U8', '8.12', 'Predicting the pH where 50 percent of Daphnia survive requires lethal-dose style toxicity reasoning.'],
  'question_bank.json|2008_Q99': ['U8', '8.13', 'Adding a control group in a toxicity experiment supports interpreting a dose-response relationship.'],
  'question_bank.json|2008_Q100': ['U8', '8.13', 'Predicting normal wild-water pH from Daphnia toxicity data requires dose-response interpretation.'],
  'question_bank.json|2016_Q01': ['U7', '7.4', 'Lead as a gasoline additive is an atmospheric pollutant and particulate-source item.'],
  'question_bank.json|2016_Q03': ['U7', '7.5', 'Radon as a leading lung cancer cause belongs to indoor air pollutants.'],
  'question_bank.json|2016_Q04': ['U8', '8.8', 'Mercury risk from marine fish requires bioaccumulation and biomagnification.'],
  'question_bank.json|2016_Q07': ['U4', '4.8', 'Regional tornado frequency on a map requires geography and climate.'],
  'question_bank.json|2016_Q08': ['U9', '9.10', 'Forest fragmentation causing biodiversity loss requires human impacts on biodiversity.'],
  'question_bank.json|2016_Q09': ['U6', '6.4', 'Identifying the major petroleum-exporting region requires distribution of natural energy resources.'],
  'question_bank.json|2016_Q10': ['U4', '4.1', 'Island arcs require plate-tectonics reasoning.'],
  'question_bank.json|2016_Q11': ['U4', '4.1', 'A nonvolcanic mountain chain due to uplift requires plate-tectonics reasoning.'],
  'question_bank.json|2016_Q12': ['U4', '4.1', 'New crust at a divergent boundary requires plate-tectonics reasoning.'],
  'question_bank.json|2016_Q13': ['U1', '1.2', 'Tree-species diversity from climatographs requires terrestrial biome identification.'],
  'question_bank.json|2016_Q14': ['U1', '1.2', 'Dry scrub with frequent fires from climatographs requires terrestrial biome identification.'],
  'question_bank.json|2016_Q17': ['U4', '4.1', 'The exception to sun-driven processes is plate tectonics, which requires Unit 4.1.'],
  'question_bank.json|2016_Q18': ['U1', '1.8', 'Phytoplankton abundance in upper water layers requires primary productivity and light availability.'],
  'question_bank.json|2016_Q19': ['U7', '7.6', 'Catalytic converters reducing vehicle pollutants requires reduction of air pollutants.'],
  'question_bank.json|2016_Q20': ['U6', '6.11', 'Fuel cell vehicle operation requires hydrogen fuel cell knowledge.'],
  'question_bank.json|2016_Q21': ['U5', '5.4', 'Intensive agriculture reducing soil organic matter requires impacts of agricultural practices.'],
  'question_bank.json|2016_Q22': ['U4', '4.3', 'Reading sand, silt, and clay proportions requires soil composition and properties.'],
  'question_bank.json|2016_Q24': ['U7', '7.3', 'The air-pollution episode diagram illustrates thermal inversion.'],
  'question_bank.json|2016_Q25': ['U1', '1.7', 'The Ogallala Aquifer item requires freshwater and groundwater resource reasoning.'],
  'question_bank.json|2016_Q30': ['U2', '2.4', 'Tree growth under full sunlight requires ecological tolerance from a graph.'],
  'question_bank.json|2016_Q31': ['U4', '4.5', 'Deserts near 30 degrees latitude require global wind pattern reasoning.'],
  'question_bank.json|2016_Q34': ['U2', '2.3', 'Extinction rates on small isolated islands require island biogeography.'],
  'question_bank.json|2016_Q36': ['U1', '1.5', 'Choosing a nitrogen-cycle diagram requires nitrogen cycle knowledge.'],
  'question_bank.json|2016_Q37': ['U5', '5.6', 'Glyphosate selecting for resistant weeds requires pest control method consequences.'],
  'question_bank.json|2016_Q38': ['U5', '5.4', 'GM crop concern about genetic diversity belongs to impacts of agricultural practices.'],
  'question_bank.json|2016_Q39': ['U8', '8.2', 'Herbicide runoff affecting amphibians requires human impacts on ecosystems.'],
  'question_bank.json|2016_Q42': ['U8', '8.1', 'Identifying likely upstream construction effect in stream data requires sources of pollution.'],
  'question_bank.json|2016_Q43': ['U5', '5.7', 'Land required for beef versus corn requires meat-production resource-use reasoning.'],
  'question_bank.json|2016_Q46': ['U3', '3.8', 'Expected decline in population growth rate requires human population dynamics.'],
  'question_bank.json|2016_Q47': ['U4', '4.9', 'El Nino effects on fish-eating birds require El Nino and La Nina.'],
  'question_bank.json|2016_Q48': ['U1', '1.8', 'Open-ocean biomass versus productivity requires primary productivity.'],
  'question_bank.json|2016_Q49': ['U7', '7.2', 'NO concentration pattern in a smoggy-day graph requires photochemical smog.'],
  'question_bank.json|2016_Q50': ['U7', '7.2', 'Reducing hydrocarbons and ozone in smog requires photochemical smog.'],
  'question_bank.json|2016_Q52': ['U1', '1.7', 'Housing development reducing groundwater recharge requires hydrologic-cycle reasoning.'],
  'question_bank.json|2016_Q53': ['U5', '5.13', 'Stormwater runoff from development requires urban-runoff reasoning.'],
  'question_bank.json|2016_Q54': ['U5', '5.13', 'Rain barrels reducing flow into a creek require methods to reduce urban runoff.'],
  'question_bank.json|2016_Q55': ['U2', '2.6', 'Finch beak-size differences require adaptation reasoning.'],
  'question_bank.json|2016_Q56': ['U1', '1.7', 'Water-saving showerhead calculation requires water-use and hydrologic-resource context.'],
  'question_bank.json|2016_Q58': ['U3', '3.9', 'Preindustrial-to-industrial demographic change requires demographic transition.'],
  'question_bank.json|2016_Q59': ['U5', '5.1', 'Externalities require tragedy-of-the-commons style shared-resource reasoning.'],
  'question_bank.json|2016_Q60': ['U4', '4.6', 'Interpreting watershed graph information requires watersheds.'],
  'question_bank.json|2016_Q61': ['U5', '5.15', 'Agroforestry to reduce erosion and diversify crops requires sustainable agriculture.'],
  'question_bank.json|2016_Q62': ['U4', '4.8', 'Surface ocean circulation distributing heat requires geography and climate.'],
  'question_bank.json|2016_Q63': ['U6', '6.6', 'Half-life of a radioactive substance requires nuclear power/radiation context.'],
  'question_bank.json|2016_Q64': ['U8', '8.5', 'Cyanobacteria toxins in Lake Erie require eutrophication.'],
  'question_bank.json|2016_Q66': ['U8', '8.12', 'Lethal-dose experimental design requires toxicity and LD50 reasoning.'],
  'question_bank.json|2016_Q69': ['U6', '6.3', 'Gasoline mileage and carbon dioxide released require fuel types and uses.'],
  'question_bank.json|2016_Q70': ['U3', '3.7', 'Promoting fertility above replacement level requires total fertility rate.'],
  'question_bank.json|2016_Q74': ['U4', '4.2', 'Disturbed-area soil samples and carbon require soil formation and erosion context.'],
  'question_bank.json|2016_Q77': ['U1', '1.4', 'A carbon sink requires carbon cycle knowledge.'],
  'question_bank.json|2016_Q80': ['U2', '2.4', 'Testing plant survivorship after trampling requires ecological tolerance experimental reasoning.'],
  'question_bank.json|2016_Q81': ['U3', '3.2', 'K-selection reproductive strategy requires K-selected and r-selected species.'],
  'question_bank.json|2016_Q83': ['U9', '9.5', 'Arctic effects from increased temperature require global climate change.'],
  'question_bank.json|2016_Q86': ['U4', '4.7', 'Twenty-four hours of daylight on December 21 requires solar radiation and seasons.'],
  'question_bank.json|2016_Q87': ['U8', '8.8', 'The best description of bioaccumulation requires bioaccumulation and biomagnification.'],
  'question_bank.json|2016_Q88': ['U7', '7.4', 'Health impact of atmospheric particulates requires atmospheric particulates.'],
  'question_bank.json|2016_Q89': ['U5', '5.2', 'A proposed clear-cut in deciduous forest requires clearcutting.'],
  'question_bank.json|2016_Q95': ['U2', '2.2', 'Economic benefit from pasture plant diversity requires ecosystem services.'],
  'question_bank.json|2016_Q96': ['U5', '5.4', 'Comparing monetary return per water use for crops requires agricultural-resource-use reasoning.'],
  'question_bank.json|2016_Q97': ['U9', '9.5', 'Global changes from increased atmospheric carbon dioxide require global climate change.'],
  'question_bank.json|2016_Q98': ['U5', '5.4', 'Graph interpretation about food/resource production requires agricultural-resource-use reasoning.'],
  'question_bank.json|2016_Q99': ['U7', '7.3', 'Human health effect associated with thermal inversion requires thermal inversion.'],
  'frq_bank.json|2008_FRQ1': ['U8', '8.9', 'The full landfill siting and management FRQ requires solid waste disposal as the latest required unit.'],
  'frq_bank.json|2008_FRQ2': ['U8', '8.2', 'The full gold mining FRQ includes mining and abandoned-site environmental problems; human impacts on ecosystems is the latest required topic.'],
  'frq_bank.json|2008_FRQ4': ['U9', '9.4', 'The full biogeochemical-cycle FRQ includes human disruption of the carbon cycle and greenhouse gas consequences; Unit 9 is the latest required unit.'],
  'frq_bank.json|2016_FRQ2': ['U8', '8.10', 'The full iron and steel FRQ includes recycling steel to reduce mined resources and abandoned mine impacts; waste reduction is the latest required topic.'],
  'frq_bank.json|2016_FRQ3': ['U8', '8.14', 'The full municipal solid waste FRQ includes waste management, landfill gas, discarded tires, and human health effects.'],
  'frq_bank.json|2016_FRQ4': ['U9', '9.5', 'The full soil FRQ includes climate-change soil degradation, so global climate change is the latest required topic.'],
}

const RULES = [
  r('9.10', /\b(human impacts on biodiversity|habitat destruction|species loss|extinction)\b/i, 'Human impacts on biodiversity require Unit 9.10.'),
  r('9.9', /\b(endangered species|threatened species|CITES)\b/i, 'Endangered species require Unit 9.9.'),
  r('9.8', /\b(invasive species|introduced species|zebra mussel|nonnative)\b/i, 'Invasive species require Unit 9.8.'),
  r('9.7', /\b(ocean acidification|carbonate|coral bleaching)\b/i, 'Ocean acidification requires Unit 9.7.'),
  r('9.6', /\b(ocean warming|sea level rise|thermal expansion)\b/i, 'Ocean warming requires Unit 9.6.'),
  r('9.5', /\b(global climate change|climate change|positive feedback|warming climate)\b/i, 'Global climate change requires Unit 9.5.'),
  r('9.4', /\b(greenhouse gases?|CFCs?|carbon dioxide increased|atmospheric carbon|burning fossil fuels)\b/i, 'Increases in greenhouse gases require Unit 9.4.'),
  r('9.3', /\b(greenhouse effect|greenhouse gas)\b/i, 'Greenhouse effect requires Unit 9.3.'),
  r('9.2', /\b(reducing ozone depletion|Montreal Protocol)\b/i, 'Reducing ozone depletion requires Unit 9.2.'),
  r('9.1', /\b(ozone layer|stratospheric ozone|skin cancer|UV radiation)\b/i, 'Stratospheric ozone depletion requires Unit 9.1.'),
  r('8.15', /\b(pathogen|infectious disease|disease organisms)\b/i, 'Pathogens and infectious diseases require Unit 8.15.'),
  r('8.14', /\b(human health|cancer|toxicolog|poison)\b/i, 'Pollution and human health require Unit 8.14.'),
  r('8.13', /\b(dose response|response curve)\b/i, 'Dose-response curves require Unit 8.13.'),
  r('8.12', /\b(LD50|lethal dose|50 percent survive)\b/i, 'Lethal dose reasoning requires Unit 8.12.'),
  r('8.11', /\b(sewage treatment|wastewater|BOD|biological oxygen demand|dissolved oxygen|organic waste)\b/i, 'Sewage treatment and oxygen demand require Unit 8.11.'),
  r('8.10', /\b(recycling|reuse|waste reduction|composting)\b/i, 'Waste reduction methods require Unit 8.10.'),
  r('8.9', /\b(solid waste|municipal solid waste|landfill|hazardous waste|radioactive waste|cradle-to-grave)\b/i, 'Solid waste disposal requires Unit 8.9.'),
  r('8.8', /\b(bioaccumulation|biomagnification|DDT|retained in the tissues|food chain)\b/i, 'Bioaccumulation and biomagnification require Unit 8.8.'),
  r('8.7', /\b(persistent organic pollutant|persistent chemical pesticide)\b/i, 'Persistent organic pollutants require Unit 8.7.'),
  r('8.6', /\b(thermal pollution|heated water|water temperature)\b/i, 'Thermal pollution requires Unit 8.6.'),
  r('8.5', /\b(eutrophication|algal bloom|oxygen sag|nitrates? into water)\b/i, 'Eutrophication requires Unit 8.5.'),
  r('8.4', /\b(wetland|mangrove)\b/i, 'Human impacts on wetlands and mangroves require Unit 8.4.'),
  r('8.3', /\b(endocrine disruptor|hormone mimic)\b/i, 'Endocrine disruptors require Unit 8.3.'),
  r('8.2', /\b(phytoremediation|environmental contamination|abandoned coal mines|abandoned hazardous waste|leached|contaminants|mercury)\b/i, 'Human impacts on ecosystems require Unit 8.2.'),
  r('8.1', /\b(pollution|nonpoint source|point source|pesticide treadmill)\b/i, 'Sources of pollution require Unit 8.1.'),
  r('7.8', /\b(noise pollution|decibel)\b/i, 'Noise pollution requires Unit 7.8.'),
  r('7.7', /\b(acid rain|sulfur dioxide|SO_2|nitrogen oxides?)\b/i, 'Acid rain requires Unit 7.7.'),
  r('7.6', /\b(remove.*particulates|scrubber|electrostatic precipitator|reduce.*emissions|SO2 emissions)\b/i, 'Reduction of air pollutants requires Unit 7.6.'),
  r('7.5', /\b(indoor air|radon gas|radon|asbestos|carbon monoxide)\b/i, 'Indoor air pollutants require Unit 7.5.'),
  r('7.4', /\b(particulates|atmospheric CO2|lead.*gasoline additive|mercury.*atmospheric)\b/i, 'Atmospheric particulates and carbon dioxide require Unit 7.4.'),
  r('7.3', /\b(thermal inversion|inversion layer)\b/i, 'Thermal inversion requires Unit 7.3.'),
  r('7.2', /\b(smog|photochemical|Los Angeles basin|tropospheric ozone)\b/i, 'Photochemical smog requires Unit 7.2.'),
  r('7.1', /\b(air pollution|pollutants? listed|Clean Air Act)\b/i, 'Introduction to air pollution requires Unit 7.1.'),
  r('6.13', /\b(energy conservation|conserve energy|efficien(?:t|cy)|compact fluorescent|LED)\b/i, 'Energy conservation requires Unit 6.13.'),
  r('6.12', /\b(wind energy|wind turbine)\b/i, 'Wind energy requires Unit 6.12.'),
  r('6.11', /\b(hydrogen fuel cell|fuel cell)\b/i, 'Hydrogen fuel cells require Unit 6.11.'),
  r('6.10', /\b(geothermal)\b/i, 'Geothermal energy requires Unit 6.10.'),
  r('6.9', /\b(hydroelectric|dam|reservoir)\b/i, 'Hydroelectric power requires Unit 6.9.'),
  r('6.8', /\b(solar energy|solar power|photovoltaic|solar thermal)\b/i, 'Solar energy requires Unit 6.8.'),
  r('6.7', /\b(biomass|biofuel|ethanol)\b/i, 'Energy from biomass requires Unit 6.7.'),
  r('6.6', /\b(nuclear power|uranium|radioactive)\b/i, 'Nuclear power requires Unit 6.6.'),
  r('6.5', /\b(fossil fuels?|coal|oil|natural gas|crude oil|hydrocarbon fuels)\b/i, 'Fossil fuels require Unit 6.5.'),
  r('6.4', /\b(distribution of natural energy resources|coal reserves|proven reserves)\b/i, 'Distribution of natural energy resources requires Unit 6.4.'),
  r('6.3', /\b(fuel types?|gasoline|transportation fuel)\b/i, 'Fuel types and uses require Unit 6.3.'),
  r('6.2', /\b(energy consumption|electricity usage|electric power demand|electricity production|power plant|per capita electricity)\b/i, 'Global energy consumption requires Unit 6.2.'),
  r('6.1', /\b(renewable|nonrenewable|energy resources)\b/i, 'Renewable and nonrenewable resources require Unit 6.1.'),
  r('5.17', /\b(sustainable forestry|old-growth forest|harvesting trees|clearcutting)\b/i, 'Sustainable forestry requires Unit 5.17.'),
  r('5.16', /\b(aquaculture|farm-raised salmon)\b/i, 'Aquaculture requires Unit 5.16.'),
  r('5.15', /\b(sustainable agriculture|organic crops)\b/i, 'Sustainable agriculture requires Unit 5.15.'),
  r('5.14', /\b(integrated pest management|biological controls)\b/i, 'Integrated pest management requires Unit 5.14.'),
  r('5.13', /\b(urban runoff|impervious surface|runoff)\b/i, 'Methods to reduce urban runoff require Unit 5.13.'),
  r('5.12', /\b(global sustainability|sustainability)\b/i, 'Introduction to sustainability requires Unit 5.12.'),
  r('5.11', /\b(ecological footprint)\b/i, 'Ecological footprints require Unit 5.11.'),
  r('5.10', /\b(urban development|urbanization)\b/i, 'Impacts of urbanization require Unit 5.10.'),
  r('5.9', /\b(mining|mountaintop removal|gold.*mine|iron ore|ore)\b/i, 'Impacts of mining require Unit 5.9.'),
  r('5.8', /\b(overfishing)\b/i, 'Impacts of overfishing require Unit 5.8.'),
  r('5.7', /\b(meat production|vegetarianism|deforestation.*human population)\b/i, 'Meat production methods require Unit 5.7.'),
  r('5.6', /\b(pest control|pesticide)\b/i, 'Pest control methods require Unit 5.6.'),
  r('5.5', /\b(irrigation)\b/i, 'Irrigation methods require Unit 5.5.'),
  r('5.4', /\b(agricultural practices|fertilizers?|green revolution)\b/i, 'Impacts of agricultural practices require Unit 5.4.'),
  r('5.3', /\b(Green Revolution)\b/i, 'Green Revolution requires Unit 5.3.'),
  r('5.2', /\b(clearcutting|fragmented landscape)\b/i, 'Clearcutting requires Unit 5.2.'),
  r('5.1', /\b(tragedy of the commons|commons)\b/i, 'Tragedy of the commons requires Unit 5.1.'),
  r('4.9', /\b(El Ni(?:n|ñ)o|La Ni(?:n|ñ)a)\b/i, 'El Nino and La Nina require Unit 4.9.'),
  r('4.8', /\b(climate regions|Mediterranean climate|geography and climate)\b/i, 'Earth geography and climate require Unit 4.8.'),
  r('4.7', /\b(solar radiation|seasons)\b/i, 'Solar radiation and seasons require Unit 4.7.'),
  r('4.6', /\b(watershed)\b/i, 'Watersheds require Unit 4.6.'),
  r('4.5', /\b(global wind|wind patterns)\b/i, 'Global wind patterns require Unit 4.5.'),
  r('4.4', /\b(atmosphere|troposphere|stratosphere|atmospheric pressure|weather experienced)\b/i, 'Earth atmosphere requires Unit 4.4.'),
  r('4.3', /\b(soil composition|soil type|soil properties|soil profile|soil particles|organic material)\b/i, 'Soil composition and properties require Unit 4.3.'),
  r('4.2', /\b(soil formation|erosion|soil horizon|A horizon)\b/i, 'Soil formation and erosion require Unit 4.2.'),
  r('4.1', /\b(plate tectonics|earthquake|volcano)\b/i, 'Plate tectonics requires Unit 4.1.'),
  r('3.9', /\b(demographic transition)\b/i, 'Demographic transition requires Unit 3.9.'),
  r('3.8', /\b(human population dynamics|world population|environmental impact of world population)\b/i, 'Human population dynamics require Unit 3.8.'),
  r('3.7', /\b(total fertility|fertility rate)\b/i, 'Total fertility rate requires Unit 3.7.'),
  r('3.6', /\b(age structure|stable age distribution)\b/i, 'Age structure diagrams require Unit 3.6.'),
  r('3.5', /\b(population growth|resource availability|doubling time|growth rate)\b/i, 'Population growth and resource availability require Unit 3.5.'),
  r('3.4', /\b(carrying capacity)\b/i, 'Carrying capacity requires Unit 3.4.'),
  r('3.3', /\b(survivorship curve)\b/i, 'Survivorship curves require Unit 3.3.'),
  r('3.2', /\b(K- strategist|K-selected|r-strategist|r-selected)\b/i, 'K-selected and r-selected species require Unit 3.2.'),
  r('3.1', /\b(generalist|specialist)\b/i, 'Generalist and specialist species require Unit 3.1.'),
  r('2.7', /\b(succession|abandoned field)\b/i, 'Ecological succession requires Unit 2.7.'),
  r('2.6', /\b(adaptation|adapted)\b/i, 'Adaptations require Unit 2.6.'),
  r('2.5', /\b(natural disruption|fire severity|wildfire)\b/i, 'Natural disruptions to ecosystems require Unit 2.5.'),
  r('2.4', /\b(ecological tolerance|tolerance range)\b/i, 'Ecological tolerance requires Unit 2.4.'),
  r('2.3', /\b(island biogeography)\b/i, 'Island biogeography requires Unit 2.3.'),
  r('2.2', /\b(ecosystem services)\b/i, 'Ecosystem services require Unit 2.2.'),
  r('2.1', /\b(biodiversity|species richness|species diversity|keystone species)\b/i, 'Biodiversity requires Unit 2.1.'),
  r('1.11', /\b(food chains?|food webs?)\b/i, 'Food chains and food webs require Unit 1.11.'),
  r('1.10', /\b(10% rule|ten percent rule)\b/i, 'Energy flow and the 10% rule require Unit 1.10.'),
  r('1.9', /\b(trophic levels?|producer|primary consumer|secondary consumer)\b/i, 'Trophic levels require Unit 1.9.'),
  r('1.8', /\b(primary production|primary productivity|photosynthetic organisms|photic zone)\b/i, 'Primary productivity requires Unit 1.8.'),
  r('1.7', /\b(hydrologic cycle|freshwater|desalination|water cycle)\b/i, 'Hydrologic cycle requires Unit 1.7.'),
  r('1.6', /\b(phosphorus cycle|phosphate|phosphorus)\b/i, 'Phosphorus cycle requires Unit 1.6.'),
  r('1.5', /\b(nitrogen cycle|nitrogen fixation|nitrogen compounds)\b/i, 'Nitrogen cycle requires Unit 1.5.'),
  r('1.4', /\b(carbon cycle|atmospheric carbon)\b/i, 'Carbon cycle requires Unit 1.4.'),
  r('1.3', /\b(aquatic biome|littoral zone|limnetic zone|profundal zone|ocean zone|pond or lake)\b/i, 'Aquatic biomes require Unit 1.3.'),
  r('1.2', /\b(terrestrial biome|desert|tundra|grassland|forest)\b/i, 'Terrestrial biomes require Unit 1.2.'),
  r('1.1', /\b(ecosystem|biotic|abiotic|pH|H\\+ ions)\b/i, 'Introduction to ecosystems requires Unit 1.1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Environmental Science primary_unit is the latest official unit required to solve the full item using that unit and prior units; short grouped items include shared context and structured data.',
  totals: { checked: 0, changed: 0, topic_materialized: 0, blocking: 0, review: 0, still_unit_level: 0 },
  before: {},
  after: {},
  findings: [],
}
const reviewPack = []

runAudit()

function runAudit() {
  for (const file of ['question_bank.json', 'frq_bank.json']) {
    const arr = readJson(path.join(SUBJECT_DIR, file))
    for (const item of arr) if (visible(item)) report.before[item.primary_unit] = (report.before[item.primary_unit] || 0) + 1
    for (const item of arr) auditItem(file, item)
    for (const item of arr) if (visible(item)) report.after[item.primary_unit] = (report.after[item.primary_unit] || 0) + 1
    if (applyFixes) fs.writeFileSync(path.join(SUBJECT_DIR, file), JSON.stringify(arr, null, 2) + '\n')
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewPack, null, 2) + '\n')
  console.log(`APES unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && (report.totals.blocking > 0 || report.totals.review > 0 || report.totals.still_unit_level > 0)) process.exit(1)
}

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const generated = generatedDecision(item)
  const decision = MANUAL[key] ? byManual(MANUAL[key]) : generated || classify(item)
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
  for (const rule of RULES) if (rule.pattern.test(text)) return byCode(rule.code, rule.reason)
  return unitLevel(item, 'No APES official-topic decision matched; requires manual review before student-facing use.')
}

function generatedDecision(item) {
  const match = String(item.question_id || '').match(/^lynkedu_2026_environmental_science_capacity_Q(\d{3})$/)
  if (!match) return null
  const n = Number(match[1])
  if (n >= 1 && n <= 12) return byCode('2.1', 'Generated APES capacity item about species using several food sources requires biodiversity.')
  if (n >= 13 && n <= 22) return byCode('4.3', 'Generated APES capacity item about clay versus sandy soil requires soil composition and properties.')
  if (n >= 23 && n <= 32) return byCode('5.15', 'Generated APES capacity item about contour plowing requires sustainable agriculture.')
  if (n >= 33 && n <= 36) return byCode('1.4', 'Generated APES capacity item about carbon moving from atmosphere into biomass requires carbon cycle.')
  if (n >= 37 && n <= 40) return byCode('3.5', 'Generated APES capacity item about population growth slowing as resources become limited requires population growth and resource availability.')
  if (n >= 41 && n <= 44) return byCode('6.12', 'Generated APES capacity item about replacing coal with wind energy requires wind energy.')
  if (n >= 45 && n <= 47) return byCode('7.4', 'Generated APES capacity item about particulate matter near roadways requires atmospheric particulates.')
  if (n >= 48 && n <= 50) return byCode('9.6', 'Generated APES capacity item about warmer ocean water and coral bleaching requires ocean warming.')
  return null
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
    classification_version: 'apes-official-progression-2026-07-21',
    authority: 'AP Environmental Science Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Environmental Science Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'APES item review against the official AP Environmental Science topic sequence; shared context and tables included',
    reviewed_at: '2026-07-21',
  }
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    JSON.stringify(item.background_data || ''),
    correctOption(item),
  ].join('\n').replace(/\s+/g, ' ')
}

function correctOption(item) {
  if (!item.options || typeof item.options !== 'object') return ''
  return String(item.answer || item.correct_answer || '')
    .split(',')
    .map(label => item.options[label.trim()] || '')
    .join(' ')
}

function byManual(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown APES topic ${code}`)
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
    group_context: String(item.group_context || item.shared_context || '').replace(/\s+/g, ' ').slice(0, 240),
    answer: item.answer || item.correct_answer || null,
  }
  report.findings.push(row)
  reviewPack.push(row)
}

function visible(item) {
  return item && item.primary_unit !== 'not_applicable' && item.student_visible !== false && item.publish_status !== 'blocked' && item.scoring_status !== 'not_scored'
}

function unitName(unit) {
  return (config.units || []).find(entry => normalizeUnit(entry.code || entry.id) === unit)?.name || unit
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/^U(\d+)$/i)
  return match ? `U${Number(match[1])}` : String(unit || '')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
