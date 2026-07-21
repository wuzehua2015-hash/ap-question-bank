#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'chemistry'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'chemistry-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByCode = new Map()
for (const unit of config.units || []) {
  for (const topic of unit.topics || []) {
    topicByCode.set(topic.code, { unit: unit.code, code: topic.code, name: topic.name })
  }
}

const MANUAL = {
  'question_bank.json|2014_Q32': ['U5', '5.1', 'The answer path uses reaction-rate stoichiometry; titration wording is context, not the required acid-base model.'],
  'question_bank.json|2014_Q33': ['U4', '4.9', 'The answer path requires assigning oxidation numbers in a redox reaction.'],
  'question_bank.json|2014_Q41': ['U3', '3.1', 'The answer depends on intermolecular forces and hydrogen bonding, not thermochemical calculation.'],
  'question_bank.json|2014_Q31': ['U1', '1.6', 'The x-ray photoelectron spectroscopy item requires interpreting PES peak position by nuclear charge.'],
  'question_bank.json|2015_Q12': ['U1', '1.7', 'Successive ionization energies identify valence-shell structure through periodic-trend reasoning.'],
  'question_bank.json|2015_Q39': ['U4', '4.5', 'Equal-mass complete-combustion yield requires reaction stoichiometry and molar-mass comparison.'],
  'question_bank.json|2015_Q50': ['U3', '3.11', 'Absorption-spectrum regions require spectroscopy and electromagnetic-spectrum reasoning.'],
  'question_bank.json|2016_Q08': ['U1', '1.5', 'Successive ionization energies identify the electron configuration and valence shell of element X.'],
  'question_bank.json|2015_Q13': ['U8', '8.11', 'The answer path connects hydroxide solubility equilibrium with pH effects.'],
  'question_bank.json|2015_Q27': ['U5', '5.3', 'The answer path requires integrated-rate-law plot reasoning for reaction order.'],
  'question_bank.json|2015_Q41': ['U8', '8.5', 'The answer path requires acid-base titration stoichiometry at the equivalence point.'],
  'question_bank.json|2016_Q37': ['U6', '6.6', 'The complete-reaction wording is context; the answer path requires thermochemical heat released.'],
  'question_bank.json|2016_Q44': ['U6', '6.1', 'The answer path requires endothermic reaction and temperature-change reasoning.'],
  'question_bank.json|2018_Q25': ['U2', '2.1', 'The answer path identifies a solid by particle structure and bonding properties.'],
  'question_bank.json|2019_Q28': ['U8', '8.5', 'The answer path requires acid-base titration equivalence-point stoichiometry.'],
  'question_bank.json|2019_Q30': ['U3', '3.1', 'The answer path uses intermolecular attractions and particle-level liquid behavior.'],
  'question_bank.json|2019_Q34': ['U7', '7.3', 'The answer path requires reaction quotient and equilibrium-constant reasoning.'],
  'question_bank.json|2015_Q16': ['U7', '7.3', 'Partial-pressure data for a decomposing gas mixture require equilibrium-constant reasoning, not acid-base chemistry.'],
  'question_bank.json|2015_Q23': ['U6', '6.4', 'Burning a food sample in a calorimeter and using water temperature change requires calorimetry.'],
  'question_bank.json|2015_Q29': ['U6', '6.7', 'Comparing O-H bond enthalpies from reaction enthalpy requires bond-enthalpy reasoning.'],
  'question_bank.json|2016_Q35': ['U1', '1.6', 'The item requires interpreting photoelectron spectra of isoelectronic species.'],
  'question_bank.json|2016_Q49': ['U1', '1.7', 'Predicting rubidium oxide formation from periodic trends belongs to atomic structure and periodic trends.'],
  'question_bank.json|2018_Q13': ['U3', '3.4', 'Balloon volume change with pressure and altitude requires gas-law reasoning.'],
  'question_bank.json|2018_Q14': ['U3', '3.3', 'Immediate vaporization into an evacuated vessel requires phase-change and particle-state reasoning.'],
  'question_bank.json|2018_Q40': ['U5', '5.3', 'Determining a rate constant from concentration-time data requires integrated-rate-law reasoning.'],
  'question_bank.json|2018_Q43': ['U3', '3.13', 'Choosing an experimental technique to determine gas concentration by absorbance requires Beer-Lambert/spectroscopy reasoning.'],
  'question_bank.json|2019_Q39': ['U8', '8.4', 'Salt hydrolysis producing a slightly acidic solution requires acid-base conjugate-pair reasoning.'],
  'frq_bank.json|2014_FRQ4': ['U7', '7.3', 'The full decomposition FRQ requires equilibrium calculations for calcium carbonate decomposition.'],
  'frq_bank.json|2014_FRQ5': ['U2', '2.7', 'The full FRQ requires molecular structure and geometry of binary fluorides.'],
  'frq_bank.json|2014_FRQ6': ['U3', '3.2', 'The full FRQ uses density/solid properties and mixture separation of polymer beads.'],
  'frq_bank.json|2016_FRQ4': ['U2', '2.4', 'The alloy FRQ requires metallic/alloy particle representations and composition reasoning.'],
  'frq_bank.json|2016_FRQ7': ['U3', '3.13', 'The spectrophotometry preparation task requires solution dilution and Beer-Lambert measurement reasoning.'],
  'frq_bank.json|2019_FRQ1': ['U6', '6.6', 'The full combustion FRQ includes redox identification and enthalpy/thermochemical reasoning, with U6 as latest required unit.'],
  'frq_bank.json|2015_FRQ2': ['U8', '8.11', 'The full FRQ combines lattice or solubility-equilibrium reasoning with acid-base effects on metal hydroxides.'],
  'frq_bank.json|2015_FRQ5': ['U7', '7.4', 'The full FRQ requires calculating an equilibrium pressure and Kp for a reversible gas reaction.'],
  'question_bank.json|2014_Q02': ['U2', '2.3', 'The item identifies an ionic crystalline solid from melting point, solid conductivity, and aqueous conductivity.'],
  'question_bank.json|2014_Q07': ['U3', '3.4', 'The item requires Boyle law reasoning for a gas at constant temperature.'],
  'question_bank.json|2014_Q08': ['U1', '1.8', 'The group data identify a metal chloride by valence electrons and ionic compound formula reasoning.'],
  'question_bank.json|2014_Q10': ['U3', '3.8', 'The item requires a particle representation of dissociated aqueous silver nitrate.'],
  'question_bank.json|2014_Q14': ['U3', '3.4', 'The table comparison requires ideal-gas law relationships between pressure, amount, and container volume.'],
  'question_bank.json|2014_Q15': ['U3', '3.5', 'The item compares average gas particle speed at the same temperature using kinetic molecular theory.'],
  'question_bank.json|2014_Q18': ['U6', '6.3', 'The item requires thermal-equilibrium heat-transfer reasoning between copper and water.'],
  'question_bank.json|2014_Q29': ['U7', '7.6', 'Combining equilibrium expressions requires properties of equilibrium constants.'],
  'question_bank.json|2014_Q30': ['U3', '3.1', 'The item requires correct representation of intermolecular hydrogen bonding between DNA bases.'],
  'question_bank.json|2014_Q35': ['U2', '2.7', 'The polarity comparison requires molecular geometry and lone-pair reasoning.'],
  'question_bank.json|2014_Q37': ['U7', '7.2', 'The reaction proceeds toward equilibrium from mixed reactants; thermodynamic values are context.'],
  'question_bank.json|2014_Q39': ['U6', '6.5', 'The item calculates energy for a phase change using heat of fusion.'],
  'question_bank.json|2014_Q40': ['U6', '6.5', 'The item compares energy required for different phase-change segments.'],
  'question_bank.json|2014_Q42': ['U2', '2.4', 'The steel and chromium context requires alloy and metallic-structure reasoning.'],
  'question_bank.json|2014_Q45': ['U6', '6.1', 'The item identifies heat flow for decomposition from the energy information.'],
  'question_bank.json|2014_Q47': ['U2', '2.3', 'Ionic-crystal cleavage and brittleness are properties of ionic solids.'],
  'question_bank.json|2014_Q49': ['U3', '3.1', 'Ordering boiling points requires intermolecular-force comparison.'],
  'question_bank.json|2015_Q01': ['U3', '3.5', 'Gas effusion comparison requires molecular speed reasoning from kinetic molecular theory.'],
  'question_bank.json|2015_Q04': ['U2', '2.4', 'The item asks for a particulate depiction of an alloy.'],
  'question_bank.json|2015_Q05': ['U2', '2.1', 'The item asks for the strongest interaction between atoms in marked molecular regions.'],
  'question_bank.json|2015_Q06': ['U6', '6.3', 'A hot metal ball in another substance requires heat-transfer reasoning.'],
  'question_bank.json|2015_Q07': ['U4', '4.3', 'The pressure observation requires matching a reaction representation to gas production.'],
  'question_bank.json|2015_Q08': ['U3', '3.3', 'The item tracks mass in a vessel across temperature change and phase or gas behavior.'],
  'question_bank.json|2015_Q09': ['U3', '3.5', 'The particle-speed diagram after heating requires kinetic molecular theory.'],
  'question_bank.json|2015_Q11': ['U3', '3.1', 'The boiling-point comparison of hydrocarbons requires intermolecular-force reasoning.'],
  'question_bank.json|2015_Q14': ['U6', '6.5', 'Heating-curve segment slopes require energy of phase changes and heat capacity.'],
  'question_bank.json|2015_Q17': ['U5', '5.5', 'The item asks which change increases reaction rate through collision-model reasoning.'],
  'question_bank.json|2015_Q18': ['U4', '4.5', 'Changing the metal amount and predicting gas amount requires reaction stoichiometry.'],
  'question_bank.json|2015_Q24': ['U3', '3.4', 'The pressure-gauge prediction in a rigid vessel requires gas-law stoichiometric reasoning.'],
  'question_bank.json|2015_Q25': ['U4', '4.9', 'Identifying oxidized and reduced elements requires redox reasoning.'],
  'question_bank.json|2015_Q26': ['U3', '3.4', 'The collected oxygen pressure calculation requires ideal-gas law reasoning.'],
  'question_bank.json|2015_Q28': ['U9', '9.3', 'Thermodynamic favorability from Gibbs free energy and entropy signs requires Unit 9.'],
  'question_bank.json|2015_Q42': ['U5', '5.8', 'Connecting a proposed mechanism to an overall rate law requires mechanism and rate-law reasoning.'],
  'question_bank.json|2015_Q43': ['U5', '5.10', 'Matching an energy profile to a proposed mechanism requires multistep profile reasoning.'],
  'question_bank.json|2015_Q44': ['U5', '5.11', 'The species decomposes ozone through the same mechanism by catalytic behavior.'],
  'question_bank.json|2016_Q02': ['U5', '5.5', 'Temperature effects on reaction rate require collision-model reasoning.'],
  'question_bank.json|2016_Q03': ['U2', '2.3', 'A hard solid that conducts when dissolved is identified through ionic-solid structure.'],
  'question_bank.json|2016_Q05': ['U2', '2.2', 'Ordering bond enthalpies requires intramolecular force and bond-energy reasoning.'],
  'question_bank.json|2016_Q06': ['U3', '3.8', 'Hydrated-ion interaction strength in aqueous solution requires solution particle representation and Coulombic reasoning.'],
  'question_bank.json|2016_Q07': ['U2', '2.1', 'Ordering binary compounds by bond polarity requires chemical bond polarity reasoning.'],
  'question_bank.json|2016_Q10': ['U5', '5.5', 'Particle representations of magnesium and acid require collision-model reasoning for reaction rate.'],
  'question_bank.json|2016_Q12': ['U7', '7.11', 'Using Ksp values to compare chloride concentration requires solubility-equilibrium reasoning.'],
  'question_bank.json|2016_Q13': ['U3', '3.5', 'Comparing gas speed distributions requires kinetic molecular theory.'],
  'question_bank.json|2016_Q17': ['U3', '3.10', 'Least soluble molecule in water requires solubility and intermolecular-force reasoning.'],
  'question_bank.json|2016_Q18': ['U3', '3.2', 'Properties of a molecular solid belong to properties of solids.'],
  'question_bank.json|2016_Q19': ['U3', '3.3', 'Vapor-pressure comparison of liquids requires phase behavior and intermolecular forces.'],
  'question_bank.json|2016_Q21': ['U4', '4.5', 'Determining silver nitrate from precipitated silver chloride requires reaction stoichiometry.'],
  'question_bank.json|2016_Q24': ['U6', '6.4', 'The experiment uses calorimetry to determine reaction enthalpy.'],
  'question_bank.json|2016_Q25': ['U6', '6.4', 'Temperature change in a polystyrene container requires calorimetry.'],
  'question_bank.json|2016_Q28': ['U3', '3.9', 'Distillation of miscible liquids requires separation of mixtures.'],
  'question_bank.json|2016_Q29': ['U5', '5.3', 'First-order decay over time requires integrated-rate-law reasoning.'],
  'question_bank.json|2016_Q31': ['U3', '3.13', 'Choosing a monitoring wavelength from absorbance spectra requires Beer-Lambert measurement reasoning.'],
  'question_bank.json|2016_Q33': ['U7', '7.11', 'Predicting precipitation from ion concentrations and solubility values requires solubility equilibrium.'],
  'question_bank.json|2016_Q38': ['U4', '4.9', 'Identifying atoms reduced requires oxidation-number reasoning.'],
  'question_bank.json|2016_Q43': ['U9', '9.2', 'Heating-curve phase changes with entropy signs require entropy-change reasoning.'],
  'question_bank.json|2016_Q45': ['U3', '3.4', 'Final pressure after a gas-phase reaction requires ideal-gas law and mole-ratio reasoning.'],
  'question_bank.json|2016_Q46': ['U9', '9.2', 'Inferring entropy change from temperature-dependent favorability requires entropy reasoning.'],
  'question_bank.json|2016_Q50': ['U4', '4.5', 'Gas volume produced from iron and hydrochloric acid requires reaction stoichiometry.'],
  'question_bank.json|2018_Q01': ['U4', '4.3', 'The item asks for a particle diagram of products from a decomposition reaction.'],
  'question_bank.json|2018_Q02': ['U1', '1.3', 'Matching an empirical formula from mass data requires elemental composition reasoning.'],
  'question_bank.json|2018_Q03': ['U2', '2.1', 'Classifying substances by bonding from data requires chemical-bond reasoning.'],
  'question_bank.json|2018_Q04': ['U3', '3.1', 'Highest boiling point requires intermolecular-force comparison.'],
  'question_bank.json|2018_Q06': ['U3', '3.8', 'Comparing solution particle diagrams requires representations of solutions.'],
  'question_bank.json|2018_Q07': ['U8', '8.4', 'Species in acetic-acid and hydroxide reaction require acid-base reaction reasoning.'],
  'question_bank.json|2018_Q10': ['U1', '1.7', 'The item compares periodic properties and their explanations.'],
  'question_bank.json|2018_Q11': ['U8', '8.3', 'Percent ionization of nitrous acid requires weak-acid equilibrium reasoning.'],
  'question_bank.json|2018_Q15': ['U7', '7.3', 'Kp for evaporation treats vapor pressure as an equilibrium expression.'],
  'question_bank.json|2018_Q16': ['U3', '3.4', 'Pressure after vaporization under identical gas conditions requires ideal-gas reasoning.'],
  'question_bank.json|2018_Q17': ['U3', '3.3', 'Equilibrium vapor pressure comparison requires phase behavior and intermolecular forces.'],
  'question_bank.json|2018_Q19': ['U3', '3.8', 'Ion-water interaction strength in aqueous solution requires solution particle representation.'],
  'question_bank.json|2018_Q22': ['U4', '4.5', 'Recovering copper phosphate mass to determine copper ion concentration requires stoichiometry.'],
  'question_bank.json|2018_Q23': ['U4', '4.5', 'Yield discrepancy after a multi-step reaction sequence requires stoichiometric reasoning.'],
  'question_bank.json|2018_Q28': ['U7', '7.10', 'Changing calcium ion concentration in a saturated salt solution requires reaction quotient and equilibrium-shift reasoning.'],
  'question_bank.json|2018_Q29': ['U7', '7.11', 'Comparing ions in saturated solutions with solids present requires solubility-equilibrium reasoning.'],
  'question_bank.json|2018_Q33': ['U4', '4.5', 'Percent yield from a reaction with excess hydrogen requires reaction stoichiometry.'],
  'question_bank.json|2018_Q34': ['U4', '4.9', 'Tracking hydrogen atoms in a reaction requires oxidation-reduction reasoning.'],
  'question_bank.json|2018_Q41': ['U6', '6.7', 'Comparing C-H, N-H, and O-H strengths requires bond-enthalpy reasoning.'],
  'question_bank.json|2018_Q42': ['U7', '7.6', 'Relating two equilibrium constants requires properties of equilibrium constants.'],
  'question_bank.json|2018_Q44': ['U9', '9.3', 'Temperature-dependent thermodynamic favorability requires Gibbs free-energy reasoning.'],
  'question_bank.json|2018_Q47': ['U5', '5.5', 'Effective collision orientation requires collision-model reasoning.'],
  'question_bank.json|2018_Q50': ['U6', '6.3', 'A hot iron sample added to water in an insulated container requires heat-transfer reasoning.'],
  'question_bank.json|2019_Q06': ['U3', '3.9', 'Separating miscible liquids by boiling-point difference requires separation of mixtures.'],
  'question_bank.json|2019_Q09': ['U2', '2.3', 'The item asks for a diagram representing the structure of an ionic solid.'],
  'question_bank.json|2019_Q13': ['U5', '5.2', 'Determining a rate law from concentration-rate data requires rate-law reasoning.'],
  'question_bank.json|2019_Q15': ['U1', '1.3', 'Determining a molecular formula from composition information requires elemental composition reasoning.'],
  'question_bank.json|2019_Q17': ['U3', '3.10', 'Water solubility comparison requires solubility and intermolecular-force reasoning.'],
  'question_bank.json|2019_Q24': ['U2', '2.2', 'Potential energy versus internuclear distance requires intramolecular force and bond-energy reasoning.'],
  'question_bank.json|2019_Q25': ['U3', '3.4', 'Gas mixture reaction in a movable piston requires ideal-gas law and stoichiometry; U3 is the latest needed unit.'],
  'question_bank.json|2019_Q26': ['U3', '3.3', 'Boiling point and vapor pressure comparison of related liquids requires phase behavior and intermolecular forces.'],
  'question_bank.json|2019_Q35': ['U4', '4.3', 'Selecting the equation for calcium carbonate and hydrochloric acid requires reaction representation.'],
  'question_bank.json|2019_Q36': ['U4', '4.5', 'Using calibration data and eggshell results to calculate mass percent requires stoichiometry.'],
  'question_bank.json|2019_Q37': ['U4', '4.5', 'Gas pressure from eggshell reaction to determine acid concentration requires stoichiometry.'],
  'question_bank.json|2019_Q38': ['U5', '5.5', 'Choosing the modification that increases rate the most requires collision-model reasoning.'],
  'question_bank.json|2019_Q40': ['U9', '9.4', 'A favorable reaction that is not observed at room temperature requires kinetic versus thermodynamic control.'],
  'question_bank.json|2019_Q42': ['U2', '2.7', 'The H-O-C bond angle requires VSEPR molecular-geometry reasoning.'],
  'question_bank.json|2019_Q43': ['U2', '2.7', 'The geometry of the glycinium cation requires VSEPR molecular-geometry reasoning.'],
  'question_bank.json|2019_Q48': ['U3', '3.3', 'Equilibrium vapor pressure comparison of isomers requires phase behavior and intermolecular forces.'],
  'question_bank.json|2019_Q49': ['U7', '7.11', 'Maximum calcium ion concentration from Ksp requires solubility-equilibrium calculation.'],
  'frq_bank.json|2014_FRQ1': ['U4', '4.5', 'The iodide tablet analysis requires precipitation stoichiometry and percent composition; equilibrium context is not required.'],
  'frq_bank.json|2014_FRQ7': ['U5', '5.3', 'Half-life data for isomerization require integrated-rate-law and concentration-time reasoning.'],
  'frq_bank.json|2015_FRQ3': ['U6', '6.7', 'The full FRQ includes intermolecular forces and bond-enthalpy comparison, with Unit 6 as latest required unit.'],
  'frq_bank.json|2015_FRQ4': ['U3', '3.1', 'Hydrogen-halide boiling points, dipoles, and polarizability require intermolecular-force reasoning.'],
  'frq_bank.json|2015_FRQ6': ['U1', '1.6', 'The full FRQ centers on photoelectron spectrum interpretation.'],
  'frq_bank.json|2018_FRQ1': ['U5', '5.8', 'The full FRQ includes Lewis-structure work and mechanism or rate-law reasoning, with Unit 5 as latest required unit.'],
  'frq_bank.json|2018_FRQ2': ['U3', '3.4', 'The full FRQ combines reaction context with gas-law behavior of prepared hydrogen chloride.'],
  'frq_bank.json|2018_FRQ4': ['U3', '3.13', 'The cobalt ore analysis requires spectrophotometry and Beer-Lambert calibration reasoning.'],
  'frq_bank.json|2018_FRQ5': ['U9', '9.2', 'The full silver and nitric acid FRQ includes entropy reasoning and redox context; Unit 9 is the latest required unit.'],
  'frq_bank.json|2019_FRQ2': ['U9', '9.3', 'The full hydrogen-peroxide FRQ combines thermodynamic favorability with reaction and rate reasoning; Unit 9 is the latest required unit.'],
}

