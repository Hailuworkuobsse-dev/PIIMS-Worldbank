
Prisma:
- Diffs the schema against the DB
- Creates `prisma/migrations/<timestamp>_add_project_notes/migration.sql`
- Applies it to the dev database
- Regenerates the client

### 3. Review the generated SQL
