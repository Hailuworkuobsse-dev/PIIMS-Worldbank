import type { Severity, GrievanceStatus } from '@prisma/client';

/**
 * Compute SLA due date from severity + submission time.
 *   CRITICAL → 24h
 *   HIGH     → 72h
 *   MEDIUM   → 7 days
 *   LOW      → 14 days
 */
export function computeSlaDue(severity: Severity, from: Date = new Date()): Date {
  const ms = {
    CRITICAL: 24 * 3600 * 1000,
    HIGH: 72 * 3600 * 1000,
    MEDIUM: 7 * 24 * 3600 * 1000,
    LOW: 14 * 24 * 3600 * 1000
  }[severity];
  return new Date(from.getTime() + ms);
}

export function slaDaysRemaining(slaDue: string | Date): number {
  const due = typeof slaDue === 'string' ? new Date(slaDue) : slaDue;
  return Math.ceil((due.getTime() - Date.now()) / (24 * 3600 * 1000));
}

export function isTerminalStatus(status: GrievanceStatus): boolean {
  return ['RESOLVED', 'CLOSED'].includes(status);
}