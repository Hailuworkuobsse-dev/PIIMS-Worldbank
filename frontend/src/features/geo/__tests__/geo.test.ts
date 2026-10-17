import { describe, it, expect } from "vitest";
import type { MapBounds } from "../geo.types";

describe("geo helpers", () => {
  it("validates bounds shape", () => {
    const b: MapBounds = { north: 15, south: 3, east: 48, west: 32 };
    expect(b.north).toBeGreaterThan(b.south);
    expect(b.east).toBeGreaterThan(b.west);
  });
});