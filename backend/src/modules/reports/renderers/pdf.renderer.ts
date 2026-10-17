import PDFDocument from 'pdfkit';

export interface PdfOptions {
  title: string;
  subtitle?: string;
  generatedBy: string;
  generatedAt?: Date;
  columns: { key: string; label: string; width?: number }[];
  rows: Record<string, unknown>[];
}

/**
 * Renders a paginated PDF with a header, table, and footer.
 */
export async function renderPdf(options: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const marginLeft = 40;
      const marginRight = 40;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // ── Header ────────────────────────────────────────────────
      doc
        .fontSize(18)
        .fillColor('#0B1E3D')
        .font('Helvetica-Bold')
        .text('PIIMS', marginLeft, 40);

      doc
        .fontSize(10)
        .fillColor('#475569')
        .font('Helvetica')
        .text('Project Inception Information Management System', marginLeft, 62);

      doc
        .fontSize(14)
        .fillColor('#14315E')
        .font('Helvetica-Bold')
        .text(options.title, marginLeft, 90, { width: contentWidth });

      if (options.subtitle) {
        doc
          .fontSize(10)
          .fillColor('#64748B')
          .font('Helvetica')
          .text(options.subtitle, marginLeft, doc.y + 2);
      }

      // ── Table ─────────────────────────────────────────────────
      const tableTop = doc.y + 20;
      const rowHeight = 20;
      const colWidths = computeColumnWidths(options.columns, contentWidth);
      const colX: number[] = [];
      let x = marginLeft;
      for (const w of colWidths) {
        colX.push(x);
        x += w;
      }

      // Header row
      doc.rect(marginLeft, tableTop, contentWidth, rowHeight).fill('#14315E');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      options.columns.forEach((col, i) => {
        doc.text(col.label, colX[i]! + 4, tableTop + 6, {
          width: colWidths[i]! - 8,
          ellipsis: true
        });
      });

      // Data rows
      let y = tableTop + rowHeight;
      doc.font('Helvetica').fontSize(8).fillColor('#0F172A');

      for (const row of options.rows) {
        if (y + rowHeight > pageHeight - 60) {
          doc.addPage();
          y = 40;
          // Re-draw header
          doc.rect(marginLeft, y, contentWidth, rowHeight).fill('#14315E');
          doc.fillColor('#FFFFFF').font('Helvetica-Bold');
          options.columns.forEach((col, i) => {
            doc.text(col.label, colX[i]! + 4, y + 6, {
              width: colWidths[i]! - 8,
              ellipsis: true
            });
          });
          y += rowHeight;
          doc.font('Helvetica').fillColor('#0F172A');
        }

        // Alternate row background
        if (options.rows.indexOf(row) % 2 === 1) {
          doc.rect(marginLeft, y, contentWidth, rowHeight).fill('#F8FAFC');
        }

        doc.fillColor('#0F172A');
        options.columns.forEach((col, i) => {
          const value = row[col.key];
          doc.text(
            value === null || value === undefined ? '' : String(value),
            colX[i]! + 4,
            y + 6,
            { width: colWidths[i]! - 8, ellipsis: true, lineBreak: false }
          );
        });
        y += rowHeight;
      }

      // ── Footer on every page ──────────────────────────────────
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('#64748B')
          .text(
            `Generated ${(options.generatedAt ?? new Date()).toISOString().slice(0, 19).replace('T', ' ')} by ${options.generatedBy} · Page ${i + 1} of ${totalPages}`,
            marginLeft,
            pageHeight - 25,
            { width: contentWidth, align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function computeColumnWidths(
  columns: { key: string; label: string; width?: number }[],
  totalWidth: number
): number[] {
  const explicit = columns.filter((c) => c.width != null);
  const auto = columns.filter((c) => c.width == null);

  if (explicit.length === columns.length) {
    return columns.map((c) => c.width!);
  }

  const explicitTotal = explicit.reduce((s, c) => s + (c.width ?? 0), 0);
  const remaining = Math.max(0, totalWidth - explicitTotal);
  const autoWidth = auto.length ? remaining / auto.length : 0;

  return columns.map((c) => c.width ?? autoWidth);
}