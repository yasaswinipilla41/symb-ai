import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts } from '../../../lib/backend';
import { findResource, categoryMeta } from '../../../lib/catalog';
import {
  certificateId, downloadCertificatePDF, certVerificationText, qrDataUrl, PASS_PERCENT,
} from '../../../lib/certificates';

function CertificatePage() {
  const { resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  const studentName = profile?.full_name || user?.email || 'Student';

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await quizAttempts.listForUser(user.id);
      if (active) {
        setAttempts((data || []).filter((a) => a.resource_name === resourceName));
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, resourceName]);

  const cert = useMemo(() => {
    const passing = attempts
      .map((a) => ({ ...a, percentage: Number(a.percentage) || 0 }))
      .filter((a) => a.percentage >= PASS_PERCENT)
      .sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
    if (!passing.length) return null;
    const best = passing.reduce((m, a) => (a.percentage > m.percentage ? a : m), passing[0]);
    const res = findResource(resourceName);
    return {
      resourceName,
      category: res?.category || null,
      categoryLabel: res ? (categoryMeta[res.category]?.label || res.category) : 'General',
      percentage: Math.round(best.percentage),
      date: passing[0].created_at, // earliest pass = completion date
      id: certificateId(user.id, resourceName),
      cert_status: best.cert_status || 'none',
      attemptId: best.id,
    };
  }, [attempts, resourceName, user]);

  useEffect(() => {
    let active = true;
    if (cert) qrDataUrl(certVerificationText(cert, studentName)).then((d) => { if (active) setQr(d); });
    return () => { active = false; };
  }, [cert, studentName]);

  if (loading) return <div className="dash-page"><p className="empty-hint">Loading…</p></div>;

  if (!cert) {
    return (
      <div className="dash-page">
        <div className="empty-state">
          <Lock size={40} />
          <p>You haven't earned this certificate yet.</p>
          <p className="dash-muted">Score {PASS_PERCENT}% or higher on the {resourceName} quiz to unlock it.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/dashboard/quizzes/${encodeURIComponent(resourceName)}`)}>Take the quiz</button>
        </div>
      </div>
    );
  }

  const onDownload = async () => {
    setBusy(true);
    try { await downloadCertificatePDF(cert, studentName); }
    catch { window.alert('Could not generate the certificate PDF.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="dash-page">
      <div className="cert-toolbar no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
        <div className="cert-toolbar-actions">
          <button className="btn btn-outline btn-sm" disabled={busy} onClick={onDownload}><Download size={15} /> {busy ? 'Preparing…' : 'Download PDF'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={15} /> Print</button>
        </div>
      </div>

      <div className="cert-preview-wrap" id="printable-cert">
        <div className="certificate">
          <div className="cert-border">
            <div className="cert-bar" />
            <p className="cert-org">SYMBIOSYS TECHNOLOGIES</p>
            <h1 className="cert-title">Course Completion Certificate</h1>
            <p className="cert-line">This certifies that</p>
            <p className="cert-name">{studentName}</p>
            <p className="cert-line">has successfully completed the learning module and assessment for</p>
            <p className="cert-course">{cert.resourceName}</p>
            <p className="cert-meta">Category: {cert.categoryLabel} &nbsp;·&nbsp; Score: {cert.percentage}% &nbsp;·&nbsp; <strong>Successfully Completed</strong></p>

            <div className="cert-footer-row">
              <div className="cert-sign">
                <img src="/signature.jpg" alt="Signature" style={{ width: '120px', height: 'auto', marginBottom: '-5px' }} />
                <div className="cert-sign-line" />
                <strong>Symbiosys Technologies</strong>
                <span>Authorized Signature</span>
              </div>
              <div className="cert-seal" style={{ border: 'none', background: 'transparent' }}>
                <img src="/logo.jpg" alt="Symbiosys Logo" style={{ width: '120px', height: 'auto' }} />
              </div>
              <div className="cert-verify">
                {qr && <img src={qr} alt="Verification QR" className="cert-qr" />}
                <div className="cert-idblock">
                  <span>Certificate ID</span>
                  <strong>{cert.id}</strong>
                  <span>{new Date(cert.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <p className="cert-tagline">Successfully Completed – Certified by Symbiosys Technologies</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertificatePage;
