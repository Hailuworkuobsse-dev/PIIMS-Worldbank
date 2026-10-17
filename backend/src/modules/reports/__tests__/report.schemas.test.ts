import { describe, it, expect } from 'vitest';
import { generateReportSchema, scheduleReportSchema } from '../report.schemas.js';

describe('generateReportSchema', () => {
  it('accepts a valid generation request', () => {
    expect(
      generateReportSchema.safeParse({
        reportCode: 'FINANCIAL',
        format: 'PDF'
      }).success
    ).toBe(true);
  });

  it('accepts with project + period', () => {
    expect(
      generateReportSchema.safeParse({
        reportCode: 'PPMR',
        projectId: '00000000-0000-4000-8000-000000000001',
        period: 'Q3-2026',
        fiscalYear: 2026,
        format: 'EXCEL'
      }).success
    ).toBe(true);
  });

  it('rejects invalid report code', () => {
    expect(
      generateReportSchema.safeParse({ reportCode: 'INVALID', format: 'PDF' }).success
    ).toBe(false);
  });
});

describe('scheduleReportSchema', () => {
  it('accepts valid schedule', () => {
    expect(
      scheduleReportSchema.safeParse({
        reportCode: 'FINANCIAL',
        cron: '0 8 1 * *',
        recipients: ['a@b.com', 'c@d.com'],
        format: 'PDF'
      }).success
    ).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(
      scheduleReportSchema.safeParse({
        reportCode: 'FINANCIAL',
        cron: '0 8 1 * *',
        recipients: ['not-an-email'],
        format: 'PDF'
      }).success
    ).toBe(false);
  });

  it('rejects empty recipients', () => {
    expect(
      scheduleReportSchema.safeParse({
        reportCode: 'FINANCIAL',
        cron: '0 8 1 * *',
        recipients: [],
        format: 'PDF'
      }).success
    ).toBe(false);
  });
});