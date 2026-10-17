export const APP_CONFIG = {
  name: "PIIMS",
  version: "2.0.0",
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? "https://api.piims.gov.et/v1",
  defaultLocale: "en" as const,
  supportedLocales: ["en", "am"] as const,
  accessTokenLifetimeSec: 15 * 60,
  idleTimeoutMs: 30 * 60 * 1000,
  autosaveDebounceMs: 20_000,
  defaultPageSize: 25,
  maxPageSize: 200,
  correlationHeader: "X-Correlation-ID",
  idempotencyHeader: "X-Idempotency-Key",
} as const;

export type Locale = (typeof APP_CONFIG.supportedLocales)[number];