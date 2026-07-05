import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { quizAttempts, profiles } from '../../../lib/backend';
import { findResource, categoryMeta } from '../../../lib/catalog';
import {
  certificateId, downloadCertificatePDF, certVerificationText, qrDataUrl, PASS_PERCENT,
} from '../../../lib/certificates';

function AdminCertificatePage() {
  const { userId, resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const { user, profile } = useAuth(); // Just to verify we are admin

  const [attempts, setAttempts] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    let active = true;
    (async () => {
      const [qa, pf] = await Promise.all([
        quizAttempts.listForUser(userId),
        profiles.list()
      ]);
      if (active) {
        setAttempts((qa.data || []).filter((a) => a.resource_name === resourceName));
        const stu = (pf.data || []).find(p => p.user_id === userId);
        setStudentProfile(stu);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [profile, userId, resourceName]);

  const studentName = studentProfile?.full_name || studentProfile?.email || 'Student';

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
      date: passing[0].created_at,
      id: certificateId(userId, resourceName),
      cert_status: best.cert_status || 'none',
      attemptId: best.id,
    };
  }, [attempts, resourceName, userId]);

  useEffect(() => {
    let active = true;
    if (cert) qrDataUrl(certVerificationText(cert, studentName)).then((d) => { if (active) setQr(d); });
    return () => { active = false; };
  }, [cert, studentName]);

  if (profile?.role !== 'admin') {
    return <div className="dash-page"><p className="empty-hint">Unauthorized</p></div>;
  }

  if (loading) return <div className="dash-page"><p className="empty-hint">Loading…</p></div>;

  if (!cert) {
    return (
      <div className="dash-page">
        <div className="empty-state">
          <Lock size={40} />
          <p>Student hasn't earned this certificate yet.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>Go Back</button>
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

export default AdminCertificatePage;
