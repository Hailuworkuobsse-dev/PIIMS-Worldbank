// MySQL: BigInt fields (e.g. AuditLog.logId) need string serialization
app.set('json replacer', (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
);