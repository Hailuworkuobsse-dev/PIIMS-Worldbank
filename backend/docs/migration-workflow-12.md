
This ensures migrations run before the app starts.

## Rollback

Prisma does not auto-generate `down` migrations. To roll back:

**Option A — Restore from backup** (recommended for data-safe rollback):