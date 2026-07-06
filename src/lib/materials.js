// Learning Materials generator.
//
// Hand-authoring a full PDF + PPT for every resource in the catalog is not
// feasible, so — exactly like the quiz generator — we synthesize a STABLE,
// intermediate-level study document per resource from its catalog metadata
// (name, category, description, tags). The same resource always produces the
// same material (seeded PRNG, no Math.random), so the derived quiz is stable
// and comparable across attempts.
//
// The returned object is the single source of truth for BOTH the in-portal PDF
// (long-form document) and the PPT (slides) views, and it also exposes
// `quizFacts` so the quiz is generated ONLY from this material — no question
// can reference anything the student didn't study here.

import { allResources, categoryMeta } from './catalog';

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

// Concept scaffolding keyed by category "family" — gives each document a
// domain-appropriate spine of topics. Falls back to a generic software spine.
const CONCEPT_SPINE = {
  default: [
    'Core purpose and where it fits',
    'Key building blocks and terminology',
    'How a typical workflow looks end-to-end',
    'Integrating it with your existing stack',
    'Performance, cost and scaling considerations',
    'Security and access management',
  ],
  ai: [
    'What the tool automates and why it matters',
    'Prompts, context and model configuration',
    'Grounding outputs in your own data',
    'Evaluating quality and handling failure modes',
    'Guardrails, safety and responsible use',
    'Putting it into a real workflow',
  ],
  infra: [
    'The problem it solves in your architecture',
    'Provisioning and configuration basics',
    'Networking, reliability and failover',
    'Observability: logs, metrics and alerts',
    'Cost control and right-sizing',
    'Security, secrets and least privilege',
  ],
  frontend: [
    'The mental model and core primitives',
    'Composition and reusable structure',
    'State, data flow and side effects',
    'Styling, accessibility and responsiveness',
    'Performance and bundle considerations',
    'Testing and shipping to production',
  ],
};

function spineFor(category) {
  if (/ai|agent|mcp|llm/i.test(category)) return CONCEPT_SPINE.ai;
  if (/infra|hosting|backend|aws|azure|iac|cicd|source|scraping|payment|erp/i.test(category)) return CONCEPT_SPINE.infra;
  if (/web-framework|mobile|design|animation|color|icon|frontend/i.test(category)) return CONCEPT_SPINE.frontend;
  return CONCEPT_SPINE.default;
}

function conceptBody(topic, name, catLabel) {
  const map = {
    'Core purpose and where it fits': `${name} exists to remove repetitive, error-prone work in the ${catLabel.toLowerCase()} space. Understanding the exact problem it targets keeps you from over- or under-using it: reach for it when its strengths match your task, and pair it with complementary tools when they don't.`,
    'What the tool automates and why it matters': `${name} automates parts of the ${catLabel.toLowerCase()} workflow that are slow or repetitive by hand. The value is not "magic" — it is consistency and speed. Knowing precisely which step it accelerates lets you measure the time it actually saves.`,
    'The problem it solves in your architecture': `${name} addresses a specific gap in a ${catLabel.toLowerCase()} architecture. Placing it correctly — and knowing what it is NOT responsible for — is what prevents brittle, tangled systems later.`,
    'The mental model and core primitives': `Everything in ${name} builds on a small set of primitives. Once you can name them and describe how they combine, the rest of the API becomes predictable rather than something to memorize.`,
  };
  return map[topic] ||
    `${topic}: in the context of ${name}, this is a concept you should be able to explain in one or two sentences and recognize in a real scenario. It connects directly to how ${name} is used day to day in a ${catLabel.toLowerCase()} workflow.`;
}

const BEST_PRACTICES = (name) => [
  `Start with a small proof-of-concept before rolling ${name} out across a team.`,
  `Keep credentials and API keys in environment variables or a secrets manager — never commit them.`,
  `Read the official ${name} documentation and pin the version you depend on.`,
  `Add monitoring/logging so you can see how ${name} behaves in production, not just locally.`,
  `Define success criteria up front so you can tell whether ${name} is actually helping.`,
  `Document your setup so a teammate can reproduce it without tribal knowledge.`,
];

