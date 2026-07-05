import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ArrowLeft, Download } from 'lucide-react';
import { certificatesApi } from '../../lib/backend';
import { findResource, categoryMeta } from '../../lib/catalog';
import { downloadCertificatePDF } from '../../lib/certificates';

function VerifyCertificatePage() {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await certificatesApi.verify(certId);
      if (active) {
        if (data) {
          const res = findResource(data.resource_name);
          setCert({
            id: data.id,
            resourceName: data.resource_name,
            percentage: data.percentage,
            date: data.created_at,
            studentName: data.student_name,
            cert_status: data.cert_status,
            categoryLabel: res ? (categoryMeta[res.category]?.label || res.category) : 'General'
          });
        } else {
          setError(true);
        }
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [certId]);

  const onDownload = async () => {
    setBusy(true);
    try { await downloadCertificatePDF(cert, cert.studentName); }
    catch { window.alert('Could not generate the certificate PDF.'); }
    finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-muted)' }}>
        <header className="home-nav" style={{ position: 'static' }}>
          <div className="home-nav-in">
            <Link to="/" className="home-logo">Symbiosys AI Knowledge Base</Link>
          </div>
        </header>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading verification data...</div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-muted)' }}>
        <header className="home-nav" style={{ position: 'static' }}>
          <div className="home-nav-in">
            <Link to="/" className="home-logo">Symbiosys AI Knowledge Base</Link>
          </div>
        </header>
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', background: 'var(--card-bg)', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <ShieldAlert size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '16px', fontSize: '24px' }}>Invalid Certificate</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We couldn't find a valid certificate matching ID: <strong>{certId}</strong>.</p>
          <Link to="/" className="btn btn-primary"><ArrowLeft size={16} /> Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-muted)' }}>
      <header className="home-nav" style={{ position: 'static' }}>
        <div className="home-nav-in">
          <Link to="/" className="home-logo">Symbiosys AI Knowledge Base</Link>
          <div className="home-nav-links">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '40px auto', width: '100%' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '50%' }}>
              <ShieldCheck size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '22px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Verified Certificate
                <span style={{ fontSize: '12px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>VALID</span>
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>This certificate was securely verified via Symbiosys records.</p>
            </div>
            <button className="btn btn-outline" disabled={busy} onClick={onDownload}><Download size={16} /> {busy ? 'Generating...' : 'Download PDF'}</button>
          </div>

          <div className="cert-preview-wrap" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div className="certificate" style={{ transform: 'none', margin: '0 auto', maxWidth: '100%' }}>
              <div className="cert-border">
                <div className="cert-bar" />
                <p className="cert-org">SYMBIOSYS TECHNOLOGIES</p>
                <h1 className="cert-title">Course Completion Certificate</h1>
                <p className="cert-line">This certifies that</p>
                <p className="cert-name">{cert.studentName}</p>
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
      </div>
    </div>
  );
}

export default VerifyCertificatePage;
