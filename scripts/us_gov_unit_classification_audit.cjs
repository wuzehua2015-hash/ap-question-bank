#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'us-government-politics'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'us-gov-unit-classification-audit')
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
  'question_bank.json|2018_Q01': ['U5', '5.8', 'The graph item asks where an individual vote has more influence under the Electoral College.'],
  'question_bank.json|2018_Q03': ['U5', '5.1', 'The demographic graph item is used to reason about electorate composition and voting behavior.'],
  'question_bank.json|2018_Q07': ['U3', '3.10', 'The graph limitation item concerns representation in state legislatures and civil-rights analysis.'],
  'question_bank.json|2018_Q09': ['U2', '2.7', 'The line graph item concerns presidential approval over time.'],
  'question_bank.json|2018_Q12': ['U1', '1.6', 'Washington’s concern about encroachment is addressed by distributing power across national institutions.'],
  'question_bank.json|2018_Q11': ['U1', '1.5', 'The Washington Farewell Address excerpt is a foundational-document interpretation item, not a media item.'],
  'question_bank.json|2018_Q14': ['U1', '1.9', 'Creative federalism refers to federal-state cooperation and federalism in action.'],
  'question_bank.json|2018_Q15': ['U1', '1.9', 'The public-schools item belongs to creative federalism and federal-state policy implementation.'],
  'question_bank.json|2018_Q19': ['U1', '1.7', 'Variation among states on capital punishment is explained by federalism.'],
  'question_bank.json|2018_Q28': ['U2', '2.15', 'The automobile safety legislation item asks about policy implementation after legislation.'],
  'question_bank.json|2018_Q49': ['U2', '2.15', 'The item asks how separation of powers creates friction in the policy-making process.'],
  'question_bank.json|2005_Q12': ['U2', '2.8', 'The Supreme Court is the branch most insulated from public opinion.'],
  'question_bank.json|2008_Q43': ['U3', '3.3', 'The clear and present danger test limits freedom of speech.'],
  'question_bank.json|2012_Q19': ['U2', '2.4', 'The item asks about presidential legislative leadership despite party support in Congress.'],
  'question_bank.json|2012_Q45': ['U5', '5.12', 'The item asks about linkage institutions influencing the policy process.'],
  'question_bank.json|2012_Q58': ['U2', '2.15', 'The item asks about stages in the policy-making process.'],
  'question_bank.json|2013_Q15': ['U2', '2.10', 'Judicial activism is a judicial-branch decision-making concept.'],
  'question_bank.json|2013_Q32': ['U3', '3.1', 'The constitutional protection for interest groups rests on First Amendment civil liberties.'],
  'question_bank.json|2013_Q49': ['U3', '3.10', 'The item asks how civil-rights activists secure rights through social-movement strategies.'],
  'question_bank.json|2020_Q09': ['U3', '3.4', 'The reporter leak item concerns freedom of the press and prior restraint.'],
  'question_bank.json|2020_Q20': ['U3', '3.3', 'Student political expression at a public school is a freedom-of-speech item.'],
  'question_bank.json|2020_Q43': ['U1', '1.7', 'Concurrent powers are a federalism concept about state and national government authority.'],
  'question_bank.json|2018_Q18': ['U3', '3.6', 'The map item concerns capital punishment and public-order limits on individual rights.'],
  'question_bank.json|2018_Q22': ['U2', '2.1', 'The diagram item compares House and Senate chamber organization.'],
  'question_bank.json|2005_Q11': ['U5', '5.6', 'Pluralist theory explains competition among interest groups.'],
  'question_bank.json|2005_Q23': ['U2', '2.4', 'The item asks students to distinguish presidential powers from powers held by Congress.'],
  'question_bank.json|2005_Q46': ['U5', '5.1', 'The grandfather clause was a voting restriction affecting voting rights.'],
  'question_bank.json|2008_Q01': ['U4', '4.2', 'Parent party identification shaping a child’s party identification is political socialization.'],
  'question_bank.json|2008_Q23': ['U5', '5.8', 'Closed primary rules belong to presidential nomination and election processes.'],
  'question_bank.json|2012_Q21': ['U5', '5.2', 'The item asks about the most common act of political participation, voting.'],
  'question_bank.json|2013_Q23': ['U1', '1.7', 'Shifting responsibilities and costs to state governments is devolution in federal-state relations.'],
  'question_bank.json|2020_Q51': ['U5', '5.1', 'The line graph item compares age groups in voting behavior.'],
  'question_bank.json|2020_Q36': ['U2', '2.2', 'The table item asks how a bill passed through congressional voting coalitions.'],
  'frq_bank.json|2018_FRQ1': ['U4', '4.8', 'The full FRQ requires congressional oversight plus party ideology and economic policymaking.'],
  'frq_bank.json|2018_FRQ2': ['U3', '3.10', 'The full FRQ uses judicial appointments to explain civil liberties outcomes.'],
  'frq_bank.json|2018_FRQ3': ['U1', '1.8', 'The full FRQ centers on federalism and federal authority over state immigration policy.'],
  'frq_bank.json|2018_FRQ4': ['U3', '3.10', 'The full argument prompt centers on equality of opportunity through rights-related constitutional action.'],
  'frq_bank.json|2005_FRQ1': ['U4', '4.6', 'The full FRQ asks how public opinion constrains the Supreme Court despite judicial independence.'],
  'frq_bank.json|2005_FRQ2': ['U3', '3.11', 'The full FRQ includes federal power plus civil-rights and policy responses that expanded federal authority.'],
  'frq_bank.json|2005_FRQ3': ['U3', '3.7', 'The full FRQ centers on selective incorporation and rights protections against state governments.'],
  'frq_bank.json|2005_FRQ4': ['U5', '5.11', 'The full FRQ centers on campaign finance reforms.'],
  'frq_bank.json|2008_FRQ1': ['U5', '5.2', 'The full FRQ centers on voter participation and voting behavior.'],
  'frq_bank.json|2008_FRQ2': ['U2', '2.15', 'The full FRQ compares restrictions on presidential, congressional, and judicial power.'],
  'frq_bank.json|2008_FRQ3': ['U5', '5.6', 'The full FRQ centers on interest-group influence over Congress and regulation of groups.'],
  'frq_bank.json|2008_FRQ4': ['U4', '4.9', 'The full FRQ centers on federal budget deficits, entitlements, and economic policy.'],
  'frq_bank.json|2012_FRQ1': ['U2', '2.2', 'The full FRQ centers on Congress lawmaking, oversight, and casework.'],
  'frq_bank.json|2012_FRQ2': ['U5', '5.1', 'The full FRQ includes minority representation and voting-rights barriers.'],
  'frq_bank.json|2012_FRQ3': ['U2', '2.11', 'The full FRQ centers on judicial appointments, confirmations, and branch checks on courts.'],
  'frq_bank.json|2012_FRQ4': ['U5', '5.6', 'The full FRQ centers on interest groups influencing elections and government decision making.'],
  'frq_bank.json|2013_FRQ1': ['U2', '2.11', 'The full FRQ centers on Supreme Court authority and checks on the judicial branch.'],
  'frq_bank.json|2013_FRQ2': ['U5', '5.4', 'The full FRQ centers on party identification and changes in political parties.'],
  'frq_bank.json|2013_FRQ3': ['U2', '2.1', 'The full FRQ centers on differences between the House and Senate.'],
  'frq_bank.json|2013_FRQ4': ['U4', '4.9', 'The full FRQ centers on deficits, entitlements, and fiscal policy.'],
  'frq_bank.json|2020_FRQ1': ['U5', '5.6', 'The full FRQ includes FCC rulemaking, interest-group comment campaigns, and congressional response.'],
  'frq_bank.json|2020_FRQ2': ['U5', '5.3', 'The visible full prompt centers on party issue priorities and use by candidates.'],
  'frq_bank.json|2020_FRQ3': ['U3', '3.10', 'The full FRQ centers on Equal Protection and school-funding civil-rights reasoning.'],
  'frq_bank.json|2020_FRQ4': ['U2', '2.5', 'The full argument prompt centers on impeachment and removal as a congressional check on the president.'],
}

const RULES = [
  r('5.13', /\b(social media|internet news|online media|digital media|changing media)\b/i, 'Changing media requires Unit 5.13.'),
  r('5.12', /\b(media|press coverage|news coverage|television|newspaper|agenda setting)\b/i, 'The media require Unit 5.12.'),
  r('5.11', /\b(campaign finance|PACs?|political action committee|soft money|independent expenditures?|Citizens United|contribution limits?)\b/i, 'Campaign finance requires Unit 5.11.'),
  r('5.10', /\b(campaign strategy|campaigns?|advertising|candidate-centered|incumbency advantage)\b/i, 'Modern campaigns require Unit 5.10.'),
  r('5.9', /\b(congressional elections?|redistricting|gerrymander|incumbent|safe seat|single-member district)\b/i, 'Congressional elections require Unit 5.9.'),
  r('5.8', /\b(electoral college|presidential election|winner-take-all|swing states?|battleground states?|electoral votes?)\b/i, 'Electing a president requires Unit 5.8.'),
  r('5.7', /\b(iron triangle|issue network|amicus curiae|lobbying.*bureaucracy|policy outcomes)\b/i, 'Groups influencing policy outcomes require Unit 5.7.'),
  r('5.6', /\b(interest groups?|lobbyists?|lobbying|pluralism|elitism|hyperpluralism|political influence group)\b/i, 'Interest groups influencing policy making require Unit 5.6.'),
  r('5.5', /\b(third part(?:y|ies)|minor party|spoiler effect)\b/i, 'Third-party politics requires Unit 5.5.'),
  r('5.4', /\b(party identification|party realignment|dealignment|party coalitions?|divided government|critical election)\b/i, 'Party change and adaptation require Unit 5.4.'),
  r('5.3', /\b(political parties?|party platform|Republican Party|Democratic Party|party system)\b/i, 'Political parties require Unit 5.3.'),
  r('5.2', /\b(voter turnout|voter participation|registration requirement|ballot fatigue|motor voter|voting-age population)\b/i, 'Voter turnout requires Unit 5.2.'),
  r('5.1', /\b(voting rights|Voting Rights Act|Twenty-fourth Amendment|24th Amendment|voting behavior|party identification|race.*voting|retrospective voting|prospective voting)\b/i, 'Voting rights and voting behavior require Unit 5.1.'),
  r('4.10', /\b(social policy|same-sex marriage|abortion|gun control|school prayer)\b/i, 'Ideology and social policy require Unit 4.10.'),
  r('4.9', /\b(economic policy|fiscal policy|monetary policy|budget deficit|deficits?|entitlements?|Federal Reserve|tax and spend|tax policy|welfare spending)\b/i, 'Ideology and economic policy require Unit 4.9.'),
  r('4.8', /\b(policy preferences?|liberal.*conservative|conservative.*liberal|ideology and policymaking)\b/i, 'Ideology and policymaking require Unit 4.8.'),
  r('4.7', /\b(liberal ideology|conservative ideology|liberals?|conservatives?|political ideology|ideological differences)\b/i, 'Party and political ideologies require Unit 4.7.'),
  r('4.6', /\b(public opinion data|poll data|margin of error|sample size|polling error|evaluate.*poll)\b/i, 'Evaluating public opinion data requires Unit 4.6.'),
  r('4.5', /\b(public opinion poll|opinion polls?|survey question|random sample of voters|benchmark poll|tracking poll)\b/i, 'Measuring public opinion requires Unit 4.5.'),
  r('4.2', /\b(political socialization|family influence|generational effect|life-cycle effect|political events.*ideology)\b/i, 'Political socialization requires Unit 4.2.'),
  r('4.1', /\b(public opinion|political culture|political efficacy|trust in government|attitudes about government)\b/i, 'American attitudes about government and politics require Unit 4.1.'),
  r('3.13', /\b(affirmative action|Bakke|Grutter)\b/i, 'Affirmative action requires Unit 3.13.'),
  r('3.12', /\b(majority rights|minority rights)\b/i, 'Balancing minority and majority rights requires Unit 3.12.'),
  r('3.11', /\b(Civil Rights Act|Americans with Disabilities Act|ADA|government responses to social movements)\b/i, 'Government responses to social movements require Unit 3.11.'),
  r('3.10', /\b(equal protection|civil rights|Brown v\. Board|minority representation|discriminat|racial segregation|gender equality|Fourteenth Amendment)\b/i, 'Social movements and Equal Protection require Unit 3.10.'),
  r('3.9', /\b(privacy rights?|right to privacy|Roe v\. Wade|Griswold)\b/i, 'Due process and privacy require Unit 3.9.'),
  r('3.8', /\b(rights of the accused|criminal defendants?|Miranda|Gideon|Mapp|due process|exclusionary rule|search and seizure)\b/i, 'Due process and accused rights require Unit 3.8.'),
  r('3.7', /\b(selective incorporation|incorporated|incorporation|Gitlow)\b/i, 'Selective incorporation requires Unit 3.7.'),
  r('3.6', /\b(public order|balancing individual freedom)\b/i, 'Balancing individual freedom with public order requires Unit 3.6.'),
  r('3.5', /\b(Second Amendment|right to bear arms|McDonald v\. Chicago|District of Columbia v\. Heller)\b/i, 'Second Amendment rights require Unit 3.5.'),
  r('3.4', /\b(freedom of the press|prior restraint|New York Times v\. United States)\b/i, 'Freedom of the press requires Unit 3.4.'),
  r('3.3', /\b(free speech|freedom of speech|symbolic speech|Tinker|Schenck|Brandenburg)\b/i, 'Freedom of speech requires Unit 3.3.'),
  r('3.2', /\b(free exercise|establishment clause|religious freedom|Engel|Wisconsin v\. Yoder)\b/i, 'Freedom of religion requires Unit 3.2.'),
  r('3.1', /\b(Bill of Rights|First Amendment|civil liberties)\b/i, 'The Bill of Rights and civil liberties require Unit 3.'),
  r('2.15', /\b(policy-making institutions?|policymaking institutions?|policy making|implementation of laws)\b/i, 'Policy and branches of government require Unit 2.15.'),
  r('2.14', /\b(oversight of the bureaucracy|hold.*bureaucracy accountable|bureaucratic accountability)\b/i, 'Holding the bureaucracy accountable requires Unit 2.14.'),
  r('2.13', /\b(rulemaking authority|discretionary authority|regulation writing|administrative discretion)\b/i, 'Discretionary and rulemaking authority require Unit 2.13.'),
  r('2.12', /\b(bureaucracy|bureaucratic|agency|Federal Communications Commission|FCC|EPA|Federal Reserve)\b/i, 'The bureaucracy requires Unit 2.12.'),
  r('2.11', /\b(checks on the judicial|check.*court|Court.*authority|judicial appointments?|confirmation process|court-packing)\b/i, 'Checks on the judicial branch require Unit 2.11.'),
  r('2.10', /\b(judicial decision|Supreme Court decision|precedent|stare decisis|majority opinion|dissenting opinion)\b/i, 'The Court in action requires Unit 2.10.'),
  r('2.9', /\b(judicial review|Marbury v\. Madison|role of the judicial branch)\b/i, 'The role of the judicial branch requires Unit 2.9.'),
  r('2.8', /\b(judicial branch|Supreme Court|federal courts?|district courts?|writ of certiorari|judiciary)\b/i, 'The judicial branch requires Unit 2.8.'),
  r('2.7', /\b(presidential communication|State of the Union|bully pulpit|public approval of the president)\b/i, 'Presidential communication requires Unit 2.7.'),
  r('2.6', /\b(expansion of presidential power|executive agreement|executive order|signing statement)\b/i, 'Expansion of presidential power requires Unit 2.6.'),
  r('2.5', /\b(impeach|impeachment|override.*veto|Senate confirmation|checks on the presidency)\b/i, 'Checks on the presidency require Unit 2.5.'),
  r('2.4', /\b(president|presidential power|commander in chief|veto|executive privilege|appointment power|chief executive)\b/i, 'Roles and powers of the president require Unit 2.4.'),
  r('2.3', /\b(congressional behavior|casework|pork barrel|logrolling|trustee|delegate|politico)\b/i, 'Congressional behavior requires Unit 2.3.'),
  r('2.2', /\b(House Rules Committee|conference committee|filibuster|lawmaking|committee system|legislative process|oversight|power of the purse)\b/i, 'Structures, powers, and functions of Congress require Unit 2.2.'),
  r('2.1', /\b(House and Senate|House of Representatives|Senate|bicameral legislature|Congress)\b/i, 'Congress and its chambers require Unit 2.1.'),
  r('1.9', /\b(unfunded mandate|block grants?|categorical grants?|fiscal federalism)\b/i, 'Federalism in action requires Unit 1.9.'),
  r('1.8', /\b(McCulloch v\. Maryland|United States v\. Lopez|commerce clause|necessary and proper|elastic clause|supremacy clause|federal authority|federalism)\b/i, 'Constitutional interpretations of federalism require Unit 1.8.'),
  r('1.7', /\b(states and the federal government|reserved powers|concurrent powers|enumerated powers|devolution)\b/i, 'Relationship between states and the federal government requires Unit 1.7.'),
  r('1.6', /\b(separation of powers|checks and balances|Federalist 51|limited government|popular sovereignty|republicanism)\b/i, 'Principles of American government require Unit 1.6.'),
  r('1.5', /\b(ratification|Federalist Papers|Brutus 1|Federalist 10|Federalist 70|Federalist 78|Anti-Federalists?)\b/i, 'Ratification and foundational documents require Unit 1.5.'),
  r('1.4', /\b(Articles of Confederation|Shays'? Rebellion)\b/i, 'Challenges of the Articles of Confederation require Unit 1.4.'),
  r('1.3', /\b(individual rights|natural rights|Declaration of Independence)\b/i, 'Government power and individual rights require Unit 1.3.'),
  r('1.2', /\b(participatory democracy|pluralist democracy|elite democracy)\b/i, 'Types of democracy require Unit 1.2.'),
  r('1.1', /\b(democracy|republic|republican government|consent of the governed)\b/i, 'Ideals of democracy require Unit 1.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP U.S. Government and Politics primary_unit is the latest official unit required to solve the full item using that unit and prior units; FRQ is classified by the whole prompt.',
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
  console.log(`US Gov unit classification audit: ${OUT_PATH}`)
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
  if (/\b(exit poll|random sampling|scientific public-opinion polling|polling firm|landline telephones|likely voters)\b/i.test(text)) return byCode('4.5', 'The item asks about polling or measuring public opinion; this belongs to Unit 4.')
  if (/\b(libertarian ideology|individual who identifies as a Democrat|Democrats?.*Republicans?.*regulations|free market|marketplace|Adam Smith|fewer regulations|reduce government spending|anti-discrimination policies)\b/i.test(text)) return byCode('4.8', 'The item asks about ideology and policy preferences; this belongs to Unit 4.')
  if (/\b(social welfare policy|regressive tax|tax rates|Social Security benefits|North American Free Trade Agreement|trade barriers|discretionary item in the federal budget)\b/i.test(text)) return byCode('4.9', 'The item asks about fiscal, tax, welfare, or economic policy; this belongs to Unit 4.')
  if (/\b(party machine|closed primary|front-loading|primary calendar|realigning election|realignment refers|ticket splitting|split-ticket voting|caucus|choosing presidential nominees|plurality system|Republican primary|political participation)\b/i.test(text)) return byCode('5.3', 'The item asks about political parties, nomination systems, or electoral participation; this belongs to Unit 5.')
  if (/\b(retrospective model of voting|Motor-voter|voter registration|grandfather clause|voting rates|minority voting|revok(?:e|es) voter registration|Voting Rights Act)\b/i.test(text)) return byCode('5.1', 'The item asks about voting rights or voting behavior; this belongs to Unit 5.')
  if (/\b(gerrymandering|district boundaries)\b/i.test(text)) return byCode('5.9', 'The item asks about congressional elections and districting; this belongs to Unit 5.')
  if (/\b(political advertisements|candidate.?s personal characteristics)\b/i.test(text)) return byCode('5.10', 'The item asks about campaigns and campaign messaging; this belongs to Unit 5.')
  if (/\b(referendum|initiative)\b/i.test(text)) return byCode('1.2', 'The item asks about direct democracy mechanisms; this belongs to Unit 1.')
  if (/\b(returning more of the responsibilities|national level to the state level|devolution|more state spending than federal spending)\b/i.test(text)) return byCode('1.7', 'The item asks about federal-state responsibility and devolution; this belongs to Unit 1.')
  if (/\b(clear and present danger)\b/i.test(text)) return byCode('3.3', 'The item asks about limits on freedom of speech; this belongs to Unit 3.')
  if (/\b(habeas corpus|bill of attainder|Fifth and Sixth Amendments|self-incrimination|right to have an attorney)\b/i.test(text)) return byCode('3.8', 'The item asks about due process or rights of the accused; this belongs to Unit 3.')
  if (/\b(capital punishment|death penalty)\b/i.test(text)) return byCode('3.6', 'The item asks about public order and safety limits on individual rights; this belongs to Unit 3.')
  if (/\b(Nineteenth Amendment|Equal Rights Amendment|Title IX|equality for women|César Chávez|Martin Luther King|nonviolence|social movement)\b/i.test(text)) return byCode('3.10', 'The item asks about social movements and equal protection; this belongs to Unit 3.')
  if (/\b(printing of currency|Department of the Treasury|presidential appointees|financial records|federal agencies|cabinet heads|regulatory policy|emission standards)\b/i.test(text)) return byCode('2.12', 'The item asks about federal bureaucracy or administrative agencies; this belongs to Unit 2.')
  if (/\b(authority to declare war|pardoning felons|primary reason for the tensions.*legislative and executive)\b/i.test(text)) return byCode('2.4', 'The item asks about presidential powers or branch relations involving the executive; this belongs to Unit 2.')
  if (/\b(Seventeenth Amendment|Senators were|bicameralism|legislative and executive branches|congressional representative|pork barreling)\b/i.test(text)) return byCode('2.3', 'The item asks about congressional behavior, representation, or chamber design; this belongs to Unit 2.')
  if (/\b(judicial activism|admission policy.*racial minority|quota system)\b/i.test(text)) return byCode('3.13', 'The item asks about affirmative action or judicial review of admissions policy; this belongs to Unit 3.')
  if (/\b(traditional political values|equality of outcome|Federalist number 10|many factions)\b/i.test(text)) return byCode('1.1', 'The item asks about foundational democratic values or factions; this belongs to Unit 1.')
  for (const rule of RULES) if (rule.pattern.test(text)) return byCode(rule.code, rule.reason)
  return { unit: null, code: null, name: null, reason: 'No official AP U.S. Government and Politics topic decision matched; item requires manual topic review.' }
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
    classification_version: 'us-gov-official-progression-2026-07-21',
    authority: 'AP U.S. Government and Politics Course and Exam Description',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP U.S. Government and Politics Course and Exam Description',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'U.S. Government item review against the official AP U.S. Government and Politics topic sequence; shared data and full FRQ prompt included',
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
    item.solution || '',
    item.explanation || '',
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
  if (!topic) throw new Error(`Unknown US Gov topic ${code}`)
  return { ...topic, unit: normalizeUnit(topic.unit), reason }
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
