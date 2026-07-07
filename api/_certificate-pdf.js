// Server-side certificate PDF generation.
// Layout is kept in lock-step with src/lib/certificates.js (A4 landscape). The
// only differences from the client version: images are embedded base64 data
// URIs, image dimensions come from jsPDF's getImageProperties (no browser
// Image/canvas), the verify URL is passed in (no window), and the result is a
// Node Buffer for emailing rather than a browser download.

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { SIGNATURE_JPEG_DATA_URI, LOGO_JPEG_DATA_URI } from './_assets.js';

const ORG = 'Symbiosys Technologies';

async function qrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 220, color: { dark: '#1e1b4b', light: '#ffffff' } });
  } catch {
    return null;
  }
}

function drawFooter(doc, cx, W, H, cert, verifyUrl, qr) {
  const footerRowTop = H - 190;
  const signLineY = footerRowTop + 58;

  // Left column – signature image + rule + labels
  const leftX = 170;
  const sigW = 120;
  try {
    const p = doc.getImageProperties(SIGNATURE_JPEG_DATA_URI);
    const sigH = (p.height / p.width) * sigW;
    doc.addImage(SIGNATURE_JPEG_DATA_URI, 'JPEG', leftX - sigW / 2, footerRowTop, sigW, sigH);
  } catch { /* image optional */ }
  doc.setDrawColor('#9ca3af'); doc.setLineWidth(1);
  doc.line(leftX - 80, signLineY, leftX + 80, signLineY);
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Symbiosys Technologies', leftX, signLineY + 16, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Authorized Signature', leftX, signLineY + 30, { align: 'center' });

  // Centre column – logo vertically centred in the image band
  const logoW = 130;
  try {
    const p = doc.getImageProperties(LOGO_JPEG_DATA_URI);
    const logoH = (p.height / p.width) * logoW;
    const logoBandH = signLineY - footerRowTop;
    const logoTopY = footerRowTop + (logoBandH - logoH) / 2;
    doc.addImage(LOGO_JPEG_DATA_URI, 'JPEG', cx - logoW / 2, logoTopY, logoW, logoH);
  } catch { /* image optional */ }

  // Right column – QR + ID block
  const qrSize = 72;
  const qrX = W - 218;
  const qrY = footerRowTop;
  const idX = qrX + qrSize + 12;
  if (qr) doc.addImage(qr, 'PNG', qrX, qrY, qrSize, qrSize);
  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Certificate ID', idX, qrY + 14, { align: 'left' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(cert.id, idX, qrY + 27, { align: 'left', maxWidth: W - idX - 50 });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(new Date(cert.date).toLocaleDateString(), idX, qrY + 41, { align: 'left' });
}

// Single course certificate. `cert` = { id, resourceName, categoryLabel, percentage, date }.
export async function buildCertificatePdfBuffer(cert, studentName, verifyUrl) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  doc.setFillColor('#ffffff'); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor('#4f46e5'); doc.setLineWidth(6); doc.rect(24, 24, W - 48, H - 48);
  doc.setDrawColor('#c7d2fe'); doc.setLineWidth(1.5); doc.rect(36, 36, W - 72, H - 72);
  doc.setFillColor('#4f46e5'); doc.rect(36, 36, W - 72, 10, 'F');

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

  const qr = await qrDataUrl(verifyUrl);
  drawFooter(doc, cx, W, H, cert, verifyUrl, qr);

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('Successfully Completed – Certified by Symbiosys Technologies', cx, H - 50, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

// Module (consolidated) certificate. `mod` = { heading, title, dedication, tagline }.
export async function buildModuleCertificatePdfBuffer(mod, cert, studentName, verifyUrl) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  doc.setFillColor('#ffffff'); doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor('#4f46e5'); doc.setLineWidth(6); doc.rect(24, 24, W - 48, H - 48);
  doc.setDrawColor('#c7d2fe'); doc.setLineWidth(1.5); doc.rect(36, 36, W - 72, H - 72);
  doc.setFillColor('#4f46e5'); doc.rect(36, 36, W - 72, 10, 'F');

  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(ORG.toUpperCase(), cx, 90, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(34);
  doc.text('Course Completion Certificate', cx, 140, { align: 'center' });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('This certifies that', cx, 178, { align: 'center' });
  doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  doc.text(studentName || 'Student', cx, 216, { align: 'center' });
  doc.setDrawColor('#e5e7eb'); doc.setLineWidth(1); doc.line(cx - 170, 228, cx + 170, 228);
  doc.setTextColor('#374151'); doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text(mod.heading, cx, 258, { align: 'center' });
  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
  doc.text(mod.title, cx, 292, { align: 'center', maxWidth: W - 160 });
  doc.setTextColor('#6b7280'); doc.setFont('helvetica', 'italic'); doc.setFontSize(13);
  doc.text(mod.dedication, cx, 322, { align: 'center' });

  const qr = await qrDataUrl(verifyUrl);
  drawFooter(doc, cx, W, H, cert, verifyUrl, qr);

  doc.setTextColor('#4f46e5'); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(mod.tagline, cx, H - 50, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
