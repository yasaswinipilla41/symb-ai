import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { allResources } from '../../../lib/catalog';
import { PASS_PERCENT } from '../../../lib/quizStore';

function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await quizAttempts.listForUser(user.id);
      if (active) { setAttempts(data || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  // Best attempt per resource
  const bestByResource = useMemo(() => {
    const m = {};
    for (const a of attempts) {
      const cur = m[a.resource_name];
      if (!cur || a.percentage > cur.percentage) m[a.resource_name] = a;
    }
    return m;
  }, [attempts]);

  const countByResource = useMemo(() => {
    const m = {};
    for (const a of attempts) m[a.resource_name] = (m[a.resource_name] || 0) + 1;
    return m;
  }, [attempts]);

  const resources = useMemo(() => allResources(), []);
  const filtered = resources.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Quizzes</h2>
          <p className="dash-muted">Each quiz has 20 questions drawn from the learning material. Score {PASS_PERCENT}% to pass and earn a certificate.</p>
        </div>
        <div className="input-wrap search-inline">
          <Search size={16} />
          <input placeholder="Search a tool to quiz on…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <div className="quiz-grid">
          {filtered.map((r) => {
            const best = bestByResource[r.name];
            const attempts = countByResource[r.name] || 0;
            return (
              <div className="quiz-card" key={r.name}>
                <div className="quiz-card-head">
                  <div className="preview-logo">{r.name.charAt(0)}</div>
                  {best && (
                    <span className={`quiz-score-badge ${best.percentage >= PASS_PERCENT ? 'ok' : 'low'}`}>
                      <Trophy size={13} /> {Math.round(best.percentage)}%
                    </span>
                  )}
                </div>
                <h4>{r.name}</h4>
                <p className="quiz-card-meta">
                  {attempts > 0
                    ? <><CheckCircle2 size={13} /> {attempts} attempt{attempts === 1 ? '' : 's'}</>
                    : <span>Not attempted yet</span>}
                </p>
                <button className="btn btn-primary btn-sm btn-block" onClick={() => navigate(`/dashboard/quizzes/${encodeURIComponent(r.name)}`)}>
                  {attempts > 0 ? <><RotateCcw size={15} /> Retake</> : <><Play size={15} /> Start quiz</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="empty-hint" style={{ marginTop: '1rem' }}>Showing {filtered.length} of {filtered.length}.</p>
    </div>
  );
}

export default QuizzesPage;
