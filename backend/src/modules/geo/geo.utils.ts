import type { MapBounds } from './geo.types.js';

/**
 * Haversine distance in km between two points on Earth.
 */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Parse "w,s,e,n" into a MapBounds object.
 */
export function parseBbox(bbox: string): MapBounds {
  const [west, south, east, north] = bbox.split(',').map(Number);
  return { west: west!, south: south!, east: east!, north: north! };
}

/**
 * True if a point is inside the given bounding box.
 */
export function isWithinBbox(
  point: { lat: number; lon: number },
  bbox: MapBounds
): boolean {
  return (
    point.lat >= bbox.south &&
    point.lat <= bbox.north &&
    point.lon >= bbox.west &&
    point.lon <= bbox.east
  );
}