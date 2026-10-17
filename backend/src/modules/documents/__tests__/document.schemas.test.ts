import { describe, it, expect } from 'vitest';
import { uploadDocumentSchema } from '../document.schemas.js';

describe('uploadDocumentSchema', () => {
  it('accepts a valid payload', () => {
    const r = uploadDocumentSchema.safeParse({
      projectId: '00000000-0000-4000-8000-000000000001',
      docType: 'REPORT',
      title: 'Q3 Financial Report',
      accessLevel: 'INTERNAL',
      tags: 'finance,q3'
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tags).toEqual(['finance', 'q3']);
    }
  });

  it('accepts without project', () => {
    expect(
      uploadDocumentSchema.safeParse({
        projectId: '',
        docType: 'OTHER',
        title: 'General file',
        accessLevel: 'INTERNAL'
      }).success
    ).toBe(true);
  });

  it('rejects short title', () => {
    expect(
      uploadDocumentSchema.safeParse({
        docType: 'REPORT',
        title: 'AB',
        accessLevel: 'INTERNAL'
      }).success
    ).toBe(false);
  });

  it('rejects unknown docType', () => {
    expect(
      uploadDocumentSchema.safeParse({
        docType: 'INVALID',
        title: 'Test',
        accessLevel: 'INTERNAL'
      }).success
    ).toBe(false);
  });
});