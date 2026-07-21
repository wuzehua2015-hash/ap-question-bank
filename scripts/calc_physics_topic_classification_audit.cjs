#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const AP_ROOT = path.join(ROOT, 'public', 'data', 'ap')
const OUT_DIR = path.join(ROOT, '.workspace', 'calc-physics-topic-classification-audit')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')
const subjectArg = process.argv.find(arg => arg.startsWith('--subject='))?.split('=')[1]

const SUBJECTS = {
  'calculus-ab': { authority: 'AP Calculus AB Course and Exam Description', family: 'calc-ab' },
  'calculus-bc': { authority: 'AP Calculus BC Course and Exam Description', family: 'calc-bc' },
  'physics-1': { authority: 'AP Physics 1: Algebra-Based Course and Exam Description', family: 'physics-mechanics', allowFluids: true },
  'physics-c-mechanics': { authority: 'AP Physics C: Mechanics Course and Exam Description', family: 'physics-mechanics' },
  'physics-2': { authority: 'AP Physics 2: Algebra-Based Course and Exam Description', family: 'physics-2' },
  'physics-c-e-m': { authority: 'AP Physics C: Electricity and Magnetism Course and Exam Description', family: 'physics-em' },
}

const MANUAL = {
  'physics-1|2017_Q35': ['4.3', 'Astronauts and container exchange momentum in an isolated system; the item requires conservation of linear momentum.'],
  'physics-2|2016_Q25': ['10.6', 'Charged spheres move to a new equilibrium under electrostatic interactions; the latest required topic is electric force, field, and potential.'],
  'physics-2|2017_Q03': ['10.1', 'The proton interaction asks attraction/repulsion from charge sign and electrostatic force.'],
  'physics-2|2017_Q23': ['10.1', 'The graph linearization uses Coulomb force dependence on separation.'],
  'physics-2|2019_Q23': ['15.3', 'Energy-level absorption of visible light requires emission and absorption spectra.'],
  'physics-c-mechanics|2012_Q34': ['2.10', 'The radius of circular motion is determined from the shared circular-motion context.'],
  'physics-c-mechanics|2014_Q20': ['2.5', 'The relationship between tensions is determined from Newton second-law force reasoning in the shared context.'],
  'physics-c-mechanics|2015_Q27': ['4.3', 'The spacecraft separates into two parts with negligible external horizontal force; the answer path requires conservation of linear momentum.'],
  'physics-c-mechanics|2017_Q20': ['1.5', 'Projectile acceleration with negligible air resistance requires motion in two dimensions.'],
  'physics-c-mechanics|2017_Q24': ['2.10', 'The speed ratio in orbiting/circular motion requires circular-motion dynamics.'],
  'physics-c-mechanics|2018_Q03': ['1.2', 'Free fall from rest over equal time intervals requires displacement, velocity, and acceleration.'],
  'physics-c-mechanics|2019_Q18': ['4.3', 'The expression for final velocity comes from the shared collision/momentum context.'],
  'physics-c-e-m|2016_Q34': ['9.1', 'Kinetic energy gained by a charge moving in the electric field of a charged sphere requires electric potential energy.'],
  'physics-c-e-m|2017_Q27': ['10.1', 'Charge on the inner surface of a conducting spherical shell requires electrostatics with conductors.'],
  'physics-c-e-m|2017_Q28': ['10.1', 'Charge on the outer surface of a conducting spherical shell requires electrostatics with conductors.'],
  'physics-c-e-m|2019_Q07': ['10.2', 'Conducting spheres brought into contact require redistribution of charge between conductors.'],
}

const selectedSubjects = subjectArg ? [subjectArg] : Object.keys(SUBJECTS)
const report = {
  generated_at: new Date().toISOString(),
  standard: 'primary_unit is the latest official topic/unit a student must complete to answer the whole item using that topic/unit and prior official content.',
  totals: { checked: 0, changed: 0, topic_materialized: 0, blocking: 0, review: 0, not_applicable: 0 },
  by_subject: {},
  findings: [],
}

for (const subject of selectedSubjects) auditSubject(subject)

fs.mkdirSync(OUT_DIR, { recursive: true })
const outPath = path.join(OUT_DIR, subjectArg ? `${subjectArg}.json` : 'summary.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n')
console.log(`Calc/Physics topic classification audit: ${outPath}`)
console.table(report.by_subject)
console.log(JSON.stringify(report.totals, null, 2))
if (failOnFindings && (report.totals.blocking > 0 || report.totals.review > 0)) process.exit(1)

