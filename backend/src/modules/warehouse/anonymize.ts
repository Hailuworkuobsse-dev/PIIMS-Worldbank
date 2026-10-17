import type { AnonLevel } from '@prisma/client';

export interface RawRecord {
  panelId: string;
  beneficiaryName?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  age?: number | null;
  income?: number | null;
  region?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  gpsLat?: number | null;
  gpsLon?: number | null;
  [key: string]: unknown;
}

export interface AnonymizationConfig {
  level: AnonLevel;
  ageBracket: number;
  incomeTopCode: number;
  locationGranularity: 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE' | 'REMOVED';
  suppressionThreshold: number;
  addNoise: boolean;
}

export const DEFAULT_ANON_CONFIG: AnonymizationConfig = {
  level: 'L2',
  ageBracket: 5,
  incomeTopCode: 99,
  locationGranularity: 'ZONE',
  suppressionThreshold: 5,
  addNoise: false
};

function pseudonymize(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return `P${Math.abs(h).toString(36).toUpperCase()}`;
}

function bracketAge(age: number, size: number): string {
  if (size <= 0) return '[SUPPRESSED]';
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
  granularity: AnonymizationConfig['locationGranularity']
): Pick<RawRecord, 'region' | 'zone' | 'woreda' | 'kebele'> {
  switch (granularity) {
    case 'REGION': return { region: record.region ?? null, zone: null, woreda: null, kebele: null };
    case 'ZONE': return { region: record.region ?? null, zone: record.zone ?? null, woreda: null, kebele: null };
    case 'WOREDA': return { region: record.region ?? null, zone: record.zone ?? null, woreda: record.woreda ?? null, kebele: null };
    case 'KEBELE': return { region: record.region ?? null, zone: record.zone ?? null, woreda: record.woreda ?? null, kebele: record.kebele ?? null };
    case 'REMOVED': return { region: null, zone: null, woreda: null, kebele: null };
  }
}

function suppressKAnon(records: RawRecord[], k: number, keys: string[]): RawRecord[] {
  if (k <= 1) return records;
  const buckets = new Map<string, number>();
  for (const r of records) {
    const key = keys.map((kk) => String(r[kk] ?? '')).join('|');
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return records.filter((r) => {
    const key = keys.map((kk) => String(r[kk] ?? '')).join('|');
    return (buckets.get(key) ?? 0) >= k;
  });
}

export function anonymize(records: RawRecord[], config: AnonymizationConfig): RawRecord[] {
  const level: AnonLevel = config.level;
  if (level === 'L0') return records;

  const incomeThreshold = config.incomeTopCode < 100
    ? topCode(records.filter((r) => r.income != null).map((r) => r.income!), config.incomeTopCode)
    : Infinity;

  let out = records.map((r) => {
    const copy: RawRecord = { ...r };
    if (copy.beneficiaryName) copy.beneficiaryName = pseudonymize(copy.beneficiaryName);
    if (copy.phone) copy.phone = '[REDACTED]';
    if (copy.nationalId) copy.nationalId = pseudonymize(copy.nationalId);
    delete copy.gpsLat;
    delete copy.gpsLon;
    return copy;
  });

  if (level === 'L1') return out;

  out = out.map((r) => {
    const copy: RawRecord = { ...r };
    if (copy.age != null) {
      copy.ageBand = bracketAge(copy.age, config.ageBracket);
      delete copy.age;
    }
    if (copy.income != null && copy.income > incomeThreshold) {
      copy.income = incomeThreshold;
      copy.incomeCapped = true;
    }
    const loc = generalizeLocation(copy, config.locationGranularity);
    copy.region = loc.region;
    copy.zone = loc.zone;
    copy.woreda = loc.woreda;
    copy.kebele = loc.kebele;
    return copy;
  });

  if (config.addNoise) {
    out = out.map((r) => {
      const copy = { ...r };
      if (typeof copy.income === 'number') {
        const noise = 1 + (Math.random() - 0.5) * 0.04;
        copy.income = Math.round(copy.income * noise);
      }
      return copy;
    });
  }

  out = suppressKAnon(out, config.suppressionThreshold, ['ageBand', 'region', 'zone'].filter((k) => out.some((r) => r[k] != null)));

  if (level === 'L2') return out;

  // L3 — full aggregation
  const aggMap = new Map<string, { count: number; incomeSum: number; incomeCount: number }>();
  for (const r of out) {
    const key = `${r.region ?? 'NA'}|${r.ageBand ?? 'NA'}`;
    const cur = aggMap.get(key) ?? { count: 0, incomeSum: 0, incomeCount: 0 };
    cur.count++;
    if (typeof r.income === 'number') { cur.incomeSum += r.income; cur.incomeCount++; }
    aggMap.set(key, cur);
  }

  const aggregated: RawRecord[] = [];
  for (const [key, val] of aggMap) {
    const [region, ageBand] = key.split('|');
    if (val.count < config.suppressionThreshold) continue;
    aggregated.push({
      panelId: `AGG-${region}-${ageBand}`,
      region: region ?? null,
      ageBand: ageBand ?? null,
      count: val.count,
      avgIncome: val.incomeCount > 0 ? Math.round(val.incomeSum / val.incomeCount) : null
    });
  }
  return aggregated;
}

export function toCsv(records: RawRecord[]): string {
  if (records.length === 0) return '';
  const headers = Object.keys(records[0]!);
  const lines = [headers.join(',')];
  for (const r of records) {
    lines.push(headers.map((h) => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}