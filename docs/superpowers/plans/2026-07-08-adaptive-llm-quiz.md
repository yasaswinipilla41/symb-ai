# Adaptive LLM-Generated Quizzes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deterministic templated quiz with Claude-generated multiple-choice questions whose difficulty adapts to the student's running performance, buffered so the student rarely waits, with the existing templated quiz as an automatic fallback.

**Architecture:** A new Vercel serverless function (`api/generate-questions.js`) holds the `ANTHROPIC_API_KEY` and calls Claude **Haiku 4.5** to produce MCQs grounded in the resource's learning material, returning validated structured JSON. A framework-agnostic client engine (`src/lib/adaptiveQuiz.js`) runs a single-floor-drop difficulty state machine and prefetches the ≤2 possible next-difficulty questions. A new `AdaptiveQuizRunner.jsx` drives the flow and reuses the existing attempt-persistence + certificate path; `QuizRunner.jsx` probes adaptivity and falls back to its current templated flow when the endpoint is unavailable.

**Tech stack:** React 18, Vite 5, Vercel serverless (Node, ESM), `@anthropic-ai/sdk`, Claude Haiku 4.5 (`claude-haiku-4-5`).

**Testing note:** This repo has **no test framework** and `npm run lint` is broken (no eslint config). Verification is `npm run build`, Node smoke tests of the endpoint's pure helpers, and manual browser checks. Do not add a test framework.

**Claude SDK facts (verified against the claude-api skill — do not deviate):**
- Model id: `claude-haiku-4-5`. Haiku 4.5 **supports structured outputs** but **does NOT support the `effort` parameter** (it 400s) — do not pass `output_config.effort` or `thinking`.
- Structured output: `output_config: { format: { type: 'json_schema', schema } }` on `client.messages.create(...)`. The first response content block is text containing valid JSON — `JSON.parse` it.
- JSON-schema limits: every object needs `additionalProperties: false` + `required`; `enum` is supported; array length / string length constraints are **not** — enforce "exactly 4 options" with server-side validation, not schema.
- `new Anthropic()` reads `ANTHROPIC_API_KEY` from the environment; do not hardcode a key. If it's unset the constructor/first call throws → the client falls back to the templated quiz.

**Conventions:** ESM (`"type": "module"`). Follow `AGENTS.md` (no Next.js patterns). Commit as the logged-in user; **no Claude credits / Co-Authored-By**. Run all commands from `/Users/dinokage/dev/symb-ai`.

---

## File Structure

**Create:**
- `api/generate-questions.js` — serverless endpoint: Claude call + prompt/rubric + schema validation.
- `src/lib/adaptiveQuiz.js` — difficulty state machine, buffered `AdaptiveEngine`, `/api` fetch, all pure/isomorphic.
- `src/lib/quizSubmit.js` — shared attempt-persistence + certificate helper used by both runners (DRY).
- `src/features/dashboard/pages/AdaptiveQuizRunner.jsx` — adaptive quiz UI.

**Modify:**
- `package.json` — add `@anthropic-ai/sdk` dependency.
- `src/features/dashboard/pages/QuizRunner.jsx` — probe adaptivity → render `AdaptiveQuizRunner` or fall through to the existing templated flow; route its submit through `quizSubmit.js`.
- `.env` doc comment — document `ANTHROPIC_API_KEY` and optional `QUIZ_MODEL`.

**Unchanged/reused:** `materials.js` (`getMaterial` → `quizFacts`), `certificateId`/`PASS_PERCENT`, `quizAttempts.insert`, `issueCertificate`, `QuizResult.jsx`, templated `getQuizForResource`/`gradeQuiz`.

---

## Task 1: Add the Anthropic SDK dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the SDK**

