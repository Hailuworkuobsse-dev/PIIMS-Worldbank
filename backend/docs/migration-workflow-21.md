
## Migration Naming Convention

| Type | Prefix | Example |
|---|---|---|
| Initial | `init` | `20261017000000_init` |
| Feature | `add_` | `20261018000000_add_project_notes` |
| Bug fix | `fix_` | `20261019000000_fix_indicator_index` |
| Data migration | `backfill_` | `20261020000000_backfill_beneficiary_region` |

Never rename a migration after it's been applied — Prisma will lose track of it.