// Deterministic quiz generator.
//
// Every AI tool needs a 20-question quiz (10 MCQ, 5 true/false, 5 open-ended)
// but hand-authoring ~3,800 questions is not realistic. Instead we generate a
// meaningful, STABLE quiz per resource from the catalog metadata: MCQ
// distractors are drawn from other resources/categories, so answers are
// plausible. The same resource always yields the same quiz (seeded PRNG, no
// Math.random) so scores are comparable across attempts and users.
//
// Admins can override/extend any quiz later via the quiz_questions table; a
// curated question there takes precedence over the generated one.

import { allResources, categoryList, categoryMeta } from './catalog';

// --- seeded PRNG (mulberry32) so quizzes are deterministic ----------------
function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n, rand) {
  return shuffle(arr, rand).slice(0, n);
}

const OPEN_TEMPLATES = [
  (r) => `In your own words, describe what ${r.name} is and what problem it solves.`,
  (r) => `Give one concrete scenario in your work where you would choose ${r.name}. Explain why.`,
  (r) => `Name one strength and one limitation of ${r.name}.`,
  (r) => `How does ${r.name} fit into a typical ${categoryMeta[r.category]?.label || 'development'} workflow?`,
  (r) => `What would you check or evaluate before adopting ${r.name} on a project?`,
];

export function generateQuiz(resource) {
  const all = allResources();
  const cats = categoryList();
  const rand = mulberry32(hashString(resource.name));

  const catLabel = categoryMeta[resource.category]?.label || resource.category;
  const others = all.filter((r) => r.name !== resource.name);
  const otherDescriptions = others.filter((r) => r.description);

  const questions = [];
  let order = 0;
  const add = (q) => { questions.push({ id: `${resource.name}-${order}`, sort_order: order, ...q }); order += 1; };

  // ---- 10 MCQ (1 mark each) ----
  // 1. Category question
  {
    const wrongCats = pickN(cats.filter((c) => c.label !== catLabel).map((c) => c.label), 3, rand);
    const opts = shuffle([catLabel, ...wrongCats], rand);
    add({ type: 'mcq', marks: 1, prompt: `Which category does ${resource.name} primarily belong to?`,
      options: opts, correct: opts.indexOf(catLabel) });
  }
  // 2. Description-match question
  {
    const wrong = pickN(otherDescriptions.map((r) => r.description), 3, rand);
    const opts = shuffle([resource.description, ...wrong], rand);
    add({ type: 'mcq', marks: 1, prompt: `Which description best matches ${resource.name}?`,
      options: opts, correct: opts.indexOf(resource.description) });
  }
  // 3. Official site / identity question
  {
    const wrongNames = pickN(others.map((r) => r.name), 3, rand);
    const opts = shuffle([resource.name, ...wrongNames], rand);
    add({ type: 'mcq', marks: 1, prompt: `Which of these tools is described as: “${truncate(resource.description, 90)}”?`,
      options: opts, correct: opts.indexOf(resource.name) });
  }
  // 4-6. "Which tool belongs to category X" style, using distractors from other categories
  const sameCat = others.filter((r) => r.category === resource.category);
  for (let k = 0; k < 3; k += 1) {
    const target = sameCat.length ? sameCat[Math.floor(rand() * sameCat.length)] : resource;
    const otherCatItems = pickN(others.filter((r) => r.category !== resource.category).map((r) => r.name), 3, rand);
    const opts = shuffle([target.name, ...otherCatItems], rand);
    add({ type: 'mcq', marks: 1, prompt: `Which of the following is categorized under “${catLabel}” (like ${resource.name})?`,
      options: opts, correct: opts.indexOf(target.name) });
  }
  // 7-10. Generic conceptual MCQs about the category
  const conceptPool = conceptQuestions(catLabel, resource.name);
  for (const c of pickN(conceptPool, Math.max(0, 10 - questions.length), rand)) {
    const opts = shuffle(c.options, rand);
    add({ type: 'mcq', marks: 1, prompt: c.prompt, options: opts, correct: opts.indexOf(c.answer) });
  }
  // Ensure exactly 10 MCQs (pad if concept pool was short)
  while (questions.filter((q) => q.type === 'mcq').length < 10) {
    const wrongNames = pickN(others.map((r) => r.name), 3, rand);
    const opts = shuffle([resource.name, ...wrongNames], rand);
    add({ type: 'mcq', marks: 1, prompt: `Which tool are you being assessed on in this quiz?`,
      options: opts, correct: opts.indexOf(resource.name) });
  }

  // ---- 5 True/False (1 mark each) ----
  const tfStatements = [
    { text: `${resource.name} is categorized under “${catLabel}”.`, answer: true },
    { text: `${resource.name} has the description: “${truncate(resource.description, 70)}”.`, answer: true },
    { text: `${resource.name} belongs to the “${pickWrongCat(catLabel, cats, rand)}” category.`, answer: false },
    { text: `${resource.name} is ${(resource.badges || []).includes('NEW') ? '' : 'not '}marked as a NEW resource.`, answer: true },
    { text: `${resource.name} is the same tool as ${randomOtherName(others, rand)}.`, answer: false },
  ];
  for (const s of tfStatements) {
    add({ type: 'truefalse', marks: 1, prompt: s.text, options: ['True', 'False'], correct: s.answer });
  }

  // ---- 5 Open-ended (2 marks each) ----
  for (const tpl of OPEN_TEMPLATES) {
    add({ type: 'open', marks: 2, prompt: tpl(resource), options: [], correct: null });
  }

  return {
    resourceName: resource.name,
    category: resource.category,
    questions,
    maxScore: questions.reduce((s, q) => s + q.marks, 0), // 25
    objectiveMax: questions.filter((q) => q.type !== 'open').reduce((s, q) => s + q.marks, 0), // 15
  };
}