Run: `cd /Users/dinokage/dev/symb-ai && npm install @anthropic-ai/sdk`
Expected: `package.json` `dependencies` gains `"@anthropic-ai/sdk"` and `package-lock.json` updates. (macOS npm may also rewrite unrelated `libc` fields in the lockfile — that's fine, keep the lockfile change scoped to this install.)

- [ ] **Step 2: Verify it imports in Node ESM**

Run: `cd /Users/dinokage/dev/symb-ai && node -e 'import("@anthropic-ai/sdk").then(m => console.log("ok", typeof m.default))'`
Expected: `ok function`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk for adaptive quiz generation"
```

---

## Task 2: Serverless endpoint `api/generate-questions.js`

**Files:**
- Create: `api/generate-questions.js`

- [ ] **Step 1: Create the file**

```javascript
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
```

- [ ] **Step 2: Verify the module + validation logic in Node (no API call)**

Run:
```bash
cd /Users/dinokage/dev/symb-ai && node -e '
import("./api/generate-questions.js").then(() => console.log("module ok")).catch(e => { console.error(e); process.exit(1); });
'
```
Expected: `module ok` (the handler is not invoked; this only proves the file parses and imports the SDK).

- [ ] **Step 3: Commit**

```bash
git add api/generate-questions.js
git commit -m "feat: /api/generate-questions generates grounded adaptive MCQs with Claude"
```

---

## Task 3: Client engine `src/lib/adaptiveQuiz.js`

**Files:**
- Create: `src/lib/adaptiveQuiz.js`

- [ ] **Step 1: Create the file**

```javascript
// Adaptive quiz engine — difficulty state machine + buffered question fetching.
// Pure/isomorphic (no React). The difficulty rule is "single floor drop":
//   correct  -> level + 1 (cap 5), reset the wrong-counter
//   wrong    -> hold; on the 2nd wrong (and only if we haven't dropped yet)
//               drop one level, then lock the floor so it never drops again.
// Questions are generated server-side (/api/generate-questions) grounded in the
// resource's learning material. If generation is unavailable, the caller falls
// back to the templated quiz.

import { getMaterial } from './materials';

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const QUESTION_COUNT = 10;

export function initialState() {
  return { level: 1, wrongCount: 0, floorLocked: false };
}

// Advance the state machine given the correctness of the just-answered question.
export function applyAnswer(state, wasCorrect) {
  const s = { ...state };
  if (wasCorrect) {
    s.level = Math.min(MAX_LEVEL, s.level + 1);
    s.wrongCount = 0;
  } else {
    s.wrongCount += 1;
    if (s.wrongCount >= 2 && !s.floorLocked) {
      s.level = Math.max(MIN_LEVEL, s.level - 1);
      s.floorLocked = true;
      s.wrongCount = 0;
    }
  }
  return s;
}

// The ≤2 possible difficulties for the NEXT question, before the current one is
// answered. Derived from the state machine so the logic lives in one place.
export function nextDifficulties(state) {
  return {
    ifCorrect: applyAnswer(state, true).level,
    ifWrong: applyAnswer(state, false).level,
  };
}

// POST to the serverless generator. Throws on any failure (→ fallback).
export async function fetchQuestions(resourceName, categoryLabel, material, difficulties, avoid) {
  const res = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceName, categoryLabel, material, difficulties, avoid }),
  });
  if (!res.ok) throw new Error(`generate-questions ${res.status}`);
  const body = await res.json().catch(() => ({}));
  if (!Array.isArray(body.questions)) throw new Error('bad response');
  return body.questions;
}

// Buffered, adaptive question source for a single attempt.
export class AdaptiveEngine {
  constructor(resourceName) {
    this.resourceName = resourceName;
    const mat = getMaterial(resourceName);
    this.ok = Boolean(mat);
    this.categoryLabel = mat?.categoryLabel || 'General';
    this.material = mat
      ? {
        definition: mat.quizFacts?.definition || mat.intro || '',
        summary: mat.summary || '',
        concepts: mat.quizFacts?.concepts || [],
        bestPractices: mat.quizFacts?.bestPractices || [],
        keyTakeaways: mat.quizFacts?.keyTakeaways || [],
      }
      : null;
    this.state = initialState();
    this.asked = [];          // prompts already shown (avoid-list)
    this.buffer = new Map();  // difficulty -> Promise<question|null>
  }

