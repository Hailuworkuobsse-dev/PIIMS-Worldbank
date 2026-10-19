/**
 * Anonymization engine.
 *
 * Applies a tiered set of transformations to research data:
 *   L0: no change (internal)
 *   L1: direct identifiers replaced with pseudonyms
 *   L2: quasi-identifiers generalized
 *   L3: fully aggregated (no individual records)
 */

import type { AnonymizationConfig, AnonLevel } from "./warehouse.types";

export interface RawRecord {
  panelId: string;
  beneficiaryName?: string | undefined;
  phone?: string | undefined;
  nationalId?: string | undefined;
  age?: number | undefined;
  income?: number | undefined;
  region?: string | undefined;
  zone?: string | undefined;
  woreda?: string | undefined;
  kebele?: string | undefined;
  gpsLat?: number | undefined;
  gpsLon?: number | undefined;
  [key: string]: any;
}

/**
 * Deterministic pseudonym generator for L1+.
 * In production, this uses a stored HMAC key so that the same panel is
 * always mapped to the same pseudonym across waves.
 */
function pseudonymize(value: string): string {
  // Simple deterministic hash — production must use HMAC-SHA256 with a secret key
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return `P${Math.abs(h).toString(36).toUpperCase()}`;
}

function bracketAge(age: number, size: number): string {
  if (size <= 0) return "[SUPPRESSED]";
  const lower = Math.floor(age / size) * size;
  return `${lower}-${lower + size - 1}`;
}

function topCode(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]!;
}

function generalizeLocation(
  record: RawRecord,
  granularity: AnonymizationConfig["locationGranularity"],
): Pick<RawRecord, "region" | "zone" | "woreda" | "kebele"> {
  switch (granularity) {
    case "REGION":
      return { region: record.region };
    case "ZONE":
      return { region: record.region, zone: record.zone };
    case "WOREDA":
      return {
        region: record.region,
        zone: record.zone,
        woreda: record.woreda,
      };
    case "KEBELE":
      return {
        region: record.region,
        zone: record.zone,
        woreda: record.woreda,
        kebele: record.kebele,
      };
    case "REMOVED":
      return {};
  }
}

/**
 * Apply suppression: records whose combination of quasi-identifiers appears
 * fewer than `k` times are dropped entirely (k-anonymity).
 */
function suppressKAnon(
  records: RawRecord[],
  k: number,
  keys: string[],
): RawRecord[] {
  if (k <= 1) return records;
  const buckets = new Map<string, number>();
  for (const r of records) {
    const key = keys.map((kk) => String(r[kk] ?? "")).join("|");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return records.filter((r) => {
    const key = keys.map((kk) => String(r[kk] ?? "")).join("|");
    return (buckets.get(key) ?? 0) >= k;
  });
}

export function anonymize(
  records: RawRecord[],
  config: AnonymizationConfig,
): RawRecord[] {
  const level: AnonLevel = config.level;

  /* L0 — no transformation */
  if (level === "L0") return records;

  /* Compute income top-code threshold across the dataset */
  const incomeThreshold =
    config.incomeTopCode < 100
      ? topCode(
          records.filter((r) => r.income != null).map((r) => r.income!),
          config.incomeTopCode,
        )
      : Infinity;

  /* L1 — pseudonymize direct identifiers */
  let out = records.map((r) => {
    const copy: RawRecord = { ...r };
    // Keep panelId (stable across waves)
    // Pseudonymize direct identifiers
    if (copy.beneficiaryName)
      copy.beneficiaryName = pseudonymize(copy.beneficiaryName);
    if (copy.phone) copy.phone = "[REDACTED]";
    if (copy.nationalId) copy.nationalId = pseudonymize(copy.nationalId);
    // Remove GPS (highest re-identification risk)
    delete copy.gpsLat;
    delete copy.gpsLon;
    return copy;
  });

  if (level === "L1") return out;

  /* L2 — generalize quasi-identifiers */
  out = out.map((r) => {
    const copy: RawRecord = { ...r };
    // Age → bracket
    if (copy.age != null) {
      copy.ageBand = bracketAge(copy.age, config.ageBracket);
      delete copy.age;
    }
    // Income → top-code
    if (copy.income != null && copy.income > incomeThreshold) {
      copy.income = incomeThreshold;
      copy.incomeCapped = true;
    }
    // Location → generalize
    const loc = generalizeLocation(copy, config.locationGranularity);
    copy.region = loc.region;
    copy.zone = loc.zone;
    copy.woreda = loc.woreda;
    copy.kebele = loc.kebele;
    return copy;
  });

  // Optional noise injection
  if (config.addNoise) {
    out = out.map((r) => {
      const copy = { ...r };
      if (typeof copy.income === "number") {
        // Add ±2% noise
        const noise = 1 + (Math.random() - 0.5) * 0.04;
        copy.income = Math.round(copy.income * noise);
      }
      return copy;
    });
  }

  // k-anonymity suppression on quasi-identifiers
  out = suppressKAnon(
    out,
    config.suppressionThreshold,
    ["ageBand", "region", "zone"].filter((k) => out.some((r) => r[k] != null)),
  );

  if (level === "L2") return out;

  /* L3 — full aggregation (returned rows are not individual records) */
  // Aggregate by region + ageBand, computing mean income and count
  const aggMap = new Map<
    string,
    { count: number; incomeSum: number; incomeCount: number }
  >();
  for (const r of out) {
    const key = `${r.region ?? "NA"}|${r.ageBand ?? "NA"}`;
    const cur = aggMap.get(key) ?? { count: 0, incomeSum: 0, incomeCount: 0 };
    cur.count++;
    if (typeof r.income === "number") {
      cur.incomeSum += r.income;
      cur.incomeCount++;
    }
    aggMap.set(key, cur);
  }
  const aggregated: RawRecord[] = [];
  for (const [key, val] of aggMap) {
    const [region, ageBand] = key.split("|");
    if (val.count < config.suppressionThreshold) continue; // suppression
    aggregated.push({
      panelId: `AGG-${region}-${ageBand}`,
      region,
      ageBand,
      count: val.count,
      avgIncome:
        val.incomeCount > 0
          ? Math.round(val.incomeSum / val.incomeCount)
          : null,
    });
  }
  return aggregated;
}