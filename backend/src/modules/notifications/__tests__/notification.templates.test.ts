import { describe, it, expect } from 'vitest';
import { renderTemplate, localizedTemplate, TEMPLATE_BY_CODE } from '../notification.templates.js';
import { TEMPLATE_CODES } from '../notification.types.js';

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    expect(renderTemplate('Hello {{name}}', { name: 'Aster' })).toBe('Hello Aster');
  });

  it('handles multiple variables', () => {
    expect(
      renderTemplate('Project {{code}} by {{name}}', { code: 'PIIMS-001', name: 'Abe' })
    ).toBe('Project PIIMS-001 by Abe');
  });

  it('leaves unknown variables as-is', () => {
    expect(renderTemplate('Hello {{unknown}}', {})).toBe('Hello {{unknown}}');
  });

  it('handles numeric values', () => {
    expect(renderTemplate('Budget: {{amount}}', { amount: 1500000 })).toBe('Budget: 1500000');
  });
});

describe('localizedTemplate', () => {
  it('returns English by default', () => {
    const t = TEMPLATE_BY_CODE[TEMPLATE_CODES.USER_INVITE];
    const result = localizedTemplate(t, 'en');
    expect(result.body).toContain('Hello');
  });

  it('returns Amharic when requested and available', () => {
    const t = TEMPLATE_BY_CODE[TEMPLATE_CODES.USER_INVITE];
    const result = localizedTemplate(t, 'am');
    expect(result.body).toContain('ሰላም');
  });

  it('falls back to English when no Amharic', () => {
    const t = TEMPLATE_BY_CODE[TEMPLATE_CODES.REPORT_READY];
    const result = localizedTemplate(t, 'am');
    expect(result.body).toContain('Your report');
  });
});

describe('template catalogue', () => {
  it('every template has required fields', () => {
    for (const [, t] of Object.entries(TEMPLATE_BY_CODE)) {
      expect(t.code).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.channels.length).toBeGreaterThan(0);
      expect(t.body).toBeTruthy();
      expect(Array.isArray(t.variables)).toBe(true);
    }
  });

  it('every template has SMS-only with empty subject', () => {
    for (const [, t] of Object.entries(TEMPLATE_BY_CODE)) {
      if (t.channels.length === 1 && t.channels[0] === 'SMS') {
        expect(t.subject).toBe('');
      }
    }
  });
});