
Then open an incident ticket and coordinate with the DBA.

---

## 3. Common Failures

### White screen / 500 errors after login

**Likely cause:** JavaScript error in a feature module.

**Fix:**
1. Check logs: `docker compose -f docker-compose.prod.yml logs backend --tail 100`
2. Check Sentry / Grafana error rate
3. If specific module fails, disable via feature flag and redeploy
4. Root-cause with frontend team

### "Unauthorized" loop

**Likely cause:** JWT clock skew or revoked token.

**Fix:**
1. Check server time: `date -u` — must be within 60s of true time
2. Verify JWT secret is unchanged
3. If token revoked, user must re-login
4. Check `/v1/auth/refresh` endpoint in logs

### FMIS sync stuck

**Likely cause:** MoF IFMIS adapter unreachable.

**Fix:**
1. Check `/v1/admin/integrations/status` → `FMIS` status
2. If `DEGRADED` or `DOWN`, check network to FMIS
3. Trigger manual sync from admin UI
4. Circuit breaker auto-resets after 30s

### MySQL connection pool exhausted

**Likely cause:** Leaked connections or high load.

**Fix:**
1. Check `/readyz` → `database.connections`
2. Check slow queries: `SHOW PROCESSLIST` in MySQL
3. Restart backend: `docker compose restart backend`
4. Investigate query patterns in logs

### MinIO bucket full

**Likely cause:** Document accumulation without cleanup.

**Fix:**
1. Check MinIO console at `https://minio.piims.gov.et:9001`
2. Verify backup is running
3. Archive old documents to cold storage
4. Expand volume or add new one

### Redis memory full

**Likely cause:** Cache not expiring.

**Fix:**
1. `redis-cli INFO memory`
2. `redis-cli DBSIZE`
3. `redis-cli FLUSHDB` (dev only — production, evict carefully)
4. Check Redis maxmemory-policy is `allkeys-lru`

---

## 4. Monitoring

### Health endpoints

| Endpoint | Purpose |
|---|---|
| `GET /healthz` | Lightweight — used by LB / Docker |
| `GET /readyz` | Deep — DB + Redis + queue |
| `GET /metrics` | Prometheus scrape |

### Key metrics

| Metric | Alert threshold |
|---|---|
| `piims_http_request_duration_ms` p95 | > 2000 ms for 5 min |
| `piims_http_requests_total{status=~"5.."}` rate | > 5% for 5 min |
| `piims_login_attempts_total{success="false"}` rate | > 50 / 5 min |
| Queue depth (BullMQ) | > 1000 for 10 min |
| `piims_integration_sync_total{success="false"}` rate | > 3 consecutive failures |
| DB connection pool | > 80% of max |

### Grafana dashboards

- System Health (default)
- Business KPIs (projects, indicators, submissions)
- Integration Health
- Error tracking (Sentry)

---

## 5. Backup & Restore

### Automated backups

Runs daily at 01:00 EAT via cron:
