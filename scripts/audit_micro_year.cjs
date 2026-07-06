#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const year = Number(process.argv[2]);
if (!Number.isInteger(year)) {
  console.error('Usage: node scripts/audit_micro_year.cjs <year>');
  process.exit(2);
}

const WEB_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');
const SUBJECT_DIR = path.join(REPO_ROOT, 'subjects', 'AP', 'Microeconomics');
const DATA_DIR = path.join(SUBJECT_DIR, '02-data', String(year));
const SOURCE_PDF = path.join(SUBJECT_DIR, '01-exams', `AP Micro ${year}.pdf`);

const errors = [];
const warnings = [];
const notes = [];

function error(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }
function note(msg) { notes.push(msg); }

function readJson(name, required = true) {
  const fullPath = path.join(DATA_DIR, name);
  if (!fs.existsSync(fullPath)) {
    if (required) error(`Missing production data file: ${name}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    error(`Invalid JSON in ${name}: ${err.message}`);
    return null;
  }
}

function relImageExists(relPath, qid) {
  if (!relPath || typeof relPath !== 'string') {
    error(`${qid}: invalid image path`);
    return false;
  }
  if (path.isAbsolute(relPath) || relPath.startsWith('/')) {
    error(`${qid}: image path must be relative, got "${relPath}"`);
    return false;
  }
  const fullPath = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    error(`${qid}: image not found: ${relPath}`);
    return false;
  }
  const stats = fs.statSync(fullPath);
  if (stats.size < 1024) {
    error(`${qid}: image too small: ${relPath} (${stats.size} bytes)`);
    return false;
  }
  return true;
}

function validateText(q, type) {
  const qid = q.question_id || `${type}${q.question_number || '?'}`;
  if (!q.text || !String(q.text).trim()) {
    error(`${qid}: empty ${type} text`);
    return;
  }
  const combined = [
    q.text,
    q.options ? Object.values(q.options).join(' ') : '',
    q.rubric ? JSON.stringify(q.rubric) : ''
  ].join(' ');
  const pollutionPatterns = [
    /GO ON TO THE NEXT PAGE/i,
    /Unauthorized copying/i,
    /any part of this page is illegal/i,
    /THIS PAGE MAY BE USED FOR TAKING NOTES/i,
    /STOP\s*END OF EXAM/i,
    /Question \d+ is reprinted/i,
    /The figure shows a graph/i
  ];
  for (const pattern of pollutionPatterns) {
    if (pattern.test(combined)) error(`${qid}: contains PDF boilerplate/pollution: ${pattern}`);
  }
  if (combined.includes('\uFFFD')) error(`${qid}: contains replacement character U+FFFD`);
  const mojibakeChars = ['\u9239', '\u6a67', '\u7eee'];
  if (mojibakeChars.some(ch => combined.includes(ch))) warn(`: possible mojibake remains`);
}

function validateOptionTable(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!q.option_table_data) return;
  const { headers, rows } = q.option_table_data;
  if (!Array.isArray(headers) || headers.length === 0) {
    error(`${qid}: option_table_data.headers missing or empty`);
    return;
  }
  if (!rows || typeof rows !== 'object' || Array.isArray(rows)) {
    error(`${qid}: option_table_data.rows must be an object keyed by A-E`);
    return;
  }
  for (const key of ['A', 'B', 'C', 'D', 'E']) {
    if (!Array.isArray(rows[key])) {
      error(`${qid}: option_table_data missing row ${key}`);
    } else if (rows[key].length !== headers.length) {
      error(`${qid}: option_table_data row ${key} has ${rows[key].length} cells, expected ${headers.length}`);
    }
  }
}

function validateClassification(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!/^U[1-6]$/.test(q.primary_unit || '')) error(`${qid}: invalid or missing primary_unit`);
  if (!Array.isArray(q.topics) || q.topics.length === 0) warn(`${qid}: topics missing`);
  if (!Array.isArray(q.skills) || q.skills.length === 0) warn(`${qid}: skills missing`);
  if (!q.classification || q.classification.review_status !== 'reviewed') {
    warn(`${qid}: evidence-based classification not reviewed`);
  }
}

function validateImages(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  const imagePaths = Array.isArray(q.image_paths) ? q.image_paths : [];
  for (const img of imagePaths) relImageExists(img, qid);
  const rubricImagePaths = Array.isArray(q.rubric_image_paths) ? q.rubric_image_paths : [];
  for (const img of rubricImagePaths) relImageExists(img, qid);
  if ((q.has_graph || q.requires_graph) && imagePaths.length === 0) {
    error(`${qid}: graph-dependent question has no image_paths`);
  }
}

function validateMcq(mcq) {
  if (!Array.isArray(mcq)) {
    error('question_bank.json must be an array');
    return;
  }
  if (mcq.length !== 60) error(`Expected 60 MCQ, found ${mcq.length}`);
  const seen = new Set();
  const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let notScoredCount = 0;
  for (const q of mcq) {
    const qid = q.question_id || `Q${q.question_number}`;
    if (!q.question_id) error(`MCQ ${q.question_number}: missing question_id`);
    if (seen.has(qid)) error(`Duplicate MCQ question_id: ${qid}`);
    seen.add(qid);
    if (!Number.isInteger(q.question_number) || q.question_number < 1 || q.question_number > 60) {
      error(`${qid}: invalid question_number`);
    }
    if (q.scoring_status === 'not_scored') {
      notScoredCount += 1;
      error(`${qid}: not_scored items must be excluded before publishing`);
      continue;
    }
    validateText(q, 'MCQ');
    if (!q.options || typeof q.options !== 'object' || Array.isArray(q.options)) {
      error(`${qid}: options must be an object`);
    } else {
      for (const key of ['A', 'B', 'C', 'D', 'E']) {
        if (!q.options[key] || !String(q.options[key]).trim()) error(`${qid}: missing/empty option ${key}`);
      }
      if (Object.keys(q.options).length !== 5) error(`${qid}: expected 5 options`);
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(q.answer)) {
      error(`${qid}: invalid answer "${q.answer}"`);
    } else {
      answerCounts[q.answer] += 1;
    }
    validateOptionTable(q);
    validateImages(q);
    validateClassification(q);
  }
  note(`MCQ count: ${mcq.length}`);
  note(`Answer distribution: ${JSON.stringify(answerCounts)}`);
  if (notScoredCount) note(`Not-scored MCQ items: ${notScoredCount}`);
}

function validateFrq(frq) {
  if (!Array.isArray(frq)) {
    error('frq_bank.json must be an array');
    return;
  }
  if (frq.length !== 3) error(`Expected 3 FRQ, found ${frq.length}`);
  const seen = new Set();
  for (const q of frq) {
    const qid = q.question_id || `FRQ${q.question_number}`;
    if (!q.question_id) error(`FRQ ${q.question_number}: missing question_id`);
    if (seen.has(qid)) error(`Duplicate FRQ question_id: ${qid}`);
    seen.add(qid);
    if (!Number.isInteger(q.question_number) || q.question_number < 1 || q.question_number > 3) {
      error(`${qid}: invalid FRQ question_number`);
    }
    validateText(q, 'FRQ');
    validateImages(q);
    validateClassification(q);
    if (!q.rubric || !Array.isArray(q.rubric.points) || q.rubric.points.length === 0) {
      error(`${qid}: missing rubric.points`);
    }
    if (!q.source_pages || !Array.isArray(q.source_pages.prompt) || !Array.isArray(q.source_pages.scoring_guidelines)) {
      warn(`${qid}: source_pages prompt/scoring_guidelines incomplete`);
    }
  }
  note(`FRQ count: ${frq.length}`);
}

function validateGraphMetadata(graphMetadata) {
  if (!graphMetadata) return;
  if (!Array.isArray(graphMetadata.graphs)) {
    error('graph_metadata.graphs must be an array');
    return;
  }
  for (const graph of graphMetadata.graphs) {
    if (!graph.path) error(`graph_metadata entry missing path: ${graph.filename || 'unknown'}`);
    else relImageExists(graph.path, `graph_metadata:${graph.filename || graph.path}`);
    if (!Array.isArray(graph.questions) || graph.questions.length === 0) {
      warn(`graph_metadata entry has no questions: ${graph.filename || graph.path}`);
    }
  }
  if (graphMetadata.total_graphs !== graphMetadata.graphs.length) {
    warn(`graph_metadata total_graphs=${graphMetadata.total_graphs} but graphs.length=${graphMetadata.graphs.length}`);
  }
}

if (!fs.existsSync(DATA_DIR)) error(`Data directory missing: ${DATA_DIR}`);
if (!fs.existsSync(SOURCE_PDF)) warn(`Expected source PDF missing at standard path: ${SOURCE_PDF}`);

const mcq = readJson('question_bank.json');
const frq = readJson('frq_bank.json');
const graphMetadata = readJson('graph_metadata.json', false);
const manifest = readJson('source_manifest.json', false);
const similarity = readJson('similarity_index.json', false);

const manifestSourcePdf = manifest && typeof manifest.source_pdf === 'string'
  ? path.join(REPO_ROOT, manifest.source_pdf)
  : null;
const sourcePdfForReport = manifestSourcePdf || SOURCE_PDF;

if (mcq) validateMcq(mcq);
if (frq) validateFrq(frq);
if (graphMetadata) validateGraphMetadata(graphMetadata);
if (manifest && /not_frq_complete|not_started/.test(manifest.status || '')) {
  warn(`source_manifest status is "${manifest.status}"`);
}
if (!similarity) warn('similarity_index.json missing');

const report = {
  subject: 'AP Microeconomics',
  year,
  audited_at: new Date().toISOString(),
  data_dir: path.relative(REPO_ROOT, DATA_DIR).replace(/\\/g, '/'),
  source_pdf: path.relative(REPO_ROOT, sourcePdfForReport).replace(/\\/g, '/'),
  status: errors.length === 0 ? 'passed_with_warnings_or_clean' : 'failed',
  p0_error_count: errors.length,
  warning_count: warnings.length,
  notes,
  errors,
  warnings
};

fs.writeFileSync(path.join(DATA_DIR, 'audit_report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`=== AP Microeconomics ${year} Production Audit ===`);
console.log(`Data directory: ${DATA_DIR}`);
console.log(`P0 errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
if (errors.length) {
  console.log('\nP0 errors:');
  for (const msg of errors) console.log(`  - ${msg}`);
}
if (warnings.length) {
  console.log('\nWarnings:');
  for (const msg of warnings) console.log(`  - ${msg}`);
}
console.log(`\nWrote ${path.join(DATA_DIR, 'audit_report.json')}`);
process.exit(errors.length ? 1 : 0);
