
### "Too many connections"

MySQL has a default max of 151 connections. If the pool exhausts:

1. Increase `max_connections` in MySQL config
2. Reduce Prisma's connection pool:
