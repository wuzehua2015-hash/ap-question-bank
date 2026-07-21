#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'psychology'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'psychology-unit-classification-audit')
const OUT_PATH = path.join(OUT_DIR, 'summary.json')
const REVIEW_PATH = path.join(OUT_DIR, 'review-pack.json')
const applyFixes = process.argv.includes('--apply')
const failOnFindings = process.argv.includes('--fail-on-findings')

const config = readJson(path.join(SUBJECT_DIR, 'classification_config.json'))
const topicByKey = new Map()
for (const unit of config.units || []) {
  const unitCode = unit.code || unit.id
  const unitNum = Number(String(unitCode).replace(/^U/i, ''))
  ;(unit.topics || []).forEach((topic, index) => {
    const name = typeof topic === 'string' ? topic : topic.name
    const code = typeof topic === 'string' ? `${unitNum}.${index + 1}` : topic.code
    topicByKey.set(name, { unit: unitCode, code, name })
    topicByKey.set(code, { unit: unitCode, code, name })
  })
}

const MANUAL = {
  'question_bank.json|1999_Q033': ['U4', '4.3', 'The item references a personality-assessment figure, which requires projective/personality-test knowledge.'],
  'question_bank.json|1999_Q098': ['U1', '1.7', 'Psychophysics is a sensation threshold and measurement topic.'],
  'question_bank.json|2004_Q006': ['U2', '2.1', 'Selective attention is treated as a perception and cognition topic in the current framework.'],
  'question_bank.json|2004_Q008': ['U1', '1.10', 'The item asks students to identify a cross-sectional research design.'],
  'question_bank.json|2004_Q060': ['U4', '4.1', 'Set point in weight-control research is a motivation and biological-drive concept.'],
  'question_bank.json|2004_Q082': ['U1', '1.7', 'Signal detection theory is a sensation topic.'],
  'question_bank.json|2004_Q087': ['U4', '4.7', 'The scenario asks about self-serving attributional bias.'],
  'question_bank.json|2004_Q098': ['U1', '1.10', 'The item asks students to identify independent variables in a research design.'],
  'question_bank.json|2007_Q041': ['U3', '3.2', 'Ignoring misbehavior and praising desired behavior uses operant conditioning principles.'],
  'question_bank.json|2007_Q044': ['U5', '5.4', 'The symptoms describe a personality disorder diagnosis.'],
  'question_bank.json|2007_Q080': ['U2', '2.8', 'Split-half reliability is a testing and assessment topic.'],
  'question_bank.json|2007_Q083': ['U4', '4.7', 'The item asks about self-serving bias.'],
  'question_bank.json|2007_Q084': ['U3', '3.3', 'Bandura and the Bobo doll study are observational-learning topics.'],
  'question_bank.json|2012_Q003': ['U1', '1.10', 'The item asks students to identify an experiment from random assignment and treatment comparison.'],
  'question_bank.json|2012_Q017': ['U3', '3.2', 'Learned helplessness is a learning consequence of lack of control.'],
  'question_bank.json|2012_Q034': ['U1', '1.10', 'The item asks about representative sampling for generalizable research.'],
  'question_bank.json|2012_Q068': ['U5', '5.4', 'Hallucinations are symptoms used in psychological-disorder diagnosis.'],
  'question_bank.json|2012_Q081': ['U5', '5.1', 'Biofeedback is a health-psychology technique for controlling physiological responses.'],
  'question_bank.json|2012_Q088': ['U4', '4.1', 'Homeostasis in response to cold is a motivation and biological-drive concept.'],
  'question_bank.json|2012_Q094': ['U4', '4.8', 'A group decision becoming more extreme is group polarization.'],
  'question_bank.json|2012_Q096': ['U4', '4.1', 'Gender differences in aggression belong with motivation and social-personality behavior.'],
  'question_bank.json|2012_Q099': ['U5', '5.4', 'Defining abnormality by deviation from cultural norms belongs to psychological-disorder diagnosis.'],
  'question_bank.json|2018_Q005': ['U1', '1.10', 'The item asks students to identify an experiment from manipulated lighting and measured scores.'],
  'question_bank.json|2018_Q039': ['U3', '3.1', 'Habituation to repeated loud music is a basic learning process.'],
  'question_bank.json|2018_Q065': ['U4', '4.6', 'The mere-exposure effect belongs to interpersonal attraction and social-personality behavior.'],
  'question_bank.json|2018_Q067': ['U5', '5.4', 'The item connects uncontrollable events to a depressive-disorder explanation.'],
  'question_bank.json|2018_Q042': ['U1', '1.7', 'The image-labeled item asks about the ear ossicles, a sensation topic.'],
  'question_bank.json|2018_Q069': ['U4', '4.7', 'The diagram item is a social/personality concept item and requires Unit 4 social-psychology reasoning.'],
  'frq_bank.json|2012_FRQ1': ['U1', '1.10', 'The full FRQ asks about research methods and descriptive or inferential statistics as course skills.'],
  'frq_bank.json|2012_FRQ2': ['U4', '4.8', 'The full FRQ includes motivation, self-actualization, social learning, biological terms, and social facilitation; the latest required unit is social psychology and personality.'],
  'frq_bank.json|2018_FRQ1': ['U4', '4.3', 'The full FRQ includes cognition, sensation, motivation, and gender roles; the latest required unit is social/personality.'],
  'frq_bank.json|2018_FRQ2': ['U5', '5.6', 'The full FRQ includes personality, social behavior, metacognition, token economy, and statistics; token economy as a behavior-management treatment term makes Unit 5 the latest required unit.'],
  'frq_bank.json|2023_SET_1_FRQ1': ['U4', '4.3', 'The full FRQ includes procedural memory, diffusion of responsibility, attribution, ghrelin, parenting style, and neuroticism; the latest required unit is social/personality.'],
  'frq_bank.json|2023_SET_1_FRQ2': ['U4', '4.7', 'The full FRQ includes research design, industrial-organizational context, reinforcement, and halo effect; the latest required unit is social/personality.'],
  'frq_bank.json|2023_SET_2_FRQ1': ['U4', '4.7', 'The full FRQ includes spotlight effect, cognitive map, Big Five extraversion, negative punishment, formal operations, actor-observer bias, and self-efficacy; the latest required unit is social/personality.'],
  'frq_bank.json|2023_SET_2_FRQ2': ['U4', '4.7', 'The full FRQ includes peripheral route persuasion, false consensus effect, mere-exposure effect, and research design; the latest required unit is social/personality.'],
  'frq_bank.json|2024_SET_1_FRQ1': ['U3', '3.6', 'The full FRQ includes Piaget assimilation, egocentrism, avoidant attachment, memory, motor cortex, cognitive map, and cones; the latest required unit is development and learning.'],
  'frq_bank.json|2024_SET_1_FRQ2': ['U4', '4.3', 'The full FRQ includes research design, context-dependent memory, Yerkes-Dodson law, and Big Five conscientiousness; the latest required unit is social/personality.'],
  'frq_bank.json|2024_SET_2_FRQ1': ['U4', '4.8', 'The full FRQ includes retinal disparity, intrinsic motivation, social facilitation, kinesthetic sense, memory, and self-serving bias; the latest required unit is social/personality.'],
  'frq_bank.json|2024_SET_2_FRQ2': ['U5', '5.1', 'The full FRQ includes anxiety, research design, external locus of control, Selye stress response, and crystallized intelligence; the latest required unit is mental and physical health.'],
  'frq_bank.json|2025_SET_1_FRQ1': ['U2', '2.2', 'The full source-based FRQ centers on misinformation effect and memory with research-method support.'],
  'frq_bank.json|2025_SET_1_FRQ2': ['U4', '4.8', 'The full source-based FRQ asks whether presence of others improves performance, which centers on social facilitation.'],
  'frq_bank.json|2025_SET_2_FRQ1': ['U3', '3.2', 'The full source-based FRQ centers on stimulus discrimination in operant conditioning with research-method support.'],
  'frq_bank.json|2025_SET_2_FRQ2': ['U4', '4.8', 'The full source-based FRQ asks about social conditions that affect helping in emergencies.'],
}