  _fetchOne(difficulty) {
    return fetchQuestions(this.resourceName, this.categoryLabel, this.material, [difficulty], this.asked)
      .then((qs) => qs[0] || null)
      .catch(() => null);
  }

  _ensure(difficulty) {
    if (!this.buffer.has(difficulty)) this.buffer.set(difficulty, this._fetchOne(difficulty));
    return this.buffer.get(difficulty);
  }

  _prefetchNext() {
    const { ifCorrect, ifWrong } = nextDifficulties(this.state);
    this._ensure(ifCorrect);
    this._ensure(ifWrong);
  }

  _take(difficulty) {
    const p = this._ensure(difficulty);
    this.buffer.delete(difficulty); // consumed — a later same-difficulty fetch will be fresh
    return p;
  }

  // First question at the starting level. Returns null on failure (→ fallback).
  async start() {
    const q = await this._take(this.state.level);
    if (!q) return null;
    this.asked.push(q.prompt);
    this._prefetchNext();
    return { ...q, difficulty: this.state.level };
  }

  // Next question after the user answers the current one. null on failure.
  async next(wasCorrect) {
    this.state = applyAnswer(this.state, wasCorrect);
    const q = await this._take(this.state.level);
    if (!q) return null;
    this.asked.push(q.prompt);
    this._prefetchNext();
    return { ...q, difficulty: this.state.level };
  }
}
```

- [ ] **Step 2: Verify the state machine in Node**

The engine imports `./materials` (browser-oriented) so import it in isolation is heavy; instead verify the pure state-machine logic by copying the transition rules into a throwaway check:

Run:
```bash
cd /Users/dinokage/dev/symb-ai && node -e '
// Re-derive the single-floor-drop rule and assert the key transitions.
function apply(s, ok){ s={...s}; if(ok){s.level=Math.min(5,s.level+1);s.wrongCount=0;} else {s.wrongCount+=1; if(s.wrongCount>=2&&!s.floorLocked){s.level=Math.max(1,s.level-1);s.floorLocked=true;s.wrongCount=0;}} return s; }
let s={level:3,wrongCount:0,floorLocked:false};
s=apply(s,true);  console.assert(s.level===4, "correct raises");
s=apply(s,false); console.assert(s.level===4 && s.wrongCount===1, "1 wrong holds");
s=apply(s,false); console.assert(s.level===3 && s.floorLocked, "2 wrong drops once + locks");
s=apply(s,false); s=apply(s,false); console.assert(s.level===3, "locked floor never drops again");
s=apply(s,true);  console.assert(s.level===4, "still rises after lock");
console.log("state machine ok");
'
```
Expected: `state machine ok` with no assertion errors. (This mirrors `applyAnswer` exactly — keep them in sync.)

- [ ] **Step 3: Verify the app still builds with the new module**

Run: `cd /Users/dinokage/dev/symb-ai && npm run build`
Expected: success (the module is imported by Task 5; building now confirms it parses).

- [ ] **Step 4: Commit**

```bash
git add src/lib/adaptiveQuiz.js
git commit -m "feat: adaptive quiz engine (single-floor-drop difficulty + buffered fetch)"
```

---

## Task 4: Shared submit helper `src/lib/quizSubmit.js`

**Files:**
- Create: `src/lib/quizSubmit.js`

Both the templated runner and the adaptive runner persist an attempt identically (insert row, auto-issue single cert, best-effort email, log history). Extract it so the two paths cannot diverge.

- [ ] **Step 1: Create the file**

```javascript
// Persist a completed quiz attempt and auto-issue its certificate.
// Shared by the templated QuizRunner and the AdaptiveQuizRunner so both produce
// identical rows, cert behavior, and history entries.

import { quizAttempts, history } from './backend';
import { certificateId, PASS_PERCENT } from './certificates';
import { issueCertificate } from './certificateApi';

// `graded` must carry: resource_name, score, max_score, percentage,
// correct_count, wrong_count, time_taken_s, answers. Returns the graded object
// augmented with id / cert fields (best-effort — never throws to the caller).
export async function submitQuizAttempt(user, graded) {
  if (!user) return graded;

  const passed = graded.percentage >= PASS_PERCENT;
  const certId = passed ? certificateId(user.id, graded.resource_name) : null;

  const { data, error } = await quizAttempts.insert({
    user_id: user.id,
    resource_name: graded.resource_name,
    score: graded.score,
    max_score: graded.max_score,
    percentage: graded.percentage,
    correct_count: graded.correct_count,
    wrong_count: graded.wrong_count,
    time_taken_s: graded.time_taken_s,
    status: 'completed',
    answers: graded.answers,
    // Single course certificates are auto-issued on pass (no admin approval).
    // A DB trigger enforces the same server-side; setting it here keeps the
    // localStorage mock identical.
    cert_status: passed ? 'approved' : 'none',
    cert_id: certId,
  });
  if (error) {
    window.alert('Failed to save quiz attempt: ' + (error.message || JSON.stringify(error)));
  }
  if (data) {
    graded.id = data.id;
    graded.user_id = user.id;
    graded.cert_id = data.cert_id || certId;
    graded.cert_status = data.cert_status || (passed ? 'approved' : 'none');
  }
  await history.log(user.id, 'quiz', `Completed quiz: ${graded.resource_name}`, { percentage: graded.percentage });

  // Auto-email the certificate PDF (best-effort; never blocks the results screen).
  if (passed && data) {
    issueCertificate({ id: data.id, user_id: user.id, resource_name: graded.resource_name, cert_id: graded.cert_id })
      .catch(() => {});
  }
  return graded;
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/dinokage/dev/symb-ai && npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/quizSubmit.js
git commit -m "feat: shared quiz-attempt submit + cert helper"
```

---

## Task 5: Adaptive runner `AdaptiveQuizRunner.jsx`

**Files:**
- Create: `src/features/dashboard/pages/AdaptiveQuizRunner.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, ListChecks, Gauge } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { QUESTION_COUNT } from '../../../lib/adaptiveQuiz';
import { submitQuizAttempt } from '../../../lib/quizSubmit';
import QuizResult from './QuizResult';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// `engine` is a started AdaptiveEngine; `first` is its first question (both from QuizRunner).
function AdaptiveQuizRunner({ resourceName, engine, first }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [current, setCurrent] = useState(first); // { prompt, options[4], correctIndex, explanation, difficulty }
  const [index, setIndex] = useState(0);         // 0-based position, 0..QUESTION_COUNT-1
  const [selected, setSelected] = useState(null); // chosen option index for the current question
  const [revealed, setRevealed] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef([]); // accumulates per-question records
  const correctRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (result) {
    return <QuizResult result={result} resourceName={resourceName} onRetake={() => window.location.reload()} />;
  }

  const choose = (optIndex) => {
    if (revealed) return;
    setSelected(optIndex);
    setRevealed(true);
    const wasCorrect = optIndex === current.correctIndex;
    if (wasCorrect) correctRef.current += 1;
    answersRef.current.push({
      questionId: `${resourceName}-a${index}`,
      type: 'mcq',
      prompt: current.prompt,
      options: current.options,
      given: optIndex,
      correct: current.correctIndex,
      isCorrect: wasCorrect,
      difficulty: current.difficulty,
      explanation: current.explanation,
      marksPossible: 1,
      marksAwarded: wasCorrect ? 1 : 0,
    });
  };

  const finish = async () => {
    setSubmitting(true);
    const timeTaken = Math.round((performance.now() - startRef.current) / 1000);
    const correct = correctRef.current;
    const graded = {
      resource_name: resourceName,
      score: correct,
      max_score: QUESTION_COUNT,
      percentage: Math.round((correct / QUESTION_COUNT) * 100),
      correct_count: correct,
      wrong_count: QUESTION_COUNT - correct,
      time_taken_s: timeTaken,
      status: 'completed',
      open_pending: 0,
      total_max: QUESTION_COUNT,
      answers: answersRef.current,
    };
    await submitQuizAttempt(user, graded);
    setSubmitting(false);
    setResult(graded);
  };

  const advance = async () => {
    const isLast = index === QUESTION_COUNT - 1;
    if (isLast) { await finish(); return; }
    setLoadingNext(true);
    const wasCorrect = selected === current.correctIndex;
    const nextQ = await engine.next(wasCorrect);
    setLoadingNext(false);
    if (!nextQ) {
      // Mid-quiz generation failure: grade what we have so the attempt still counts.
      await finish();
      return;
    }
    setCurrent(nextQ);
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const total = QUESTION_COUNT;

  return (
    <div className="dash-page">
      <div className="quiz-runner-head">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/quizzes')}><ArrowLeft size={15} /> Exit</button>
        <div className="quiz-runner-title">
          <h2>{resourceName} — Assessment</h2>
          <span className="dash-muted">Question {index + 1} of {total}</span>
        </div>
        <div className="quiz-timer"><Clock size={15} /> {formatTime(elapsed)}</div>
      </div>

      <div className="quiz-progress"><div className="quiz-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} /></div>

      <div className="quiz-question-card">
        <div className="quiz-qtype" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Gauge size={13} /> Level {current.difficulty} · Multiple choice
        </div>
        <h3 className="quiz-prompt">{current.prompt}</h3>

        <div className="quiz-options">
          {current.options.map((opt, i) => {
            const isSel = selected === i;
            let cls = 'quiz-option';
            if (revealed) {
              if (i === current.correctIndex) cls += ' correct';
              else if (isSel) cls += ' wrong';
            } else if (isSel) cls += ' selected';
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => choose(i)}>
                <span className="quiz-option-mark">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-option-text">{opt}</span>
                {revealed && i === current.correctIndex && <CheckCircle2 size={17} className="quiz-opt-icon ok" />}
                {revealed && isSel && i !== current.correctIndex && <XCircle size={17} className="quiz-opt-icon no" />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={`quiz-feedback ${selected === current.correctIndex ? 'ok' : 'no'}`}>
            {selected === current.correctIndex ? 'Correct!' : 'Not quite — the correct answer is highlighted.'}
            {current.explanation ? ` ${current.explanation}` : ''}
          </div>
        )}
      </div>

      {!revealed && <p className="quiz-must-answer">Select an answer to continue — questions can't be skipped.</p>}

      <div className="quiz-nav">
        <span className="quiz-answered"><ListChecks size={15} /> {index + (revealed ? 1 : 0)}/{total} answered</span>
        {index === total - 1 ? (
          <button className="btn btn-primary" onClick={advance} disabled={!revealed || submitting}>
            <Send size={15} /> {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={advance} disabled={!revealed || loadingNext}>
            {loadingNext ? 'Loading…' : 'Next'} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default AdaptiveQuizRunner;
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/dinokage/dev/symb-ai && npm run build`
Expected: success. (`Gauge` is a valid lucide-react icon; if the installed lucide-react version lacks it, substitute `Trophy` in both the import and the JSX.)

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/pages/AdaptiveQuizRunner.jsx
git commit -m "feat: adaptive quiz runner UI"
```

---

## Task 6: `QuizRunner.jsx` — probe adaptive, else templated; route submit through the helper

**Files:**
- Modify: `src/features/dashboard/pages/QuizRunner.jsx`

The existing templated flow stays intact as the fallback. We add an adaptivity probe at the top and reuse the shared submit helper.

- [ ] **Step 1: Add imports**

Find the existing import block (lines 1-9):

```jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, ListChecks } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { getQuizForResource, gradeQuiz } from '../../../lib/quizStore';
import { quizAttempts, history } from '../../../lib/backend';
import { certificateId, PASS_PERCENT } from '../../../lib/certificates';
import { issueCertificate } from '../../../lib/certificateApi';
import QuizResult from './QuizResult';
```

Replace with:

```jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, ListChecks } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { getQuizForResource, gradeQuiz } from '../../../lib/quizStore';
import { submitQuizAttempt } from '../../../lib/quizSubmit';
import { AdaptiveEngine } from '../../../lib/adaptiveQuiz';
import AdaptiveQuizRunner from './AdaptiveQuizRunner';
import QuizResult from './QuizResult';
```

(`quizAttempts`, `history`, `certificateId`, `PASS_PERCENT`, `issueCertificate` are no longer imported here — they now live in `quizSubmit.js`. `useMemo`/`useRef` remain used by the templated flow.)

- [ ] **Step 2: Add the adaptivity probe at the top of the component**

Find the start of the component and its first hooks:

```jsx
function QuizRunner() {
  const { resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const { user } = useAuth();

  const quiz = useMemo(() => getQuizForResource(resourceName), [resourceName]);
```

Replace with:

```jsx
function QuizRunner() {
  const { resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Adaptive probe: try LLM-generated questions; fall back to templated. ---
  const [adaptiveMode, setAdaptiveMode] = useState('probing'); // 'probing' | 'adaptive' | 'templated'
  const [adaptiveEngine, setAdaptiveEngine] = useState(null);
  const [adaptiveFirst, setAdaptiveFirst] = useState(null);

  useEffect(() => {
    let active = true;
    const eng = new AdaptiveEngine(resourceName);
    if (!eng.ok) { setAdaptiveMode('templated'); return () => { active = false; }; }
    eng.start().then((q) => {
      if (!active) return;
      if (q) { setAdaptiveEngine(eng); setAdaptiveFirst(q); setAdaptiveMode('adaptive'); }
      else setAdaptiveMode('templated');
    });
    return () => { active = false; };
  }, [resourceName]);

  const quiz = useMemo(() => getQuizForResource(resourceName), [resourceName]);
```

- [ ] **Step 3: Branch the render before the templated UI**

Find the `submit` function and the `if (!quiz)` / `if (result)` guards. Immediately AFTER the hooks and BEFORE the existing `if (!quiz) {` guard, the component currently goes straight into templated logic. Insert the adaptive branch right after the `const quiz = useMemo(...)` line block and the other `useState`/`useEffect` hooks that follow it. Concretely, find this run of hooks (they currently sit just below the `quiz` memo):

```jsx
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [revealed, setRevealed] = useState({}); // instant MCQ/TF validation
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!quiz) {
```

Replace only the `if (!quiz) {` line at the end of that run with the adaptive branch followed by the original guard:

```jsx
  useEffect(() => {
    startRef.current = performance.now();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (adaptiveMode === 'probing') {
    return (
      <div className="dash-page">
        <div className="quiz-question-card" style={{ textAlign: 'center' }}>
          <div className="route-loader-spinner" aria-label="Preparing your quiz" style={{ margin: '1.5rem auto' }} />
          <p className="dash-muted">Preparing your adaptive quiz…</p>
        </div>
      </div>
    );
  }

  if (adaptiveMode === 'adaptive') {
    return <AdaptiveQuizRunner resourceName={resourceName} engine={adaptiveEngine} first={adaptiveFirst} />;
  }

  if (!quiz) {
```

> Note: React requires hooks to run unconditionally, so the two early `return`s above must come AFTER every `useState`/`useEffect`/`useMemo`/`useRef` hook in the component. The `if (!quiz)` guard already sits after all hooks, so inserting the adaptive returns immediately before it is safe.

- [ ] **Step 4: Route the templated `submit` through the shared helper**

Find the templated `submit` function body (the `if (user) { ... }` block that inserts the attempt). Replace the entire `submit` function:

```jsx
  const submit = async () => {
    setSaving(true);
    const timeTaken = Math.round((performance.now() - startRef.current) / 1000);
    const graded = gradeQuiz(quiz, responses, timeTaken);
    // Persist permanently
    if (user) {
      const passed = graded.percentage >= PASS_PERCENT;
      const certId = passed ? certificateId(user.id, graded.resource_name) : null;
      const { data, error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: graded.resource_name,
        score: graded.score,
        max_score: graded.max_score,
        percentage: graded.percentage,
        correct_count: graded.correct_count,
        wrong_count: graded.wrong_count,
        time_taken_s: graded.time_taken_s,
        status: 'completed',
        answers: graded.answers,
        // Single course certificates are auto-issued on pass (no admin approval).
        // In Supabase mode a DB trigger also enforces this; here we set it so the
        // localStorage mock behaves identically.
        cert_status: passed ? 'approved' : 'none',
        cert_id: certId,
      });
      if (error) {
        alert('Failed to save quiz attempt: ' + (error.message || JSON.stringify(error)));
      }
      if (data) {
        graded.id = data.id;
        graded.user_id = user.id;
        graded.cert_id = data.cert_id || certId;
        graded.cert_status = data.cert_status || (passed ? 'approved' : 'none');
      }
      await history.log(user.id, 'quiz', `Completed quiz: ${resourceName}`, { percentage: graded.percentage });

      // Auto-email the certificate PDF. Best-effort — never block the results
      // screen (offline/mock mode or a missing endpoint simply skips the email;
      // the certificate is already downloadable in-app).
      if (passed && data) {
        issueCertificate({ id: data.id, user_id: user.id, resource_name: graded.resource_name, cert_id: graded.cert_id })
          .catch(() => {});
      }
    }
    setSaving(false);
    setResult(graded);
  };
```

with:

```jsx
  const submit = async () => {
    setSaving(true);
    const timeTaken = Math.round((performance.now() - startRef.current) / 1000);
    const graded = gradeQuiz(quiz, responses, timeTaken);
    await submitQuizAttempt(user, graded);
    setSaving(false);
    setResult(graded);
  };
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/dinokage/dev/symb-ai && npm run build`
Expected: success. If the build reports `certificateId`/`PASS_PERCENT`/`quizAttempts`/`history`/`issueCertificate` as unused, that's expected — they were removed from the import in Step 1. If it reports any of them as *undefined* (still referenced), a templated-path reference was missed — re-check Step 4.

- [ ] **Step 6: Functional check (templated fallback path, mock mode)**

Run `npm run dev` (Vite, no `/api`). Take a quiz for **Sakana AI**. Because `/api/generate-questions` isn't served in plain Vite dev, the probe fails and the quiz falls back to the **templated** 20-question flow, unchanged from today. Passing at ≥70% still auto-issues the course certificate.
Expected: quiz runs exactly as before; certificate appears on `/dashboard/certificates`.

- [ ] **Step 7: Commit**

```bash
git add src/features/dashboard/pages/QuizRunner.jsx
git commit -m "feat: probe adaptive quiz with templated fallback; share submit helper"
```

---

## Task 7: Document the required env vars

**Files:**
- Modify: `.env`

- [ ] **Step 1: Append documentation for the new keys**

Add these commented lines to `.env` (below the existing serverless-secrets block). They document the requirement; real values go in the Vercel dashboard, not committed.

```
#   ANTHROPIC_API_KEY          Anthropic API key for adaptive quiz generation (server-only)
#   QUIZ_MODEL                 optional; defaults to claude-haiku-4-5
```

- [ ] **Step 2: Verify not accidentally committing secrets**

Run: `cd /Users/dinokage/dev/symb-ai && git status --short .env`
Expected: `.env` is gitignored (`.env*` is in `.gitignore`), so this shows nothing to commit. The documentation lives only in the local file; **no commit needed**. If `.env` is NOT ignored in this checkout, do not `git add` it — instead note the two vars in `PORTAL.md` or the plan and skip.

---

## Task 8: Full verification pass

- [ ] **Step 1: Build clean**

Run: `cd /Users/dinokage/dev/symb-ai && npm run build`
Expected: no errors, `dist/` produced (dist is gitignored).

- [ ] **Step 2: Endpoint smoke (optional — requires `vercel dev` + `ANTHROPIC_API_KEY`)**

If `vercel dev` and `ANTHROPIC_API_KEY` are available:
```bash
curl -sS -X POST http://localhost:3000/api/generate-questions \
  -H 'Content-Type: application/json' \
  -d '{"resourceName":"Sakana AI","categoryLabel":"AI Tools","material":{"definition":"A Tokyo AI research lab using nature-inspired methods.","summary":"","concepts":[{"title":"Evolutionary model merge","body":"Combining models via evolution."}],"bestPractices":["Start with a small pilot."],"keyTakeaways":["Judged by the problem it solves."]},"difficulties":[1,3],"avoid":[]}' | head -40
```
Expected: JSON `{ "questions": [ {difficulty:1,...}, {difficulty:3,...} ] }`, each with 4 options and a `correctIndex` in 0..3. Without env, the app degrades to the templated quiz (Step 3 below), which is the supported offline behavior.

- [ ] **Step 3: End-to-end functional checklist**

- [ ] Plain `npm run dev` (no `/api`): every quiz falls back to the templated 20-question flow; passing ≥70% auto-issues the course certificate. No console errors from the failed probe (it's caught).
- [ ] With `vercel dev` + `ANTHROPIC_API_KEY`: a quiz shows one MCQ at a time labelled "Level N"; a brief spinner appears before Q1, then subsequent questions are usually instant (prefetch). Answering correctly raises the level; two wrongs drop it one notch and never again. After 10 questions the results screen shows a score = correct/10 and, at ≥70%, the certificate is issued.
- [ ] Mid-quiz: if generation fails after Q1 (e.g. kill the endpoint), the attempt grades what's answered rather than hanging.

- [ ] **Step 4: Sanity grep — no secret leaked to the client bundle**

Run: `cd /Users/dinokage/dev/symb-ai && grep -rn "ANTHROPIC_API_KEY\|new Anthropic" src`
Expected: **no matches** in `src/` (the key and SDK are only referenced in `api/`). The client only ever `fetch`es `/api/generate-questions`.

- [ ] **Step 5: Confirm clean tree**

Run: `cd /Users/dinokage/dev/symb-ai && git status --short | grep -v '^??'`
Expected: clean (all tasks committed; untracked `.codegraph/` and local `.env` are fine).

---

## Notes / risks carried from the spec

- **Latency:** Q1 has an unavoidable generation wait (spinner shown); prefetch covers the rest. If Haiku latency is high, the "Level N" spinner between questions is the visible cost.
- **Cost:** prefetch-both ≈ ~15–20 Haiku calls per attempt. Tunable later via `QUIZ_MODEL` or by prefetching only the "if correct" branch.
- **Hallucination:** mitigated by grounding in `quizFacts` + the explicit "answerable only from the material" system rule + server-side schema/shape validation (drops malformed questions).
- **`AdminQuizReview`** has no open-ended items for adaptive attempts (all auto-scored MCQ) — expected, not a bug.
- **No DB migration:** adaptive question data rides in the existing `quiz_attempts.answers` jsonb; scoring/cert logic is unchanged and reused via `quizSubmit.js`.
- **Structured-output model support:** Haiku 4.5 supports `output_config.format`. If `QUIZ_MODEL` is overridden, it must be a model that supports structured outputs (Fable 5 / Opus 4.8 / Sonnet 5 / Haiku 4.5) or the endpoint will error and the app falls back to templated.
```
