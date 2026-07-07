# Design: Adaptive LLM-Generated Quizzes

Date: 2026-07-08
Status: Approved design — pending implementation plan

## Overview

Replace the deterministic, templated quiz generator with **Claude-generated multiple-choice questions** whose **difficulty adapts** to the student's running performance during a single attempt. Questions are generated server-side (Claude API key stays secret), grounded in the resource's in-portal learning material, and buffered so the student rarely waits. When the generation endpoint is unavailable, the quiz falls back to the existing templated generator so it always works.

## Decisions (locked via brainstorming)

| Topic | Decision |
|---|---|
| Difficulty rule | **Single floor drop** state machine, levels 1–5, start at 1 (see below) |
| Generation | **Hybrid buffered** — generate Q1 immediately, prefetch the ≤2 possible next-difficulty questions in the background |
| Prefetch | **Both branches** ("if correct" and "if wrong") for smoothest UX (~15–20 Haiku calls/attempt) |
| Question types | **All multiple-choice** (single correct option); no True/False, no open-ended |
| Grounding | **Grounded in the learning material** — Claude gets `quizFacts` as context; questions must be answerable from the portal |
| Count | **Fixed 10** questions per attempt |
| Scoring | **Flat % correct**, pass **≥ 70%**; reuse the existing cert auto-issue flow unchanged |
| Difficulty persistence | **Reset each attempt** (per-attempt session state only; no cross-attempt storage) |
| Model | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`), overridable via `QUIZ_MODEL` env |
| Fallback | On endpoint-unreachable or generation error → existing templated `getQuizForResource` quiz |

## Difficulty state machine (per attempt)

Levels 1–5. Start at level 1. State: `level`, `wrongCount` (consecutive wrongs at the current level), `floorLocked` (has the one allowed drop happened).

Evaluated after each answered question:

- **Correct** → `level = min(5, level + 1)`; `wrongCount = 0` (a correct answer cancels a pending drop).
- **Wrong** → `wrongCount += 1`; keep `level` (hold). Then:
  - if `wrongCount === 2` **and** `!floorLocked` → `level = max(1, level - 1)`, `floorLocked = true`, `wrongCount = 0`.
  - if `floorLocked` → never drop again; the level only holds or rises for the rest of the attempt.

**Next-difficulty prediction (for prefetch).** Before the student answers question *i*, the next difficulty is one of at most two values:
- `ifCorrect = min(5, level + 1)`
- `ifWrong = (wrongCount === 1 && !floorLocked) ? max(1, level - 1) : level`

The buffer prefetches a question at each of these ≤2 difficulties.

## Server: `POST /api/generate-questions`

Vercel serverless function. Holds `ANTHROPIC_API_KEY` (server-only). Uses `@anthropic-ai/sdk`.

**Request body:**
```json
{
  "resourceName": "Sakana AI",
  "categoryLabel": "AI Tools",
  "material": {
    "definition": "…",
    "summary": "…",
    "concepts": [{ "title": "…", "body": "…" }],
    "bestPractices": ["…"],
    "keyTakeaways": ["…"]
  },
  "difficulties": [2, 4],
  "avoid": ["already-asked question prompt 1", "…"]
}
```
- `difficulties` is a list (1–5 each) — one MCQ generated per entry (supports prefetching both branches in one call).
- `avoid` is the list of already-asked prompts so Claude does not repeat.

**Behavior:**
- Builds one Claude Messages API call per difficulty (or a single call returning an array), forcing **structured JSON output via a tool/`tool_choice`** (schema: `{ prompt: string, options: string[4], correctIndex: 0..3, explanation: string }`). Consult the `claude-api` skill during implementation for the current SDK/tool-use idiom and model id.
- The prompt includes: the material context, the resource name/category, an instruction that questions must be answerable **from the material only**, the difficulty **rubric**, and the `avoid` list.
- **Difficulty rubric** (in the prompt): L1 recall/definition · L2 comprehension · L3 application · L4 analysis / edge cases / distinguishing similar options · L5 synthesis / tradeoffs / expert judgment.
- Validates each returned object (4 options, integer `correctIndex` in range, non-empty prompt). On invalid/failed generation returns an error for that item; the client treats a failed item as a fallback trigger for that question.

**Response:**
```json
{ "questions": [ { "difficulty": 2, "prompt": "…", "options": ["…","…","…","…"], "correctIndex": 1, "explanation": "…" }, … ] }
```

**Env:** `ANTHROPIC_API_KEY` (required for adaptive mode), `QUIZ_MODEL` (optional; default `claude-haiku-4-5-20251001`).

## Client: `src/lib/adaptiveQuiz.js`

A framework-agnostic engine + fetch/buffer layer, unit-testable in isolation from React.

- **`createAdaptiveSession(resourceName)`** — resolves the material via `getMaterial(resourceName)`; returns a session object holding `level`, `wrongCount`, `floorLocked`, `askedPrompts[]`, the answered `history[]`, and a small `buffer` map keyed by difficulty of prefetched questions.
- **`fetchQuestions(material, difficulties, avoid)`** — POSTs to `/api/generate-questions`; returns validated questions or throws (→ fallback).
- **`nextDifficulties(state)`** — returns `{ ifCorrect, ifWrong }` per the state machine.
- **`applyAnswer(state, wasCorrect)`** — advances the state machine, returns the new `level`.
- The React layer drives: fetch Q1 (level 1) + prefetch level for the "if correct"/"if wrong" of Q1; on answer, pick the buffered question for the branch that occurred, show it, and kick off prefetch for the new ≤2 branches; stop at 10 questions.
- **Fallback:** if the first fetch fails (offline/mock/no `/api`/API error), the engine signals fallback and the runner uses the existing templated `getQuizForResource(resourceName)` quiz for the whole attempt (non-adaptive).

## Client: `QuizRunner.jsx` changes

- On mount, start an adaptive session and fetch Q1 (show a per-question loading state; first question has an unavoidable ~1–2s wait).
- Render one MCQ at a time (reuse existing MCQ UI + instant reveal). Difficulty is internal; optionally show a subtle level indicator (nice-to-have, not required).
- After each answer, update the difficulty state and advance from the buffer; prefetch the next branches.
- After 10 questions, build the same `graded` shape the current `gradeQuiz` produces (`resource_name`, `score`, `max_score`, `percentage = correct/10×100`, `correct_count`, `wrong_count`, `answers[]` with per-question `{ prompt, options, given, correct, difficulty, explanation }`, `time_taken_s`) and run the **existing** submit path: `quizAttempts.insert(...)` with `cert_status`/`cert_id` auto-issue + best-effort `issueCertificate(...)`. No changes to the persistence or certificate logic.
- Keep the templated fallback path intact (when the session signals fallback, behave exactly as today).

## Data & persistence

- **No DB migration.** Adaptive question data lives in the existing `quiz_attempts.answers` **jsonb** column. `percentage`, `cert_status`, `cert_id`, etc. are unchanged.
- Difficulty is per-attempt session state only (reset each attempt) — nothing persisted for it.

## Scope / non-goals

- No True/False or open-ended questions in adaptive mode (so `AdminQuizReview`'s open-answer grading simply has no items for adaptive attempts — acceptable, not broken).
- No cross-attempt difficulty memory.
- No admin-authored `quiz_questions` table (the long-standing unused hook stays unused).
- No change to module (consolidated) certificate logic or the 70% pass mark.

## Risks / notes

- **Latency:** first question waits on generation (~1–2s) — show a loading state. Prefetch covers the rest.
- **Cost:** prefetch-both ≈ ~15–20 Haiku calls/attempt. Acceptable; the `QUIZ_MODEL` env allows tuning, and a future optimization could prefetch only the "if correct" branch.
- **Hallucination / off-material questions:** mitigated by grounding in `quizFacts` and an explicit "answerable from the material only" instruction; server-side schema validation rejects malformed items.
- **Duplicate questions:** mitigated by passing the `avoid` list of already-asked prompts.
- **No test framework in repo:** verification is `npm run build` + a Node smoke test of `api/generate-questions.js` (mock/validate path) + manual browser run (adaptive when `vercel dev` + `ANTHROPIC_API_KEY`; templated fallback in plain `npm run dev`).
- **Secret handling:** `ANTHROPIC_API_KEY` is server-only (Vercel env); never exposed to the client bundle. Consult the `claude-api` skill during implementation for correct SDK usage and the current model id.
