
## Pull Request Process

1. Create feature branch off `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature
   ```
2. Make changes following code standards below
3. Add or update tests
4. Run `npm run lint && npm run typecheck && npm test`
5. Update `CHANGELOG.md` under `[Unreleased]`
6. Push and open PR with descriptive title
7. **Two approvals required** — from feature owner + architect or QA
8. Squash-merge to `develop`

## Code Review Checklist

Every reviewer confirms:

- [ ] Types are strict — no `any` without justification
- [ ] Zod validation on every request input
- [ ] Permission checked via `requirePermission` middleware
- [ ] Scope enforced (org / geographic)
- [ ] Audit log written for every mutation
- [ ] Prisma queries use proper indexes
- [ ] Error handling via `AppError` subclasses
- [ ] No `console.log` in production code (use `logger`)
- [ ] Tests cover happy path + at least one failure case
- [ ] CHANGELOG updated

## Code Standards

- **Prettier**: 100-col lines, single quotes, semicolons
- **Imports**: sorted (ESLint `import/order`)
- **File naming**: `kebab-case.ts` for files, `PascalCase` for types
- **Module boundaries**: no cross-module imports except through `*.service.ts`
- **Error messages**: user-facing, actionable, no stack traces in API responses
- **Logging**: structured JSON via Pino, never `console.log`

## Testing Requirements

- **Unit tests** for: services, utilities, validators
- **Integration tests** for: full request-response cycle with real DB
- **E2E tests** for: critical user journeys (login, project lifecycle, field interview)
- **Minimum coverage**: 80% across `src/modules/**`

## Database Migrations

1. Never modify an already-applied migration
2. Test migrations on a copy of production data first
3. Include both `up` and `down` (Prisma generates only `up` — write `down` manually if needed)
4. Coordinate with DBA for production migrations
5. Document breaking changes in `CHANGELOG.md`

## Security

- Never commit secrets (use `.env.example`)
- Never trust client-side RBAC — always enforce server-side
- Report vulnerabilities privately (see [SECURITY.md](./SECURITY.md))
- Sanitize all user inputs via Zod

## Release Process
