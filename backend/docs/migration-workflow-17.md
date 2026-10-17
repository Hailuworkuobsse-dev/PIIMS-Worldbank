
**Production:**
Do NOT reset. Instead:
1. Investigate which migration was applied manually
2. Use `npx prisma migrate resolve --applied <migration_name>` to mark it as applied
3. Or restore from backup

### "Client generation out of sync"
