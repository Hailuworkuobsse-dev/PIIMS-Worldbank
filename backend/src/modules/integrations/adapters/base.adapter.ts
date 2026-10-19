import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { circuitBreaker } from '../utils/circuit-breaker.js';
import { retry, isTransientError } from '../utils/retry.js';
import { logger } from '@/config/logger.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

/**
 * Base adapter — every integration extends this and gets:
 *   - Shared HTTP client
 *   - Circuit breaker
 *   - Retry with exponential backoff
 *   - Structured logging
 */
export abstract class BaseAdapter {
  abstract readonly code: IntegrationCode;
  protected readonly client: AxiosInstance;

  constructor(
    protected readonly baseUrl: string | undefined,
    apiKey?: string | undefined,
    protected readonly timeoutMs = 30_000
  ) {
    this.client = axios.create({
      ...(baseUrl ? { baseURL: baseUrl } : {}),
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      }
    });
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error(`${this.code} is not configured`);
    }

    return circuitBreaker.execute(`adapter:${this.code}`, () =>
      retry(
        async () => {
          const start = Date.now();
          try {
            const response = await this.client.request<T>(config);
            logger.debug(
              { integration: this.code, method: config.method, url: config.url, durationMs: Date.now() - start },
              'adapter request ok'
            );
            return response.data;
          } catch (err) {
            logger.warn(
              { integration: this.code, method: config.method, url: config.url, err: (err as Error).message },
              'adapter request failed'
            );
            throw err;
          }
        },
        { retryIf: isTransientError }
      )
    );
  }

  abstract testConnection(): Promise<AdapterHealth>;
}