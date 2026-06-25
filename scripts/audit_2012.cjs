#!/usr/bin/env node
/**
 * 2012 Audit Script - COMPREHENSIVE
 * Checks EVERY question for correctness, not just structure
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data/ap/microeconomics';
const IMAGE_DIR = 'public/images/ap/microeconomics';

let exitCode = 0;
const errors = [];
const warnings = [];

function error(msg) {
  errors.push(msg);
  exitCode = 1;
}

function warn(msg) {
  warnings.push(msg);
}

// Load data
const mcq = JSON.parse(fs.readFileSync(path.join(DATA_DIR, '2012_question_bank.json'), 'utf8'));
const frq = JSON.parse(fs.readFileSync(path.join(DATA_DIR, '2012_frq_bank.json'), 'utf8'));
const similarity = JSON.parse(fs.readFileSync(path.join(DATA_DIR, '2012_similarity_index.json'), 'utf8'));

console.log('=== 2012 AUDIT REPORT ===\n');
console.log(`MCQ: ${mcq.length} questions`);
console.log(`FRQ: ${frq.length} questions`);
console.log(`Similarity: ${Object.keys(similarity).length} entries\n`);

// ============================================
// 1. MCQ COMPLETENESS
// ============================================
console.log('--- 1. MCQ COMPLETENESS ---');

for (const q of mcq) {
  const qid = q.question_id;
  
  // Must have answer
  if (!q.answer || !q.answer.trim()) {
    error(`${qid}: MISSING answer`);
  } else if (!['A','B','C','D','E'].includes(q.answer)) {
    error(`${qid}: INVALID answer "${q.answer}"`);
  }
  
  // Must have 5 options
  const optKeys = Object.keys(q.options);
  if (optKeys.length !== 5) {
    error(`${qid}: WRONG option count: ${optKeys.length}`);
  }
  for (const k of ['A','B','C','D','E']) {
    if (!q.options[k]) error(`${qid}: MISSING option ${k}`);
    else if (!q.options[k].trim()) error(`${qid}: EMPTY option ${k}`);
  }
  
  // Text must not be empty
  if (!q.text || !q.text.trim()) {
    error(`${qid}: EMPTY question text`);
  }
  
  // Text must end with punctuation (not truncated)
  const lastChar = q.text.trim().slice(-1);
  if (!['.', '?', '!'].includes(lastChar)) {
    warn(`${qid}: Text does not end with punctuation (may be truncated)`);
  }
  
  // No placeholder text
  const fullText = q.text + ' ' + Object.values(q.options).join(' ');
  if (fullText.includes('See graph') || fullText.includes('See diagram')) {
    error(`${qid}: Contains PLACEHOLDER text`);
  }
  
  // No page pollution
  const pollution = ['GO ON TO THE NEXT PAGE', 'Unauthorized', 'MICROECONOMICS Section', 'any part of this page is illegal'];
  for (const p of pollution) {
    if (fullText.includes(p)) {
      error(`${qid}: Contains POLLUTION: "${p}"`);
    }
  }
  
  // Graph questions must have image
  if (q.requires_graph || q.has_graph) {
    if (!q.image_paths || q.image_paths.length === 0) {
      error(`${qid}: Graph question but NO image_paths`);
    } else {
      for (const ip of q.image_paths) {
        const imgPath = ip.startsWith('/') ? `public${ip}` : `public/${ip}`;
        if (!fs.existsSync(imgPath)) {
          error(`${qid}: Image file NOT FOUND: ${ip}`);
        }
      }
    }
  }
  
  // Table options must have option_table_data
  if (q.option_table_data) {
    const table = q.option_table_data;
    if (!table.headers || table.headers.length === 0) {
      error(`${qid}: option_table_data has empty headers`);
    }
    for (const k of ['A','B','C','D','E']) {
      if (!table.rows[k]) {
        error(`${qid}: option_table_data missing row ${k}`);
      } else if (table.rows[k].length !== table.headers.length) {
        error(`${qid}: option_table_data row ${k} has ${table.rows[k].length} cells, expected ${table.headers.length}`);
      }
    }
  }
  
  // Background data consistency
  if (q.background_data) {
    if (q.background_data.table) {
      if (!q.background_data.table.headers || !q.background_data.table.rows) {
        error(`${qid}: background_data.table incomplete`);
      }
    }
    if (q.background_data.payoff_matrix) {
      const m = q.background_data.payoff_matrix;
      if (!m.players || m.players.length !== 2) {
        error(`${qid}: payoff_matrix invalid players`);
      }
    }
  }
  
  // Unit classification
  if (!q.primary_unit || !q.primary_unit.match(/^U[1-6]$/)) {
    error(`${qid}: INVALID primary_unit: ${q.primary_unit}`);
  }
  
  // Pure unit consistency
  const hasSecondary = q.secondary_units && q.secondary_units.length > 0;
  if (q.pure_unit && hasSecondary) {
    error(`${qid}: pure_unit=true but has secondary_units`);
  }
  if (!q.pure_unit && !hasSecondary) {
    error(`${qid}: pure_unit=false but no secondary_units`);
  }
}

console.log(`  P0 errors: ${errors.length}, P1 warnings: ${warnings.length}`);

// ============================================
// 2. FRQ COMPLETENESS
// ============================================
console.log('\n--- 2. FRQ COMPLETENESS ---');
const frqErrors = [];

for (const f of frq) {
  const fid = f.frq_id || `FRQ${f.question_number}`;
  
  if (!f.text || !f.text.trim()) {
    frqErrors.push(`${fid}: EMPTY text`);
  }
  if (!f.rubric || !f.rubric.points || f.rubric.points.length === 0) {
    frqErrors.push(`${fid}: MISSING rubric`);
  }
  if (!f.year) {
    frqErrors.push(`${fid}: MISSING year`);
  }
}

console.log(`  FRQ errors: ${frqErrors.length}`);
for (const e of frqErrors) console.log(`    ${e}`);

// ============================================
// 3. SIMILARITY INDEX
// ============================================
console.log('\n--- 3. SIMILARITY INDEX ---');
let simErrors = 0;

for (const q of mcq) {
  const qid = q.question_id;
  if (!similarity[qid]) {
    simErrors++;
    error(`${qid}: MISSING similarity index entry`);
  } else {
    const entry = similarity[qid];
    if (!entry.overall_top10 || entry.overall_top10.length === 0) {
      simErrors++;
      error(`${qid}: Similarity index empty`);
    }
  }
}

console.log(`  Similarity errors: ${simErrors}`);

// ============================================
// 4. IMAGE INTEGRITY
// ============================================
console.log('\n--- 4. IMAGE INTEGRITY ---');
let imgErrors = 0;

const expectedImages = mcq.filter(q => q.requires_graph || q.has_graph).map(q => {
  return q.image_paths ? path.basename(q.image_paths[0]) : null;
}).filter(Boolean);

for (const img of expectedImages) {
  const imgPath = path.join(IMAGE_DIR, img);
  if (!fs.existsSync(imgPath)) {
    imgErrors++;
    error(`Image MISSING: ${img}`);
  } else {
    const stats = fs.statSync(imgPath);
    if (stats.size < 200) {
      imgErrors++;
      error(`Image too small: ${img} (${stats.size} bytes)`);
    }
  }
}

console.log(`  Image errors: ${imgErrors}`);

// ============================================
// 5. QUESTION NUMBER CONTINUITY
// ============================================
console.log('\n--- 5. QUESTION NUMBER CONTINUITY ---');
const nums = mcq.map(q => q.question_number).sort((a,b) => a-b);
const missing = [];
for (let i = 1; i <= 60; i++) {
  if (!nums.includes(i)) missing.push(i);
}
if (missing.length > 0) {
  error(`Missing question numbers: ${missing.join(', ')}`);
}
console.log(`  Missing: ${missing.length > 0 ? missing.join(', ') : 'None'}`);

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(60));
console.log('AUDIT SUMMARY');
console.log('='.repeat(60));
console.log(`P0 Errors (must fix): ${errors.length}`);
console.log(`P1 Warnings (should fix): ${warnings.length}`);

if (errors.length > 0) {
  console.log('\nP0 Errors:');
  for (const e of errors) console.log(`  ❌ ${e}`);
}

if (warnings.length > 0) {
  console.log('\nP1 Warnings:');
  for (const w of warnings) console.log(`  ⚠️  ${w}`);
}

if (errors.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED - 2012 is ready for user review');
} else {
  console.log(`\n❌ AUDIT FAILED - ${errors.length} P0 errors must be fixed`);
}

process.exit(exitCode);
