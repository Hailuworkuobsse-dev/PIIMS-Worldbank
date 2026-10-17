export interface IndicatorSeries {
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  waves: {
    waveCode: string; // W0, W1, W2
    waveName: string;
    mean: number;
    n: number;
    sd?: number;
  }[];
}

export interface DiDResult {
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  treatment: { baseline: number; endline: number; n: number };
  control: { baseline: number; endline: number; n: number };
  treatmentChange: number;
  controlChange: number;
  did: number;
  stdError: number;
  pValue: number;
  significant: boolean;
}

export interface DisaggregationRow {
  key: string;
  label: string;
  values: { waveCode: string; value: number; n: number }[];
  change: number;
}

export interface ImpactDashboard {
  projectId: string;
  projectCode: string;
  projectName: string;
  waves: {
    waveCode: string;
    waveName: string;
    startDate: string;
    endDate: string;
  }[];
  headlineIndicators: IndicatorSeries[];
  lastUpdated: string;
}