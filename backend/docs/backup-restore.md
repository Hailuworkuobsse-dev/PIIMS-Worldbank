# Backup & Restore

## Backup Strategy

| Data | Frequency | Retention | Location |
|---|---|---|---|
| MySQL full | Daily at 01:00 EAT | 30 days local, 90 days cold | `/opt/piims/backups/mysql/` |
| MinIO documents | Daily at 01:00 EAT | 30 days local | `/opt/piims/backups/minio/` |
| Config | On change | Git history | Repository |

## Automated Backup

Cron on the production server:
