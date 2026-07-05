import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Award, Clock, FileText, ArrowLeft, ShieldCheck, Download, KeyRound, CheckCircle2, ShieldOff, Ban } from 'lucide-react';
import { profiles, quizAttempts, history, activityLogs } from '../../../lib/backend';
import { PASS_PERCENT, downloadCertificatePDF, certificateId } from '../../../lib/certificates';
import { roleLabel } from '../../../lib/roles';

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status}</span>;
}

function AdminStudentProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    const [pf, qa, hs, ac] = await Promise.all([
      profiles.get(userId),
      quizAttempts.listForUser(userId),
      history.listForUser(userId),
      activityLogs.listForUser(userId)
    ]);
    setProfile(pf.data || null);
    setAttempts(qa.data || []);
    setUserHistory(hs.data || []);
    setActivity(ac.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const bestAttempts = useMemo(() => {
    const best = {};
    attempts.forEach(a => {
      const pct = Number(a.percentage) || 0;
      const key = a.resource_name;
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
          if (pct > cur.percentage || (pct === cur.percentage && new Date(a.created_at) > new Date(cur.created_at))) {
            best[key] = { ...a, percentage: pct };
          }
        }
      }
    });
    return Object.values(best).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [attempts]);

  const certHistory = bestAttempts.filter(a => a.percentage >= PASS_PERCENT);
  
  const loginActivity = activity.filter(a => a.action === 'login').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const materialHistory = userHistory.filter(h => h.type === 'view_material' || h.type === 'download_material' || h.type === 'view_flashcard').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleDownload = async (a, studentName) => {
    setBusy('dl-' + a.id);
    try {
      const cert = {
        resourceName: a.resource_name,
        categoryLabel: 'General',
        percentage: Math.round(a.percentage),
        date: a.created_at,
        id: certificateId(a.user_id, a.resource_name),
      };
      await downloadCertificatePDF(cert, studentName);
    } catch {
      window.alert('Could not download certificate.');
    }
    setBusy(null);
  };

  const handleApprove = async (a) => {
    setBusy(a.id);
    await quizAttempts.update(a.id, { cert_status: 'approved', cert_id: a.cert_id || certificateId(a.user_id, a.resource_name) });
    await load();
    setBusy(null);
  };

  if (loading) return <div className="dash-page"><p className="empty-hint">Loading profile...</p></div>;
  if (!profile) return <div className="dash-page"><p className="empty-hint">User not found.</p></div>;

  const studentName = profile.full_name || profile.email || 'Student';

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Student Profile</h2>
          <p className="dash-muted">Detailed view of {studentName}'s history and statistics.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="dash-avatar lg" style={{ objectFit: 'cover', width: 96, height: 96, fontSize: '3rem' }} />
          ) : (
            <div className="dash-avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-slate-200)', color: 'var(--color-slate-500)', width: 96, height: 96 }}>
              <User size={48} />
            </div>
          )}
        </div>
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{studentName}</h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--color-slate-500)' }}>{profile.email}</p>
          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div><dt>Employee ID</dt><dd>{profile.employee_id || '—'}</dd></div>
            <div><dt>Department</dt><dd>{profile.department || '—'}</dd></div>
            <div><dt>Registered</dt><dd>{new Date(profile.created_at).toLocaleDateString()}</dd></div>
            <div><dt>Role</dt><dd className="cap">{roleLabel(profile.role)}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={profile.status} /></dd></div>
          </div>
        </div>
      </div>

      <div className="dash-two-col">
        <div className="panel">
          <div className="panel-head"><h3><Award size={16} /> Certificate History</h3></div>
          {certHistory.length === 0 ? (
            <p className="empty-hint">No certificates earned yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Course</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {certHistory.map(a => {
                    const status = a.cert_status || 'none';
                    return (
                      <tr key={a.id}>
                        <td>{a.resource_name}</td>
                        <td>{Math.round(a.percentage)}%</td>
                        <td>
                          {status === 'approved' && <span className="badge-green">Approved</span>}
                          {status === 'pending' && <span className="badge-amber">Pending</span>}
                          {status === 'rejected' && <span className="badge-red">Rejected</span>}
                          {status === 'none' && <span className="dash-muted">No Request</span>}
                        </td>
                        <td>
                          {status === 'approved' && (
                            <button className="btn btn-outline btn-sm" disabled={busy === 'dl-' + a.id} onClick={() => handleDownload(a, studentName)}>
                              <Download size={14} /> DL
                            </button>
                          )}
                          {status === 'pending' && (
                            <button className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => handleApprove(a)}>
                              Approve
                            </button>
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

        <div className="panel">
          <div className="panel-head"><h3><FileText size={16} /> Quiz History</h3></div>
          {attempts.length === 0 ? (
            <p className="empty-hint">No quiz attempts yet.</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Course</th><th>Score</th><th>Result</th><th>Date</th></tr></thead>
                <tbody>
                  {attempts.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(a => (
                    <tr key={a.id}>
                      <td>{a.resource_name}</td>
                      <td>{Math.round(a.percentage)}%</td>
                      <td>
                        <span className={`badge-${a.percentage >= PASS_PERCENT ? 'green' : 'red'}`}>
                          {a.percentage >= PASS_PERCENT ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.9em', color: 'var(--color-slate-500)' }}>
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="dash-two-col" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <div className="panel-head"><h3><Clock size={16} /> Learning Materials Progress</h3></div>
          {materialHistory.length === 0 ? (
            <p className="empty-hint">No material history recorded.</p>
          ) : (
            <ul className="mini-list" style={{ padding: '0 1rem 1rem 1rem' }}>
              {materialHistory.slice(0, 10).map((h) => (
                <li key={h.id}>
                  <span className="mini-dot" />
                  <span className="mini-title">{h.title}</span>
                  <span className="mini-time">{new Date(h.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3><KeyRound size={16} /> Login Activity</h3></div>
          {loginActivity.length === 0 ? (
            <p className="empty-hint">No login activity recorded.</p>
          ) : (
            <ul className="mini-list" style={{ padding: '0 1rem 1rem 1rem' }}>
              {loginActivity.slice(0, 10).map((a) => (
                <li key={a.id}>
                  <span className="mini-dot" />
                  <span className="mini-title">Signed In</span>
                  <span className="mini-time">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

export default AdminStudentProfile;
