import { describe, it, expect } from 'vitest';
import { levenshtein, scoreDuplicateMatch } from '../beneficiary.utils.js';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('aster', 'aster')).toBe(0);
  });

  it('returns length for empty string', () => {
    expect(levenshtein('', 'hello')).toBe(5);
    expect(levenshtein('hello', '')).toBe(5);
  });

  it('computes distance correctly', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('aster', 'astere')).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(levenshtein('Aster', 'aster')).toBe(0);
  });
});

describe('scoreDuplicateMatch', () => {
  it('returns 1.0 for exact national ID', () => {
    const r = scoreDuplicateMatch(
      { fullName: 'A', nationalId: '12345' },
      { fullName: 'B', nationalId: '12345' }
    );
    expect(r.score).toBe(1.0);
    expect(r.reasons).toContain('national_id_exact');
  });

  it('returns 0.95 for exact phone', () => {
    const r = scoreDuplicateMatch(
      { fullName: 'A', phone: '+251911234567' },
      { fullName: 'B', phone: '+251911234567' }
    );
    expect(r.score).toBe(0.95);
  });

  it('returns 0.9 for exact name + same woreda', () => {
    const r = scoreDuplicateMatch(
      { fullName: 'Aster Bekele', woreda: 'Bora' },
      { fullName: 'Aster Bekele', woreda: 'Bora' }
    );
    expect(r.score).toBe(0.9);
  });

  it('returns 0.75 for close name + same woreda', () => {
    const r = scoreDuplicateMatch(
      { fullName: 'Aster Bekele', woreda: 'Bora' },
      { fullName: 'Aster Bekel', woreda: 'Bora' }
    );
    expect(r.score).toBe(0.75);
  });

  it('returns 0 for clearly different records', () => {
    const r = scoreDuplicateMatch(
      { fullName: 'Abebe Kebede', woreda: 'Bora', region: 'Oromia' },
      { fullName: 'XYZ WXY', woreda: 'Amhara', region: 'Amhara' }
    );
    expect(r.score).toBe(0);
  });
});