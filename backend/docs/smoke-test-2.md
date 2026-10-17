
Checks (each returns pass/fail):
1. `GET /healthz` → 200
2. `GET /readyz` → 200
3. `POST /v1/auth/login` → 200 + token
4. `GET /v1/auth/me` → 200
5. `GET /v1/pipeline` → 200
6. `GET /v1/projects` → 200
7. `GET /v1/audit` → 200
8. `GET /v1/admin/users` → 200
9. `GET /v1/admin/integrations/status` → 200
10. `GET /v1/reports/catalogue` → 200
11. `GET /metrics` → 200
12. `GET /v1/projects` (no token) → 401

## Manual — Critical Path 1: PIU Officer

Login as `mowe.piu01`:
- [ ] Dashboard loads
- [ ] Navigate to Projects
- [ ] Create new project via wizard
- [ ] Project appears in list with `IDEA` status
- [ ] Open project detail → all tabs render
- [ ] Advance stage `IDEA → PROFILE` with checklist
- [ ] Sign out

## Manual — Critical Path 2: Data Collector (CAPI)

Login as `dc.en01` on mobile:
- [ ] Field → assignments load
- [ ] Start interview → consent capture
- [ ] Complete 5 questions → skip logic fires
- [ ] Take photo → preview shows
- [ ] Finish interview → submit or offline queue
- [ ] If offline: go online → auto-sync
- [ ] Sign out

## Manual — Critical Path 3: World Bank TTL

Login as `wb.ttl01`:
- [ ] Portfolio dashboard loads
- [ ] Pending inception reviews appear
- [ ] Click Review → approve with comment
- [ ] No-objection flow works
- [ ] Generate ISR report → download succeeds
- [ ] Impact dashboard renders DiD chart
- [ ] Sign out

## Accessibility Spot Checks

- [ ] Tab order is logical on each page
- [ ] Focus ring visible on all interactive elements
- [ ] Screen reader announces form errors
- [ ] Zoom to 200% — no content lost
- [ ] Colour contrast on status chips passes AA

## Performance Spot Checks

- [ ] Dashboard loads in < 3s
- [ ] API p95 latency < 500ms (check Grafana)
- [ ] Metrics endpoint responds in < 100ms

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Lead | | | |
| Ops Engineer | | | |
| Release Manager | | | |