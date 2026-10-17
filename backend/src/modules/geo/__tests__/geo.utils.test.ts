import { describe, it, expect } from 'vitest';
import { haversineKm, parseBbox, isWithinBbox } from '../geo.utils.js';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm({ lat: 9, lon: 40 }, { lat: 9, lon: 40 })).toBeCloseTo(0, 5);
  });

  it('computes Addis to Adama ~90km', () => {
    const d = haversineKm({ lat: 9.03, lon: 38.74 }, { lat: 8.54, lon: 39.27 });
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(100);
  });
});

describe('parseBbox', () => {
  it('parses valid bbox', () => {
    const b = parseBbox('38.0,8.0,40.0,10.0');
    expect(b.west).toBe(38);
    expect(b.south).toBe(8);
    expect(b.east).toBe(40);
    expect(b.north).toBe(10);
  });
});

describe('isWithinBbox', () => {
  const bbox = { west: 38, south: 8, east: 40, north: 10 };
  it('returns true inside', () => {
    expect(isWithinBbox({ lat: 9, lon: 39 }, bbox)).toBe(true);
  });
  it('returns false outside', () => {
    expect(isWithinBbox({ lat: 12, lon: 39 }, bbox)).toBe(false);
  });
});