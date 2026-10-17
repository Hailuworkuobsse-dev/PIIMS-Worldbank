
### Timezone issues

MySQL stores `DATETIME` without timezone. Prisma returns `Date` objects in UTC.

Always use ISO 8601 with timezone (`TIMESTAMPTZ` equivalent) in application code. MySQL `DATETIME` does not store the timezone offset — ensure all writes use UTC:
