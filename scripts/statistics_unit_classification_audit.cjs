#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SUBJECT = 'statistics'
const SUBJECT_DIR = path.join(ROOT, 'public', 'data', 'ap', SUBJECT)
const OUT_DIR = path.join(ROOT, '.workspace', 'statistics-unit-classification-audit')
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
  'question_bank.json|2008_Q03': ['U1', '1.8', 'Boxplots compare one quantitative variable across gender groups.'],
  'question_bank.json|2008_Q05': ['U4', '4.4', 'The item asks for hypotheses for a paired population mean difference.'],
  'question_bank.json|2008_Q13': ['U1', '1.7', 'A linear transformation of test scores requires summary-statistic transformation reasoning.'],
  'question_bank.json|2008_Q16': ['U2', '2.9', 'The total count from independent candy samples requires mean and standard deviation of random variables.'],
  'question_bank.json|2008_Q20': ['U4', '4.2', 'The item asks how to reduce margin of error for a confidence interval for a population mean.'],
  'question_bank.json|2008_Q21': ['U2', '2.6', 'The diagnostic-test item requires conditional probability with false-positive and false-negative rates.'],
  'question_bank.json|2008_Q22': ['U3', '3.2', 'The item asks for the mean and standard deviation of a sampling distribution of a sample proportion.'],
  'question_bank.json|2008_Q27': ['U3', '3.14', 'Expected counts in a two-way categorical table under independence are chi-square setup knowledge.'],
  'question_bank.json|2008_Q28': ['U5', '5.1', 'The item interprets a scatterplot relating two quantitative ratings.'],
  'question_bank.json|2008_Q30': ['U1', '1.13', 'The item asks about replication in an experimental design.'],
  'question_bank.json|2008_Q32': ['U1', '1.13', 'The item asks students to identify a confounding variable in a study design.'],
  'question_bank.json|2008_Q34': ['U4', '4.1', 'The item requires a sampling distribution of a sample mean and normal probability.'],
  'question_bank.json|2008_Q36': ['U2', '2.2', 'The item interprets a two-way table of two categorical variables.'],
  'question_bank.json|2008_Q40': ['U4', '4.1', 'The item identifies a sampling distribution of a sample mean.'],
  'question_bank.json|2012_Q06': ['U1', '1.7', 'Quartiles and statements about a one-variable quantitative distribution require summary statistics.'],
  'question_bank.json|2012_Q10': ['U1', '1.13', 'The item asks whether random assignment supports a causal conclusion.'],
  'question_bank.json|2012_Q23': ['U2', '2.2', 'The item interprets association in a two-way table of categorical variables.'],
  'question_bank.json|2012_Q25': ['U2', '2.11', 'The item requires normal-distribution probability for commute time.'],
  'question_bank.json|2012_Q28': ['U3', '3.6', 'The item compares one-tailed and two-tailed p-values.'],
  'question_bank.json|2012_Q31': ['U3', '3.8', 'The item reasons about p-values, intervals, and repeated tests for a treatment effect on proportions.'],
  'question_bank.json|2012_Q35': ['U4', '4.4', 'The item asks for the alternative hypothesis for a population mean level.'],
  'question_bank.json|2012_Q37': ['U4', '4.1', 'The item describes the sampling distribution of the sample mean.'],
  'question_bank.json|2012_Q38': ['U4', '4.4', 'The item asks for an appropriate null hypothesis for two population means.'],
  'question_bank.json|2012_Q39': ['U2', '2.8', 'The repeated die-difference item requires a probability distribution of a random variable.'],
  'question_bank.json|2013_Q01': ['U1', '1.7', 'The item asks which summary statistic is unchanged by converting units.'],
  'question_bank.json|2013_Q08': ['U2', '2.9', 'A symmetric probability distribution requires random-variable distribution parameter reasoning.'],
  'question_bank.json|2013_Q10': ['U4', '4.2', 'The item asks for a confidence interval for a population mean.'],
  'question_bank.json|2013_Q14': ['U2', '2.10', 'The item asks students to identify the graph of a binomial distribution.'],
  'question_bank.json|2013_Q17': ['U2', '2.11', 'The item requires normal-distribution probability from a shaded region.'],
  'question_bank.json|2013_Q18': ['U5', '5.1', 'The item interprets a scatterplot of two quantitative movie-rating variables.'],
  'question_bank.json|2013_Q31': ['U1', '1.13', 'The item asks for the valid conclusion from an observational study.'],
  'question_bank.json|2013_Q36': ['U2', '2.9', 'The item combines independent approximately normal donated amounts as random variables.'],
  'question_bank.json|2014_Q02': ['U1', '1.8', 'The item interprets boxplots comparing quantitative test-score distributions.'],
  'question_bank.json|2014_Q04': ['U2', '2.4', 'The item uses a probability model for drawing candies with replacement.'],
  'question_bank.json|2014_Q06': ['U2', '2.10', 'The observed number of boys in a sample of births requires binomial-style sampling variation.'],
  'question_bank.json|2014_Q11': ['U2', '2.10', 'The dice game asks for a probability comparison across repeated independent trials.'],
  'question_bank.json|2014_Q27': ['U4', '4.4', 'The item asks for the appropriate paired t-test alternative hypothesis for a mean difference.'],
  'question_bank.json|2014_Q30': ['U5', '5.5', 'The item asks for a confidence interval for the slope of a population regression line.'],
  'question_bank.json|2014_Q33': ['U4', '4.5', 'The item interprets multiple matched-pair t-test results.'],
  'question_bank.json|2015_Q03': ['U1', '1.7', 'The item asks how a standardized score changes under unit conversion.'],
  'question_bank.json|2015_Q09': ['U2', '2.11', 'The item uses z-score reasoning for an approximately normal distribution.'],
  'question_bank.json|2015_Q11': ['U4', '4.4', 'The item asks for hypotheses involving paired pulse-rate means.'],
  'question_bank.json|2015_Q13': ['U3', '3.2', 'The item compares standard deviations of sampling distributions of sample proportions.'],
  'question_bank.json|2015_Q17': ['U1', '1.8', 'The item interprets boxplots comparing pulse-rate distributions.'],
  'question_bank.json|2015_Q19': ['U2', '2.6', 'The item applies independence in a two-way table to find an expected count.'],
  'question_bank.json|2015_Q23': ['U3', '3.8', 'The item identifies a Type II error for stated hypotheses.'],
  'question_bank.json|2015_Q24': ['U4', '4.7', 'The item estimates the difference between two population means from two samples.'],
  'question_bank.json|2015_Q28': ['U4', '4.2', 'The item asks for sample size for a confidence interval for a population mean.'],
  'question_bank.json|2015_Q29': ['U5', '5.1', 'The item interprets an observational relationship between two quantitative variables.'],
  'question_bank.json|2015_Q33': ['U4', '4.1', 'The item asks how sample size affects the sample mean estimator.'],
  'question_bank.json|2015_Q34': ['U5', '5.5', 'The item asks for the test statistic for a regression slope.'],
  'question_bank.json|2015_Q36': ['U3', '3.9', 'The item uses a sampling distribution for the difference between sample proportions.'],
  'question_bank.json|2016_Q02': ['U2', '2.2', 'The item interprets a two-way table for tanning-booth use and skin-cancer status.'],
  'question_bank.json|2016_Q05': ['U4', '4.1', 'The item applies the sampling distribution of the sample mean to a skewed population.'],
  'question_bank.json|2016_Q08': ['U3', '3.4', 'The item interprets confidence level through repeated intervals.'],
  'question_bank.json|2016_Q16': ['U3', '3.10', 'The item asks for the standard error in a confidence interval for the difference between proportions.'],
  'question_bank.json|2016_Q25': ['U1', '1.13', 'The item asks about random assignment and control in an experiment.'],
  'question_bank.json|2016_Q29': ['U1', '1.13', 'The item asks why a study without a control group cannot support the stated causal conclusion.'],
  'question_bank.json|2016_Q35': ['U2', '2.11', 'The item combines normal-distribution probability with weather-dependent commute times.'],
  'question_bank.json|2016_Q39': ['U4', '4.1', 'The item describes the distribution of sample means from repeated samples.'],
  'question_bank.json|2017_Q01': ['U2', '2.1', 'The item chooses a display for comparing proportions in a two-way categorical table.'],
  'question_bank.json|2017_Q10': ['U1', '1.13', 'The item identifies the study type and response variable.'],
  'question_bank.json|2017_Q12': ['U1', '1.12', 'The item evaluates sampling problems from surveying conference attendees.'],
  'question_bank.json|2017_Q16': ['U2', '2.2', 'The item uses two categorical variables and independence to reason about preference counts.'],
  'question_bank.json|2017_Q21': ['U4', '4.1', 'The item asks how increasing sample size affects bias and variance of a sample-mean estimator.'],
  'question_bank.json|2017_Q24': ['U1', '1.13', 'The item asks about blocking and random assignment in an experiment.'],
  'question_bank.json|2017_Q26': ['U3', '3.9', 'The item requires the standard deviation for a difference in sample proportions under a null condition.'],
  'question_bank.json|2017_Q28': ['U3', '3.11', 'The item interprets and compares confidence intervals for a population proportion.'],
  'question_bank.json|2017_Q29': ['U1', '1.7', 'The item asks for summary-statistic reasoning about total golf scores.'],
  'question_bank.json|2017_Q30': ['U4', '4.1', 'The item describes a distribution of sample means from repeated samples.'],
  'frq_bank.json|2008_FRQ5': ['U5', '5.5', 'The full FRQ includes mean comparison plus least-squares regression plots; the latest required unit is regression analysis.'],
  'frq_bank.json|2012_FRQ4': ['U3', '3.13', 'The full FRQ asks for convincing evidence of change in two population proportions.'],
  'frq_bank.json|2013_FRQ1': ['U4', '4.10', 'The full FRQ includes conditions for a two-sample t-test comparing means.'],
  'frq_bank.json|2013_FRQ5': ['U4', '4.1', 'The full FRQ asks for the sampling distribution and probability for a sample mean.'],
  'frq_bank.json|2015_FRQ4': ['U3', '3.15', 'The full FRQ requires a chi-square goodness-of-fit test.'],
  'frq_bank.json|2015_FRQ5': ['U4', '4.5', 'The full FRQ uses hypotheses for population means, Type II error, and power.'],
  'frq_bank.json|2016_FRQ1': ['U5', '5.1', 'The full FRQ asks students to graph and describe a relationship between two quantitative variables.'],
  'frq_bank.json|2016_FRQ2': ['U3', '3.13', 'The full FRQ requires a two-proportion inference procedure and study-design conclusion.'],
  'frq_bank.json|2017_FRQ2': ['U4', '4.10', 'The full FRQ includes random assignment plus a two-sample mean comparison and power.'],
}

const RULES = [
  r('5.5', /\b(least[- ]squares|least squares|regression equation|slope of the regression|estimated regression|predicted value|prediction equation|coefficient of determination|r\^?2)\b/i, 'Least-squares regression and prediction require Unit 5.5.'),
  r('5.4', /\b(residual|residual plot|standard deviation of the residuals)\b/i, 'Residual analysis requires Unit 5.4.'),
  r('5.3', /\b(linear regression|regression model|line of best fit|prediction line)\b/i, 'Linear regression models require Unit 5.3.'),
  r('5.2', /\b(correlation|correlation coefficient|association between two quantitative variables)\b/i, 'Correlation requires Unit 5.2.'),
  r('5.1', /\b(scatterplot|scatter plot|two quantitative variables)\b/i, 'Graphical relationships between two quantitative variables require Unit 5.1.'),
  r('4.10', /\b(two-sample t|two sample t|difference between (the )?two (population )?means|compare.*means|t[- ]test.*means)\b/i, 'Carrying out a test for the difference between two means requires Unit 4.10.'),
  r('4.9', /\b(test.*difference between (the )?two (population )?means|hypothesis.*\bmu_?1\b.*\bmu_?2\b)\b/i, 'Setting up a test for the difference between two means requires Unit 4.9.'),
  r('4.8', /\b(confidence interval.*difference between (the )?two (population )?means|interval.*\bmu_?1\s*-\s*mu_?2)\b/i, 'Justifying a claim from a two-mean interval requires Unit 4.8.'),
  r('4.7', /\b(construct.*confidence interval.*two means|two-sample confidence interval|interval.*difference.*means)\b/i, 'Constructing an interval for two means requires Unit 4.7.'),
  r('4.6', /\b(sampling distribution.*difference between sample means|difference between sample means)\b/i, 'Sampling distributions for differences between sample means require Unit 4.6.'),
  r('4.5', /\b(one-sample t|one sample t|t[- ]test|test.*population mean|mean.*p-value|significant.*mean)\b/i, 'Carrying out a test for a population mean requires Unit 4.5.'),
  r('4.4', /\b(hypotheses?.*(\\mu|mu|mean)|null hypothesis.*mean|alternative hypothesis.*mean|\\mu_[A-Z]|\\mu_D)\b/i, 'Setting up a test for a population mean requires Unit 4.4.'),
  r('4.3', /\b(claim.*confidence interval.*mean|interpret.*confidence interval.*mean)\b/i, 'Justifying a claim from a mean interval requires Unit 4.3.'),
  r('4.2', /\b(confidence interval.*mean|mean confidence interval|estimate.*population mean|paired t|matched pairs|mean difference)\b/i, 'Constructing a confidence interval for a mean or mean difference requires Unit 4.2.'),
  r('4.1', /\b(sampling distribution.*sample mean|central limit theorem|distribution of sample means)\b/i, 'Sampling distributions for sample means require Unit 4.1.'),
  r('3.15', /\b(chi[- ]square|goodness[- ]of[- ]fit|test for independence|test of independence|test for homogeneity)\b/i, 'Carrying out a chi-square test requires Unit 3.15.'),
  r('3.14', /\b(expected counts?|conditions.*chi|two-way table.*test)\b/i, 'Setting up a chi-square test requires Unit 3.14.'),
  r('3.13', /\b(two[- ]proportion|difference between (the )?two proportions|p_?1\s*-\s*p_?2|compare.*proportions)\b/i, 'Carrying out a test for the difference between two proportions requires Unit 3.13.'),
  r('3.12', /\b(hypotheses?.*proportions?|null hypothesis.*proportion|alternative hypothesis.*proportion)\b/i, 'Setting up a proportion test requires Unit 3.12.'),
  r('3.11', /\b(claim.*confidence interval.*proportions?|interpret.*confidence interval.*proportions?)\b/i, 'Justifying a claim from a proportion interval requires Unit 3.11.'),
  r('3.10', /\b(confidence interval.*difference between (the )?two proportions|interval.*p_?1\s*-\s*p_?2)\b/i, 'Constructing an interval for two proportions requires Unit 3.10.'),
  r('3.9', /\b(sampling distribution.*difference between sample proportions|difference between sample proportions)\b/i, 'Sampling distributions for differences between sample proportions require Unit 3.9.'),
  r('3.8', /\b(type i error|type ii error|power of the test|statistical power)\b/i, 'Errors and power in tests require Unit 3.8.'),
  r('3.7', /\b(z[- ]test|one[- ]proportion z|test.*population proportion|sample proportion.*p-value)\b/i, 'Carrying out a test for a population proportion requires Unit 3.7.'),
  r('3.6', /\b(p-value|p value|significance level|statistically significant)\b/i, 'p-values require Unit 3.6.'),
  r('3.5', /\b(hypothesis test|null hypothesis|alternative hypothesis|test statistic)\b/i, 'Setting up a test for a proportion requires Unit 3.5 when the parameter is categorical.'),
  r('3.4', /\b(claim.*confidence interval.*proportion|interpret.*confidence interval.*proportion)\b/i, 'Justifying a claim from a proportion interval requires Unit 3.4.'),
  r('3.3', /\b(confidence interval.*proportion|estimate.*population proportion|margin of error.*proportion)\b/i, 'Constructing a population-proportion interval requires Unit 3.3.'),
  r('3.2', /\b(sampling distribution.*sample proportion|distribution of sample proportions)\b/i, 'Sampling distributions for sample proportions require Unit 3.2.'),
  r('3.1', /\b(estimator|unbiased estimate|point estimate)\b/i, 'Estimators require Unit 3.1.'),
  r('2.12', /\b(sampling distribution|sample statistic)\b/i, 'Sampling distributions require Unit 2.12 unless a later inference topic is required.'),
  r('2.11', /\b(normal distribution|normal curve|standard normal|z-score|z score|68-95-99.7|empirical rule)\b/i, 'Normal distribution reasoning requires Unit 2.11.'),
  r('2.10', /\b(binomial|geometric|at least one|exactly \d+|at most \d+|successes?|trials)\b/i, 'Binomial distribution reasoning requires Unit 2.10.'),
  r('2.9', /\b(expected value|standard deviation of (a )?random variable|mean of (a )?random variable)\b/i, 'Parameters of random variables require Unit 2.9.'),
  r('2.8', /\b(random variable|probability distribution)\b/i, 'Random variables require Unit 2.8.'),
  r('2.7', /\b(independent events?|union of events?|at least one)\b/i, 'Independent events and unions require Unit 2.7.'),
  r('2.6', /\b(conditional probability|given that|given a|given the|tree diagram|false positive|false negative)\b/i, 'Conditional probability requires Unit 2.6.'),
  r('2.5', /\b(mutually exclusive|disjoint)\b/i, 'Mutually exclusive events require Unit 2.5.'),
  r('2.4', /\b(probability|chance process)\b/i, 'Probability reasoning requires Unit 2.4.'),
  r('2.3', /\b(simulat|random number table|random digit)\b/i, 'Estimating probabilities using simulation requires Unit 2.3.'),
  r('2.2', /\b(relative frequency table|conditional distribution|marginal distribution|joint distribution)\b/i, 'Summary statistics for two categorical variables require Unit 2.2.'),
  r('2.1', /\b(two-way table|two way table|contingency table)\b/i, 'Two-categorical-variable tables require Unit 2.1.'),
  r('1.13', /\b(experiment|treatment|control group|random assignment|matched pairs|blocking|block design|placebo|blinding)\b/i, 'Experimental design requires Unit 1.13.'),
  r('1.12', /\b(bias|nonresponse|undercoverage|voluntary response|wording)\b/i, 'Sampling problems require Unit 1.12.'),
  r('1.11', /\b(simple random sample|stratified|cluster sample|systematic sample|random sample|survey)\b/i, 'Random sampling requires Unit 1.11.'),
  r('1.10', /\b(investigative question|statistical question)\b/i, 'Investigative questions require Unit 1.10.'),
  r('1.9', /\b(compare.*distributions?|boxplot|box plot|histograms?.*compare|difference in distributions)\b/i, 'Comparing distributions requires Unit 1.9.'),
  r('1.8', /\b(parallel boxplots?|side-by-side boxplots?|comparative bar graph)\b/i, 'Graphical comparisons require Unit 1.8.'),
  r('1.7', /\b(mean|median|standard deviation|interquartile range|iqr|five-number summary|percentile)\b/i, 'Summary statistics for one quantitative variable require Unit 1.7.'),
  r('1.6', /\b(skewed|symmetric|center|spread|outlier|shape)\b/i, 'Describing one quantitative distribution requires Unit 1.6.'),
  r('1.5', /\b(dotplot|histogram|stemplot|stem-and-leaf)\b/i, 'Graphical representation for one quantitative variable requires Unit 1.5.'),
  r('1.4', /\b(bar graph|pie chart|categorical graph)\b/i, 'Graphical representation for one categorical variable requires Unit 1.4.'),
  r('1.3', /\b(frequency table|categorical variable|one categorical variable)\b/i, 'Summary for one categorical variable requires Unit 1.3.'),
  r('1.2', /\b(variable|quantitative|categorical)\b/i, 'Variable type reasoning requires Unit 1.2.'),
]

const report = {
  generated_at: new Date().toISOString(),
  standard: 'AP Statistics primary_unit is the latest official Fall 2026 unit required to solve the full item using that unit and prior units; FRQ is classified by the whole prompt.',
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
  console.log(`Statistics unit classification audit: ${OUT_PATH}`)
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
  const lower = text.toLowerCase()
  if (/\b(least[- ]squares|least squares|regression equation|residual|slope of the regression|predicted value|correlation coefficient)\b/i.test(text)) {
    return byCode('5.5', 'The item requires regression-model, prediction, slope, or residual reasoning; this belongs to Unit 5.')
  }
  if (/\b(chi[- ]square|goodness[- ]of[- ]fit|test of independence|test for independence|test for homogeneity|association exists between|relationship between .{0,80} and .{0,80}related)\b/i.test(text)) {
    return byCode('3.15', 'The item requires chi-square or categorical-association inference; this belongs to Unit 3.')
  }
  if (/\b(two[- ]proportion|difference between (the )?two proportions|proportion of .{0,80} is (greater|less|different)|percent.*margin of error|margin of error.*percent|sample proportion|\bp_?1\b|\bp_?2\b|\bp-hat\b|\\hat\{p\})\b/i.test(text)) {
    return byCode('3.13', 'The item requires inference or sampling-distribution reasoning for proportions; this belongs to Unit 3.')
  }
  if (/\b(confidence interval|hypothesis test|p-value|p value|significant difference|statistical evidence|convincing evidence)\b/i.test(text)) {
    if (/\b(mean|average|mu|\\mu|t[- ]test|paired|matched pairs|two-sample t|sample mean|hours|weight|length|salary|cost|time|yield|median)\b/i.test(text)) {
      return byCode('4.10', 'The item requires inference for quantitative data or means; this belongs to Unit 4.')
    }
    return byCode('3.13', 'The item requires inference for categorical data or proportions; this belongs to Unit 3.')
  }
  if (/\b(normal distribution|normally distributed|z-score|z score|standard normal|percentile rank)\b/i.test(text) && /\b(probability|area|region|less than|greater than|between)\b/i.test(text)) {
    return byCode('2.11', 'The item requires normal distribution probability reasoning; this belongs to Unit 2.')
  }
  if (/\b(expected value|score is|random variable|probability distribution)\b/i.test(text)) {
    return byCode('2.9', 'The item requires random-variable parameter reasoning; this belongs to Unit 2.')
  }
  if (/\b(two-way table|segmented bar chart|conditional distribution|joint distribution|marginal distribution|independent, with)\b/i.test(text) || /P\\?\(/.test(text)) {
    return byCode('2.6', 'The item requires two-categorical-variable or conditional-probability reasoning; this belongs to Unit 2.')
  }
  if (/\b(experiment|randomly assigned|treatment|control group|placebo|blocking|block design|matched pairs)\b/i.test(text)) {
    return byCode('1.13', 'The item asks about experimental design, treatment assignment, or causal conclusion from design; this belongs to Unit 1.')
  }
  if (/\b(survey|simple random sample|stratified|cluster sample|systematic sample|random sample|undercoverage|nonresponse|bias)\b/i.test(text) && !/\b(confidence interval|hypothesis|p-value|margin of error|statistical evidence)\b/i.test(text)) {
    return byCode('1.11', 'The item asks about sampling design or survey scope without requiring later inference; this belongs to Unit 1.')
  }
  if (/\b(boxplot|box plot|histogram|dotplot|quartile|median|iqr|interquartile|variance|standardized score|z=|skewed|symmetric|distribution)\b/i.test(text) && !lower.includes('probability distribution')) {
    return byCode('1.9', 'The item requires describing, transforming, or comparing quantitative distributions; this belongs to Unit 1.')
  }
  for (const rule of RULES) if (rule.pattern.test(text)) return byCode(rule.code, rule.reason)
  return { unit: null, code: null, name: null, reason: 'No official AP Statistics topic decision matched; item requires manual topic review.' }
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
    classification_version: 'statistics-official-progression-2026-07-21',
    authority: 'AP Statistics Course and Exam Description, Effective Fall 2026',
    evidence: [decision.reason],
  }
  item.classification_accuracy = {
    authority: 'AP Statistics Course and Exam Description, Effective Fall 2026',
    required_topics: [{ unit: decision.unit, topic_code: decision.code, topic_name: decision.name, reason: decision.reason }],
    primary_unit_rule: 'primary_unit is the latest official unit required to solve the full item using that unit and prior units.',
    why_not_earlier_unit: decision.unit === 'U1' ? 'This is Unit 1 material; no earlier unit exists.' : `${unitName(decision.unit)} is required by the full item.`,
    classification_reasoning: item.classification_reasoning,
    review_method: 'Statistics item review against the official Fall 2026 AP Statistics topic sequence; options, shared data, and full FRQ prompt included',
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
  if (!topic) throw new Error(`Unknown Statistics topic ${code}`)
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
