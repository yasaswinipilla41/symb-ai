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

  try {
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
  } catch (e) {
    // Never throw to the caller — the results screen must always render.
    window.alert('Failed to save quiz attempt: ' + (e.message || String(e)));
  }
  return graded;
}
