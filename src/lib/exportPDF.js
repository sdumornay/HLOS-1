import jsPDF from 'jspdf';

export function exportToPDF({ title, subtitle, sections, filename }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20;

  const checkPage = (needed = 10) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // Header bar
  doc.setFillColor(17, 34, 85);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Leadership Health Operating System', margin, 9);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 9, { align: 'right' });

  y = 25;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 34, 85);
  doc.text(title, margin, y);
  y += 8;

  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 130);
    doc.text(subtitle, margin, y);
    y += 8;
  }

  // Divider
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Sections
  sections.forEach(section => {
    checkPage(16);

    if (section.heading) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 34, 85);
      doc.text(section.heading, margin, y);
      y += 7;
    }

    if (section.items) {
      section.items.forEach(item => {
        checkPage(14);
        if (item.label) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 70, 90);
          doc.text(item.label, margin, y);
          y += 4.5;
        }
        if (item.value) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 90, 110);
          const lines = doc.splitTextToSize(String(item.value), contentW);
          lines.forEach(line => {
            checkPage(5);
            doc.text(line, margin + (item.indent ? 4 : 0), y);
            y += 4.5;
          });
          y += 1;
        }
      });
    }

    if (section.table) {
      const { headers, rows } = section.table;
      const colW = contentW / headers.length;
      checkPage(12);

      // Header row
      doc.setFillColor(240, 243, 250);
      doc.rect(margin, y - 4, contentW, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 50, 80);
      headers.forEach((h, i) => doc.text(h, margin + i * colW + 2, y));
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 80, 100);
      rows.forEach((row, ri) => {
        checkPage(7);
        if (ri % 2 === 1) {
          doc.setFillColor(250, 251, 254);
          doc.rect(margin, y - 4, contentW, 6, 'F');
        }
        row.forEach((cell, i) => {
          const lines = doc.splitTextToSize(String(cell || '—'), colW - 4);
          doc.text(lines[0], margin + i * colW + 2, y);
        });
        y += 6;
      });
      y += 3;
    }

    y += 4;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 170, 185);
    doc.text(`Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' });
    doc.text('Confidential — HLOS', margin, 290);
  }

  doc.save(filename || 'hlos-export.pdf');
}