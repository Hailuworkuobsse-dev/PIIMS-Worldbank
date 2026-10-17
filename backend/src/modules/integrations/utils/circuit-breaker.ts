/**
 * Simple in-memory circuit breaker. For multi-instance deployments,
 * back the state with Redis so all instances share failure counts.
 */
type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerConfig {
  failureThreshold: number;   // consecutive failures before opening
  successThreshold: number;   // successes in half-open to close
  openDurationMs: number;     // how long to stay open before half-open
}

interface BreakerRecord {
  state: BreakerState;
  failures: number;
  successes: number;
  openedAt: number | null;
  lastFailure: string | null;
}

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  openDurationMs: 30_000
};

class CircuitBreaker {
  private records = new Map<string, BreakerRecord>();
  private config: BreakerConfig;

  constructor(config: Partial<BreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getOrCreate(key: string): BreakerRecord {
    if (!this.records.has(key)) {
      this.records.set(key, {
        state: 'CLOSED', failures: 0, successes: 0, openedAt: null, lastFailure: null
      });
    }
    return this.records.get(key)!;
  }

  private shouldTransitionToHalfOpen(record: BreakerRecord): boolean {
    return (
      record.state === 'OPEN' &&
      record.openedAt !== null &&
      Date.now() - record.openedAt >= this.config.openDurationMs
    );
  }

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const record = this.getOrCreate(key);

    if (this.shouldTransitionToHalfOpen(record)) {
      record.state = 'HALF_OPEN';
      record.successes = 0;
    }

    if (record.state === 'OPEN') {
      throw new Error(`Circuit breaker is OPEN for ${key}${record.lastFailure ? `: ${record.lastFailure}` : ''}`);
    }

    try {
      const result = await fn();
      this.recordSuccess(record);
      return result;
    } catch (err) {
      this.recordFailure(record, (err as Error).message);
      throw err;
    }
  }

  private recordSuccess(record: BreakerRecord): void {
    if (record.state === 'HALF_OPEN') {
      record.successes++;
      if (record.successes >= this.config.successThreshold) {
        record.state = 'CLOSED';
        record.failures = 0;
        record.successes = 0;
        record.openedAt = null;
      }
    } else {
      record.failures = 0;
    }
  }

  private recordFailure(record: BreakerRecord, message: string): void {
    record.failures++;
    record.lastFailure = message;

    if (record.state === 'HALF_OPEN') {
      record.state = 'OPEN';
      record.openedAt = Date.now();
      record.successes = 0;
    } else if (record.failures >= this.config.failureThreshold) {
      record.state = 'OPEN';
      record.openedAt = Date.now();
    }
  }

  getState(key: string): { state: BreakerState; failures: number; lastFailure: string | null } {
    const record = this.getOrCreate(key);
    if (this.shouldTransitionToHalfOpen(record)) {
      record.state = 'HALF_OPEN';
      record.successes = 0;
    }
    return { state: record.state, failures: record.failures, lastFailure: record.lastFailure };
  }

  reset(key: string): void {
    this.records.delete(key);
  }
}

export const circuitBreaker = new CircuitBreaker();
export { CircuitBreaker };