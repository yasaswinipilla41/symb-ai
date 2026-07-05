// Leaderboard ranking.
//
// Students are ranked by a blend of quiz performance and completion, matching
// the spec: quiz scores, completion (courses passed), and completion time as a
// tiebreak. Certificates and average score are derived from the same attempts.

import { PASS_PERCENT } from './quizFromMaterial';

// Reduce a student's raw attempts to best-per-course, then to summary metrics.
export function summarize(attempts) {
  const bestByResource = {};
  for (const a of attempts) {
    const pct = Number(a.percentage) || 0;
    const cur = bestByResource[a.resource_name];
    if (!cur || pct > cur.pct) {
      bestByResource[a.resource_name] = { pct, time: Number(a.time_taken_s) || 0 };
    }
  }
  const bests = Object.values(bestByResource);
  const coursesTaken = bests.length;
  const coursesCompleted = bests.filter((b) => b.pct >= PASS_PERCENT).length;
  const avgScore = coursesTaken ? Math.round(bests.reduce((s, b) => s + b.pct, 0) / coursesTaken) : 0;
  const totalTime = bests.reduce((s, b) => s + b.time, 0);
  const completionRate = coursesTaken ? Math.round((coursesCompleted / coursesTaken) * 100) : 0;
  return {
    attemptsCount: attempts.length,
    coursesTaken,
    coursesCompleted,
    certificates: coursesCompleted,
    avgScore,
    completionRate,
    totalTime,
  };
}

// Build a ranked leaderboard from all profiles + all attempts.
// Returns rows sorted best-first, each with a `rank`.
export function buildLeaderboard(profiles, allAttempts) {
  const byUser = {};
  for (const a of allAttempts) (byUser[a.user_id] = byUser[a.user_id] || []).push(a);

  const rows = (profiles || [])
    .filter((p) => p.role !== 'admin') // students only
    .map((p) => {
      const s = summarize(byUser[p.user_id] || []);
      return {
        userId: p.user_id,
        name: p.full_name || p.email || 'Student',
        email: p.email,
        ...s,
      };
    })
    .filter((r) => r.attemptsCount > 0);

  rows.sort((a, b) =>
    b.avgScore - a.avgScore ||
    b.coursesCompleted - a.coursesCompleted ||
    a.totalTime - b.totalTime
  );
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

export { PASS_PERCENT };