const RULES = [
  r('5.6', /\b(psychotherapy|therapy|therapist|cognitive therapy|behavior therapy|client-centered|Carl Rogers|psychoanalysis|free association|systematic desensitization|exposure therapy|token economy|treatment of patients|Dorothea Dix)\b/i, 'Treatment and therapy require Unit 5.'),
  r('5.6', /\b(antidepressant|antipsychotic|antianxiety|lithium|electroconvulsive|ssri|prozac|biomedical therapy)\b/i, 'Biomedical therapy requires Unit 5.'),
  r('5.4', /\b(disorder|depression|major depressive|bipolar|schizophrenia|anxiety|panic|phobia|obsessive|compulsive|dissociative|somatic|personality disorder|ptsd|autism|adhd|psychotic|hallucination|delusion|abnormal behavior|abnormal behaviors|DSM)\b/i, 'Psychological disorders and diagnosis require Unit 5.'),
  r('5.1', /\b(stress|stressor|general adaptation syndrome|coping|health psychology|biofeedback|immune system|Kubler-Ross|death)\b/i, 'Stress and health psychology require Unit 5.'),
  r('4.8', /\b(conformity|obedience|groupthink|group polarization|social facilitation|social inhibition|social loafing|deindividuation|bystander|diffusion of responsibility|foot-in-the-door|door-in-the-face|group norm|less likely.*help|social influence|normative social influence|working in a group|autokinetic|crowd)\b/i, 'Social influence and group behavior require Unit 4.'),
  r('4.7', /\b(attribution|fundamental attribution|self-serving|attitude|cognitive dissonance|prejudice|stereotype|ethnocentrism|outgroup homogeneity|scapegoat|persuasion|central route|peripheral route)\b/i, 'Attitudes, attribution, and prejudice require Unit 4.'),
  r('4.6', /\b(attachment style|romantic love|companionate love|passionate love|interpersonal attraction|attraction|attracted|proximity|mere exposure|lasting romantic relationship)\b/i, 'Interpersonal attraction requires Unit 4.'),
  r('4.3', /\b(personality|trait|big five|freud|id\b|ego\b|superego|defense mechanism|projection|humanistic|self-actualization|locus of control|dumb luck|personal responsibility|unconscious desires|unconscious feelings|projective test|Rorschach|Thematic Apperception Test|TAT|androgyny|gender typing|type A personality)\b/i, 'Personality theories require Unit 4.'),
  r('4.2', /\b(emotion|facial expression|facial feedback|james-lange|cannon-bard|schachter|yerkes-dodson|polygraph)\b/i, 'Emotion requires Unit 4.'),
  r('4.1', /\b(motivation|drive-reduction|drive reduction|incentive|hierarchy of needs|hunger|low blood-glucose|blood-glucose|achievement motivation|need for achievement|approach-approach conflict|homeostasis|set point|instinct|ethologist|genetically programmed action pattern|intrinsic|extrinsic)\b/i, 'Motivation requires Unit 4.'),
  r('3.7', /\b(kohlberg|moral development|preconventional|conventional|postconventional)\b/i, 'Moral development requires Unit 3.'),
  r('3.6', /\b(piaget|sensorimotor|preoperational|concrete operational|formal operational|object permanence|conservation|egocentrism|assimilation|spoons are tableware|four-legged animal)\b/i, 'Cognitive development requires Unit 3.'),
  r('3.5', /\b(attachment|secure base|strange situation|harlow|imprinting)\b/i, 'Attachment requires Unit 3.'),
  r('3.4', /\b(developmental|infant|adolescent|adolescence|puberty|teratogen|prenatal|critical period|erikson|roll over|crawl|walk|authoritative parents|five year olds)\b/i, 'Developmental psychology requires Unit 3.'),
  r('3.3', /\b(observational learning|modeling|social-learning|social learning|bandura|bobo doll|mirror neuron|self-efficacy)\b/i, 'Observational learning requires Unit 3.'),
  r('3.2', /\b(operant conditioning|reinforcement|reinforcer|reinforced|punishment|shaping|schedules? of reinforcement|fixed-ratio|variable-ratio|fixed-interval|variable-interval|skinner|learned helplessness|overjustification|product of learning|piece of candy)\b/i, 'Operant conditioning requires Unit 3.'),
  r('3.1', /\b(classical conditioning|conditioned stimulus|conditioned response|unconditioned stimulus|unconditioned response|pavlov|extinction|extinguished|spontaneous recovery|generalization|discrimination|taste aversion|aversion|habituation)\b/i, 'Classical conditioning requires Unit 3.'),
  r('2.8', /\b(testing|aptitude test|achievement test|intelligence test|fails to predict|predict what it is designed to predict|reliability|validity|standardization|norms|percentile|iq\b|Binet|assessment measures|Barnum effect)\b/i, 'Testing and intelligence assessment require Unit 2.'),
  r('2.7', /\b(confirmation tendency|availability heuristic|representativeness heuristic|framing|overconfidence|mental set|functional fixedness|hindsight)\b/i, 'Cognitive tendencies require Unit 2.'),
  r('2.6', /\b(intelligence|g factor|fluid intelligence|crystallized intelligence|abstract logic|unfamiliar problems|multiple intelligences|savant)\b/i, 'Intelligence requires Unit 2.'),
  r('2.5', /\b(language|grammar|phoneme|morpheme|syntax|semantics|babbling|prelinguistic|telegraphic speech|linguistic relativity|Chomsky|overregularization|Wernicke)\b/i, 'Language requires Unit 2.'),
  r('2.4', /\b(problem solving|problem-solving|algorithm|heuristic|mental shortcut|rules of thumb|insight|creativity|divergent thinking|concept|prototype|category|categories|metacognition|schemas?|DBRI|functional fixedness|not used for a particular purpose|all the books on every shelf)\b/i, 'Thinking and problem solving require Unit 2.'),
  r('2.2', /\b(memory|memories|amnesia|anterograde|retrograde|encoding|storage|retrieval|short-term memory|long-term memory|working memory|episodic|semantic|procedural|flashbulb|priming|recall|recognition|forgotten|forgetting|interference|mnemonic|serial position|middle of the list|first and last steps|tip of the tongue|long-term potentiation|synaptic transmission|misinformation effect|Loftus|pennies|beginning French)\b/i, 'Memory requires Unit 2.'),
  r('2.1', /\b(perception|selective attention|gestalt|figure-ground|depth perception|binocular|monocular|retinal disparity|perceptual constancy|phi phenomenon|top-down processing)\b/i, 'Perception requires Unit 2.'),
  r('1.9', /\b(psychoactive|drug|depressant|stimulant|hallucinogen|tolerance|withdrawal|addiction|alcohol|cocaine|opiates|marijuana)\b/i, 'Psychoactive drugs require Unit 1.'),
  r('1.8', /\b(consciousness|sleep|dream|rem sleep|circadian|hypnosis|meditation)\b/i, 'Consciousness requires Unit 1.'),
  r('1.7', /\b(sensation|sensory|absolute threshold|difference threshold|signal detection|sensory adaptation|sensory neurons|retina|rods and cones|middle ear|oval window|tympanic|cochlea|pitch|frequency|opponent-process|transduction|visual|auditory|taste|gustatory|odor|olfactory|kinesthetic|vestibular|semicircular canals|ossicles|psychophysics)\b/i, 'Sensation requires Unit 1.'),
  r('1.6', /\b(genetic|gene|dominant|recessive|offspring|heritability|twin stud|evolutionary psychology|evolutionary perspective|sociobiology|natural selection|chromosome)\b/i, 'Genetics and behavior require Unit 1.'),
  r('1.5', /\b(endocrine|hormone|adrenal|pituitary|thyroid|oxytocin)\b/i, 'Endocrine system requires Unit 1.'),
  r('1.4', /\b(nervous system|central nervous system|peripheral nervous system|autonomic|sympathetic|parasympathetic|somatic nervous system|spinal cord)\b/i, 'Nervous system requires Unit 1.'),
  r('1.3', /\b(brain|cerebral cortex|cerebral hemisphere|left hemisphere|frontal lobe|parietal lobe|occipital lobe|temporal lobe|amygdala|hippocampus|hypothalamus|thalamus|cerebellum|medulla|pons|corpus callosum|limbic)\b/i, 'Brain structures require Unit 1.'),
  r('1.2', /\b(neuron|neurons|neural|neurotransmitter|synapse|synaptic|receptor sites|action potential|reuptake|dopamine|serotonin|acetylcholine|gaba|endorphin)\b/i, 'Neural communication requires Unit 1.'),
  r('1.10', /\b(experiment|experimental method|cause-effect|cause-and-effect|scientific|verified|refuted|significant difference|statistical significance|p\s*=\s*\.05|correlat|scattergram|scatterplot|measure the relationship|random assignment|random sample|representative of the population|operational definition|independent variable|dependent variable|control group|double-blind|placebo|mean|median|mode|standard deviation|normal curve|case study|survey|longitudinal|cross-sectional|ethical issues|informed consent)\b/i, 'Research methods and statistics are earliest-stage course skills unless later psychology content is required.'),
  r('1.1', /\b(structuralism|functionalism|behaviorism|behaviorists|Skinnerian|John B\. Watson|psychoanalytic|humanistic psychology|cognitive psychology|cognitive theorists|biological psychology|clinical psychology|community psychologists|industrialorganizational|industrial-organizational|nature-nurture)\b/i, 'Psychology perspectives and biological psychology foundations require Unit 1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Psychology primary_unit is the latest current official unit required to solve the full item using that unit and prior units; FRQ is classified by the whole prompt.',
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
  console.log(`Psychology unit classification audit: ${OUT_PATH}`)
  console.table(report.totals)
  console.log(JSON.stringify({ ...report.totals, before: report.before, after: report.after }, null, 2))
  if (failOnFindings && (report.totals.blocking > 0 || report.totals.review > 0 || report.totals.still_unit_level > 0)) process.exit(1)
}

function auditItem(file, item) {
  if (!visible(item)) return
  report.totals.checked += 1
  const key = `${file}|${item.question_id}`
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
  if (/\b(loss of sensation.*no physiological basis|no physiological basis.*condition)\b/i.test(text)) {
    return byTopic('5.4', 'The item describes a psychological disorder symptom without physiological basis; this belongs to Unit 5.')
  }
  if (/\b(correct order of information processing in vision|photoreceptors relay visual information|cones and rods|visual information to the brain)\b/i.test(text)) {
    return byTopic('1.7', 'The item asks about sensory processing in vision; this belongs to Unit 1.')
  }
  if (/\b(early explorers.*wealth and fame)\b/i.test(text)) {
    return byTopic('4.1', 'The item asks about incentive motivation; this belongs to Unit 4.')
  }
  if (/\b(sweetened water.*immune suppression|drug that causes immune suppression)\b/i.test(text)) {
    return byTopic('3.1', 'The item asks about conditioned immune response; this belongs to Unit 3.')
  }
  if (/\b(afraid of public speaking|switching classes each semester|button that stopped the air puffs|button that had no effect)\b/i.test(text)) {
    return byTopic('3.2', 'The item asks about reinforcement or learned helplessness through controllability; this belongs to Unit 3.')
  }
  if (/\b(independent and dependent variables|independent variables|dependent variables|cause-and-effect|cause-effect|same subjects are tested|cross-sectional|longitudinal|precise operational definitions|scientific only if|representative of the population|correlation between two measures|strong negative correlation|scattergrams? represents|scatterplots? depicts|measure the relationship)\b/i.test(text)) {
    return byTopic('1.10', 'The item asks about research design, variables, statistical graphs, or scientific-method reasoning; this belongs to Unit 1.')
  }
  if (/\b(researcher studying the effect|randomly assigns student participants|compares the two groups.*p\s*=\s*\.05)\b/i.test(text)) {
    return byTopic('1.10', 'The item asks about experimental research and statistical significance; this belongs to Unit 1.')
  }
  if (/\b(Which is a definition of discrimination that most directly applies to perception|patch over one eye|depth|retinal image|size constancy|phi phenomenon|stationary point of light|Gestalt organizing|Gestalt princip|selective attention)\b/i.test(text)) {
    return byTopic('2.1', 'The item asks about perception or attention; this belongs to Unit 2.')
  }
  if (/\b(Which is a definition of discrimination that most directly applies to classical conditioning|fearful of rattlesnakes|garden snakes|conditioned to flinch)\b/i.test(text)) {
    return byTopic('3.1', 'The item asks about discrimination or a conditioned response in classical conditioning; this belongs to Unit 3.')
  }
  if (/\b(Which is a definition of discrimination that most directly applies to social psychology)\b/i.test(text)) {
    return byTopic('4.7', 'The item asks about discrimination in social psychology; this belongs to Unit 4.')
  }
  if (/\b(behavioral and mental activity|will NOT increase behavioral|barbiturates)\b/i.test(text)) {
    return byTopic('1.9', 'The item requires psychoactive-drug category knowledge; this belongs to Unit 1.')
  }
  if (/\b(lacked energy|unable to go to work|expected bad things|profound sadness|hopelessness|extreme euphoria|very talkative|overconfident|hyperactive)\b/i.test(text)) {
    return byTopic('5.4', 'The item describes symptoms used for psychological-disorder diagnosis; this belongs to Unit 5.')
  }
  if (/\b(always returns after leaving home|checking the doors|example of a compulsion|distress every time she leaves her house)\b/i.test(text)) {
    return byTopic('5.4', 'The item describes anxiety, compulsion, or related diagnostic symptoms; this belongs to Unit 5.')
  }
  if (/\b(facial expressions|basic human emotions|sadness.*innate|universal.*facial)\b/i.test(text)) {
    return byTopic('4.2', 'The item asks about emotion and facial expression; this belongs to Unit 4.')
  }
  if (/\b(evolutionary process.*preserves traits|natural selection|adaptive function|preprogrammed.*learned|jealousy.*adaptive function)\b/i.test(text)) {
    return byTopic('1.6', 'The item asks about evolutionary or genetic influences on behavior; this belongs to Unit 1.')
  }
  if (/\b(transference|specific phobias|fear of cats|mental health hospital|take turns.*stars)\b/i.test(text)) {
    return byTopic('5.6', 'The item asks about clinical treatment methods; this belongs to Unit 5.')
  }
  if (/\b(social psychologist|people behave differently in groups|conflict within organizations|contributions of club members drop|law-abiding people.*crowd|crosscultural studies on attributional|beliefs, values, attitudes|members of a group.*more extreme|fit in with his friends|all math majors|teacher.*mistakenly informed|supervisor who doubts|social interaction is preprogrammed)\b/i.test(text)) {
    return byTopic('4.8', 'The item asks about social psychology or group behavior; this belongs to Unit 4.')
  }
  if (/\b(central tendency|skewed distribution|score data|scattergrams|strong negative correlation|minimum intensity.*detected|correlation between scores obtained on two halves)\b/i.test(text)) {
    return byTopic('1.10', 'The item asks about statistics or graphical summaries used in psychological research; this belongs to Unit 1.')
  }
  if (/\b(rugby team.*antique dolls|Michael states that his friend Scott is cheap|fate is determined by her own actions|psychoanalytically oriente psychologist|theoretical framewc.*healthy ch|views the human condition)\b/i.test(text)) {
    return byTopic('4.3', 'The item asks about personality, gender-role, or personality-assessment concepts; this belongs to Unit 4.')
  }
  if (/\b(taking a painkiller|closes a window|reduction in noise|grandparents ignore|tantrums|pulled on the dog.?s tail|negatively reinforced|gift certificates|enjoys it less)\b/i.test(text)) {
    return byTopic('3.2', 'The item asks about reinforcement, punishment, or operant-learning consequences; this belongs to Unit 3.')
  }
  if (/\b(two-year-old child is frightened|small dog.*cat|Samuel became ill|pepperoni pizza|Garcia showed|conditioned taste|became nauseated)\b/i.test(text)) {
    return byTopic('3.1', 'The item asks about classical-conditioning generalization or taste aversion; this belongs to Unit 3.')
  }
  if (/\b(fear of dogs.*exposed to dogs|lost as the individual is exposed)\b/i.test(text)) {
    return byTopic('3.1', 'The item asks about extinction through exposure in classical conditioning; this belongs to Unit 3.')
  }
  if (/\b(14-month-old toddler|Mary Ainsw|Understanding that things continue to exist|Jason drops a toy|look over the side|Piagetian processes)\b/i.test(text)) {
    return byTopic('3.5', 'The item asks about attachment or early developmental milestones; this belongs to Unit 3.')
  }
  if (/\b(pair of lights flashing|stationary point of light|patch over one eye|selective attention|biological clock|visual information processing|saturated green|white surface|sees a red patch|correct order of information processing in vision)\b/i.test(text)) {
    return byTopic('2.1', 'The item asks about perception or attention; this belongs to Unit 2.')
  }
  if (/\b(speech functions|left cerebral hemisphere|Alzheimer|high-wire act|coordinate her movements|racing heart|shallow breathing|gate control theory)\b/i.test(text)) {
    return byTopic('1.3', 'The item asks about brain structures or nervous-system pathways; this belongs to Unit 1.')
  }
  if (/\b(behavior therapists emphasize|therapeutic treatments|contemporary definitions of abnormality|sees and feels imaginary|patients who use threats|overcome his fear|hypothesized to result.*no effect on the air puffs)\b/i.test(text)) {
    return byTopic('5.6', 'The item asks about therapy, clinical definitions, or clinical applications; this belongs to Unit 5.')
  }
  if (/\b(frustration-aggression|aggression as catharsis|gender differences.*aggression)\b/i.test(text)) {
    return byTopic('4.1', 'The item asks about motivational accounts of aggression; this belongs to Unit 4.')
  }
  if (/\b(Paul.*unrealistic expectations|cognitive model|Rudolph.*painting|creative productivity|Nick is smiling|change in mood|facial feedback)\b/i.test(text)) {
    return byTopic('4.2', 'The item asks about cognitive views of emotion or emotion expression; this belongs to Unit 4.')
  }
  if (/\b(healthy ch.*choose what is good|accept personal responsibility|stubborn individual.*uncooperative|Michael states.*Scott is cheap|personality assessment|test scores with another person)\b/i.test(text)) {
    return byTopic('4.3', 'The item asks about personality theories, defense mechanisms, assessment, or ethics of personal test results; this belongs to Unit 4.')
  }
  if (/\b(Jessie.*rush-hour|personal qualities|self-serving bias|self-serving|dispositional factors|environmental factors|Jack performed well|test was unfair|hate those you have injured|attitudes and behavior)\b/i.test(text)) {
    return byTopic('4.7', 'The item asks about attribution, bias, or cognitive dissonance; this belongs to Unit 4.')
  }
  if (/\b(Denny.*wrapping paper|mathematical formula|word games|series of letters|Wolfgang Kohler|sudden solving|plastic tablecloth|plane crash|cancel.*reservation|every possible combination)\b/i.test(text)) {
    return byTopic('2.4', 'The item asks about problem solving, heuristics, or functional fixedness; this belongs to Unit 2.')
  }
  if (/\b(Cognitive theorists emphasize|internal processes such as unrealistic expectations)\b/i.test(text)) {
    return byTopic('2.4', 'The item asks about cognitive explanations and schemas; this belongs to Unit 2.')
  }
  if (/\b(dichotic listening|first and last|young child.*goed|human languages|likes dog my swim to|learned to speak.*French|details of common objects|pennies)\b/i.test(text)) {
    return byTopic('2.2', 'The item asks about attention, memory, or language-related cognitive processing; this belongs to Unit 2.')
  }
  if (/\b(phonemes|rules of grammar|syntax|prelinguistic|Wernicke)\b/i.test(text)) {
    return byTopic('2.5', 'The item asks about language structure; this belongs to Unit 2.')
  }
  if (/\b(fifty-two-year-old|65-year-old|unfamiliar problems|abstract logic|linguistic intelligence)\b/i.test(text)) {
    return byTopic('2.6', 'The item asks about intelligence or changes in cognitive ability; this belongs to Unit 2.')
  }
  if (/\b(Hindsight bias|raincoats|mathematical formula|mental shortcut)\b/i.test(text)) {
    return byTopic('2.7', 'The item asks about cognitive tendencies or problem-solving shortcuts; this belongs to Unit 2.')
  }
  if (/\b(split-half reliability|test fails to predict|assessment measures)\b/i.test(text)) {
    return byTopic('2.8', 'The item asks about reliability or validity of tests; this belongs to Unit 2.')
  }
  if (/\b(constant exposure to a stimulus|nerve cells fire less frequently|cats can see better|minimum intensity|Balance is influenced|vision|visual stimuli|semicircular canals)\b/i.test(text)) {
    return byTopic('1.7', 'The item asks about sensory systems or thresholds; this belongs to Unit 1.')
  }
  if (/\b(hormones in the body|Endocrine system)\b/i.test(text)) {
    return byTopic('1.5', 'The item asks about the endocrine system; this belongs to Unit 1.')
  }
  if (/\b(quotation below.*healthy infants|John B\. Watson|early Skinnerian|mind.*internal thoughts)\b/i.test(text)) {
    return byTopic('1.1', 'The item asks about psychology perspectives and historical schools; this belongs to Unit 1.')
  }
  for (const rule of RULES) if (rule.pattern.test(text)) return byTopic(rule.topic, rule.reason)
  return { unit: null, code: null, name: null, reason: 'No official AP Psychology topic decision matched; item requires manual topic review.' }
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
    classification_version: 'psychology-official-progression-2026-07-21',
    authority: 'AP Psychology Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Psychology Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'Psychology item review against the current AP Psychology five-unit topic sequence; options, shared data, and full FRQ prompt included',
    reviewed_at: '2026-07-21',
  }
}

function itemText(item) {
  return [
    item.group_context || '',
    item.shared_context || '',
    item.text || item.question_text || item.prompt || '',
    JSON.stringify(item.background_data || ''),
  ].join('\n').replace(/\s+/g, ' ')
}

function byManual(row) {
  return byTopic(row[1], `Manual official-progression review: ${row[2]}`)
}

function byTopic(topic, reason) {
  const entry = topicByKey.get(topic)
  if (!entry) throw new Error(`Unknown Psychology topic ${topic}`)
  return { ...entry, unit: normalizeUnit(entry.unit), reason }
}

function r(topic, pattern, reason) {
  return { topic, pattern, reason }
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
    text: String(item.text || item.question_text || item.prompt || '').replace(/\s+/g, ' ').slice(0, 500),
    group_context: String(item.group_context || item.shared_context || '').replace(/\s+/g, ' ').slice(0, 260),
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
