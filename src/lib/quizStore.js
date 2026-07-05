// Quiz loading + scoring helpers shared by the runner and results views.

import { generateQuizFromMaterial, PASS_PERCENT } from './quizFromMaterial';
import { findResource } from './catalog';

export { PASS_PERCENT };

// Load a quiz for a resource. The quiz is generated ONLY from the resource's
// Learning Material (see materials.js / quizFromMaterial.js), so every question
// maps to something the student can study in-portal first. Admin-curated
// questions from the quiz_questions table can be layered in here later.
export function getQuizForResource(resourceName) {
  const resource = findResource(resourceName);
  if (!resource) return null;
  return generateQuizFromMaterial(resourceName);
}

// Grade a completed quiz. Objective questions (MCQ + True/False) are auto-scored;
// open-ended answers are stored for admin review (marks pending).
export function gradeQuiz(quiz, responses, timeTakenS) {
  let objectiveScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const answers = quiz.questions.map((q) => {
    const given = responses[q.id];
    if (q.type === 'open') {
      return {
        questionId: q.id, type: 'open', prompt: q.prompt,
        openText: given || '', marksPossible: q.marks, marksAwarded: null, // pending admin review
      };
    }
    const isCorrect = q.type === 'truefalse'
      ? (given === true || given === 'True') === q.correct
      : given === q.correct;
    if (given === undefined || given === null || given === '') {
      wrongCount += 1;
    } else if (isCorrect) {
      objectiveScore += q.marks;
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
    return {
      questionId: q.id, type: q.type, prompt: q.prompt,
      given: given ?? null, correct: q.correct, isCorrect: !!isCorrect,
      marksPossible: q.marks, marksAwarded: isCorrect ? q.marks : 0,
    };
  });

  const objectiveMax = quiz.objectiveMax;
  const percentage = objectiveMax ? Math.round((objectiveScore / objectiveMax) * 100) : 0;
  const openPending = answers.filter((a) => a.type === 'open').length;

  return {
    resource_name: quiz.resourceName,
    score: objectiveScore,
    max_score: objectiveMax,
    percentage,
    correct_count: correctCount,
    wrong_count: wrongCount,
    time_taken_s: timeTakenS,
    status: 'completed',
    open_pending: openPending,
    total_max: quiz.maxScore,
    answers,
  };
}
