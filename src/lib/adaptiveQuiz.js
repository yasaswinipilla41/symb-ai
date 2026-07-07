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
    // Drop the whole buffer: the taken question is consumed, and the not-taken
    // sibling was fetched against a shorter avoid-list, so it's stale. _prefetchNext
    // immediately repopulates both branches fresh (in-flight fetches keep running).
    this.buffer.clear();
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
