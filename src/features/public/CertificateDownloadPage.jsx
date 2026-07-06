// Public certificate download page — the destination of the emailed link.
//
// Route: /certificate-download/:token  (no login required — the token is the
// credential). The token is validated server-side (/api/redeem-cert-token, or
// the mock store offline). If it is valid and unexpired we render the
// certificate and let the user download it as a PDF using the same generator
// the in-app certificate pages use. Expired/invalid tokens get a friendly page.

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ShieldCheck, Clock, AlertTriangle, Loader } from 'lucide-react';
import { redeemCertToken } from '../../lib/certificateApi';
import { findResource, categoryMeta } from '../../lib/catalog';
import {
  downloadCertificatePDF, certVerificationText, qrDataUrl,
} from '../../lib/certificates';

function buildCert(raw) {
  const res = findResource(raw.resourceName);
  return {
    ...raw,
    category: res?.category || null,
    categoryLabel: res ? (categoryMeta[res.category]?.label || res.category) : 'General',
  };
}

export default function CertificateDownloadPage() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await redeemCertToken(token);
      if (!active) return;
      if (!r.ok) {
        setState({ status: 'error', code: r.error, reason: r.reason });
      } else {
        setState({
          status: 'ready',
          cert: buildCert(r.cert),
          studentName: r.studentName,
          expiresAt: r.expiresAt,
        });
      }
    })();
    return () => { active = false; };
  }, [token]);

  const cert = state.cert;
  const studentName = state.studentName;

  useEffect(() => {
    let active = true;
    if (cert) qrDataUrl(certVerificationText(cert, studentName)).then((d) => { if (active) setQr(d); });
    return () => { active = false; };
  }, [cert, studentName]);

  const expiresLabel = useMemo(() => {
    if (!state.expiresAt) return '';
    try { return new Date(state.expiresAt).toLocaleString(); } catch { return ''; }
  }, [state.expiresAt]);

  const onDownload = async () => {
    setBusy(true);
    try { await downloadCertificatePDF(cert, studentName); }
    catch { window.alert('Could not generate the certificate PDF.'); }
    finally { setBusy(false); }
  };

  if (state.status === 'loading') {
    return (
      <div className="cert-dl-shell">
        <div className="cert-dl-card">
          <Loader size={34} className="spin" />
          <p className="dash-muted">Validating your download link…</p>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    const expired = state.code === 'expired';
    return (
      <div className="cert-dl-shell">
        <div className="cert-dl-card">
          {expired ? <Clock size={40} color="#b45309" /> : <AlertTriangle size={40} color="#dc2626" />}
          <h2 style={{ margin: '0.5rem 0' }}>{expired ? 'Link expired' : 'Invalid link'}</h2>
          <p className="dash-muted">{state.reason}</p>
          <Link to="/login" className="btn btn-primary btn-sm">Go to the portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cert-dl-shell">
      <div className="cert-dl-head">
        <div className="cert-dl-badge"><ShieldCheck size={16} /> Certificate approved</div>
        <h1>Hi {studentName}, your certificate is ready</h1>
        <p className="dash-muted">
          Download it as a PDF below.
          {expiresLabel && <> This link is valid until <strong>{expiresLabel}</strong>.</>}
        </p>
        <div className="cert-dl-actions">
          <button className="btn btn-primary" disabled={busy} onClick={onDownload}>
            <Download size={16} /> {busy ? 'Preparing…' : 'Download PDF'}
          </button>
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
            <p className="cert-meta">
              Category: {cert.categoryLabel}
              {cert.percentage != null && <> &nbsp;·&nbsp; Score: {cert.percentage}%</>}
              &nbsp;·&nbsp; <strong>Successfully Completed</strong>
            </p>

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
