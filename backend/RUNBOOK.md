# PIIMS Operations Runbook

**Audience:** MoWE IT Operations, on-call engineers
**Scope:** Deployment, rollback, incident response, common failures

---

## Table of Contents

1. Deployment procedure
2. Rollback procedure
3. Common failures
4. Monitoring
5. Backup & restore
6. Security incidents
7. Change management
8. On-call rotation

---

## 1. Deployment Procedure

### Pre-deployment checklist

- [ ] CI pipeline is green on the release tag
- [ ] `CHANGELOG.md` updated
- [ ] Database migrations reviewed by DBA
- [ ] Backup verified within last 24 hours
- [ ] Smoke test passes on staging
- [ ] Security scan passed (`npm audit`)

### Deploy to staging
