import { logger } from "@/config/logger.js";

/**
 * Optional Sentry integration.
 * Enable by setting SENTRY_DSN env var and installing @sentry/node:
 *   npm i @sentry/node
 *
 * If not installed or not configured, this is a silent no-op.
 */
let sentryInitialized = false;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.debug("Sentry DSN not set — skipping error tracking");
    return;
  }

  if (sentryInitialized) return;

  try {
    const Sentry = await import("@sentry/node" as any);
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0.1
    });
    sentryInitialized = true;
    logger.info("Sentry error tracking initialized");
  } catch {
    logger.warn(
      "SENTRY_DSN set but @sentry/node not installed. Run: npm i @sentry/node"
    );
  }
}

export function captureException(err: Error, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    logger.error({ err: err.message, ...context }, "unhandled error");
    return;
  }

  import("@sentry/node" as any)
    .then((Sentry: any) => {
      Sentry.captureException(err, { extra: context });
    })
    .catch(() => {
      logger.error({ err: err.message, ...context }, "unhandled error");
    });
}
