/**
 * Difference-in-Differences calculator.
 *
 * DiD = (Treatment_endline − Treatment_baseline) − (Control_endline − Control_baseline)
 *
 * Standard error is computed using the standard two-sample variance formula,
 * which is a reasonable approximation for the effect of adding independent
 * sampling errors across the four group×wave cells.
 *
 * For rigorous inference, researchers re-run this against the anonymized
 * dataset using their own statistical tools.
 */

import type { DiDResult } from "./analytics.types";

export interface GroupMeans {
  baselineMean: number;
  baselineN: number;
  baselineSD: number;
  endlineMean: number;
  endlineN: number;
  endlineSD: number;
}

export function computeDiD(
  indicator: {
    indicatorId: string;
    indicatorCode: string;
    indicatorName: string;
    unit: string;
  },
  treatment: GroupMeans,
  control: GroupMeans,
): DiDResult {
  const treatmentChange = treatment.endlineMean - treatment.baselineMean;
  const controlChange = control.endlineMean - control.baselineMean;
  const did = treatmentChange - controlChange;

  /* Variance of the difference:
   * Var(treatmentChange) = Var(T_end)/n_Tend + Var(T_base)/n_Tbase
   * Var(controlChange)   = Var(C_end)/n_Cend + Var(C_base)/n_Cbase
   * Var(did)             = Var(treatmentChange) + Var(controlChange)
   */
  const varTreatmentChange =
    treatment.endlineSD ** 2 / Math.max(treatment.endlineN, 1) +
    treatment.baselineSD ** 2 / Math.max(treatment.baselineN, 1);

  const varControlChange =
    control.endlineSD ** 2 / Math.max(control.endlineN, 1) +
    control.baselineSD ** 2 / Math.max(control.baselineN, 1);

  const stdError = Math.sqrt(varTreatmentChange + varControlChange);

  /* Two-sided p-value via normal approximation (z-test) */
  const z = stdError > 0 ? did / stdError : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));

  return {
    indicatorId: indicator.indicatorId,
    indicatorCode: indicator.indicatorCode,
    indicatorName: indicator.indicatorName,
    unit: indicator.unit,
    treatment: {
      baseline: treatment.baselineMean,
      endline: treatment.endlineMean,
      n: treatment.endlineN,
    },
    control: {
      baseline: control.baselineMean,
      endline: control.endlineMean,
      n: control.endlineN,
    },
    treatmentChange,
    controlChange,
    did,
    stdError,
    pValue,
    significant: pValue < 0.05,
  };
}

/** Standard normal CDF approximation (Abramowitz & Stegun 7.1.26) */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Convenience: compute DiD from raw per-group per-wave arrays of individual observations. */
export function computeDiDFromRaw(
  indicator: {
    indicatorId: string;
    indicatorCode: string;
    indicatorName: string;
    unit: string;
  },
  treatmentBaseline: number[],
  treatmentEndline: number[],
  controlBaseline: number[],
  controlEndline: number[],
): DiDResult {
  const stats = (arr: number[]) => ({
    mean: arr.reduce((s, v) => s + v, 0) / Math.max(arr.length, 1),
    n: arr.length,
    sd:
      arr.length > 1
        ? Math.sqrt(
            arr.reduce(
              (s, v) =>
                s + (v - arr.reduce((a, b) => a + b, 0) / arr.length) ** 2,
              0,
            ) /
              (arr.length - 1),
          )
        : 0,
  });

  const tb = stats(treatmentBaseline);
  const te = stats(treatmentEndline);
  const cb = stats(controlBaseline);
  const ce = stats(controlEndline);

  return computeDiD(
    indicator,
    {
      baselineMean: tb.mean,
      baselineN: tb.n,
      baselineSD: tb.sd,
      endlineMean: te.mean,
      endlineN: te.n,
      endlineSD: te.sd,
    },
    {
      baselineMean: cb.mean,
      baselineN: cb.n,
      baselineSD: cb.sd,
      endlineMean: ce.mean,
      endlineN: ce.n,
      endlineSD: ce.sd,
    },
  );
}