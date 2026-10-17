
Must pass **all** critical paths:
- Login as `mowe.admin`
- GET `/v1/auth/me`
- GET `/v1/projects`
- GET `/v1/pipeline`
- GET `/v1/admin/integrations/status`

### Promote to production

Manual approval in GitHub Actions:
- Workflow: **Deploy**
- Environment: **production**
- Confirm with release manager

### Post-deployment verification

- [ ] `curl https://api.piims.gov.et/healthz` returns `ok`
- [ ] `curl https://api.piims.gov.et/readyz` returns `healthy`
- [ ] Login works for one account per role
- [ ] Dashboard loads
- [ ] Monitor Grafana for 15 minutes (error rate, latency)
- [ ] Update `CHANGELOG.md` — move `[Unreleased]` to version

---

## 2. Rollback Procedure

If production shows critical failures:
