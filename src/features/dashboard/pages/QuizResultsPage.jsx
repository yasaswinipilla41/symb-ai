import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Award, Eye, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { PASS_PERCENT } from '../../../lib/quizStore';
import { earnedCertificates, certificateId, downloadCertificatePDF } from '../../../lib/certificates';
import { findResource, categoryMeta } from '../../../lib/catalog';

function formatTime(s) {
  const m = Math.floor((s || 0) / 60);
  return `${m}m ${(s || 0) % 60}s`;
}

function QuizResultsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const studentName = profile?.full_name || user?.email || 'Student';

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await quizAttempts.listForUser(user.id);
      if (active) { setAttempts(data || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  // Earned certificates by resource, keyed so we can read each one's approval
  // status. A certificate is downloadable ONLY once an admin has approved it.
  const certByResource = useMemo(() => {
    const map = {};
    for (const c of earnedCertificates(attempts, user?.id)) map[c.resourceName] = c;
    return map;
  }, [attempts, user]);

  const sorted = useMemo(
    () => [...attempts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [attempts]
  );

  const downloadCert = async (resourceName, date) => {
    setBusy(resourceName);
    try {
      const res = findResource(resourceName);
      await downloadCertificatePDF({
        resourceName,
        categoryLabel: res ? (categoryMeta[res.category]?.label || res.category) : 'General',
        percentage: Math.max(...attempts.filter((a) => a.resource_name === resourceName).map((a) => Math.round(Number(a.percentage) || 0))),
        date,
        id: certificateId(user.id, resourceName),
      }, studentName);
    } catch { window.alert('Could not generate the certificate.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2">My Quiz Results</h2>
      <p className="dash-muted">Every attempt is saved permanently. Pass at {PASS_PERCENT}% to earn a certificate. {attempts.length} total.</p>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : attempts.length === 0 ? (
        <div className="empty-state">
          <Trophy size={40} />
          <p>No quiz attempts yet.</p>
          <Link to="/dashboard/quizzes" className="btn btn-primary btn-sm">Take a quiz</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Course</th><th>Score</th><th>Status</th><th>Completed</th><th>Time</th><th>Certificate</th></tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const pct = Math.round(Number(a.percentage) || 0);
                const passed = pct >= PASS_PERCENT;
                const certInfo = certByResource[a.resource_name];
                const approved = certInfo?.cert_status === 'approved';
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-user">
                        <div className="dash-avatar sm">{a.resource_name.charAt(0)}</div>
                        <strong>{a.resource_name}</strong>
                      </div>
                    </td>
                    <td><span className={`quiz-score-badge ${passed ? 'ok' : 'low'}`}><Trophy size={13} /> {pct}%</span></td>
                    <td>
                      {passed
                        ? <span className="pill-pass"><CheckCircle2 size={13} /> Passed</span>
                        : <span className="pill-fail"><XCircle size={13} /> Failed</span>}
                    </td>
                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                    <td><span className="result-mini"><Clock size={13} /> {formatTime(a.time_taken_s)}</span></td>
                    <td>
                      {!certInfo ? (
                        <span className="cert-status locked">Not earned</span>
                      ) : approved ? (
                        <div className="row-actions">
                          <button className="icon-btn sm" title="Preview certificate" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(a.resource_name)}`)}><Eye size={15} /></button>
                          <button className="icon-btn sm" title="Download certificate" disabled={busy === a.resource_name} onClick={() => downloadCert(a.resource_name, a.created_at)}><Download size={15} /></button>
                          <span className="cert-status earned"><Award size={13} /> Earned</span>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button className="icon-btn sm" title="View certificate status" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(a.resource_name)}`)}><Eye size={15} /></button>
                          <span className="cert-status locked">
                            {certInfo.cert_status === 'pending' ? 'Awaiting approval'
                              : certInfo.cert_status === 'rejected' ? 'Rejected'
                              : 'Approval required'}
                          </span>
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

export default QuizResultsPage;
