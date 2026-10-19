# PIIMS authentication and government SSO deployment

## Authentication behavior

- Local sign-in uses the provisioned PIIMS username/email and Argon2 password hash.
- The backend owns account status checks, lockout, password validation, MFA challenge verification, refresh-token rotation, and authorization.
- Privileged roles require MFA by default. Operators can explicitly override `MFA_REQUIRED_ROLES`; an empty value disables the role-based requirement and should only be used in isolated test environments.
- First-login accounts must change their password, complete required MFA enrollment, and acknowledge policy version `2026-10-v1` before entering the role-aware home.
- Consent is recorded on the user record and in the audit log. The migration must be applied before deploying this version.
- Refresh tokens are single-use during rotation. Reuse is rejected, and the verified-MFA assurance bit follows the rotated refresh token.
- Role-specific home workspaces are selected from the registered PIIMS role code and display shortcuts only when the user's permissions allow them.

## Government OpenID Connect (OIDC) SSO

SSO is disabled unless all of these values are configured in the backend environment:

```dotenv
IDP_ISSUER_URL=https://identity-provider.example/tenant
IDP_CLIENT_ID=your-registered-client-id
IDP_CLIENT_SECRET=provided-by-your-identity-provider
API_PUBLIC_URL=https://api.example.gov.et
FRONTEND_URL=https://piims.example.gov.et
```

- `API_PUBLIC_URL` is the public API origin without `/v1`; `API_BASE_PATH` is appended to construct the callback URL.
- Register the exact redirect URI `{API_PUBLIC_URL}{API_BASE_PATH}/auth/sso/callback` with the identity provider.
- The provider must support OpenID Connect Authorization Code flow, PKCE (S256), an OIDC discovery document, RS256 ID-token signing, and verified email claims.
- PIIMS never auto-provisions SSO users. The verified email must match an active, administrator-provisioned PIIMS account.
- Roles requiring MFA are accepted through SSO only when the validated ID token confirms MFA through an `amr` value such as `mfa` or `otp`, or an appropriate `acr` claim. Configure and test this claim mapping with the identity-provider administrator before production use.
- Set `FRONTEND_URL` to the trusted frontend origin. Do not rely on a broad or user-controlled redirect URL.
- Use HTTPS for both origins in production. The state cookie is Secure in production and is protected with an HMAC, nonce, short lifetime, and PKCE verifier.

## Database rollout

Apply migrations in order before deploying:
1. `20261019160000_user_policy_acceptance`
2. `20261019161000_refresh_token_mfa_state`

Run `npm run prisma:generate`, `npm run typecheck`, and `npm test` in `backend`; run the frontend typecheck, build, and unit tests before promotion.

## Role register note

The frontend role-code registry currently contains 41 unique role codes, although the product brief refers to 43 roles. The home router covers every code currently present in the registry. Reconcile the authoritative role register before assigning the two unlisted roles or granting them permissions; do not infer permissions for unregistered roles.
