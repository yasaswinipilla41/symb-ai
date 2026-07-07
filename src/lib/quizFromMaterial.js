// Material-driven quiz generator.
//
// Builds a 10-question, all-MCQ assessment whose every correct answer comes
// straight from the resource's Learning Material (see materials.js). Distractors
// are plausible but wrong: real descriptions of OTHER tools, unused concept
// topics, and explicit "anti-practices". Questions are concept-, practice- and
// scenario-based and deterministic (seeded), so a student who studied the
// material can pass, and scores are comparable across attempts.
//
// Passing score is 70% (see PASS_PERCENT).

import { allResources, categoryList, categoryMeta } from './catalog';
import { getMaterial } from './materials';

export const PASS_PERCENT = 70;

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

const ANTI_PRACTICES = [
  'Commit API keys directly into the repository.',
  'Deploy straight to production without any testing.',
  'Skip the official documentation entirely.',
  'Share a single admin login with the whole team.',
  'Adopt it everywhere at once with no pilot.',
  'Disable all monitoring and logging.',
];

// A pool of concept topics from OTHER domains, used as wrong options for the
// "which concept is covered" questions.
const FOREIGN_CONCEPTS = [
  'Choosing a brand color palette',
  'Booking meeting rooms',
  'Designing a company logo',
  'Writing marketing copy',
  'Managing payroll schedules',
  'Planning a seating chart',
];

export function generateQuizFromMaterial(resourceName) {
  const material = getMaterial(resourceName);
  if (!material) return null;

  const rand = mulberry32(hashString(`quizmat:${resourceName}`));
  const name = material.resourceName;
  const catLabel = material.categoryLabel;
  const facts = material.quizFacts;

  const otherResources = allResources().filter((r) => r.name !== name);
  const otherDescriptions = otherResources.filter((r) => r.description).map((r) => r.description);
  const otherCatLabels = categoryList().map((c) => c.label).filter((l) => l !== catLabel);

  const questions = [];
  let order = 0;
  const add = (prompt, options, correctText) => {
    const opts = shuffle(options, rand);
    questions.push({
      id: `${name}-m${order}`,
      sort_order: order,
      type: 'mcq',
      marks: 1,
      prompt,
      options: opts,
      correct: opts.indexOf(correctText),
    });
    order += 1;
  };

  // 1. Definition
  add(
    `According to the learning material, which statement best describes ${name}?`,
    [facts.definition, ...pickN(otherDescriptions, 3, rand)],
    facts.definition
  );

  // 2. Category
  add(
    `Which category does ${name} belong to?`,
    [catLabel, ...pickN(otherCatLabels, 3, rand)],
    catLabel
  );

  // 3–6. Concept coverage (concept-based)
  const conceptTitles = facts.concepts.map((c) => c.title);
  const chosenConcepts = pickN(conceptTitles, Math.min(4, conceptTitles.length), rand);
  for (const title of chosenConcepts) {
    add(
      `Which of the following is a core concept covered in the ${name} learning material?`,
      [title, ...pickN(FOREIGN_CONCEPTS, 3, rand)],
      title
    );
  }

  // 7–8. Best practices (practical)
  const chosenBP = pickN(facts.bestPractices, 2, rand);
  for (const bp of chosenBP) {
    add(
      `When adopting ${name}, which of these is a recommended best practice?`,
      [bp, ...pickN(ANTI_PRACTICES, 3, rand)],
      bp
    );
  }

  // 9. Scenario — first step
  {
    const correct = 'Run a small proof-of-concept and define clear success criteria.';
    add(
      `Your team wants to adopt ${name} on a live project. What is the most sensible FIRST step?`,
      [correct,
        'Roll it out to every team immediately.',
        'Delete your existing tools first.',
        'Skip planning and deploy to production.'],
      correct
    );
  }

  // 10. Key takeaway
  {
    const correct = facts.keyTakeaways[0];
    add(
      `Which statement best reflects a key takeaway about ${name}?`,
      [correct,
        `${name} should be chosen purely by how popular it is on social media.`,
        `${name} removes the need for any planning or testing.`,
        `${name} guarantees zero bugs automatically.`],
      correct
    );
  }

  // --- 5 True/False Questions (1 mark each) ---
  const addTF = (prompt, answer) => {
    questions.push({
      id: `${name}-tf${order}`,
      sort_order: order,
      type: 'truefalse',
      marks: 1,
      prompt,
      options: ['True', 'False'],
      correct: answer,
    });
    order += 1;
  };

  const tfStatements = shuffle([
    { text: `One of the recommended best practices for adopting ${name} is to ${facts.bestPractices[0].toLowerCase()}`, answer: true },
    { text: `${name} is defined as: "${facts.definition.slice(0, 80)}..."`, answer: true },
    { text: `A core concept covered in the ${name} material is "${facts.concepts[0]?.title || catLabel}".`, answer: true },
    { text: `When adopting ${name}, it is highly recommended to ${ANTI_PRACTICES[Math.floor(rand() * ANTI_PRACTICES.length)].toLowerCase()}`, answer: false },
    { text: `A core concept of ${name} is "${FOREIGN_CONCEPTS[Math.floor(rand() * FOREIGN_CONCEPTS.length)]}".`, answer: false }
  ], rand);

  for (const s of tfStatements) {
    addTF(s.text, s.answer);
  }

  // --- 5 Open-Ended Questions (2 marks each) ---
  const addOpen = (prompt) => {
    questions.push({
      id: `${name}-open${order}`,
      sort_order: order,
      type: 'open',
      marks: 2,
      prompt,
      options: [],
      correct: null,
    });
    order += 1;
  };

  const openTemplates = [
    `Explain in your own words how ${name} provides value to an engineering team.`,
    `Describe a scenario where choosing ${name} might NOT be the best option.`,
    `If you had to teach a junior developer how to start using ${name}, what would you tell them?`,
    `How does ${name} compare to other tools in the ${catLabel} category?`,
    `What is the biggest challenge or learning curve associated with adopting ${name}?`,
  ];

  for (const prompt of openTemplates) {
    addOpen(prompt);
  }

  const maxScore = questions.reduce((s, q) => s + q.marks, 0);
  const objectiveMax = questions.filter(q => q.type !== 'open').reduce((s, q) => s + q.marks, 0);

  return {
    resourceName: name,
    category: material.category,
    questions,
    maxScore,
    objectiveMax,
    passPercent: PASS_PERCENT,
  };
}
