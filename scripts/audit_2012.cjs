#!/usr/bin/env node
/**
 * AP Microeconomics 2012 production-data audit.
 *
 * This audits the canonical working data under subjects/, not dist/ or public/.
 * public/ is only a publish target after this production data passes review.
 */

const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');
const SUBJECT_DIR = path.join(REPO_ROOT, 'subjects', 'AP', 'Microeconomics');
const DATA_DIR = path.join(SUBJECT_DIR, '02-data', '2012');
const SOURCE_PDF = path.join(SUBJECT_DIR, '01-exams', 'AP Micro 2012.pdf');

const errors = [];
const warnings = [];
let exitCode = 0;

function error(msg) {
  errors.push(msg);
  exitCode = 1;
}

function warn(msg) {
  warnings.push(msg);
}

function readJson(name) {
  const fullPath = path.join(DATA_DIR, name);
  if (!fs.existsSync(fullPath)) {
    error(`Missing production data file: ${fullPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    error(`Invalid JSON in ${fullPath}: ${err.message}`);
    return null;
  }
}

function imageExists(relPath, qid) {
  if (!relPath) return false;
  if (path.isAbsolute(relPath) || relPath.startsWith('/')) {
    error(`${qid}: production image path must be relative to 02-data/2012, got "${relPath}"`);
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

function validateOptionTable(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!q.option_table_data) return;
  const table = q.option_table_data;
  if (!Array.isArray(table.headers) || table.headers.length === 0) {
    error(`${qid}: option_table_data.headers missing or empty`);
  }
  if (!table.rows || typeof table.rows !== 'object' || Array.isArray(table.rows)) {
    error(`${qid}: option_table_data.rows must be an object keyed by A-E`);
    return;
  }
  for (const key of ['A', 'B', 'C', 'D', 'E']) {
    if (!Array.isArray(table.rows[key])) {
      error(`${qid}: option_table_data missing row ${key}`);
    } else if (table.headers && table.rows[key].length !== table.headers.length) {
      error(`${qid}: option_table_data row ${key} has ${table.rows[key].length} cells, expected ${table.headers.length}`);
    }
  }
}

function validateBackgroundData(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!q.background_data) return;
  const bg = q.background_data;
  if (bg.table) {
    if (!Array.isArray(bg.table.headers) || !Array.isArray(bg.table.rows)) {
      error(`${qid}: background_data.table must include headers and rows arrays`);
    }
  }
  if (bg.payoff_matrix) {
    const m = bg.payoff_matrix;
    if (!Array.isArray(m.players) || m.players.length !== 2) {
      error(`${qid}: payoff_matrix.players must contain two players`);
    }
    const hasMatrix = Array.isArray(m.matrix);
    const hasObjectPayoffs = m.payoffs && typeof m.payoffs === 'object';
    if (!hasMatrix && !hasObjectPayoffs) {
      error(`${qid}: payoff_matrix must include matrix or payoffs`);
    }
  }
}

function validateImagePaths(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!Array.isArray(q.image_paths)) return;
  for (const img of q.image_paths) imageExists(img, qid);
}

function validateSharedImageGroups(questions) {
  const expected = [
    { ids: ['2012_Q18', '2012_Q19'], image: 'images/2012_Q18_Q19.png' },
    { ids: ['2012_Q59', '2012_Q60'], image: 'images/2012_Q59_Q60.png' }
  ];
  const byId = new Map(questions.map(q => [q.question_id, q]));
  for (const group of expected) {
    for (const id of group.ids) {
      const q = byId.get(id);
      if (!q) {
        error(`Shared image group missing question: ${id}`);
        continue;
      }
      if (!Array.isArray(q.image_paths) || !q.image_paths.includes(group.image)) {
        error(`${id}: expected shared image association ${group.image}`);
      }
    }
  }
}

function validateClassification(q) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (q.primary_unit && !/^U[1-6]$/.test(q.primary_unit)) {
    error(`${qid}: invalid primary_unit "${q.primary_unit}"`);
  }
  if (!q.primary_unit) {
    warn(`${qid}: classification pending (primary_unit empty)`);
  }
  if (!q.classification || q.classification.review_status !== 'reviewed') {
    warn(`${qid}: evidence-based classification not reviewed`);
  }
}

function validateQuestionText(q, type) {
  const qid = q.question_id || `Q${q.question_number}`;
  if (!q.text || !q.text.trim()) {
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
    /Question \d+ is reprinted/i
  ];
  for (const pattern of pollutionPatterns) {
    if (pattern.test(combined)) {
      error(`${qid}: contains PDF boilerplate/pollution: ${pattern}`);
    }
  }
  if (combined.includes('\uFFFD')) {
    error(`${qid}: contains replacement character U+FFFD`);
  }
}

console.log('=== AP Microeconomics 2012 Production Audit ===\n');
console.log(`Data directory: ${DATA_DIR}`);

if (!fs.existsSync(SOURCE_PDF)) {
  error(`Source PDF missing: ${SOURCE_PDF}`);
} else {
  console.log(`Source PDF: ${SOURCE_PDF}`);
}

const mcq = readJson('question_bank.json');
const frq = readJson('frq_bank.json');
const manifest = readJson('source_manifest.json');
readJson('graph_metadata.json');

if (manifest && manifest.status !== 'production_candidate_not_published') {
  warn(`source_manifest status is "${manifest.status}"`);
}

console.log('\n--- 1. MCQ ---');
if (Array.isArray(mcq)) {
  if (mcq.length !== 60) error(`Expected 60 MCQ, found ${mcq.length}`);
  const seen = new Set();
  const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const q of mcq) {
    const qid = q.question_id || `Q${q.question_number}`;
    if (!q.question_id) error(`MCQ ${q.question_number}: missing question_id`);
    if (seen.has(qid)) error(`Duplicate MCQ question_id: ${qid}`);
    seen.add(qid);
    if (!Number.isInteger(q.question_number) || q.question_number < 1 || q.question_number > 60) {
      error(`${qid}: invalid question_number ${q.question_number}`);
    }
    validateQuestionText(q, 'MCQ');
    if (!q.options || typeof q.options !== 'object' || Array.isArray(q.options)) {
      error(`${qid}: options must be an object`);
    } else {
      for (const key of ['A', 'B', 'C', 'D', 'E']) {
        if (!q.options[key] || !String(q.options[key]).trim()) {
          error(`${qid}: missing/empty option ${key}`);
        }
      }
      if (Object.keys(q.options).length !== 5) {
        error(`${qid}: expected 5 options, found ${Object.keys(q.options).length}`);
      }
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(q.answer)) {
      error(`${qid}: invalid answer "${q.answer}"`);
    } else {
      answerCounts[q.answer] += 1;
    }
    validateImagePaths(q);
    if (q.has_graph || q.requires_graph) {
      if (!Array.isArray(q.image_paths) || q.image_paths.length === 0) {
        error(`${qid}: graph question has no image_paths`);
      }
    }
    validateOptionTable(q);
    validateBackgroundData(q);
    validateClassification(q);
  }
  validateSharedImageGroups(mcq);
  console.log(`MCQ count: ${mcq.length}`);
  console.log(`Answer distribution: ${JSON.stringify(answerCounts)}`);
} else {
  error('question_bank.json must be an array');
}

console.log('\n--- 2. FRQ ---');
if (Array.isArray(frq)) {
  if (frq.length !== 3) error(`Expected 3 FRQ, found ${frq.length}`);
  const seen = new Set();
  for (const q of frq) {
    const qid = q.question_id || `FRQ${q.question_number}`;
    if (!q.question_id) error(`FRQ ${q.question_number}: missing question_id`);
    if (seen.has(qid)) error(`Duplicate FRQ question_id: ${qid}`);
    seen.add(qid);
    if (!Number.isInteger(q.question_number) || q.question_number < 1 || q.question_number > 3) {
      error(`${qid}: invalid question_number ${q.question_number}`);
    }
    validateQuestionText(q, 'FRQ');
    if (!q.rubric || !Array.isArray(q.rubric.points) || q.rubric.points.length === 0) {
      error(`${qid}: missing rubric.points`);
    }
    validateImagePaths(q);
    if (q.has_graph) {
      if (!Array.isArray(q.image_paths) || q.image_paths.length === 0) {
        warn(`${qid}: marked has_graph but image_paths pending`);
      }
    }
    validateBackgroundData(q);
    validateClassification(q);
  }
  console.log(`FRQ count: ${frq.length}`);
} else {
  error('frq_bank.json must be an array');
}

console.log('\n--- 3. Summary ---');
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

if (errors.length === 0) {
  console.log('\nNo P0 errors. Production candidate is structurally ready for classification/source review.');
} else {
  console.log('\nAudit failed. Fix P0 errors before publishing to Web public data.');
}

process.exit(exitCode);
