
CI/CD automatically:
1. Runs lint, typecheck, unit tests, E2E tests
2. Builds Docker image
3. Pushes to GHCR
4. Deploys to staging
5. Verifies `/healthz`

### Smoke test staging
