#!/usr/bin/env bash
#
# PIIMS database restore script.
# Usage: ./restore.sh /opt/piims/backups/mysql/piims_20261017_010000.sql.gz
#
# WARNING: This DESTROYS the current database. Requires explicit confirmation.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-admin}"
DB_NAME="${DB_NAME:-piims}"

echo "⚠️  WARNING: This will DESTROY and replace the '$DB_NAME' database."
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Type 'RESTORE' to confirm: " confirmation

if [ "$confirmation" != "RESTORE" ]; then
  echo "Aborted."
  exit 0
fi

echo "Dropping and recreating database..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "
  DROP DATABASE IF EXISTS \`$DB_NAME\`;
  CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

echo "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | mysql \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --default-character-set=utf8mb4 \
  "$DB_NAME"

echo "✓ Restore complete. Verifying..."

TABLES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'")
echo "Tables in database: $TABLES"

echo "✓ Restore verified"