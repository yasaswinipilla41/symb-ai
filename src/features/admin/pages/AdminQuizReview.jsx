import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Check, Clock, Filter, Save } from 'lucide-react';
import { quizAttempts, profiles } from '../../../lib/backend';
import { certificateId, PASS_PERCENT } from '../../../lib/certificates';

// Admin reviews and grades open-ended answers (2 marks each). Grading updates
// the attempt's answers[] and recomputes the combined score/percentage so the
// user's result reflects the reviewed marks.
function AdminQuizReview() {
  const [attempts, setAttempts] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [filter, setFilter] = useState('pending');
  const [drafts, setDrafts] = useState({}); // attemptId -> { questionId: marks }
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [qa, pf] = await Promise.all([quizAttempts.listAll(), profiles.list()]);
    setAttempts(qa.data || []);
    const map = {};
    (pf.data || []).forEach((p) => { map[p.user_id] = p; });
    setUserMap(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const withOpen = useMemo(
    () => attempts.filter((a) => (a.answers || []).some((x) => x.type === 'open')),
    [attempts]
  );

  const isPending = (a) => (a.answers || []).some((x) => x.type === 'open' && x.marksAwarded == null);
  const filtered = withOpen.filter((a) => (filter === 'pending' ? isPending(a) : filter === 'graded' ? !isPending(a) : true));

  const setMark = (attemptId, questionId, marks) =>
    setDrafts((d) => ({ ...d, [attemptId]: { ...(d[attemptId] || {}), [questionId]: marks } }));

  const saveGrades = async (a) => {
    setSavingId(a.id);
    const draft = drafts[a.id] || {};
    const answers = (a.answers || []).map((x) => {
      if (x.type !== 'open') return x;
      const m = draft[x.questionId];
      return m == null && x.marksAwarded == null ? x : { ...x, marksAwarded: m != null ? m : x.marksAwarded };
    });
    // Recompute combined score/percentage over ALL marks (objective + open).
    const objective = answers.filter((x) => x.type !== 'open').reduce((s, x) => s + (x.marksAwarded || 0), 0);
    const openAwarded = answers.filter((x) => x.type === 'open').reduce((s, x) => s + (x.marksAwarded || 0), 0);
    const totalMax = answers.reduce((s, x) => s + (x.marksPossible || 0), 0);
    const totalScore = objective + openAwarded;
    const percentage = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

    const patch = { answers, score: totalScore, max_score: totalMax, percentage };
    if (percentage >= PASS_PERCENT) {
      patch.cert_id = a.cert_id || certificateId(a.user_id, a.resource_name);
    }
    await quizAttempts.update(a.id, patch);
    setSavingId(null);
    setDrafts((d) => { const n = { ...d }; delete n[a.id]; return n; });
    load();
  };

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Quiz Review</h2>
          <p className="dash-muted"></p>
        </div>
        <div className="filter-chips">
          <Filter size={15} />
          {['pending', 'graded', 'all'].map((f) => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Graded'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><FileText size={40} /><p>Nothing to review here.</p></div>
      ) : (
        <div className="review-list">
          {filtered.map((a) => {
            const u = userMap[a.user_id];
            const openAnswers = (a.answers || []).filter((x) => x.type === 'open');
            const pending = isPending(a);
            return (
              <div className="panel review-attempt" key={a.id}>
                <div className="panel-head">
                  <h3>
                    {a.resource_name}
                    <span className="review-user"> · {u?.full_name || u?.email || 'Unknown user'}</span>
                  </h3>
                  <span className={`grade-pill ${pending ? 'pending' : 'graded'}`}>
                    {pending ? <><Clock size={13} /> Pending</> : <><Check size={13} /> Graded</>}
                  </span>
                </div>
                <div className="review-answers">
                  {openAnswers.map((x) => {
                    const draftMark = drafts[a.id]?.[x.questionId];
                    const current = draftMark != null ? draftMark : x.marksAwarded;
                    return (
                      <div className="review-answer" key={x.questionId}>
                        <p className="open-q">{x.prompt}</p>
                        <p className="open-a">{x.openText || <em>No answer provided.</em>}</p>
                        <div className="mark-picker">
                          <span>Marks:</span>
                          {[0, 1, 2].map((m) => (
                            <button key={m} className={`mark-btn ${current === m ? 'active' : ''}`} onClick={() => setMark(a.id, x.questionId, m)}>{m}</button>
                          ))}
                          {x.marksAwarded != null && draftMark == null && <span className="mark-saved">Saved: {x.marksAwarded}/2</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary btn-sm" disabled={savingId === a.id} onClick={() => saveGrades(a)}>
                    <Save size={15} /> {savingId === a.id ? 'Saving…' : 'Save grades'}
                  </button>
                  <span className="dash-muted">Combined score {a.score}/{a.max_score} · {Math.round(a.percentage)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminQuizReview;
