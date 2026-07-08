// POST /api/generate-questions
// -----------------------------------------------------------------------------
// Generates adaptive multiple-choice quiz questions with Claude, grounded in the
// resource's in-portal learning material. Returns one MCQ per requested
// difficulty level so the client can prefetch both "if correct" / "if wrong"
// branches in a single call.
//
// Body: {
//   resourceName: string,
//   categoryLabel: string,
//   material: { definition, summary, concepts:[{title,body}], bestPractices:[], keyTakeaways:[] },
//   difficulties: number[]  // each 1..5
//   avoid: string[]         // already-asked prompts, so Claude doesn't repeat
// }
// Response: { questions: [ { difficulty, prompt, options:[4], correctIndex, explanation } ] }
//
// Env: ANTHROPIC_API_KEY (required), QUIZ_MODEL (optional; default claude-haiku-4-5).

import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-haiku-4-5';

const DIFFICULTY_RUBRIC = `Difficulty levels (1 easiest, 5 hardest):
1 — Recall: a definition or a plainly stated fact from the material.
2 — Comprehension: restating or recognizing a concept in different words.
3 — Application: choosing what to do in a concrete, realistic scenario.
4 — Analysis: distinguishing between similar options, spotting an edge case or a subtle mistake.
5 — Synthesis / judgment: weighing trade-offs, combining multiple concepts, expert-level reasoning.`;

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          difficulty: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer', enum: [0, 1, 2, 3] },
          explanation: { type: 'string' },
        },
        required: ['difficulty', 'prompt', 'options', 'correctIndex', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function buildSystem() {
  return [
    'You are an assessment author. You write multiple-choice quiz questions that test a learner ONLY on the learning material provided.',
    'Rules:',
    '- Every question must be answerable purely from the provided material — never require outside knowledge.',
    '- Exactly ONE option is correct; the other three are plausible but clearly wrong to someone who studied the material.',
    '- Each question has exactly 4 options.',
    '- Do not reference "the material" or "the text" in the question wording; ask about the subject directly.',
    '- Do not repeat or lightly reword any question in the provided avoid-list.',
    '',
    DIFFICULTY_RUBRIC,
  ].join('\n');
}

function buildUserContent({ resourceName, categoryLabel, material, difficulties, avoid }) {
  const concepts = (material?.concepts || []).map((c) => `- ${c.title}: ${c.body}`).join('\n');
  const bps = (material?.bestPractices || []).map((b) => `- ${b}`).join('\n');
  const takeaways = (material?.keyTakeaways || []).map((k) => `- ${k}`).join('\n');
  const avoidList = (avoid || []).length ? (avoid || []).map((a) => `- ${a}`).join('\n') : '(none yet)';
  return [
    `Subject: ${resourceName} (category: ${categoryLabel})`,
    '',
    `Definition: ${material?.definition || ''}`,
    material?.summary ? `\nSummary: ${material.summary}` : '',
    concepts ? `\nConcepts:\n${concepts}` : '',
    bps ? `\nBest practices:\n${bps}` : '',
    takeaways ? `\nKey takeaways:\n${takeaways}` : '',
    '',
    `Write one multiple-choice question for EACH of these difficulty levels, in this order: ${JSON.stringify(difficulties)}.`,
    'Return each question with its difficulty level, the question prompt, exactly 4 options, the 0-based index of the correct option, and a one-sentence explanation.',
    '',
    'Do NOT reuse any of these already-asked questions:',
    avoidList,
  ].filter(Boolean).join('\n');
}

function validateQuestion(q) {
  return q
    && typeof q.prompt === 'string' && q.prompt.trim().length > 0
    && Array.isArray(q.options) && q.options.length === 4
    && q.options.every((o) => typeof o === 'string' && o.trim().length > 0)
    && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3
    && Number.isInteger(q.difficulty);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: set ANTHROPIC_API_KEY.' });
  }

  try {
    const { resourceName, categoryLabel = 'General', material, difficulties, avoid } = await readJson(req);
    if (!resourceName || !Array.isArray(difficulties) || difficulties.length === 0) {
      return res.status(400).json({ error: 'resourceName and a non-empty difficulties[] are required' });
    }
    const wanted = difficulties.filter((d) => Number.isInteger(d) && d >= 1 && d <= 5).slice(0, 5);
    if (!wanted.length) return res.status(400).json({ error: 'difficulties must be integers 1..5' });

    const client = new Anthropic();
    const response = await client.messages.create({
      model: process.env.QUIZ_MODEL || DEFAULT_MODEL,
      max_tokens: 2048,
      system: buildSystem(),
      messages: [{ role: 'user', content: buildUserContent({ resourceName, categoryLabel, material, difficulties: wanted, avoid }) }],
      output_config: { format: { type: 'json_schema', schema: QUESTION_SCHEMA } },
    });

    const text = response.content.find((b) => b.type === 'text')?.text || '{}';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { questions: [] }; }
    const questions = (parsed.questions || []).filter(validateQuestion).map((q) => ({
      difficulty: q.difficulty,
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
      explanation: (q.explanation || '').trim(),
    }));

    return res.status(200).json({ questions });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Generation failed' });
  }
}
