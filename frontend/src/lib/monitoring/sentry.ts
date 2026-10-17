/**
 * Optional Sentry integration.
 * Install: npm i @sentry/react
 * Enable by setting VITE_SENTRY_DSN in .env
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return;

  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_ENV,
        tracesSampleRate: 0.1,
        integrations: [Sentry.browserTracingIntegration()],
        ignoreErrors: [
          "ResizeObserver loop limit exceeded",
          "Non-Error promise rejection",
        ],
        beforeSend(event) {
          // Remove beneficiary PII from breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((b) => {
              if (b.data?.url) {
                b.data.url = b.data.url.replace(
                  /\/beneficiaries\/[a-f0-9-]+/,
                  "/beneficiaries/[id]",
                );
              }
              return b;
            });
          }
          return event;
        },
      });
    })
    .catch(() => {
      /* Sentry is optional — fail silently */
    });
}