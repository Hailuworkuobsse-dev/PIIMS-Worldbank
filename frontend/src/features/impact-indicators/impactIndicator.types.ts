export const IMPACT_DOMAINS = [
  "INCOME",
  "ENERGY",
  "WATER",
  "HEALTH",
  "EDUCATION",
  "GENDER",
  "ENVIRONMENT",
  "RESILIENCE",
  "SATISFACTION",
] as const;
export type ImpactDomain = (typeof IMPACT_DOMAINS)[number];

export const INDICATOR_DIRECTION = ["INCREASE", "DECREASE"] as const;
export type IndicatorDirection = (typeof INDICATOR_DIRECTION)[number];

export interface ImpactIndicator {
  indicatorId: string;
  domain: ImpactDomain;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  unit: string;
  direction: IndicatorDirection;
  method?: string;
  disaggregation: string[];
  isComposite: boolean;
  compositeFormula?: CompositeFormula;
  standardRef?: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "ACTIVE" | "DEPRECATED";
}

export interface CompositeFormula {
  components: { indicatorId: string; weight: number }[];
  normalization: "MIN_MAX" | "Z_SCORE" | "NONE";
  aggregation: "WEIGHTED_SUM" | "WEIGHTED_AVG";
}

export interface IndicatorWaveAssignment {
  indicatorWaveId: string;
  indicatorId: string;
  waveId: string;
  targetValue?: number;
  collectionWindowStart?: string;
  collectionWindowEnd?: string;
  required: boolean;
}

export interface TheoryOfChange {
  tocId: string;
  projectId: string;
  name: string;
  description?: string;
  diagramUrl?: string;
  links: ToCLink[];
}

export interface ToCLink {
  fromType: "OUTPUT" | "OUTCOME" | "IMPACT";
  fromId: string;
  fromLabel: string;
  toType: "OUTPUT" | "OUTCOME" | "IMPACT";
  toId: string;
  toLabel: string;
  assumption?: string;
}

export interface ImpactIndicatorFilters {
  domain?: ImpactDomain[];
  q?: string;
  status?: "ACTIVE" | "DEPRECATED";
}