const RULES = [
  r('9.11', /\b(electrolysis|Faraday|faradays|mol e|coulomb|ampere|current passed)\b/i, 'Electrolysis and Faraday calculations require Unit 9.11.'),
  r('9.10', /\b(Nernst|nonstandard|cell potential under|Q.*cell|Ecell under)\b/i, 'Nonstandard cell potential requires Unit 9.10.'),
  r('9.9', /\b(cell potential|Ecell|voltage|free energy.*cell|galvanic.*free energy)\b/i, 'Cell potential and free energy require Unit 9.9.'),
  r('9.8', /\b(galvanic cell|voltaic cell|anode|cathode|salt bridge|standard reduction potential)\b/i, 'Galvanic cells require Unit 9.8.'),
  r('9.5', /\b(free energy.*equilibrium|delta G.*K|Gibbs.*equilibrium)\b/i, 'Free energy and equilibrium require Unit 9.5.'),
  r('9.4', /\b(thermodynamic control|kinetic control|kinetically favored|thermodynamically favored)\b/i, 'Thermodynamic and kinetic control require Unit 9.4.'),
  r('9.3', /\b(Gibbs|free energy|spontaneous|thermodynamic favorability|delta G)\b/i, 'Gibbs free energy and thermodynamic favorability require Unit 9.3.'),
  r('9.2', /\b(entropy change|delta S|absolute entropy)\b/i, 'Entropy change requires Unit 9.2.'),
  r('9.1', /\b(entropy|disorder|microstate)\b/i, 'Entropy concepts require Unit 9.1.'),

  r('8.11', /\b(pH.*solubility|solubility.*pH|hydroxide.*pH|common ion.*pH)\b/i, 'pH and solubility require Unit 8.11.'),
  r('8.10', /\b(buffer capacity)\b/i, 'Buffer capacity requires Unit 8.10.'),
  r('8.9', /\b(Henderson|Hasselbalch|pH\s*=\s*pKa)\b/i, 'Henderson-Hasselbalch reasoning requires Unit 8.9.'),
  r('8.8', /\b(buffer|buffers)\b/i, 'Buffer properties require Unit 8.8.'),
  r('8.7', /\b(pKa|pH and pKa)\b/i, 'pH and pKa require Unit 8.7.'),
  r('8.6', /\b(molecular structure of acids|acid strength.*structure|bond polarity.*acid)\b/i, 'Molecular structure of acids and bases requires Unit 8.6.'),
  r('8.5', /\b(titration|equivalence point|half-equivalence|indicator|titrant)\b/i, 'Acid-base titrations require Unit 8.5.'),
  r('8.4', /\b(acid-base reaction|neutralization|conjugate acid-base|Bronsted|Brønsted)\b/i, 'Acid-base reactions and conjugate pairs require Unit 8.4.'),
  r('8.3', /\b(weak acid|weak base|Ka\b|Kb\b|acid-dissociation|base-dissociation)\b/i, 'Weak acid and base equilibria require Unit 8.3.'),
  r('8.2', /\b(pH|pOH|strong acid|strong base|hydronium|hydroxide)\b/i, 'pH and pOH of strong acids and bases require Unit 8.2.'),
  r('8.1', /\b(acid|base|proton donor|proton acceptor)\b/i, 'Acid-base introduction requires Unit 8.1.'),

  r('7.12', /\b(common-ion|common ion)\b/i, 'Common-ion effect requires Unit 7.12.'),
  r('7.11', /\b(Ksp|solubility product|molar solubility)\b/i, 'Solubility equilibria require Unit 7.11.'),
  r('7.10', /\b(reaction quotient|Le Chatelier|stress.*equilibrium|shift.*equilibrium)\b/i, 'Reaction quotient and Le Chatelier reasoning require Unit 7.10.'),
  r('7.9', /\b(Le Chatelier|stress.*equilibrium|shift.*equilibrium)\b/i, 'Le Chatelier principle requires Unit 7.9.'),
  r('7.7', /\b(equilibrium concentration|ICE table|initial.*change.*equilibrium)\b/i, 'Equilibrium concentration calculation requires Unit 7.7.'),
  r('7.6', /\b(Kp|Kc|equilibrium constant.*reverse|equilibrium constant.*multiply)\b/i, 'Properties of equilibrium constants require Unit 7.6.'),
  r('7.5', /\b(magnitude of.*equilibrium constant|large K|small K|lies to the)\b/i, 'Magnitude of equilibrium constant requires Unit 7.5.'),
  r('7.4', /\b(calculate.*equilibrium constant|determine.*Kp|determine.*Kc)\b/i, 'Calculating equilibrium constants requires Unit 7.4.'),
  r('7.3', /\b(equilibrium constant|reaction quotient|\bQ\b|\bKp\b|\bKc\b)\b/i, 'Reaction quotient and equilibrium constant require Unit 7.3.'),
  r('7.2', /\b(reversible reaction|forward reaction|reverse reaction)\b/i, 'Direction of reversible reactions requires Unit 7.2.'),
  r('7.1', /\b(equilibrium)\b/i, 'Equilibrium introduction requires Unit 7.1.'),

  r('6.9', /\b(Hess|Hess's|Hess?s)\b/i, 'Hess law requires Unit 6.9.'),
  r('6.8', /\b(enthalpy of formation|standard enthalpy|formation reaction)\b/i, 'Enthalpy of formation requires Unit 6.8.'),
  r('6.7', /\b(bond enthalpy|bond energy|break.*bond|form.*bond)\b/i, 'Bond enthalpies require Unit 6.7.'),
  r('6.6', /\b(enthalpy of reaction|delta H|heat of reaction|thermochemical)\b/i, 'Enthalpy of reaction requires Unit 6.6.'),
  r('6.5', /\b(phase change|heat of fusion|heat of vaporization|boiling point|melting point)\b/i, 'Energy of phase changes requires Unit 6.5.'),
  r('6.4', /\b(calorimetry|calorimeter|specific heat|heat capacity|q\s*=|temperature change)\b/i, 'Heat capacity and calorimetry require Unit 6.4.'),
  r('6.3', /\b(heat transfer|thermal equilibrium)\b/i, 'Heat transfer and thermal equilibrium require Unit 6.3.'),
  r('6.2', /\b(energy diagram|reaction energy profile)\b/i, 'Energy diagrams require Unit 6.2.'),
  r('6.1', /\b(endothermic|exothermic|absorbs heat|releases heat)\b/i, 'Endothermic and exothermic processes require Unit 6.1.'),

  r('5.11', /\b(catalyst|catalysis|catalyzed)\b/i, 'Catalysis requires Unit 5.11.'),
  r('5.10', /\b(multistep.*energy profile|multi-step.*energy profile)\b/i, 'Multistep reaction energy profile requires Unit 5.10.'),
  r('5.9', /\b(pre-equilibrium)\b/i, 'Pre-equilibrium approximation requires Unit 5.9.'),
  r('5.8', /\b(mechanism.*rate law|rate law.*mechanism|rate-determining step)\b/i, 'Reaction mechanism and rate law require Unit 5.8.'),
  r('5.7', /\b(reaction mechanism|elementary steps?)\b/i, 'Reaction mechanisms require Unit 5.7.'),
  r('5.6', /\b(activation energy|energy profile)\b/i, 'Reaction energy profile requires Unit 5.6.'),
  r('5.5', /\b(collision model|effective collision|orientation factor)\b/i, 'Collision model requires Unit 5.5.'),
  r('5.4', /\b(elementary reaction|molecularity)\b/i, 'Elementary reactions require Unit 5.4.'),
  r('5.3', /\b(integrated rate law|first-order plot|second-order plot|half-life|concentration.*time)\b/i, 'Concentration changes over time require Unit 5.3.'),
  r('5.2', /\b(rate law|order of reaction|initial rate|rate constant)\b/i, 'Rate law requires Unit 5.2.'),
  r('5.1', /\b(reaction rate|rate of disappearance|rate of formation)\b/i, 'Reaction rates require Unit 5.1.'),

  r('4.9', /\b(oxidation|reduction|redox|oxidizing agent|reducing agent|oxidation number)\b/i, 'Oxidation-reduction reactions require Unit 4.9.'),
  r('4.8', /\b(acid-base reaction|neutralization|proton transfer)\b/i, 'Introductory acid-base reaction recognition requires Unit 4.8.'),
  r('4.7', /\b(precipitation|combustion|single replacement|double replacement|synthesis reaction|decomposition reaction)\b/i, 'Types of chemical reactions require Unit 4.7.'),
  r('4.6', /\b(titration|titrant|equivalence point)\b/i, 'Introduction to titration requires Unit 4.6.'),
  r('4.5', /\b(stoichiometry|limiting reactant|limiting reagent|moles? of|grams? of|molarity|balanced equation|complete reaction)\b/i, 'Stoichiometry requires Unit 4.5.'),
  r('4.4', /\b(physical change|chemical change|dissolves?|dissolution|evaporates?|condenses?)\b/i, 'Physical and chemical changes require Unit 4.4.'),
  r('4.3', /\b(reaction represented|balanced chemical equation|particle diagram.*reaction)\b/i, 'Representations of reactions require Unit 4.3.'),
  r('4.2', /\b(net ionic|spectator ion|ionic equation)\b/i, 'Net ionic equations require Unit 4.2.'),
  r('4.1', /\b(chemical reaction|reacts?|products?)\b/i, 'Reaction introduction requires Unit 4.1.'),

  r('3.13', /\b(Beer|Lambert|absorbance|calibration curve)\b/i, 'Beer-Lambert law requires Unit 3.13.'),
  r('3.12', /\b(photon|frequency|wavelength|Planck)\b/i, 'Properties of photons require Unit 3.12.'),
  r('3.11', /\b(spectroscopy|electromagnetic spectrum|absorption spectrum)\b/i, 'Spectroscopy requires Unit 3.11.'),
  r('3.10', /\b(solubility|dissolve|saturated|unsaturated)\b/i, 'Solubility requires Unit 3.10.'),
  r('3.9', /\b(chromatography|separation of.*mixture)\b/i, 'Chromatography and separation require Unit 3.9.'),
  r('3.8', /\b(particle representation.*solution|solution representation|hydration shell)\b/i, 'Representations of solutions require Unit 3.8.'),
  r('3.7', /\b(solution|mixture|concentration|molarity|dilution)\b/i, 'Solutions and mixtures require Unit 3.7.'),
  r('3.6', /\b(deviation from ideal|nonideal gas|intermolecular forces.*ideal gas)\b/i, 'Deviation from ideal gas law requires Unit 3.6.'),
  r('3.5', /\b(kinetic molecular|root mean square|Maxwell|molecular speed)\b/i, 'Kinetic molecular theory requires Unit 3.5.'),
  r('3.4', /\b(ideal gas|PV\s*=|partial pressure|gas law|Dalton)\b/i, 'Ideal gas law requires Unit 3.4.'),
  r('3.3', /\b(solids?, liquids?, and gases|phase diagram|vapor pressure)\b/i, 'Solids, liquids, and gases require Unit 3.3.'),
  r('3.2', /\b(crystalline solid|ionic solid|metallic solid|molecular solid|network covalent|conduct electricity as a solid)\b/i, 'Properties of solids require Unit 3.2.'),
  r('3.1', /\b(intermolecular|hydrogen bond|London dispersion|dipole-dipole|boiling point|surface tension|viscosity)\b/i, 'Intermolecular forces require Unit 3.1.'),

  r('2.7', /\b(VSEPR|hybridization|molecular geometry|bond angle|tetrahedral|trigonal|linear molecule)\b/i, 'VSEPR and hybridization require Unit 2.7.'),
  r('2.6', /\b(resonance|formal charge)\b/i, 'Resonance and formal charge require Unit 2.6.'),
  r('2.5', /\b(Lewis|electron-dot|lone pair|octet)\b/i, 'Lewis diagrams require Unit 2.5.'),
  r('2.4', /\b(metal|alloy|metallic bonding)\b/i, 'Structure of metals and alloys requires Unit 2.4.'),
  r('2.3', /\b(ionic solid|lattice|unit cell|crystal lattice)\b/i, 'Structure of ionic solids requires Unit 2.3.'),
  r('2.2', /\b(potential energy|Coulomb|bond length|bond energy)\b/i, 'Intramolecular force and potential energy require Unit 2.2.'),
  r('2.1', /\b(ionic bond|covalent bond|polar bond|chemical bond|bonding)\b/i, 'Types of chemical bonds require Unit 2.1.'),

  r('1.8', /\b(valence electron|ionic compound|cation|anion)\b/i, 'Valence electrons and ionic compounds require Unit 1.8.'),
  r('1.7', /\b(periodic trend|ionization energy|atomic radius|electronegativity|electron affinity)\b/i, 'Periodic trends require Unit 1.7.'),
  r('1.6', /\b(photoelectron|PES)\b/i, 'Photoelectron spectroscopy requires Unit 1.6.'),
  r('1.5', /\b(electron configuration|orbital|subshell|quantum number)\b/i, 'Atomic structure and electron configuration require Unit 1.5.'),
  r('1.4', /\b(mixture|hydrate|empirical formula from mixture)\b/i, 'Composition of mixtures requires Unit 1.4.'),
  r('1.3', /\b(percent composition|elemental composition|empirical formula|molecular formula)\b/i, 'Elemental composition requires Unit 1.3.'),
  r('1.2', /\b(mass spectrum|mass spectra|isotope abundance|average atomic mass)\b/i, 'Mass spectra require Unit 1.2.'),
  r('1.1', /\b(molar mass|mole|Avogadro|grams? sample|mass of oxygen)\b/i, 'Moles and molar mass require Unit 1.1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Chemistry primary_unit is the latest official unit required to solve the full item; topic code is written only when the rule or manual review lands inside that unit.',
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
  console.log(`Chemistry unit classification audit: ${OUT_PATH}`)
  console.log(`Review pack: ${REVIEW_PATH}`)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && report.totals.blocking) process.exit(1)
}

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
  const decision = MANUAL[key] ? byManual(MANUAL[key]) : classify(item)
  const current = normalizeUnit(item.primary_unit)
  if (decision.unit !== current) {
    addFinding('blocking', file, item, `Proposed ${decision.unit} ${decision.code}; current ${current}. ${decision.reason}`)
    if (!applyFixes) return
    report.totals.changed += 1
  }
  if (decision.code) {
    if (applyFixes) applyDecision(item, decision)
    report.totals.topic_materialized += 1
  } else {
    report.totals.still_unit_level += 1
    addFinding('review', file, item, decision.reason)
  }
}

function classify(item) {
  const current = normalizeUnit(item.primary_unit)
  const text = itemText(item)
  for (const rule of RULES) {
    if (!rule.pattern.test(text)) continue
    const decision = byCode(rule.code, rule.reason)
    if (decision.unit === current) return decision
    addFinding('review', 'auto-rule-review', item, `Rule suggested ${decision.unit} ${decision.code}, but current unit is ${current}; retained pending Chemistry review. ${decision.reason}`)
    return unitLevel(item, 'Rule conflict retained pending Chemistry topic-level review.')
  }
  return unitLevel(item, 'No chemistry topic rule matched; retained as unit-level evidence pending manual topic review.')
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    correctOption(item),
    item.question_type || '',
    JSON.stringify(item.background_data || ''),
  ].join('\n').replace(/\s+/g, ' ')
}

function correctOption(item) {
  if (!item.options || typeof item.options !== 'object') return ''
  return String(item.answer || item.correct_answer || '')
    .split(',')
    .map(label => item.options[label.trim()] || '')
    .join(' ')
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
    classification_version: 'chemistry-official-progression-2026-07-21',
    authority: 'AP Chemistry Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Chemistry Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'Chemistry item review against the official AP Chemistry topic sequence; shared group context included',
    reviewed_at: '2026-07-21',
  }
}

function unitLevel(item, reason) {
  const unit = normalizeUnit(item.primary_unit)
  return { unit, code: null, name: unitName(unit), reason }
}

function byManual(row) {
  return byCode(row[1], `Manual official-progression review: ${row[2]}`)
}

function byCode(code, reason) {
  const topic = topicByCode.get(code)
  if (!topic) throw new Error(`Unknown Chemistry topic ${code}`)
  return { ...topic, reason }
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
    answer: item.answer || item.correct_answer || null,
    options: item.options || null,
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
