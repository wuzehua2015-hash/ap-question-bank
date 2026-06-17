// 题库数据加载工具
let mcqCache = null;
let frqCache = null;

const BASE_URL = import.meta.env.BASE_URL || '/';

export async function loadMCQBank() {
  if (mcqCache) return mcqCache;
  const res = await fetch(`${BASE_URL}data/macro_question_bank_v4.json`);
  if (!res.ok) throw new Error(`Failed to load MCQ bank: ${res.status}`);
  mcqCache = await res.json();
  return mcqCache;
}

export async function loadFRQBank() {
  if (frqCache) return frqCache;
  const res = await fetch(`${BASE_URL}data/macro_frq_bank.json`);
  if (!res.ok) throw new Error(`Failed to load FRQ bank: ${res.status}`);
  frqCache = await res.json();
  return frqCache;
}

// 按单元过滤
export function filterByUnit(questions, unit) {
  if (unit === 'all') return questions;
  return questions.filter(q => q.primary_unit === unit || q.secondary_units?.includes(unit));
}

// 按难度过滤
export function filterByDifficulty(questions, difficulty) {
  if (difficulty === 'all') return questions;
  return questions.filter(q => q.difficulty === difficulty);
}

// 按技能过滤
export function filterBySkills(questions, skills) {
  if (!skills || skills.length === 0) return questions;
  return questions.filter(q => 
    skills.some(s => q.skills?.includes(s))
  );
}

// 按话题过滤
export function filterByTopics(questions, topics) {
  if (!topics || topics.length === 0) return questions;
  return questions.filter(q => 
    topics.some(t => q.topics?.includes(t))
  );
}

// 纯单元题过滤
export function filterPureUnit(questions, pure) {
  if (pure === null || pure === undefined) return questions;
  return questions.filter(q => q.pure_unit === pure);
}

// 生成随机Quiz
export function generateQuiz(questions, config) {
  let pool = [...questions];
  
  if (config.unit) pool = filterByUnit(pool, config.unit);
  if (config.difficulty) pool = filterByDifficulty(pool, config.difficulty);
  if (config.skills?.length) pool = filterBySkills(pool, config.skills);
  if (config.topics?.length) pool = filterByTopics(pool, config.topics);
  if (config.pureUnit !== null && config.pureUnit !== undefined) pool = filterPureUnit(pool, config.pureUnit);
  
  // 排除已做过的题（从localStorage读取）
  const doneIds = new Set(JSON.parse(localStorage.getItem('doneQuestions') || '[]'));
  if (config.excludeDone) {
    pool = pool.filter(q => !doneIds.has(q.question_id));
  }
  
  // 去重：同一来源的题目最多2题
  if (config.diverseSources) {
    const sourceCount = {};
    pool = pool.filter(q => {
      const src = q.source || 'unknown';
      sourceCount[src] = (sourceCount[src] || 0) + 1;
      return sourceCount[src] <= 2;
    });
  }
  
  // 随机排序并取指定数量
  pool = pool.sort(() => Math.random() - 0.5);
  const count = Math.min(config.count || 10, pool.length);
  return pool.slice(0, count);
}

// 所有可用单元
export const UNITS = [
  { id: 'U1', name: 'U1: Basic Economic Concepts', topics: ['scarcity', 'opportunity cost', 'PPC', 'comparative advantage', 'terms of trade'] },
  { id: 'U2', name: 'U2: Economic Indicators & Business Cycle', topics: ['GDP', 'inflation', 'unemployment', 'CPI', 'business cycle', 'real vs nominal'] },
  { id: 'U3', name: 'U3: National Income & Price Determination', topics: ['AD-AS', 'fiscal policy', 'multiplier', 'crowding out', 'SRAS', 'LRAS'] },
  { id: 'U4', name: 'U4: Financial Sector', topics: ['money market', 'loanable funds', 'central bank', 'monetary policy', 'bank balance sheet', 'money multiplier'] },
  { id: 'U5', name: 'U5: Long-Run Consequences of Stabilization Policies', topics: ['Phillips curve', 'debt', 'growth', 'supply-side', 'classical vs Keynesian'] },
  { id: 'U6', name: 'U6: Open Economy', topics: ['exchange rates', 'balance of payments', 'net exports', 'capital flows', 'foreign exchange'] }
];

// 所有可用技能
export const SKILLS = [
  'identify', 'calculate', 'explain', 'draw_graph', 'analyze', 'compare', 'predict', 'state'
];

// 难度选项
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
