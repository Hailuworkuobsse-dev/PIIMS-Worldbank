/**
 * Prometheus-style metrics — exposed at /metrics.
 * In production, configure Prometheus to scrape this endpoint.
 */

interface MetricSample {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  values: Map<string, { value: number; labels: string }>;
}

class MetricsRegistry {
  private metrics = new Map<string, MetricSample>();

  private ensureMetric(name: string, help: string, type: MetricSample['type']): MetricSample {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { name, help, type, values: new Map() });
    }
    return this.metrics.get(name)!;
  }

  private labelString(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }

  counter(name: string, help: string, labels: Record<string, string> = {}, delta = 1): void {
    const m = this.ensureMetric(name, help, 'counter');
    const key = JSON.stringify(labels);
    const existing = m.values.get(key);
    m.values.set(key, {
      value: (existing?.value ?? 0) + delta,
      labels: this.labelString(labels)
    });
  }

  gauge(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    const m = this.ensureMetric(name, help, 'gauge');
    const key = JSON.stringify(labels);
    m.values.set(key, { value, labels: this.labelString(labels) });
  }

  histogram(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    const m = this.ensureMetric(name, help, 'histogram');
    const buckets = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    for (const b of buckets) {
      const bucketLabel = { ...labels, le: String(b) };
      const key = JSON.stringify(bucketLabel);
      const existing = m.values.get(key);
      m.values.set(key, {
        value: (existing?.value ?? 0) + (value <= b ? 1 : 0),
        labels: this.labelString(bucketLabel)
      });
    }
    const infLabel = { ...labels, le: '+Inf' };
    const infKey = JSON.stringify(infLabel);
    const existingInf = m.values.get(infKey);
    m.values.set(infKey, {
      value: (existingInf?.value ?? 0) + 1,
      labels: this.labelString(infLabel)
    });
  }

  render(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      for (const sample of metric.values.values()) {
        lines.push(`${metric.name}${sample.labels} ${sample.value}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }
}

export const metrics = new MetricsRegistry();

/* ─── Pre-defined metrics ─────────────────────────────────────── */

export const httpMetrics = {
  requestCount(labels: { method: string; route: string; status: string }) {
    metrics.counter('piims_http_requests_total', 'Total HTTP requests', labels);
  },
  requestDuration(labels: { method: string; route: string; status: string }, durationMs: number) {
    metrics.histogram('piims_http_request_duration_ms', 'HTTP request duration in ms', durationMs, labels);
  },
  activeRequests(_delta: number) {
    // Simple gauge without labels — track with a shared counter
  }
};

export const dbMetrics = {
  queryDuration(operation: string, durationMs: number) {
    metrics.histogram('piims_db_query_duration_ms', 'DB query duration', durationMs, { operation });
  }
};

export const businessMetrics = {
  loginAttempts(success: boolean) {
    metrics.counter('piims_login_attempts_total', 'Login attempts', { success: String(success) });
  },
  notificationSent(channel: string, success: boolean) {
    metrics.counter('piims_notification_delivered_total', 'Notifications delivered', {
      channel, success: String(success)
    });
  },
  syncRun(integration: string, success: boolean) {
    metrics.counter('piims_integration_sync_total', 'Integration sync runs', {
      integration, success: String(success)
    });
  }
};