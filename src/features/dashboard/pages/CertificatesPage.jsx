import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Eye, Download, Sparkles, Lock, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { useResourcesStore } from '../../../lib/useResourcesStore';
import {
  earnedCertificates, downloadCertificatePDF, downloadModuleCertificatePDF,
  PASS_PERCENT, certificateId,
} from '../../../lib/certificates';
import {
  MODULE_PASS_PERCENT, moduleProgress, moduleCertAttempt, moduleCertMeta,
  moduleCertResourceName, moduleCertSlug, moduleLabel, isModuleCertResource,
} from '../../../lib/workshops';

function CertificatesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  // Live merged catalog — used to know the CURRENT set of tools in each module
  // (so admin-added tools count and module totals stay accurate).
  const { catalog: liveCatalog, loading: catalogLoading } = useResourcesStore();
  const liveResources = useMemo(() => {
    const out = [];
    for (const slug of Object.keys(liveCatalog)) {
      for (const item of liveCatalog[slug].items || []) {
        out.push({ ...item, category: item.category || slug });
      }
    }
    return out;
  }, [liveCatalog]);

  const studentName = profile?.full_name || user?.email || 'Student';

  const reload = async () => {
    if (!user) return;
    const { data } = await quizAttempts.listForUser(user.id);
    setAttempts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await quizAttempts.listForUser(user.id);
      if (active) { setAttempts(data || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const certs = useMemo(() => earnedCertificates(attempts, user?.id), [attempts, user]);

  const onDownload = async (cert) => {
    setBusy(cert.id);
    try { await downloadCertificatePDF(cert, studentName); }
    catch { window.alert('Could not generate the certificate PDF.'); }
    finally { setBusy(''); }
  };

  // ---- Module certificates --------------------------------------------------
  // One card per module the student is engaged with (has at least one quiz
  // attempt in, or has already requested). Each shows progress toward the
  // module certificate, earned by passing every tool at MODULE_PASS_PERCENT.
  const moduleCards = useMemo(() => {
    const byCat = {};
    for (const r of liveResources) (byCat[r.category] = byCat[r.category] || []).push(r.name);

    const engaged = new Set();
    for (const a of attempts) {
      if (isModuleCertResource(a.resource_name)) {
        const s = moduleCertSlug(a.resource_name);
        if (s) engaged.add(s);
        continue;
      }
      const res = liveResources.find((r) => r.name === a.resource_name);
      if (res) engaged.add(res.category);
    }

    return [...engaged]
      .filter((slug) => (byCat[slug]?.length || 0) > 0)
      .map((slug) => {
        const required = byCat[slug];
        const label = liveCatalog[slug]?.title || moduleLabel(slug);
        return {
          slug,
          meta: moduleCertMeta(slug, label),
          progress: moduleProgress(slug, attempts, required),
          attempt: moduleCertAttempt(slug, attempts),
        };
      })
      .sort((a, b) => (b.progress.passedCount / b.progress.total) - (a.progress.passedCount / a.progress.total));
  }, [liveResources, liveCatalog, attempts]);

  const requestModule = async (card) => {
    setBusy(`ws-${card.slug}`);
    try {
      const { error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: moduleCertResourceName(card.slug),
        score: 0,
        max_score: 0,
        // 100 = the module was fully completed (every tool passed). Stored so
        // the certificate's verification QR resolves (the public verify RPC only
        // returns certificates at >= 80%). Filtered out of quiz-results /
        // leaderboard everywhere else.
        percentage: 100,
        correct_count: 0,
        wrong_count: 0,
        time_taken_s: 0,
        status: 'completed',
        answers: [],
        cert_status: 'pending',
        cert_id: certificateId(user.id, moduleCertResourceName(card.slug)),
      });
      if (error) window.alert(`Could not request the module certificate: ${error.message || error}`);
      else await reload();
    } finally {
      setBusy('');
    }
  };

  const downloadModule = async (card) => {
    setBusy(`wsdl-${card.slug}`);
    try {
      await downloadModuleCertificatePDF(
        card.meta,
        {
          id: card.attempt?.cert_id || certificateId(user.id, moduleCertResourceName(card.slug)),
          date: card.attempt?.created_at || new Date().toISOString(),
        },
        studentName
      );
    } catch {
      window.alert('Could not generate the module certificate PDF.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2"><Award size={22} style={{ verticalAlign: '-4px' }} /> My Certificates</h2>
      <p className="dash-muted">Earn a course certificate at {PASS_PERCENT}% per quiz, and a module certificate by passing every quiz in a module at {MODULE_PASS_PERCENT}%.</p>

      {loading || catalogLoading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <>
          {/* ---- Module certificates -------------------------------------- */}
          {moduleCards.length > 0 && (
            <>
              <h3 className="dash-h3" style={{ margin: '0.5rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} style={{ color: '#7c3aed' }} /> Module Certificates
              </h3>
              <div className="cert-grid" style={{ marginBottom: '1.75rem' }}>
                {moduleCards.map(({ slug, meta, progress, attempt }) => {
                  const status = attempt?.cert_status || 'none';
                  const certId = attempt?.cert_id || certificateId(user.id, moduleCertResourceName(slug));
                  const pctWidth = progress.total ? Math.round((progress.passedCount / progress.total) * 100) : 0;
                  const remaining = progress.total - progress.passedCount;
                  return (
                    <div className="cert-card cert-card-workshop" key={slug}>
                      <div className="cert-card-ribbon" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}><Sparkles size={18} /></div>
                      <span className="cert-card-cat" style={{ color: '#7c3aed' }}>Module Award</span>
                      <h4 style={{ marginTop: '0.15rem' }}>{meta.label}</h4>
                      <p className="dash-muted" style={{ fontSize: '0.82rem', margin: '0.2rem 0 0.6rem' }}>
                        Pass all {progress.total} quiz{progress.total === 1 ? '' : 'zes'} at {MODULE_PASS_PERCENT}%+ to earn this.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--color-slate-200, #e5e7eb)', overflow: 'hidden' }}>
                          <div style={{ width: `${pctWidth}%`, height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', whiteSpace: 'nowrap' }}>
                          {progress.passedCount} / {progress.total}
                        </span>
                      </div>

                      {status !== 'none' && <span className="cert-card-id">{certId}</span>}

                      <div className="cert-card-actions">
                        {!progress.completed ? (
                          <span className="cert-status locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={14} /> {remaining} more to go
                          </span>
                        ) : status === 'approved' ? (
                          <button className="btn btn-primary btn-sm" disabled={busy === `wsdl-${slug}`} onClick={() => downloadModule({ slug, meta, attempt })}>
                            <Download size={14} /> {busy === `wsdl-${slug}` ? '…' : 'Download PDF'}
                          </button>
                        ) : status === 'pending' ? (
                          <span className="cert-status locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={14} /> Pending admin approval
                          </span>
                        ) : status === 'rejected' ? (
                          <>
                            <span className="cert-status locked" style={{ color: 'var(--color-red)' }}>Rejected</span>
                            <button className="btn btn-outline btn-sm" disabled={busy === `ws-${slug}`} onClick={() => requestModule({ slug })}>Request again</button>
                          </>
                        ) : (
                          <button className="btn btn-primary btn-sm" disabled={busy === `ws-${slug}`} onClick={() => requestModule({ slug })}>
                            <ShieldCheck size={14} /> {busy === `ws-${slug}` ? 'Requesting…' : 'Request Certificate'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ---- Course certificates -------------------------------------- */}
          <h3 className="dash-h3" style={{ margin: '0.5rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={18} /> Course Certificates
          </h3>
          {certs.length === 0 ? (
            <div className="empty-state">
              <Award size={40} />
              <p>No course certificates yet. Pass a quiz at {PASS_PERCENT}% to earn your first one.</p>
              <Link to="/dashboard/quizzes" className="btn btn-primary btn-sm">Browse quizzes</Link>
            </div>
          ) : (
            <div className="cert-grid">
              {certs.map((c) => (
                <div className="cert-card" key={c.id}>
                  <div className="cert-card-ribbon"><Award size={18} /></div>
                  <h4>{c.resourceName}</h4>
                  <span className="cert-card-cat">{c.categoryLabel}</span>
                  <div className="cert-card-meta">
                    <span>Score <strong>{c.percentage}%</strong></span>
                    <span>{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                  <span className="cert-card-id">{c.id}</span>

                  <div className="cert-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(c.resourceName)}`)}><Eye size={14} /> Preview</button>
                    <button className="btn btn-outline btn-sm" disabled={busy === c.id} onClick={() => onDownload(c)}><Download size={14} /> {busy === c.id ? '…' : 'PDF'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CertificatesPage;
