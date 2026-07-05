// Download helpers for Learning Materials.
//
// PDF  -> jsPDF (real, multi-page .pdf of the long-form document)
// PPTX -> pptxgenjs (real, openable .pptx of the slide deck)
// Both libraries are dynamically imported so they don't bloat the initial load.

const BRAND = 'Symbiosys Technology · AI Learning Platform';

function fileSafe(name) {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------- PDF --------
export async function downloadMaterialPDF(material) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };
  const text = (str, { size = 11, style = 'normal', color = '#1f2937', gap = 6, lh = 1.4 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(str, maxW);
    for (const line of lines) {
      ensure(size * lh);
      doc.text(line, margin, y);
      y += size * lh;
    }
    y += gap;
  };
  const heading = (str) => { ensure(28); text(str, { size: 15, style: 'bold', color: '#4f46e5', gap: 8 }); };
  const rule = () => { ensure(14); doc.setDrawColor(226, 232, 240); doc.line(margin, y, pageW - margin, y); y += 14; };

  // Cover header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 8, 'F');
  text(BRAND, { size: 9, color: '#6b7280', gap: 4 });
  text(material.resourceName, { size: 24, style: 'bold', color: '#111827', gap: 2 });
  text(`${material.categoryLabel} · Learning Material`, { size: 12, color: '#6b7280', gap: 10 });
  rule();

  heading('Introduction');
  text(material.intro);

  heading('Learning Objectives');
  material.objectives.forEach((o) => text(`•  ${o}`, { gap: 3 }));
  y += 4;

  heading('Concepts & Detailed Explanations');
  material.concepts.forEach((c) => {
    text(c.title, { size: 12, style: 'bold', color: '#111827', gap: 3 });
    text(c.body);
  });

  heading('Practical Examples');
  material.examples.forEach((e) => {
    text(e.title, { size: 12, style: 'bold', color: '#111827', gap: 3 });
    text(e.body);
  });

  if (material.diagram) {
    heading(material.diagram.title);
    material.diagram.steps.forEach((s, i) => text(`${i + 1}.  ${s}`, { gap: 3 }));
    y += 4;
  }

  heading('Best Practices');
  material.bestPractices.forEach((b) => text(`•  ${b}`, { gap: 3 }));
  y += 4;

  heading('Key Takeaways');
  material.keyTakeaways.forEach((k) => text(`•  ${k}`, { gap: 3 }));
  y += 4;

  heading('Summary');
  text(material.summary);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor('#9ca3af');
    doc.text(`${BRAND}`, margin, pageH - 20);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 20, { align: 'right' });
  }

  doc.save(`${fileSafe(material.resourceName)}-learning-material.pdf`);
}

// --------------------------------------------------------------- PPTX --------
export async function downloadMaterialPPTX(material) {
  const mod = await import('pptxgenjs');
  const PptxGenJS = mod.default || mod;
  const pptx = new PptxGenJS();
  pptx.author = 'Symbiosys Technology';
  pptx.company = 'Symbiosys Technology';
  pptx.title = `${material.resourceName} — Learning Material`;

  const INDIGO = '4F46E5';
  const DARK = '111827';
  const GRAY = '6B7280';

  material.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.18, fill: { color: INDIGO } });

    if (i === 0) {
      slide.addText(material.resourceName, { x: 0.6, y: 1.8, w: 8.8, h: 1.2, fontSize: 40, bold: true, color: DARK });
      slide.addText(`${material.categoryLabel} · Learning Material`, { x: 0.6, y: 3.0, w: 8.8, h: 0.6, fontSize: 18, color: GRAY });
      slide.addText('Certified by Symbiosys Technology', { x: 0.6, y: 5.0, w: 8.8, h: 0.4, fontSize: 12, italic: true, color: INDIGO });
    } else {
      slide.addText(s.title, { x: 0.6, y: 0.5, w: 8.8, h: 0.8, fontSize: 26, bold: true, color: INDIGO });
      const body = s.bullets.map((b) => ({ text: b, options: { bullet: true, fontSize: 16, color: DARK, paraSpaceAfter: 8 } }));
      slide.addText(body, { x: 0.7, y: 1.5, w: 8.6, h: 4.6, valign: 'top' });
    }
    slide.addText('Symbiosys Technology · AI Learning Platform', { x: 0.6, y: 6.9, w: 8.8, h: 0.3, fontSize: 9, color: GRAY });
  });

  await pptx.writeFile({ fileName: `${fileSafe(material.resourceName)}-slides.pptx` });
}
