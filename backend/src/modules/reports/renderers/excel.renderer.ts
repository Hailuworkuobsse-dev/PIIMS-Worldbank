import ExcelJS from 'exceljs';

/**
 * Render rows into an .xlsx buffer with a styled header.
 */
export async function renderExcel(
  rows: Record<string, unknown>[],
  sheetName = 'Report'
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PIIMS';
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName);

  if (rows.length === 0) {
    ws.addRow(['No data']);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  const headers = Object.keys(rows[0]!);

  ws.columns = headers.map((h) => ({
    header: h,
    key: h,
    width: Math.max(15, Math.min(50, h.length + 6))
  }));

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF14315E' }
  };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;

  // Add data rows
  for (const row of rows) {
    ws.addRow(row);
  }

  // Freeze header + auto-filter
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}