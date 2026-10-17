# Smoke Test Checklist

Run before every production deployment. Minimum 3 role journeys must pass.

## Prerequisites

- Staging environment: https://staging.piims.gov.et
- Test accounts for each role (see ops password vault)
- Test data seeded

## Critical path 1 — MoWE PIU Officer

- [ ] Login as `mowe.piu01`
- [ ] Dashboard loads with correct KPIs
- [ ] Navigate to **Projects** → click **New project**
- [ ] Complete wizard (5 steps) → submit
- [ ] Project appears in list with status `IDEA`
- [ ] Open project detail → verify all tabs render
- [ ] Navigate to **Inception** → submit report with file upload
- [ ] Verify status shows `SUBMITTED`
- [ ] Sign out

## Critical path 2 — Data Collector (CAPI)

- [ ] Login as `dc.en01` on mobile device or mobile emulation
- [ ] **Field** → verify assignments load
- [ ] Start interview → capture consent
- [ ] Complete 5 questions → verify skip logic fires correctly
- [ ] Take a photo → verify preview
- [ ] Finish interview → verify submit or offline queue
- [ ] If offline: go online → verify auto-sync
- [ ] Check server: submission appears in `/impact/qa` flag queue (if rules fire)
- [ ] Sign out

## Critical path 3 — World Bank TTL

- [ ] Login as `wb.ttl01`
- [ ] **Portfolio** dashboard loads with all 7 projects
- [ ] Click a project → detail view opens
- [ ] **Inception** → view pending reviews (should be ≥ 1)
- [ ] Click **Review** → approve with comment
- [ ] Verify no-objection flow works
- [ ] **Reports** → generate ISR → download succeeds
- [ ] **Impact** → verify DiD chart renders
- [ ] Sign out

## Accessibility spot checks

- [ ] Tab order is logical on each page
- [ ] Focus ring visible on all interactive elements
- [ ] Screen reader announces form errors
- [ ] Zoom to 200% — no content lost
- [ ] Colour contrast on status chips passes AA

## Performance spot checks

- [ ] Dashboard loads in < 3 s on Fast 3G
- [ ] Offline mode works — disconnect wifi, verify app still navigates
- [ ] Service worker: reload page after deploy → "New version available" prompt appears

## Sign-off

| Role            | Name | Signature | Date |
| --------------- | ---- | --------- | ---- |
| QA Lead         |      |           |      |
| Ops Engineer    |      |           |      |
| Release Manager |      |           |      |