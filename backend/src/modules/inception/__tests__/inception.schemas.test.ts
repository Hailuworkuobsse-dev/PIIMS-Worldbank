import { describe, it, expect } from 'vitest';
import {
  submitInceptionSchema, reviewDecisionSchema, noObjectionSchema
} from '../inception.schemas.js';

describe('submitInceptionSchema', () => {
  it('accepts a valid submission', () => {
    expect(
      submitInceptionSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        summary: 'This inception report covers project setup, methodology, and work plan.',
        version: 1
      }).success
    ).toBe(true);
  });

  it('rejects short summary', () => {
    expect(
      submitInceptionSchema.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        summary: 'Too short',
        version: 1
      }).success
    ).toBe(false);
  });
});

describe('reviewDecisionSchema', () => {
  it('allows APPROVE without comments', () => {
    expect(reviewDecisionSchema.safeParse({ decision: 'APPROVE' }).success).toBe(true);
  });

  it('requires ≥10-char comments for REQUEST_REVISION', () => {
    expect(
      reviewDecisionSchema.safeParse({ decision: 'REQUEST_REVISION', comments: 'short' }).success
    ).toBe(false);
    expect(
      reviewDecisionSchema.safeParse({
        decision: 'REQUEST_REVISION',
        comments: 'Please revise section 2.'
      }).success
    ).toBe(true);
  });

  it('rejects REJECT without comments', () => {
    expect(reviewDecisionSchema.safeParse({ decision: 'REJECT' }).success).toBe(false);
  });
});

describe('noObjectionSchema', () => {
  it('accepts valid no-objection', () => {
    expect(
      noObjectionSchema.safeParse({
        noObjection: true,
        effectiveDate: '2026-11-01'
      }).success
    ).toBe(true);
  });

  it('rejects noObjection: false', () => {
    expect(
      noObjectionSchema.safeParse({
        noObjection: false,
        effectiveDate: '2026-11-01'
      }).success
    ).toBe(false);
  });
});