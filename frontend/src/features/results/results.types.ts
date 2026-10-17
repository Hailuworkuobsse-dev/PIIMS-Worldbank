export const INDICATOR_TYPES = ["OUTPUT", "OUTCOME", "IMPACT"] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

export const INDICATOR_FREQUENCIES = [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
] as const;
export type IndicatorFrequency = (typeof INDICATOR_FREQUENCIES)[number];

export const INDICATOR_DIRECTIONS = ["INCREASE", "DECREASE"] as const;
export type IndicatorDirection = (typeof INDICATOR_DIRECTIONS)[number];

export const TRAFFIC_LIGHT = [
  "ON_TRACK",
  "AT_RISK",
  "OFF_TRACK",
  "NOT_STARTED",
] as const;
export type TrafficLightStatus = (typeof TRAFFIC_LIGHT)[number];

export interface Component {
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  budget?: string;
  responsibleOrgId?: string;
  orderNo: number;
}

export interface SubComponent {
  subcomponentId: string;
  componentId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  budget?: string;
  orderNo: number;
}

export interface Indicator {
  indicatorId: string;
  subcomponentId: string;
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  indicatorType: IndicatorType;
  unit: string;
  baseline?: number;
  baselineDate?: string;
  target?: number;
  targetDate?: string;
  actual?: number;
  frequency: IndicatorFrequency;
  direction: IndicatorDirection;
  method?: string;
  disaggregation?: string[];
  status: TrafficLightStatus;
  achievementPct?: number;
}

export interface IndicatorValue {
  valueId: string;
  indicatorId: string;
  period: string;
  fiscalYear: number;
  value: number;
  target?: number;
  achievementPct?: number;
  disaggregation?: Record<string, Record<string, number>>;
  dataSource?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
}

export interface ResultsFilters {
  projectId?: string;
  componentId?: string;
  status?: TrafficLightStatus[];
  type?: IndicatorType[];
  q?: string;
}

/* ---- Aggregation ---- */
export interface AggregationRow {
  key: string;
  label: string;
  indicatorCount: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  avgAchievement: number;
}