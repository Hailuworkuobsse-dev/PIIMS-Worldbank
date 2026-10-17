# Changelog

All notable changes to PIIMS Backend.

Format: [Keep a Changelog](https://keepachangelog.com/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [2.0.0] — 2026-10-17

### Added

**Core (Steps 1–4)**
- Express server with 9-layer middleware chain (security, correlation, logging, metrics, body parsers, rate limit, routes, 404, errors)
- Zod-validated environment (fail-fast on invalid config)
- Pino structured logging with PII redaction
- Prisma 5 + MySQL 8.4 with 62 models across 14 domains
- Redis cache with graceful reconnect
- BullMQ queues: `reports`, `sync`, `anonymize`, `notify`, `import`
- S3/MinIO storage abstraction with signed URLs
- AppError hierarchy with RFC-7807-style responses
- Graceful shutdown (SIGTERM/SIGINT, 30s timeout)

**Auth (M1)**
- JWT access tokens (15 min) + refresh tokens (8 h) with DB-backed rotation
- Argon2id password hashing
- TOTP MFA (RFC 6238) with challenge token flow
- Account lockout after 5 failed attempts (15 min)
- Login rate limiting per IP + username
- 9 endpoints: login, mfa/verify, refresh, logout, me, change-password, mfa/setup, mfa/enable, mfa/disable
- `requireAuth`, `requirePermission`, `requireAnyPermission`, `requireAllPermissions`, `requireRole`, `requireMfa` middleware
- Wildcard permission matching (`*` and `prefix:*`)
- Hash-chained audit log on every auth event

**Projects (M2)**
- CRUD with cursor pagination
- Auto-generated project codes (`PIIMS-YYYY-NNNN`) with collision retry
- Optimistic locking via `version` field
- Stage-gate advancement with checklist validation
- Pipeline counts by status
- Scope enforcement (Federal/Regional/Zonal/Woreda/Kebele/ownRecordsOnly)

**Admin (M16)**
- User CRUD with role/org assignment
- Temporary password generation for invites
- Password reset revokes all sessions
- Master data CRUD
- System health aggregation (DB, Redis, queue, users)
- Audit log query with filters
- Role & org lookup endpoints for forms

**Documents (M10)**
- Multipart upload to S3 with MIME whitelist (25 MB limit)
- Auto SHA-256 checksums
- Version history with restore
- Signed URL download (15-min TTL)

**Inception (M3)**
- Report submission with file upload
- Review workflow (APPROVE / REVISION_REQUIRED / REJECT)
- Section + general comment threads with resolve
- No-objection recording
- Deadline tracking with overdue filter
- Version history per project

**Reports (M11)**
- 9-report catalogue (PPMR, ISR, FINANCIAL, PROCUREMENT, BENEFICIARY, GRIEVANCE, IMPACT, INCEPTION, AD_HOC)
- Async generation via BullMQ
- PDF (pdfkit), Excel (exceljs), CSV renderers
- World Bank XML exporter (ISR/PPMR)
- Scheduled reports
- Signed URL download

**Results (M4)**
- Components + subcomponents + indicators (14 question types)
- Indicator value entry with direction-aware achievement computation
- Traffic-light status (≥90 on-track, 60–89 at-risk, <60 off-track)
- Aggregation by component, region, or gender
- Logframe Excel export

**Financial (M5)**
- Budget register with appropriation, released, expended, committed, balance
- Disbursement recording with auto-update of linked budget
- Execution summary (KPIs + by-component breakdown)
- FMIS sync trigger (stub with simulation)
- Cost-per-output join (indicators × budgets)
- Exception detection (over-budget, delayed release, low/high burn, unreconciled)

**Procurement (M6)**
- Procurement plans with method, dates, status
- Contracts with supplier validation and unique numbers
- Delay detection with severity classification
- Supplier performance score (60% timeliness + 20% volume + 20% quality)

**Supplier Portal (M7)**
- Strictly isolated — every endpoint scoped via `getSupplierForUser(orgId)`
- Profile management
- Contracts list (own only) with delivery counts
- Delivery submission with serial uniqueness
- Invoice upload with S3 storage
- Warranty register (derived from deliveries)
- Payment status (derived from invoices)
- Dashboard KPIs

**Beneficiary (M8)**
- Registration with deduplication (Levenshtein + multi-signal)
- Unique ID generation (`BEN-YYYY-NNNNN`) with collision retry
- Consent capture (5 types) as immutable records
- List with filters + `sms_intake` filter
- Verify / reject / merge duplicates
- Service delivery recording with scope enforcement

**GIS (M9)**
- Beneficiary + intervention markers with bbox filtering
- Haversine distance verification
- Scope enforcement

**Grievance (M13)**
- `GRV-YYYY-NNNNN` ticket numbers
- SLA computation per severity (24h / 72h / 7d / 14d)
- Anonymous intake
- Assign / resolve / escalate workflows with action history
- Stats by status, category, region, avg resolution time

**Impact Suite (M18–M23)**
- Impact domains + indicators with composite index support
- Wave assignment
- Survey builder with 14 question types
- Safe skip-logic evaluator (no `eval()`)
- Publish + lock workflow
- Collector assignment
- Field submission with answers + paradata + consent
- QA rules engine (duration, straight-line, GPS, outliers)
- Automatic flag creation on submission
- Back-checks and scorecards
- Wave dataset building (QA-cleared only)
- Anonymization engine (L0–L3) with pseudonymization, bracketing, k-anonymity
- Research catalogue + DUA workflow
- DiD calculator (difference-in-differences with SE + p-value)
- Impact dashboard with wave trajectories

**Notifications (M14)**
- 20 template definitions (EN + AM)
- In-app / email / SMS channels
- Async delivery via BullMQ
- Retry on failure (3 attempts, exponential backoff)
- Delivery status tracking
- User preferences (via SystemSetting)
- Broadcast endpoint for admins

**Integrations (M15)**
- 10 adapters: FMIS, DBE, WB, SMS, USSD, Mobile Money, GIS, IdP, ODK, Safe Room
- Base adapter with shared HTTP client
- Circuit breaker per integration
- Retry with exponential backoff for transient errors
- Idempotency via Redis
- Sync job audit + 24h stats
- Manual sync trigger (202 accepted)
- 4 inbound webhooks (SMS, USSD, ODK, Mobile Money)
- Adapter health check per integration

**Operations (Step 10)**
- Prometheus metrics at `/metrics`
- HTTP request metrics middleware
- Backup/restore scripts (`scripts/backup.sh`, `scripts/restore.sh`)
- Smoke test script (`scripts/smoke-test.sh`)
- E2E test suite (Supertest) covering 3 critical paths
- Production Dockerfile (multi-stage, non-root, healthcheck)
- docker-compose for MySQL 8.4, Redis, MinIO
- CI/CD pipelines (GitHub Actions)
- Comprehensive documentation (README, RUNBOOK, SECURITY, CONTRIBUTING)

### Changed
- **Database: MySQL 8.4** (was PostgreSQL in design phase)
  - `@db.Uuid` → `@db.Char(36)`
  - `String[]` → `Json`
  - BigInt JSON serialization added
- All endpoints use camelCase JSON + snake_case DB
- Token responses use snake_case (`access_token`, `refresh_token`) to match frontend

### Fixed
- Prisma connection leak on shutdown
- JWT refresh single-flight race
- Beneficiary deduplication across registration channels
- Skip logic malformed expressions fail-safe to "show"

## [1.0.0] — 2025-06-01

Initial MVP release (17 modules, PostgreSQL).