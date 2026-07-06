import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Award, Check, X, Eye, Download, ShieldCheck, Clock, Mail, Sparkles } from 'lucide-react';
import { quizAttempts, profiles } from '../../../lib/backend';
import { PASS_PERCENT, downloadCertificatePDF, downloadModuleCertificatePDF, certificateId } from '../../../lib/certificates';
import { approveCertificate } from '../../../lib/certificateApi';
import { isModuleCertResource, moduleCertSlug, moduleCertMeta, moduleLabel } from '../../../lib/workshops';

function AdminLeaderboard() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

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

  const bestAttempts = useMemo(() => {
    const best = {};
    
    attempts.forEach(a => {
      if (isModuleCertResource(a.resource_name)) return; // module awards handled separately
      const pct = Number(a.percentage) || 0;
      if (pct < PASS_PERCENT) return; // View only requests from students who have passed the quiz.

      const key = `${a.user_id}::${a.resource_name}`;
      const cur = best[key];
      
      const hasRequest = (attempt) => attempt.cert_status && attempt.cert_status !== 'none';
      
      if (!cur) {
        best[key] = { ...a, percentage: pct };
      } else {
        const curHas = hasRequest(cur);
        const aHas = hasRequest(a);
        
        if (aHas && !curHas) {
          best[key] = { ...a, percentage: pct };
        } else if (!aHas && curHas) {
          // keep cur
        } else {
          // both have or both don't have, pick highest score
          if (pct > cur.percentage || (pct === cur.percentage && new Date(a.created_at) > new Date(cur.created_at))) {
            best[key] = { ...a, percentage: pct };
          }
        }
      }
    });
    
    return Object.values(best).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [attempts]);

  const handleApprove = async (a) => {
    setBusy(a.id);
    try {
      const studentName = userMap[a.user_id]?.full_name || userMap[a.user_id]?.email || 'the student';
      const result = await approveCertificate(a);
      if (result.emailed) {
        window.alert(`Certificate approved. A download link was emailed to ${result.to || studentName}. It expires in 24 hours.`);
      } else if (result.link) {
        const note = result.mock
          ? 'Certificate approved. Email is disabled in offline/demo mode — share this 24-hour download link:'
          : `Certificate approved, but the email could not be sent${result.emailError ? ` (${result.emailError})` : ''}. Share this 24-hour download link:`;
        window.prompt(note, result.link);
      } else {
        window.alert('Certificate approved.');
      }
    } catch (e) {
      window.alert(`Approval failed: ${e.message}`);
    } finally {
      await load();
      setBusy(null);
    }
  };

  // Re-issue the download link for an already-approved certificate. Reuses the
  // approve flow, which mints a fresh 24h token and re-emails it to the student.
  const handleResend = async (a) => {
    setBusy('rs-' + a.id);
    try {
      const studentName = userMap[a.user_id]?.full_name || userMap[a.user_id]?.email || 'the student';
      const result = await approveCertificate(a);
      if (result.emailed) {
        window.alert(`A new 24-hour download link was emailed to ${result.to || studentName}.`);
      } else if (result.link) {
        const note = result.mock
          ? 'Email is disabled in offline/demo mode — share this 24-hour download link:'
          : `The link could not be emailed${result.emailError ? ` (${result.emailError})` : ''}. Copy this 24-hour download link and send it to the student:`;
        window.prompt(note, result.link);
      } else {
        window.alert(`Could not send the download link${result.emailError ? `:\n\n${result.emailError}` : '.'}`);
      }
    } catch (e) {
      window.alert(`Could not resend link: ${e.message}`);
    } finally {
      await load();
      setBusy(null);
    }
  };

  const handleReject = async (a) => {
    if (!window.confirm("Are you sure you want to reject this certificate request?")) return;
    setBusy(a.id);
    await quizAttempts.update(a.id, { cert_status: 'rejected' });
    await load();
    setBusy(null);
  };

  // --- Module certificate approvals ----------------------------------------
  // Sentinel quiz_attempts rows whose resource_name is a module cert. Dedupe to
  // the most recent row per student per module (a re-request inserts a new row).
  const moduleRequests = useMemo(() => {
    const latest = {};
    for (const a of attempts) {
      if (!isModuleCertResource(a.resource_name)) continue;
      const key = `${a.user_id}::${a.resource_name}`;
      const cur = latest[key];
      if (!cur || new Date(a.created_at) > new Date(cur.created_at)) latest[key] = a;
    }
    return Object.values(latest).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [attempts]);

  const setModuleStatus = async (a, cert_status) => {
    setBusy(`ws-${a.id}`);
    try {
      // Module certificates are delivered in-app (no emailed token link), so
      // approval is a direct status update rather than the /api approve flow.
      await quizAttempts.update(a.id, { cert_status });
    } finally {
      await load();
      setBusy(null);
    }
  };

  const handleModuleDownload = async (a, studentName) => {
    const slug = moduleCertSlug(a.resource_name);
    if (!slug) return;
    setBusy(`wsdl-${a.id}`);
    try {
      await downloadModuleCertificatePDF(
        moduleCertMeta(slug, moduleLabel(slug)),
        { id: a.cert_id || certificateId(a.user_id, a.resource_name), date: a.created_at },
        studentName
      );
    } catch {
      window.alert('Could not download the module certificate.');
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (a, studentName) => {
    setBusy('dl-' + a.id);
    try {
      const cert = {
        resourceName: a.resource_name,
        categoryLabel: 'General', // fallback, admin might not need perfect category matching here or we can lookup
        percentage: Math.round(a.percentage),
        date: a.created_at,
        id: a.cert_id || certificateId(a.user_id, a.resource_name),
      };
      await downloadCertificatePDF(cert, studentName);
    } catch {
      window.alert('Could not download certificate.');
    }
    setBusy(null);
  };

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Leaderboard & Approvals</h2>
          <p className="dash-muted">Manage student quiz scores and certificate requests.</p>
        </div>
      </div>

      {!loading && moduleRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0 0.75rem' }}>
            <Sparkles size={18} style={{ color: '#7c3aed' }} />
            <strong>Module Certificate Approvals</strong>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Module</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {moduleRequests.map(a => {
                const u = userMap[a.user_id];
                const studentName = u?.full_name || u?.email || 'Student';
                const slug = moduleCertSlug(a.resource_name);
                const meta = slug ? moduleCertMeta(slug, moduleLabel(slug)) : null;
                const status = a.cert_status || 'pending';
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ lineHeight: 1.4 }}>{studentName}</strong>
                        <span style={{ fontSize: '0.85em', color: 'var(--color-slate-500)' }}>{u?.email}</span>
                      </div>
                    </td>
                    <td>{meta?.label || a.resource_name}</td>
                    <td>
                      {status === 'approved' && <span className="badge-green"><ShieldCheck size={12} /> Approved</span>}
                      {status === 'pending' && <span className="badge-amber"><Clock size={12} /> Pending</span>}
                      {status === 'rejected' && <span className="badge-red"><X size={12} /> Rejected</span>}
                    </td>
                    <td style={{ color: 'var(--color-slate-500)', fontSize: '0.9em' }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" disabled={busy === `ws-${a.id}`} onClick={() => setModuleStatus(a, 'approved')}>Approve</button>
                          <button className="btn btn-outline btn-sm" disabled={busy === `ws-${a.id}`} onClick={() => { if (window.confirm('Reject this module certificate request?')) setModuleStatus(a, 'rejected'); }}>Reject</button>
                        </div>
                      ) : status === 'approved' ? (
                        <button className="btn btn-outline btn-sm" disabled={busy === `wsdl-${a.id}`} onClick={() => handleModuleDownload(a, studentName)}>
                          <Download size={14} /> DL
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={busy === `ws-${a.id}`} onClick={() => setModuleStatus(a, 'approved')}>Approve</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading ? (
        <p className="empty-hint">Loading...</p>
      ) : bestAttempts.length === 0 ? (
        <div className="empty-state">
          <Award size={40} />
          <p>No successful quiz attempts recorded yet.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Photo</th>
                <th>Student</th>
                <th>Course</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
                <th>Certificate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bestAttempts.map(a => {
                const u = userMap[a.user_id];
                const studentName = u?.full_name || u?.email || 'Student';
                const passed = a.percentage >= PASS_PERCENT;
                const status = a.cert_status || 'none';
                return (
                  <tr key={a.id}>
                    <td onClick={() => navigate(`/admin/student/${a.user_id}`)} style={{ cursor: 'pointer' }}>
                      {u?.avatar_url ? (
                        <img src={u.avatar_url} alt="Profile" className="dash-avatar sm" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="dash-avatar sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-slate-200)', color: 'var(--color-slate-500)' }}>
                          <User size={16} />
                        </div>
                      )}
                    </td>
                    <td onClick={() => navigate(`/admin/student/${a.user_id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong className="hover-underline" style={{ lineHeight: '1.4' }}>{studentName}</strong>
                        <span style={{ fontSize: '0.85em', color: 'var(--color-slate-500)' }}>{u?.email}</span>
                      </div>
                    </td>
                    <td>{a.resource_name}</td>
                    <td>
                      <strong style={{ color: passed ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {a.percentage}%
                      </strong>
                    </td>
                    <td>
                      <span className={`badge-${passed ? 'green' : 'red'}`}>
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-slate-500)', fontSize: '0.9em' }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {status === 'approved' && <span className="badge-green"><ShieldCheck size={12} /> Approved</span>}
                      {status === 'pending' && <span className="badge-amber"><Clock size={12} /> Pending</span>}
                      {status === 'rejected' && <span className="badge-red"><X size={12} /> Rejected</span>}
                      {status === 'none' && <span className="dash-muted">No Request</span>}
                    </td>
                    <td>
                      {status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => handleApprove(a)}>Approve</button>
                          <button className="btn btn-outline btn-sm" disabled={busy === a.id} onClick={() => handleReject(a)}>Reject</button>
                        </div>
                      )}
                      {status === 'approved' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/certificate/${a.user_id}/${encodeURIComponent(a.resource_name)}`)}>
                            <Eye size={14} /> View
                          </button>
                          <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                            <Download size={14} /> DL
                          </button>
                          <button className="btn btn-outline btn-sm" disabled={busy === 'rs-' + a.id} onClick={() => handleResend(a)} title="Email a fresh 24-hour download link to the student">
                            <Mail size={14} /> {busy === 'rs-' + a.id ? 'Sending…' : 'Resend link'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminLeaderboard;
