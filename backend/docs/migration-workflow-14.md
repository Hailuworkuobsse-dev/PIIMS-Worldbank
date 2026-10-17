
Prisma returns them as parsed JS arrays. Application code treats them as `string[]`.

### BigInt Handling

`AuditLog.logId` uses `BigInt @id @default(autoincrement())`. MySQL returns it as `bigint`, which cannot be serialized by `JSON.stringify` by default.

The Express app sets a custom JSON replacer in `src/app.ts`:
