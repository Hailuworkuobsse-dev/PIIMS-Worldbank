
**Option B — Manual rollback migration**:
1. Write `prisma/migrations/<timestamp>_rollback_<name>/migration.sql` with the inverse SQL
2. Apply via `npx prisma migrate resolve --applied <rollback_migration_name>`

For production, option A is safer.

## MySQL-Specific Notes

### UUID Storage

We use `@db.Char(36)` instead of `@db.VarChar(191)` (Prisma's default for String):
- Fixed length (36 chars)
- More efficient index storage
- Matches the canonical UUID format exactly

### JSON Columns

MySQL doesn't have native array types. Fields declared as `String[]` in TypeScript are stored as `Json` columns in Prisma:
