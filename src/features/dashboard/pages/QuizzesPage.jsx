import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Trophy, Play, RotateCcw, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { useResourcesStore } from '../../../lib/useResourcesStore';
import { PASS_PERCENT } from '../../../lib/quizStore';
import { MODULE_PASS_PERCENT } from '../../../lib/workshops';

function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [moduleSlug, setModuleSlug] = useState('all');
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live, admin-editable catalog. Sourcing quizzes from here (instead of the
  // static catalog) means any tool an admin adds or edits automatically shows
  // up here with an up-to-date, auto-generated quiz.
  const { catalog, loading: catalogLoading } = useResourcesStore();

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

  const resources = useMemo(() => {
    const out = [];
    for (const slug of Object.keys(catalog)) {
      for (const item of catalog[slug].items || []) {
        out.push({ ...item, category: item.category || slug });
      }
    }
    return out;
  }, [catalog]);

  // Module (category) options for the dropdown.
  const moduleOptions = useMemo(
    () => Object.keys(catalog)
      .map((slug) => ({ slug, title: catalog[slug].title || slug, count: (catalog[slug].items || []).length }))
      .filter((o) => o.count > 0)
      .sort((a, b) => a.title.localeCompare(b.title)),
    [catalog]
  );

  const filtered = resources.filter(
    (r) => (moduleSlug === 'all' || r.category === moduleSlug) && r.name.toLowerCase().includes(q.toLowerCase())
  );

  // Progress toward the selected module's certificate.
  const moduleStat = useMemo(() => {
    if (moduleSlug === 'all') return null;
    const names = (catalog[moduleSlug]?.items || []).map((i) => i.name);
    const passed = names.filter((n) => (Number(bestByResource[n]?.percentage) || 0) >= MODULE_PASS_PERCENT).length;
    return { total: names.length, passed, label: catalog[moduleSlug]?.title || moduleSlug };
  }, [moduleSlug, catalog, bestByResource]);

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Quizzes</h2>
          <p className="dash-muted">Each quiz has 20 questions drawn from the learning material. Score {PASS_PERCENT}% to pass and earn a certificate.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="input-wrap search-inline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={16} />
            <select
              value={moduleSlug}
              onChange={(e) => setModuleSlug(e.target.value)}
              style={{ border: 'none', background: 'transparent', font: 'inherit', color: 'inherit', outline: 'none', cursor: 'pointer' }}
              aria-label="Filter quizzes by module"
            >
              <option value="all">All modules ({resources.length})</option>
              {moduleOptions.map((m) => (
                <option key={m.slug} value={m.slug}>{m.title} ({m.count})</option>
              ))}
            </select>
          </div>
          <div className="input-wrap search-inline">
            <Search size={16} />
            <input placeholder="Search a tool to quiz on…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {moduleStat && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <Sparkles size={18} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem' }}>
            <strong>{moduleStat.label}</strong> module — passed <strong>{moduleStat.passed}</strong> of <strong>{moduleStat.total}</strong> at {MODULE_PASS_PERCENT}%+.{' '}
            {moduleStat.passed === moduleStat.total && moduleStat.total > 0
              ? <>Module complete! <Link to="/dashboard/certificates">Claim your module certificate →</Link></>
              : <>Pass all {moduleStat.total} to earn the <Link to="/dashboard/certificates">module certificate</Link>.</>}
          </span>
        </div>
      )}

      {loading || catalogLoading ? (
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
      <p className="empty-hint" style={{ marginTop: '1rem' }}>Showing {filtered.length} of {resources.length}.</p>
    </div>
  );
}

export default QuizzesPage;
