import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Eye, Download } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { earnedCertificates, downloadCertificatePDF, PASS_PERCENT, certificateId } from '../../../lib/certificates';

function CertificatesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const studentName = profile?.full_name || user?.email || 'Student';

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await quizAttempts.listForUser(user.id);
      if (active) { setCerts(earnedCertificates(data || [], user.id)); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const onDownload = async (cert) => {
    setBusy(cert.id);
    try { await downloadCertificatePDF(cert, studentName); }
    catch { window.alert('Could not generate the certificate PDF.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2"><Award size={22} style={{ verticalAlign: '-4px' }} /> My Certificates</h2>
      <p className="dash-muted">Earn a certificate by scoring {PASS_PERCENT}% or higher on any course quiz.</p>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : certs.length === 0 ? (
        <div className="empty-state">
          <Award size={40} />
          <p>No certificates yet. Pass a quiz at {PASS_PERCENT}% to earn your first one.</p>
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
                      setCerts(certs.map(cert => cert.id === c.id ? { ...cert, id: certId, cert_status: 'pending' } : cert));
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
    </div>
  );
}

export default CertificatesPage;
