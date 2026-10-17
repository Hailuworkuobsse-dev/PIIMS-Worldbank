/**
 * QA rules engine.
 *
 * Given a submission + aggregate context (medians, means), evaluate which
 * QA rules are violated. This runs client-side for HFC-style preview and is
 * also mirrored by the backend for authoritative flag generation.
 */

export interface QASubmission {
  submissionId: string;
  collectorId: string;
  durationSeconds: number;
  answers: { questionId: string; value: string | number | null }[];
  gpsStart?: { lat: number; lon: number };
  gpsEnd?: { lat: number; lon: number };
  assignedLocation?: { lat: number; lon: number };
}

export interface QAContext {
  medianDurationSeconds: number;
  p95DurationSeconds: number;
  numericMean?: Record<string, number>;
  numericSD?: Record<string, number>;
}

export interface RuleViolation {
  ruleType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: Record<string, any>;
}

/* Haversine distance in km */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function evaluateRules(
  sub: QASubmission,
  ctx: QAContext,
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  /* 1. Duration too short (< 50% of median) */
  if (
    ctx.medianDurationSeconds > 0 &&
    sub.durationSeconds < ctx.medianDurationSeconds * 0.5
  ) {
    violations.push({
      ruleType: "DURATION_SHORT",
      severity: "HIGH",
      details: {
        duration: sub.durationSeconds,
        median: ctx.medianDurationSeconds,
      },
    });
  }

  /* 2. Duration too long (> 3x median) */
  if (
    ctx.medianDurationSeconds > 0 &&
    sub.durationSeconds > ctx.medianDurationSeconds * 3
  ) {
    violations.push({
      ruleType: "DURATION_LONG",
      severity: "MEDIUM",
      details: {
        duration: sub.durationSeconds,
        median: ctx.medianDurationSeconds,
      },
    });
  }

  /* 3. Straight-lining — same answer 15+ consecutive times */
  let maxStreak = 1;
  let streak = 1;
  for (let i = 1; i < sub.answers.length; i++) {
    if (
      sub.answers[i]!.value != null &&
      sub.answers[i]!.value === sub.answers[i - 1]!.value
    ) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  if (maxStreak >= 15) {
    violations.push({
      ruleType: "STRAIGHT_LINE",
      severity: "HIGH",
      details: { consecutiveSameAnswers: maxStreak },
    });
  }

  /* 4. GPS outside target area (> 5 km) */
  if (sub.gpsStart && sub.assignedLocation) {
    const distance = haversineKm(sub.gpsStart, sub.assignedLocation);
    if (distance > 5) {
      violations.push({
        ruleType: "GPS_OUTSIDE",
        severity: "HIGH",
        details: { distanceKm: distance.toFixed(2) },
      });
    }
  }

  /* 5. GPS start vs end mismatch (> 2 km drift during interview) */
  if (sub.gpsStart && sub.gpsEnd) {
    const drift = haversineKm(sub.gpsStart, sub.gpsEnd);
    if (drift > 2) {
      violations.push({
        ruleType: "GPS_OUTSIDE",
        severity: "MEDIUM",
        details: {
          driftKm: drift.toFixed(2),
          note: "Location drift during interview",
        },
      });
    }
  }

  /* 6. Numeric outlier (|z| > 3) */
  if (ctx.numericMean && ctx.numericSD) {
    for (const a of sub.answers) {
      if (typeof a.value !== "number") continue;
      const mean = ctx.numericMean[a.questionId];
      const sd = ctx.numericSD[a.questionId];
      if (mean != null && sd != null && sd > 0) {
        const z = Math.abs((a.value - mean) / sd);
        if (z > 3) {
          violations.push({
            ruleType: "OUTLIER",
            severity: "MEDIUM",
            details: {
              questionId: a.questionId,
              value: a.value,
              zScore: z.toFixed(2),
            },
          });
        }
      }
    }
  }

  return violations;
}