export function generateMaterial(resource) {
  const rand = mulberry32(hashString(`mat:${resource.name}`));
  const catLabel = categoryMeta[resource.category]?.label || resource.category || 'Software';
  const desc = (resource.description || `${resource.name} is a ${catLabel.toLowerCase()} tool.`).trim();
  const tags = resource.tags || [];

  const objectives = [
    `Explain what ${resource.name} is and the problem it solves.`,
    `Describe where ${resource.name} fits inside a ${catLabel.toLowerCase()} workflow.`,
    `Identify the core concepts and terminology used with ${resource.name}.`,
    `Apply ${resource.name} to a realistic, hands-on scenario.`,
    `Recognize the best practices and common pitfalls when adopting ${resource.name}.`,
  ];

  const spine = spineFor(resource.category);
  const concepts = spine.map((topic) => ({ title: topic, body: conceptBody(topic, resource.name, catLabel) }));

  const examples = [
    {
      title: `Getting started with ${resource.name}`,
      body: `A first, minimal use of ${resource.name}: set it up, run the smallest possible task end-to-end, and confirm the output. This "hello world" proves your environment works before you build anything real.`,
    },
    {
      title: `A realistic scenario`,
      body: `Imagine your team needs to deliver a ${catLabel.toLowerCase()} outcome under a deadline. Using ${resource.name}, you would scope the task, configure it to match your requirements, integrate it with the tools you already use, and validate the result against your success criteria.`,
    },
  ];

  const diagram = {
    title: `${resource.name} — typical workflow`,
    steps: ['Define the requirement', `Configure ${resource.name}`, 'Integrate with your stack', 'Run & validate output', 'Monitor & iterate'],
  };

  const bestPractices = shuffle(BEST_PRACTICES(resource.name), rand).slice(0, 5);

  const keyTakeaways = [
    `${resource.name} is best understood by the specific problem it solves, not by hype.`,
    `It belongs to the “${catLabel}” category and is chosen when that category's needs dominate.`,
    `A small pilot and clear success criteria are the safest way to adopt it.`,
    `Security basics — secrets management and least privilege — always apply.`,
  ];

  const summary = `In this module you learned what ${resource.name} is, the problem it solves within ${catLabel}, its core concepts, a practical scenario, and the best practices for adopting it responsibly. You are now ready to take the assessment, which is drawn entirely from this material.`;

  // Slides for the PPT view (derived from the same content).
  const slides = [
    { title: resource.name, bullets: [`${catLabel} · Learning Material`, desc] },
    { title: 'Learning Objectives', bullets: objectives },
    ...concepts.map((c) => ({ title: c.title, bullets: [c.body] })),
    { title: 'Practical Example', bullets: [examples[1].title, examples[1].body] },
    { title: diagram.title, bullets: diagram.steps.map((s, i) => `${i + 1}. ${s}`) },
    { title: 'Best Practices', bullets: bestPractices },
    { title: 'Key Takeaways', bullets: keyTakeaways },
    { title: 'Summary', bullets: [summary] },
  ];

  // Facts the quiz may draw from — ONLY these, so the quiz stays in-material.
  const quizFacts = {
    definition: desc,
    categoryLabel: catLabel,
    concepts,
    bestPractices,
    objectives,
    keyTakeaways,
  };

  return {
    resourceName: resource.name,
    category: resource.category,
    categoryLabel: catLabel,
    intro: `${resource.name} is ${desc.charAt(0).toLowerCase() + desc.slice(1)} This module gives you an intermediate, practical understanding of ${resource.name}: what it is, when to use it, how it works, and how to adopt it well.${tags.length ? ` Key themes: ${tags.slice(0, 5).join(', ')}.` : ''}`,
    objectives,
    concepts,
    examples,
    diagram,
    bestPractices,
    keyTakeaways,
    summary,
    slides,
    quizFacts,
  };
}

// Cheap in-memory cache so repeated views/quizzes don't regenerate.
const _cache = new Map();
export function getMaterial(resourceName) {
  if (_cache.has(resourceName)) return _cache.get(resourceName);
  const resource = allResources().find((r) => r.name === resourceName);
  if (!resource) return null;
  const mat = generateMaterial(resource);
  _cache.set(resourceName, mat);
  return mat;
}

// Drop cached materials so the next getMaterial() regenerates from the current
// catalog. Call this whenever a resource is added/edited/removed by an admin,
// otherwise an edited tool would keep serving its stale (pre-edit) material and
// quiz. Pass a name to clear one entry, or omit to clear everything.
export function clearMaterialCache(resourceName) {
  if (resourceName) _cache.delete(resourceName);
  else _cache.clear();
}

// ---------------------------------------------------------------------------
// Admin document overrides.
//
// The document view is generated, but admins may edit and save it. Edits are
// persisted (as rich-text HTML) in localStorage, keyed by resource name, and
// layered on top of the generated document at render time. Clearing an
// override restores the original generated content.
// ---------------------------------------------------------------------------
const DOC_OVERRIDE_KEY = 'material-doc-overrides';

function readDocOverrides() {
  try {
    return JSON.parse(localStorage.getItem(DOC_OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getMaterialDocOverride(resourceName) {
  return readDocOverrides()[resourceName] || null;
}

export function saveMaterialDocOverride(resourceName, html) {
  const all = readDocOverrides();
  all[resourceName] = html;
  localStorage.setItem(DOC_OVERRIDE_KEY, JSON.stringify(all));
}

export function clearMaterialDocOverride(resourceName) {
  const all = readDocOverrides();
  delete all[resourceName];
  localStorage.setItem(DOC_OVERRIDE_KEY, JSON.stringify(all));
}
