/**
 * Structured logger. In production, forwards to backend endpoint and (optionally) Sentry.
 * In development, logs to console.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  correlationId?: string;
}

const buffer: LogEntry[] = [];
let flushTimer: number | null = null;

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  // In production, POST to /v1/logs
  if (import.meta.env.PROD) {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
    }).catch(() => {
      // ignore — logging must never break the app
    });
  } else {
    // eslint-disable-next-line no-console
    batch.forEach((entry) =>
      console.log(`[${entry.level}]`, entry.message, entry.context ?? ""),
    );
  }
}

function schedule() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flush();
    flushTimer = null;
  }, 2000);
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  buffer.push({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  });
  schedule();
  if (level === "error") flush();
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => log("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => log("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => log("error", m, c),
};

/* Flush on page unload */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flush);
}