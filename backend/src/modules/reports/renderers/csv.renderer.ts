/**
 * Minimal CSV renderer. Accepts an array of row objects and produces
 * an RFC-4180-compliant CSV string.
 */
export function renderCsv(rows: Record<string, unknown>[]): Buffer {
  if (rows.length === 0) return Buffer.from('', 'utf-8');

  const headers = Object.keys(rows[0]!);
  const lines: string[] = [];

  lines.push(headers.map(escape).join(','));

  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }

  return Buffer.from(lines.join('\r\n') + '\r\n', 'utf-8');
}

function escape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}