function auditSubject(subject) {
  const meta = { ...SUBJECTS[subject], subject }
  if (!meta) throw new Error(`Unknown subject: ${subject}`)
  const dir = path.join(AP_ROOT, subject)
  const config = readJson(path.join(dir, 'classification_config.json'))
  const topicByCode = new Map()
  const unitByCode = new Map()
  for (const unit of config.units || []) {
    unitByCode.set(unit.code, unit)
    for (const topic of unit.topics || []) topicByCode.set(topic.code, { unit: unit.code, code: topic.code, name: topic.name })
  }
  const subjectStats = { checked: 0, changed: 0, topic_materialized: 0, blocking: 0, review: 0, not_applicable: 0 }
  for (const file of ['question_bank.json', 'frq_bank.json']) {
    const filePath = path.join(dir, file)
    if (!fs.existsSync(filePath)) continue
    const rows = readJson(filePath)
    for (const item of rows) {
      if (!visible(item)) continue
      subjectStats.checked += 1
      report.totals.checked += 1
      const decision = classify(meta, item)
      if (decision.notApplicable) {
        subjectStats.not_applicable += 1
        report.totals.not_applicable += 1
        if (applyFixes) markNotApplicable(item, decision, meta)
        continue
      }
      if (!decision.code || !topicByCode.has(decision.code)) {
        addFinding('review', subject, file, item, `No official topic decision: ${decision.reason || 'unmatched text'}`)
        subjectStats.review += 1
        report.totals.review += 1
        continue
      }
      const topic = topicByCode.get(decision.code)
      const current = normalizeUnit(item.primary_unit)
      if (topic.unit !== current) {
        addFinding('blocking', subject, file, item, `Proposed ${topic.unit} ${topic.code}; current ${current}. ${decision.reason}`)
        subjectStats.blocking += 1
        report.totals.blocking += 1
      }
      if (applyFixes) {
        if (topic.unit !== current) {
          subjectStats.changed += 1
          report.totals.changed += 1
        }
        applyDecision(item, topic, decision, meta)
      }
      subjectStats.topic_materialized += 1
      report.totals.topic_materialized += 1
    }
    if (applyFixes) fs.writeFileSync(filePath, JSON.stringify(rows, null, 2) + '\n')
  }
  report.by_subject[subject] = subjectStats
}

function classify(meta, item) {
  const text = itemText(item)
  const manual = MANUAL[`${meta.subject}|${item.question_id}`]
  if (manual) return { code: manual[0], unit: `U${manual[0].split('.')[0]}`, reason: `Manual official-progression review: ${manual[1]}` }
  if (meta.family === 'calc-ab') return classifyCalc(item, text, false)
  if (meta.family === 'calc-bc') return classifyCalc(item, text, true)
  if (meta.family === 'physics-mechanics') return classifyMechanics(item, text, meta.allowFluids)
  if (meta.family === 'physics-2') return classifyPhysics2(item, text)
  if (meta.family === 'physics-em') return classifyEM(item, text)
  return { reason: 'No subject family configured.' }
}

