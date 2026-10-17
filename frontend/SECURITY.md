# Security Policy

## Reporting a vulnerability

**Do not open a public issue.**

Email **security@piims.gov.et** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive an acknowledgment within 24 hours. We aim to patch critical issues within 7 days.

## Scope

In scope:
- Frontend application (this repository)
- API gateway and backend services
- Data processing pipeline
- Beneficiary data handling

Out of scope:
- Third-party dependencies (report to the vendor directly)
- Social engineering
- Physical attacks on infrastructure

## Security controls

| Control | Implementation |
|---|---|
| Authentication | OAuth 2.0 + JWT, MFA for privileged roles |
| Authorization | RBAC + org/geo scope enforcement (server + client) |
| Transport | TLS 1.3 (nginx + API gateway) |
| Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Data at rest | AES-256 (database) |
| Audit | Append-only audit log with hash chain |
| Secrets | GitHub Secrets + HashiCorp Vault (runtime) |
| Dependencies | `npm audit` on every PR, Dependabot enabled |
| SAST | ESLint security plugin + CodeQL (weekly) |
| Secrets scanning | GitHub Advanced Security |

## Compliance

- ISO 27001 aligned
- World Bank data protection requirements
- Ethiopian data sovereignty policy

## Disclosure policy

We follow coordinated disclosure. Public disclosure after a patch is available is preferred; embargoed disclosure by mutual agreement.