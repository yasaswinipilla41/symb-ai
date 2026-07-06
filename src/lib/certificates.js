// Certificate logic.
//
// A certificate is EARNED when a student's best attempt on a resource's quiz is
// >= PASS_PERCENT (80%). Certificates are therefore derived from quiz_attempts —
// no extra table needed. The certificate ID is deterministic (stable) from the
// student id + course name, so the same pass always yields the same ID.

import { PASS_PERCENT } from './quizFromMaterial';
import { findResource, categoryMeta } from './catalog';

const ORG = 'Symbiosys Technologies';

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Stable, human-readable certificate ID: SYM-XXXX-XXXX
export function certificateId(userId, resourceName) {
  const a = hash32(`${userId}::${resourceName}`).toString(36).toUpperCase().padStart(6, '0').slice(0, 4);
  const b = hash32(`${resourceName}::${userId}`).toString(36).toUpperCase().padStart(6, '0').slice(0, 4);
  return `SYM-${a}-${b}`;
}

// Best passing attempt per resource → one certificate each.
export function earnedCertificates(attempts, userId) {
  const bestByResource = {};
  for (const a of attempts) {
    const pct = Number(a.percentage) || 0;
    const cur = bestByResource[a.resource_name];
    if (!cur || pct > cur.percentage || (pct === cur.percentage && new Date(a.created_at) < new Date(cur.created_at))) {
      bestByResource[a.resource_name] = { ...a, percentage: pct, cert_status: a.cert_status || 'none' };
    }
  }
  return Object.values(bestByResource)
    .filter((a) => a.percentage >= PASS_PERCENT)
    .map((a) => {
      const res = findResource(a.resource_name);
      return {
        resourceName: a.resource_name,
        category: res?.category || null,
        categoryLabel: res ? (categoryMeta[res.category]?.label || res.category) : 'General',
        percentage: Math.round(a.percentage),
        date: a.created_at,
        id: a.cert_id || certificateId(a.user_id || userId, a.resource_name),
        cert_status: a.cert_status || 'none',
        attemptId: a.id,
      };
    })
    .sort((x, y) => new Date(y.date) - new Date(x.date));
}

export function hasCertificate(attempts, resourceName) {
  return attempts.some((a) => a.resource_name === resourceName && (Number(a.percentage) || 0) >= PASS_PERCENT);
}

// Verification QR payload.
// Base URL is derived from the running origin so the QR always points at the
// domain the app is actually served from. Set VITE_PUBLIC_BASE_URL to pin a
// canonical domain (e.g. a custom cert-verification domain) if needed.
export function certVerificationText(cert, studentName) {
  const envBase = import.meta.env.VITE_PUBLIC_BASE_URL?.trim();
  const base =
    envBase ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/verify/${cert.id}`;
}

async function qrDataUrl(text) {
  try {
    const QR = (await import('qrcode')).default;
    return await QR.toDataURL(text, { margin: 1, width: 220, color: { dark: '#1e1b4b', light: '#ffffff' } });
  } catch {
    return null;
  }
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

// Build the certificate as a landscape PDF and trigger download.
export async function downloadCertificatePDF(cert, studentName) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background + double border
  doc.setFillColor('#ffffff'); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor('#4f46e5'); doc.setLineWidth(6); doc.rect(24, 24, W - 48, H - 48);
  doc.setDrawColor('#c7d2fe'); doc.setLineWidth(1.5); doc.rect(36, 36, W - 72, H - 72);

  // Top bar
  doc.setFillColor('#4f46e5'); doc.rect(36, 36, W - 72, 10, 'F');

  const cx = W / 2;
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(ORG.toUpperCase(), cx, 90, { align: 'center' });

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(34);
  doc.text('Course Completion Certificate', cx, 140, { align: 'center' });

  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('This certifies that', cx, 180, { align: 'center' });

  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  doc.text(studentName || 'Student', cx, 220, { align: 'center' });
  doc.setDrawColor('#e5e7eb'); doc.setLineWidth(1); doc.line(cx - 160, 232, cx + 160, 232);

  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('has successfully completed the learning module and assessment for', cx, 262, { align: 'center' });

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text(cert.resourceName, cx, 296, { align: 'center' });

  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  doc.text(`Category: ${cert.categoryLabel}   ·   Score: ${cert.percentage}%   ·   Successfully Completed`, cx, 322, { align: 'center' });

  // ── Footer section ─────────────────────────────────────────────────────────
  // A4 landscape = 841 × 595 pt.
  // Inner border bottom edge = 36 + (H - 72) = H - 36 = 559 pt.
  // Outer border bottom edge = 24 + (H - 48) = H - 24 = 571 pt.
  //
  // Layout targets (matching on-screen UI proportions):
  //   footerRowTop  – shared top edge for sig image, logo image and QR code
  //   signLineY     – underline beneath the signature image
  //   taglineY      – tagline baseline, must stay above inner-border bottom (559)
  //
  const footerRowTop = H - 190;         // 405 pt  – lifts the whole footer row
  const signLineY    = footerRowTop + 58; // 463 pt  – tight gap after sig image
  const taglineY     = H - 50;           // 545 pt  – 14 pt above inner border (559)

  // Left column – signature image, then rule, then labels
  const leftX = 170;
  const sigW  = 120;
  try {
    const sigImg = await loadImage('/signature.jpg');
    const sigH   = (sigImg.height / sigImg.width) * sigW;
    doc.addImage(sigImg, 'JPEG', leftX - sigW / 2, footerRowTop, sigW, sigH);
  } catch (e) {
    console.error('Could not load signature', e);
  }

  doc.setDrawColor('#9ca3af'); doc.setLineWidth(1);
  doc.line(leftX - 80, signLineY, leftX + 80, signLineY);
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Symbiosys Technologies', leftX, signLineY + 16, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Authorized Signature', leftX, signLineY + 30, { align: 'center' });

  // Centre column – logo, vertically centred within the image band
  const logoW = 130;
  try {
    const logoImg = await loadImage('/logo.jpg');
    const logoH   = (logoImg.height / logoImg.width) * logoW;
    const logoBandH = signLineY - footerRowTop;           // height of image band
    const logoTopY  = footerRowTop + (logoBandH - logoH) / 2;
    doc.addImage(logoImg, 'JPEG', cx - logoW / 2, logoTopY, logoW, logoH);
  } catch (e) {
    console.error('Could not load logo', e);
  }

  // Right column – QR code + ID block, top-aligned with footer row
  const qrSize = 72;
  const qrX    = W - 218;
  const qrY    = footerRowTop;
  const idX    = qrX + qrSize + 12;

  const qr = await qrDataUrl(certVerificationText(cert, studentName));
  if (qr) doc.addImage(qr, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Certificate ID', idX, qrY + 14, { align: 'left' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(cert.id, idX, qrY + 27, { align: 'left', maxWidth: W - idX - 50 });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(new Date(cert.date).toLocaleDateString(), idX, qrY + 41, { align: 'left' });

  // Tagline – centred, safely inside the inner border (inner-border bottom = H - 36 = 559)
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('Successfully Completed – Certified by Symbiosys Technologies', cx, taglineY, { align: 'center' });

  doc.save(`${cert.id}-${cert.resourceName.replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}

export { qrDataUrl, PASS_PERCENT };
