export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryIf?: (err: unknown) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  attempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 4
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === opts.attempts) break;
      if (opts.retryIf && !opts.retryIf(err)) break;

      const delay = Math.min(
        opts.maxDelayMs,
        opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1)
      );

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

/**
 * True if the error is transient (network, 5xx, timeout).
 */
export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string; response?: { status?: number }; message?: string };
  if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED') return true;
  const status = e.response?.status;
  if (status && status >= 500 && status < 600) return true;
  if (status === 429) return true;
  return false;
}