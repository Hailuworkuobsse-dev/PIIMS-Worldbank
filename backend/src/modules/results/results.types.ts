import type {
  IndicatorType, IndicatorFrequency, IndicatorDirection, TrafficLight
} from '@prisma/client';

export interface ComponentDTO {
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  budget?: string;
  responsibleOrgId?: string;
  orderNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubcomponentDTO {
  subcomponentId: string;
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  budget?: string;
  orderNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndicatorDTO {
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
  disaggregation: string[];
  status: TrafficLight;
  achievementPct?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndicatorValueDTO {
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
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface AggregationRowDTO {
  key: string;
  label: string;
  indicatorCount: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  notStarted: number;
  avgAchievement: number;
}