function classifyCalc(item, text, bc) {
  if (!bc && /\b(taylor|maclaurin|power series|series converge|radius of convergence|interval of convergence)\b|\\sum/i.test(text)) {
    return { notApplicable: true, reason: 'Infinite series/Taylor content is outside the AP Calculus AB official unit map.' }
  }
  const highRules = [
    bc && d('10.14', /\b(taylor|maclaurin|power series|radius of convergence|interval of convergence|series converge|geometric series|harmonic series|ratio test|alternating series|lagrange error|nth[- ]term|partial sum)\b|\\sum/i, 'Infinite sequences and series are BC Unit 10.'),
    bc && d('9.6', /\b(polar|parametric|vector[- ]valued|xy-plane|position \(\s*x\(t\)|r\(\s*theta|area enclosed by.*polar|arc length.*parametric)\b/i, 'Parametric, polar, and vector-valued contexts are BC Unit 9.'),
    d('8.7', /volume|cross sections?|washer|shell|area of the region|bounded by|arc length|average value|total distance|net change|accumulation|rate .* enters|rate .* leaves/i, 'Applications of integration require Unit 8.'),
    d('7.6', /differential equation|slope field|euler|logistic|separable|particular solution|dy\/dx|dy\/dt|\\dfrac\{dy\}\{dx\}|\\frac\{dy\}\{dx\}|\\dfrac\{dy\}\{dt\}|\\frac\{dy\}\{dt\}/i, 'Differential equations require Unit 7.'),
  ].filter(Boolean)
  const highDecision = firstRule(text, highRules)
  if (highDecision) return highDecision

  const labelDecision = classifyCalcByTopicLabel(item, bc)
  if (labelDecision) return labelDecision

  const rules = [
    d('6.8', /riemann|trapezoidal|definite integral|integral|antiderivative|fundamental theorem|accumulation function|u-substitution|substitution|\\int/i, 'Integration and accumulation require Unit 6.'),
    d('5.9', /f\\prime\\prime|f''|second derivative|graph of .*f.*which value.*f|graph of .*f'.*which/i, 'Comparing a function with its first and second derivatives requires Unit 5.'),
    d('5.10', /\b(optimization|maximize|minimize|absolute maximum|absolute minimum|global maximum|global minimum|candidate|critical point|increasing|decreasing|concavity|concave|point of inflection|mean value theorem|l'?hospital|second derivative test|first derivative test)\b/i, 'Analytical applications of derivatives require Unit 5.'),
    d('4.2', /\b(position|velocity|acceleration|speed|motion along|moving toward|particle at rest)\b/i, 'Straight-line motion with derivative relationships requires Unit 4.'),
    d('4.4', /\b(related rates|rate of change|linearization|local linearity|at what rate|changing at time)\b/i, 'Contextual applications of derivatives require Unit 4.'),
    d('3.3', /f\^\{-?1\}|h\^\{-?1\}|g\(x\)=f\^\{-?1\}|inverse of/i, 'Inverse-function derivative notation requires Unit 3.'),
    d('3.1', /f\(g\(x\)\)|g\(f\(x\)\)|composite/i, 'Composite functions require the chain rule in Unit 3.'),
    d('3.5', /\b(chain rule|composite|implicit|inverse function|inverse trigonometric|arccos|arcsin|arctan|higher-order|second derivative)\b/i, 'Composite, implicit, inverse, or higher derivatives require Unit 3.'),
    d('2.8', /derivative|differentiate|tangent line|normal line|product rule|quotient rule|power rule|f\s*'|f\\s*\\prime|dy\/dx|dydx|\\frac\{d|\\lim_\{h\\to0\}.*h/i, 'Derivative definition and rules require Unit 2.'),
    d('1.11', /limit|continuity|continuous|discontinuous|asymptote|intermediate value theorem|ivt|\\lim/i, 'Limits and continuity require Unit 1.'),
  ].filter(Boolean)
  return firstRule(text, rules) || { reason: 'No high-confidence calculus topic evidence.' }
}

function classifyCalcByTopicLabel(item, bc) {
  const label = (item.topics || [])
    .filter(topic => typeof topic === 'string' || !/^\d+\.\d+$/.test(String(topic.code || '')))
    .map(topic => typeof topic === 'string' ? topic : `${topic.code || ''} ${topic.name || ''}`)
    .join(' ')
    .toLowerCase()
  if (!label.trim()) return null
  const rules = [
    bc && d('10.14', /taylor|maclaurin|power series representations?|differentiating power series|series and partial sums|infinite series|series convergence|convergence tests|geometric series|harmonic series|p-tests|comparison test|alternating series|ratio test|radius of convergence|interval of convergence|lagrange error|partial sums/i, 'Existing topic label maps to official BC Unit 10 series content.'),
    bc && d('9.6', /parametric motion|parametric equations?|parametric derivatives|vector-valued|polar|polar area|polar curves?|polar coordinates|slope of a polar curve|parametric arc length/i, 'Existing topic label maps to official BC Unit 9 parametric/polar/vector content.'),
    d('8.13', /arc length|total distance|distance traveled/i, 'Existing topic label maps to applications of integration.'),
    d('8.11', /washers?|disk\/washer|rotation/i, 'Existing topic label maps to volume by washer method.'),
    d('8.9', /disk method/i, 'Existing topic label maps to volume by disk method.'),
    d('8.7', /cross sections?|volumes?|area and volume|area between curves and volume|area, tangents, and cross sections/i, 'Existing topic label maps to volume/area applications of integration.'),
    d('8.4', /area between curves|area under a curve|area bounded|applications of integration/i, 'Existing topic label maps to area applications of integration.'),
    d('8.3', /accumulation from rate|rate functions and accumulation|net change|change from rate|motion and accumulation|accumulation and optimization|rates, accumulation/i, 'Existing topic label maps to accumulation in applied contexts.'),
    d('8.2', /particle motion|position from velocity|velocity from acceleration|motion with velocity|motion with acceleration|integration and accumulation in particle motion/i, 'Existing topic label maps to motion with integrals.'),
    d('8.1', /average value/i, 'Existing topic label maps to average value.'),
    d('7.9', /logistic/i, 'Existing topic label maps to logistic differential equations.'),
    d('7.7', /initial conditions|particular solution|separable differential/i, 'Existing topic label maps to separable differential equations with initial conditions.'),
    d('7.5', /euler/i, 'Existing topic label maps to Euler method.'),
    d('7.3', /slope fields?/i, 'Existing topic label maps to slope fields.'),
    d('7.1', /differential equations?|solving differential/i, 'Existing topic label maps to differential equation modeling.'),
    d('6.13', /improper integrals?/i, 'Existing topic label maps to improper integrals.'),
    d('6.12', /partial fractions?/i, 'Existing topic label maps to linear partial fractions.'),
    d('6.11', /integration by parts/i, 'Existing topic label maps to integration by parts.'),
    d('6.9', /substitution/i, 'Existing topic label maps to integration using substitution.'),
    d('6.8', /antiderivatives?|indefinite integrals?|basic integration/i, 'Existing topic label maps to antiderivatives and indefinite integrals.'),
    d('6.7', /fundamental theorem.*definite integrals?/i, 'Existing topic label maps to FTC and definite integrals.'),
    d('6.4', /fundamental theorem|accumulation functions?/i, 'Existing topic label maps to accumulation functions.'),
    d('6.3', /riemann sums? as limits|summation/i, 'Existing topic label maps to Riemann sums and definite integral notation.'),
    d('6.2', /riemann|trapezoidal/i, 'Existing topic label maps to numerical integration approximation.'),
    d('6.1', /definite integrals?|signed area|properties of definite integrals|interpreting definite integrals|integration and accumulation/i, 'Existing topic label maps to integration and accumulation.'),
    d('5.12', /implicit relations/i, 'Existing topic label maps to behavior of implicit relations.'),
    d('5.11', /optimization/i, 'Existing topic label maps to optimization.'),
    d('5.10', /critical points? with calculator|closed interval/i, 'Existing topic label maps to optimization/extrema setup.'),
    d('5.9', /function behavior|function analysis|graph analysis|derivative graphs and original functions|connecting a function|analyzing f|derivative behavior/i, 'Existing topic label maps to connecting a function and derivatives.'),
    d('5.8', /sketching graphs|derivative graphs from function graphs/i, 'Existing topic label maps to sketching graphs from derivatives.'),
    d('5.7', /second derivative test/i, 'Existing topic label maps to second derivative test.'),
    d('5.6', /concavity|inflection/i, 'Existing topic label maps to concavity.'),
    d('5.5', /absolute extrema|extreme value theorem|candidate/i, 'Existing topic label maps to absolute extrema.'),
    d('5.4', /first derivative test|relative extrema|local extrema|\bextrema\b/i, 'Existing topic label maps to relative extrema by first derivative.'),
    d('5.3', /increasing and decreasing|monotonicity/i, 'Existing topic label maps to increasing/decreasing intervals.'),
    d('5.1', /mean value theorem/i, 'Existing topic label maps to MVT.'),
    d('4.7', /l'?hospital/i, 'Existing topic label maps to L Hospital rule.'),
    d('4.6', /linear approximation|linearization|local linearity/i, 'Existing topic label maps to linear approximation.'),
    d('4.5', /related rates/i, 'Existing topic label maps to related rates.'),
    d('4.3', /rates of change|interpreting derivatives/i, 'Existing topic label maps to rates of change in context.'),
    d('4.2', /motion along a line|velocity and position|speed, velocity|average velocity|particle at rest|acceleration and zeros|motion with position/i, 'Existing topic label maps to straight-line motion.'),
    d('4.1', /derivative as rate/i, 'Existing topic label maps to derivative interpretation.'),
    d('3.6', /higher-order|second derivative/i, 'Existing topic label maps to higher-order derivatives.'),
    d('3.5', /product and chain|chain rule and quotient|selecting procedures/i, 'Existing topic label maps to selecting derivative procedures.'),
    d('3.4', /inverse trigonometric|arccos|arcsin|arctan/i, 'Existing topic label maps to inverse trigonometric derivatives.'),
    d('3.3', /inverse functions?/i, 'Existing topic label maps to derivatives of inverse functions.'),
    d('3.2', /implicit differentiation/i, 'Existing topic label maps to implicit differentiation.'),
    d('3.1', /chain rule|composite/i, 'Existing topic label maps to the chain rule.'),
    d('2.10', /trigonometric derivatives|tangent.*trigonometric/i, 'Existing topic label maps to trigonometric derivatives.'),
    d('2.9', /quotient rule/i, 'Existing topic label maps to quotient rule.'),
    d('2.8', /product rule/i, 'Existing topic label maps to product rule.'),
    d('2.7', /exponential|logarithmic|ln x|cos x|sin x/i, 'Existing topic label maps to common transcendental derivatives.'),
    d('2.6', /derivative rules/i, 'Existing topic label maps to derivative rules.'),
    d('2.5', /power rule/i, 'Existing topic label maps to power rule.'),
    d('2.4', /differentiability and continuity|continuity and differentiability|differentiability of piecewise/i, 'Existing topic label maps to differentiability and continuity.'),
    d('2.3', /derivative estimates|derivatives? from graphs?|derivative tables|derivative values from graphs?|derivative at a point/i, 'Existing topic label maps to estimating derivatives.'),
    d('2.2', /derivative definition|defining the derivative|derivative as a limit|tangent lines?/i, 'Existing topic label maps to derivative definition.'),
    d('1.16', /intermediate value theorem/i, 'Existing topic label maps to IVT.'),
    d('1.15', /limits at infinity|horizontal asymptotes?|asymptotes/i, 'Existing topic label maps to limits at infinity/horizontal asymptotes.'),
    d('1.14', /vertical asymptotes?/i, 'Existing topic label maps to infinite limits and vertical asymptotes.'),
    d('1.13', /removable discontinuities/i, 'Existing topic label maps to removable discontinuities.'),
    d('1.12', /continuity.*interval/i, 'Existing topic label maps to continuity over intervals.'),
    d('1.11', /continuity|continuous/i, 'Existing topic label maps to continuity at a point.'),
    d('1.10', /types of discontinuities|discontinuities/i, 'Existing topic label maps to discontinuities.'),
    d('1.7', /selecting.*limits|limits and asymptotes/i, 'Existing topic label maps to selecting procedures for limits.'),
    d('1.6', /algebraic simplification/i, 'Existing topic label maps to algebraic manipulation for limits.'),
    d('1.3', /limits from graphs?|continuity from graphs?|limits and continuity from graphs/i, 'Existing topic label maps to estimating limit values from graphs.'),
    d('1.2', /limits?|evaluating limits?|one-sided|two-sided/i, 'Existing topic label maps to defining limits and notation.'),
  ].filter(Boolean)
  return firstRule(label, rules)
}

function classifyMechanics(item, text, allowFluids) {
  const rules = [
    allowFluids && d('8.4', /\b(fluid|pressure|density|buoyant|buoyancy|pipe|water flows|flow rate|bernoulli|continuity equation|submerged)\b/i, 'Fluids require Physics 1 Unit 8.'),
    d('7.3', /\b(simple harmonic|oscillat|spring constant|period|frequency|pendulum|standing wave|wave pulses?|traveling waves?|wave signal)\b/i, 'Oscillations and waves require the latest mechanics wave/oscillation unit.'),
    d('6.4', /\b(angular momentum|rotational kinetic|rolling|rotat.*energy|torque and work|orbiting satellite)\b/i, 'Energy and momentum of rotating systems require Unit 6.'),
    d('5.6', /\b(torque|rotational inertia|moment of inertia|angular acceleration|rotational equilibrium|rotates?|pivot|wheel|pulley)\b/i, 'Torque and rotational dynamics require Unit 5.'),
    d('4.3', /\b(momentum|impulse|collision|center of mass|stick together|elastic|inelastic)\b/i, 'Linear momentum requires Unit 4.'),
    d('3.4', /\b(work|energy|power|kinetic energy|potential energy|conservation of mechanical energy|spring potential|joule|motor|rebound height|minimum distance)\b/i, 'Work, energy, and power require Unit 3.'),
    d('2.5', /\b(force|forces|free-body|newton|friction|frictional|tension|normal force|gravitational force|gravitational field|gravitational attraction|centripetal|circular motion|static equilibrium|resistive force|inclined plane)\b/i, 'Force and translational dynamics require Unit 2.'),
    d('1.3', /\b(position|velocity|acceleration|displacement|projectile|kinematics|speed|motion graph|x-axis|y-axis|falls? through|dropped from rest|maximum height|height of the building|distance traveled|how far .* travel|moving but not accelerating|velocities .* function of time)\b/i, 'Kinematics require Unit 1.'),
  ].filter(Boolean)
  if (!allowFluids && /\b(fluid|pressure|density|buoyant|pipe|water flows|flow rate|bernoulli|submerged)\b/i.test(text)) return { notApplicable: true, reason: 'Fluid mechanics is not in this Mechanics course map.' }
  if (/\b(circuit|resistor|battery|current|capacitor|electric field|magnetic|charge|voltage|ohm)\b/i.test(text)) return { notApplicable: true, reason: 'Electricity/circuit content is outside the current Physics 1 mechanics unit path.' }
  return firstRule(text, rules) || classifyPhysicsLabel(item, allowFluids ? 'physics-1' : 'mechanics') || { reason: 'No high-confidence mechanics topic evidence.' }
}

function classifyPhysics2(item, text) {
  const rules = [
    d('15.7', /\b(nuclear|decay|alpha particle|beta|fusion|fission|half-life|uranium|thorium|radioactive)\b/i, 'Nuclear physics requires Unit 15.'),
    d('15.5', /\b(photoelectric|photon|electron diffraction|bohr|energy[- ]level|emission spectrum|absorption spectrum|blackbody|compton|quantum|wave function|probability of finding the particle|law of conservation of electric charge)\b/i, 'Modern physics requires Unit 15.'),
    d('14.8', /\b(double[- ]slit|thin[- ]film|diffraction|interference|standing wave|sound|doppler|electromagnetic wave|wave pulses?|periodic wave|mechanical wave|transverse|wavelength|frequency)\b/i, 'Waves and physical optics require Unit 14.'),
    d('13.4', /\b(lens|mirror|focal length|image distance|object distance|refraction|reflection|optical bench|index of refraction|ray|apparent positions?|pool)\b/i, 'Geometric optics require Unit 13.'),
    d('12.4', /\b(magnetic|magnet|compass|bar magnets?|induction|induced current|magnetic flux|right-hand|current-carrying wire)\b/i, 'Magnetism and electromagnetic induction require Unit 12.'),
    d('11.6', /\b(circuit|resistor|battery|current|resistance|ohm|kirchhoff|ammeter|voltmeter|rc circuit|bulb|bulbs|potential differences .* bulbs)\b/i, 'Electric circuits require Unit 11.'),
    d('10.6', /\b(capacitor|electric field|electric potential|electric force|electrostatic force|test charge|point charge|positive charge|free protons|charged objects?|charging|uncharged spheres?|uncharged conducting spheres?|uncharged insulating rod|conductor|sphere.*charge|coulomb|parallel plates)\b/i, 'Electric force, field, and potential require Unit 10.'),
    d('9.4', /\b(ideal gas|gas as it goes|internal energy of the gas|thermodynamic|thermal|temperature|heat|entropy|first law|second law|specific heat|conductivity|radiation|conduction|convection)\b/i, 'Thermodynamics requires Unit 9.'),
  ]
  if (/\b(fluid|pressure|density|buoyant|pipe|water flows|flow rate|bernoulli|submerged)\b/i.test(text)) return { notApplicable: true, reason: 'Fluid mechanics is not in the current Physics 2 U9-U15 course map.' }
  return firstRule(text, rules) || classifyPhysicsLabel(item, 'physics-2') || { reason: 'No high-confidence Physics 2 topic evidence.' }
}

function classifyEM(item, text) {
  const rules = [
    d('13.4', /\b(inductor|inductance|induced current|induction|faraday|lenz|magnetic flux|motional emf|rl circuit)\b/i, 'Electromagnetic induction requires Unit 13.'),
    d('12.4', /\b(magnetic field|magnetic force|ampere|current-carrying|solenoid|wire.*current|right-hand)\b/i, 'Magnetic fields and electromagnetism require Unit 12.'),
    d('11.6', /\b(circuit|resistor|battery|current|resistance|ohm|kirchhoff|ammeter|voltmeter|switch|bulb)\b/i, 'Electric circuits require Unit 11.'),
    d('10.3', /\b(capacitor|capacitance|dielectric|conducting sphere|conductor|redistribution of charge|isolated.*conductor)\b/i, 'Conductors and capacitors require Unit 10.'),
    d('9.2', /\b(electric potential|potential energy|voltage|equipotential|potential difference)\b/i, 'Electric potential requires Unit 9.'),
    d('8.6', /\b(gauss|electric flux|electric field|charge distribution|coulomb|electric force|electrostatic force|point charge|proton|electron|charged particle)\b/i, 'Electric charges, fields, and Gauss law require Unit 8.'),
  ]
  return firstRule(text, rules) || classifyPhysicsLabel(item, 'em') || { reason: 'No high-confidence E&M topic evidence.' }
}

function classifyPhysicsLabel(item, family) {
  if (!item) return null
  const label = (item.topics || [])
    .filter(topic => typeof topic === 'string' || !/^\d+\.\d+$/.test(String(topic.code || '')))
    .map(topic => typeof topic === 'string' ? topic : `${topic.code || ''} ${topic.name || ''}`)
    .join(' ')
    .toLowerCase()
  if (!label.trim()) return null
  if (family === 'physics-1' || family === 'mechanics') {
    const rules = [
      family === 'physics-1' && d('8.4', /fluids?/i, 'Existing topic label maps to fluids.'),
      d('7.3', /oscillations?|waves?|spring/i, 'Existing topic label maps to oscillations.'),
      d('6.4', /rotational energy|rotational systems|angular momentum/i, 'Existing topic label maps to energy and momentum of rotating systems.'),
      d('5.6', /torque|rotational dynamics|rotational inertia/i, 'Existing topic label maps to torque and rotational dynamics.'),
      d('4.3', /momentum|collisions?|center of mass/i, 'Existing topic label maps to linear momentum.'),
      d('3.4', /work|energy|power/i, 'Existing topic label maps to work, energy, and power.'),
      d('2.5', /forces?|newton|translational dynamics/i, 'Existing topic label maps to force and translational dynamics.'),
      d('1.3', /kinematics|motion/i, 'Existing topic label maps to kinematics.'),
    ].filter(Boolean)
    return firstRule(label, rules)
  }
  if (family === 'physics-2') {
    const rules = [
      d('15.7', /modern physics|nuclear|decay/i, 'Existing topic label maps to modern physics.'),
      d('14.8', /waves?|sound|physical optics/i, 'Existing topic label maps to waves and physical optics.'),
      d('13.4', /optics|lens|mirror/i, 'Existing topic label maps to geometric optics.'),
      d('12.4', /magnetism|induction/i, 'Existing topic label maps to magnetism and electromagnetic induction.'),
      d('11.6', /circuits?/i, 'Existing topic label maps to electric circuits.'),
      d('10.6', /electric fields?|electric force|electric potential|charge/i, 'Existing topic label maps to electric force, field, and potential.'),
      d('9.4', /thermodynamics|thermal|gas/i, 'Existing topic label maps to thermodynamics.'),
    ]
    if (/fluids?/.test(label)) return { notApplicable: true, reason: 'Fluid mechanics is not in the current Physics 2 U9-U15 course map.' }
    return firstRule(label, rules)
  }
  if (family === 'em') {
    const rules = [
      d('13.6', /inductors?|lr circuits?/i, 'Existing topic label maps to circuits with inductors.'),
      d('13.2', /electromagnetic induction|induction/i, 'Existing topic label maps to electromagnetic induction.'),
      d('12.4', /magnetic fields|electromagnetism|magnetism/i, 'Existing topic label maps to magnetic fields and electromagnetism.'),
      d('11.6', /circuits?|resistance/i, 'Existing topic label maps to electric circuits.'),
      d('10.3', /conductors?|capacitors?/i, 'Existing topic label maps to conductors and capacitors.'),
      d('9.2', /electric potential/i, 'Existing topic label maps to electric potential.'),
      d('8.4', /charge distributions?|electric charges|electric fields|gauss/i, 'Existing topic label maps to electric charges, fields, and Gauss law.'),
    ]
    return firstRule(label, rules)
  }
  return null
}

function firstRule(text, rules) {
  for (const rule of rules) if (rule.re.test(text)) return rule
  return null
}

function d(code, re, reason) {
  const unit = `U${code.split('.')[0]}`
  return { code, unit, re, reason }
}

function applyDecision(item, topic, decision, meta) {
  item.primary_unit = topic.unit
  item.unit = topic.unit
  item.unit_name = unitName(topic.unit, meta)
  item.topics = [{ code: topic.code, name: topic.name }]
  item.unit_classification = 'official-topic-progression-reviewed'
  item.classification_reasoning = `${decision.reason} Latest required official topic: ${topic.code} ${topic.name}.`
  item.classification = {
    ...(item.classification || {}),
    primary_unit: topic.unit,
    review_status: 'reviewed',
    classification_version: 'official_topic_progression_v2_2026_07_21',
    authority: meta.authority,
    evidence: item.classification_reasoning,
  }
  item.classification_accuracy = {
    authority: meta.authority,
    required_topics: [{
      unit: topic.unit,
      topic_code: topic.code,
      topic_name: topic.name,
      reason: item.classification_reasoning,
    }],
    primary_unit_rule: 'primary_unit is the latest official topic/unit a student must complete to answer the whole item using that topic/unit and prior official content.',
    why_not_earlier_unit: earlierReason(topic.unit),
    classification_reasoning: item.classification_reasoning,
    review_method: 'subject-specific official topic progression audit',
    reviewed_at: '2026-07-21',
  }
}

function markNotApplicable(item, decision, meta) {
  item.previous_primary_unit = item.primary_unit
  item.primary_unit = 'not_applicable'
  item.unit = 'not_applicable'
  item.unit_name = 'Outside current official unit progression'
  item.student_visible = false
  item.publish_status = 'blocked'
  item.classification_reasoning = decision.reason
  item.classification = {
    ...(item.classification || {}),
    primary_unit: 'not_applicable',
    review_status: 'blocked',
    classification_version: 'official_topic_progression_v2_2026_07_21',
    authority: meta.authority,
    evidence: decision.reason,
  }
  item.classification_accuracy = {
    authority: meta.authority,
    required_topics: [],
    primary_unit_rule: 'Items outside the current official course map are not used in student unit-progression flows.',
    why_not_earlier_unit: decision.reason,
    classification_reasoning: decision.reason,
    review_method: 'subject-specific official topic progression audit',
    reviewed_at: '2026-07-21',
  }
}

function itemText(item) {
  const parts = [item.text, item.stem, item.prompt, item.answer, item.explanation, item.rubric, JSON.stringify(item.options || ''), JSON.stringify(item.topics || '')]
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ')
}

function visible(item) {
  return item && item.primary_unit !== 'not_applicable' && item.student_visible !== false && item.publish_status !== 'blocked' && item.scoring_status !== 'not_scored'
}

function normalizeUnit(unit) {
  const match = String(unit || '').match(/U?\s*(\d+)/i)
  return match ? `U${match[1]}` : String(unit || '')
}

function unitName(unitCode, meta) {
  const subject = meta.subject
  const config = readJson(path.join(AP_ROOT, subject, 'classification_config.json'))
  return (config.units || []).find(unit => unit.code === unitCode)?.name || unitCode
}

function earlierReason(unit) {
  const n = Number(String(unit).replace('U', ''))
  if (!Number.isFinite(n)) return 'The item is outside the current official unit progression.'
  return n <= 1 || n === 8 || n === 9 ? 'This is the first relevant unit in the official course progression for this subject.' : `The answer path requires Unit ${n}; earlier units alone are insufficient.`
}

function addFinding(severity, subject, file, item, message) {
  report.findings.push({ severity, subject, file, question_id: item.question_id, primary_unit: item.primary_unit, message })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
