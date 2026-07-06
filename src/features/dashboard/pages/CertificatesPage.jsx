import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Eye, Download, Sparkles, Lock, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { useResourcesStore } from '../../../lib/useResourcesStore';
import {
  earnedCertificates, downloadCertificatePDF, downloadWorkshopCertificatePDF,
  PASS_PERCENT, certificateId,
} from '../../../lib/certificates';
import {
  WORKSHOPS, WORKSHOP_PASS_PERCENT, workshopProgress, workshopAttempt,
} from '../../../lib/workshops';

function CertificatesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  // Live merged catalog — used to know the CURRENT set of AI Tools required to
  // complete a workshop (so admin-added tools count and the total is accurate).
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

  // ---- Workshop awards ------------------------------------------------------
  const workshops = useMemo(
    () => WORKSHOPS.map((w) => {
      const required = liveResources.filter((r) => r.category === w.categorySlug).map((r) => r.name);
      return {
        workshop: w,
        progress: workshopProgress(w, attempts, required),
        attempt: workshopAttempt(w, attempts),
      };
    }),
    [attempts, liveResources]
  );

  const requestWorkshop = async (w, progress) => {
    setBusy(`ws-${w.slug}`);
    try {
      const { error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: w.resourceName,
        score: 0,
        max_score: 0,
        // 100 = the workshop was fully completed (every required tool passed).
        // Stored so the certificate's verification QR resolves (the public
        // verify RPC only returns certificates at >= 80%). This sentinel row is
        // filtered out of quiz-results / leaderboard everywhere else.
        percentage: 100,
        correct_count: 0,
        wrong_count: 0,
        time_taken_s: 0,
        status: 'completed',
        answers: [],
        cert_status: 'pending',
        cert_id: certificateId(user.id, w.resourceName),
      });
      if (error) {
        window.alert(`Could not request the workshop certificate: ${error.message || error}`);
      } else {
        await reload();
      }
    } finally {
      setBusy('');
    }
  };

  const downloadWorkshop = async (w, attempt) => {
    setBusy(`wsdl-${w.slug}`);
    try {
      await downloadWorkshopCertificatePDF(
        w,
        {
          id: attempt.cert_id || certificateId(user.id, w.resourceName),
          date: attempt.created_at || new Date().toISOString(),
        },
        studentName
      );
    } catch {
      window.alert('Could not generate the workshop certificate PDF.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2"><Award size={22} style={{ verticalAlign: '-4px' }} /> My Certificates</h2>
      <p className="dash-muted">Earn a certificate by scoring {PASS_PERCENT}% or higher on any course quiz.</p>

      {loading || catalogLoading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <>
          {/* ---- Workshop awards ------------------------------------------- */}
          {workshops.map(({ workshop, progress, attempt }) => {
            const status = attempt?.cert_status || 'none';
            const certId = attempt?.cert_id || certificateId(user.id, workshop.resourceName);
            return (
              <div className="cert-card cert-card-workshop" key={workshop.slug} style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <div className="cert-card-ribbon" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}><Sparkles size={18} /></div>
                <span className="cert-card-cat" style={{ color: '#7c3aed' }}>Workshop Award</span>
                <h4 style={{ marginTop: '0.15rem' }}>{workshop.title}</h4>
                <p className="dash-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.6rem' }}>
                  Complete every AI Tools quiz at {WORKSHOP_PASS_PERCENT}% or higher to earn this.
                </p>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--color-slate-200, #e5e7eb)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress.total ? Math.round((progress.passedCount / progress.total) * 100) : 0}%`,
                      height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', whiteSpace: 'nowrap' }}>
                    {progress.passedCount} / {progress.total} passed
                  </span>
                </div>

                {status !== 'none' && <span className="cert-card-id">{certId}</span>}

                <div className="cert-card-actions">
                  {!progress.completed ? (
                    <span className="cert-status locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={14} /> {progress.total - progress.passedCount} more AI Tool{progress.total - progress.passedCount === 1 ? '' : 's'} to go
                    </span>
                  ) : status === 'approved' ? (
                    <button className="btn btn-primary btn-sm" disabled={busy === `wsdl-${workshop.slug}`} onClick={() => downloadWorkshop(workshop, attempt)}>
                      <Download size={14} /> {busy === `wsdl-${workshop.slug}` ? '…' : 'Download PDF'}
                    </button>
                  ) : status === 'pending' ? (
                    <span className="cert-status locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> Pending admin approval
                    </span>
                  ) : status === 'rejected' ? (
                    <>
                      <span className="cert-status locked" style={{ color: 'var(--color-red)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Rejected</span>
                      <button className="btn btn-outline btn-sm" disabled={busy === `ws-${workshop.slug}`} onClick={() => requestWorkshop(workshop, progress)}>Request again</button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" disabled={busy === `ws-${workshop.slug}`} onClick={() => requestWorkshop(workshop, progress)}>
                      <ShieldCheck size={14} /> {busy === `ws-${workshop.slug}` ? 'Requesting…' : 'Request Certificate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* ---- Course certificates -------------------------------------- */}
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
                    {c.cert_status === 'approved' ? (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(c.resourceName)}`)}><Eye size={14} /> Preview</button>
                        <button className="btn btn-outline btn-sm" disabled={busy === c.id} onClick={() => onDownload(c)}><Download size={14} /> {busy === c.id ? '…' : 'PDF'}</button>
                      </>
                    ) : c.cert_status === 'pending' ? (
                      <span className="dash-muted" style={{ fontSize: '0.85rem' }}>Pending Approval</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        const certId = c.id || certificateId(user.id, c.resourceName);
                        const { error } = await quizAttempts.update(c.attemptId, { cert_status: 'pending', cert_id: certId });
                        if (error) {
                          console.error(error);
                          window.alert(`Failed to request certificate. Error: ${error.message || JSON.stringify(error)}`);
                        } else {
                          await reload();
                        }
                      }}>
                        Request Certificate
                      </button>
                    )}
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