function truncate(str = '', n) {
  return str.length > n ? `${str.slice(0, n)}…` : str;
}
function pickWrongCat(correct, cats, rand) {
  const wrong = cats.filter((c) => c.label !== correct);
  return wrong[Math.floor(rand() * wrong.length)]?.label || 'Other';
}
function randomOtherName(others, rand) {
  return others[Math.floor(rand() * others.length)]?.name || 'another tool';
}

// A small bank of category-flavored conceptual MCQs.
function conceptQuestions(catLabel, name) {
  return [
    {
      prompt: `When evaluating a tool like ${name}, which factor is generally MOST important for long-term adoption?`,
      answer: 'Fit with your existing workflow and maintainability',
      options: ['Fit with your existing workflow and maintainability', 'Its logo color', 'The number of GitHub stars only', 'Whether it trended once on social media'],
    },
    {
      prompt: `What is a sensible first step before rolling out ${name} across a team?`,
      answer: 'Run a small pilot / proof-of-concept',
      options: ['Run a small pilot / proof-of-concept', 'Deploy directly to production', 'Remove all existing tools first', 'Skip documentation entirely'],
    },
    {
      prompt: `“${catLabel}” tools are primarily used to…`,
      answer: `support ${catLabel.toLowerCase()} tasks in a development or business workflow`,
      options: [`support ${catLabel.toLowerCase()} tasks in a development or business workflow`, 'replace the need for any planning', 'guarantee zero bugs automatically', 'make code run without a computer'],
    },
    {
      prompt: `Which practice best keeps your use of ${name} secure?`,
      answer: 'Keep credentials in environment variables / secrets, not in code',
      options: ['Keep credentials in environment variables / secrets, not in code', 'Commit API keys to the repo', 'Share one admin login with everyone', 'Disable all updates'],
    },
    {
      prompt: `A good way to learn ${name} efficiently is to…`,
      answer: 'read the official docs and try a small hands-on example',
      options: ['read the official docs and try a small hands-on example', 'avoid the documentation', 'only watch unrelated videos', 'guess without testing'],
    },
    {
      prompt: `Before comparing ${name} to alternatives, you should first…`,
      answer: 'define your requirements and success criteria',
      options: ['define your requirements and success criteria', 'pick the one with the shortest name', 'choose randomly', 'ignore your actual needs'],
    },
  ];
}
