# Security Policy

## Reporting a Vulnerability

**Do not open a public issue.**

Email **security@piims.gov.et** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive an acknowledgment within 24 hours. We aim to patch critical issues within 7 days.

## Supported Versions

| Version | Supported |
|---|---|
| 2.x | ✓ |
| 1.x | ✗ |

## Scope

**In scope:**
- Backend API (`https://api.piims.gov.et`)
- Authentication and session management
- Authorization (RBAC)
- Data handling (beneficiary PII, financial data)
- File upload and storage
- Third-party integrations

**Out of scope:**
- Denial of Service attacks
- Social engineering
- Physical attacks on infrastructure
- Third-party dependencies (report to vendor)

## Security Controls

| Control | Implementation |
|---|---|
| Authentication | OAuth 2.0-style JWT + TOTP MFA |
| Password hashing | Argon2id (19 MB memory, 2 iterations) |
| Transport | TLS 1.2+ (nginx terminated) |
| Headers | Helmet: CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| Rate limiting | 1000 req/min global; 5/min on login |
| RBAC | 43 roles × fine-grained permissions |
| Audit logging | Append-only hash-chained log |
| Input validation | Zod on every endpoint |
| File uploads | MIME whitelist + 25 MB limit + SHA-256 checksums |
| Secret management | Environment variables (never in code) |
| Dependency scanning | `npm audit` on every CI run |
| SAST | ESLint security plugin |
| Session revocation | Refresh token rotation + DB-tracked revocation |

## Compliance

- **ISO 27001** aligned
- **World Bank** data protection requirements
- **Ethiopian data sovereignty** — data hosted in-country

## Vulnerability Disclosure

We follow **coordinated disclosure**:
- Public disclosure after a patch is available
- 90-day disclosure deadline for critical issues
- Credit given to reporter (unless anonymity requested)

## Contact

- Security incidents: `security@piims.gov.et` (P1)
- Non-urgent: `security-reports@piims.gov.et`
- PGP key: [available on request]