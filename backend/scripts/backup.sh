#!/usr/bin/env bash
#
# PIIMS database + storage backup script.
# Run daily via cron: 0 1 * * * /opt/piims/backend/scripts/backup.sh
#
# Backs up:
#   - MySQL database (full mysqldump, gzipped)
#   - MinIO bucket (rsync mirror)
#
# Retention: 30 days local, 90 days cold (adjust for production)

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-admin}"
DB_NAME="${DB_NAME:-piims}"

BACKUP_DIR="${BACKUP_DIR:-/opt/piims/backups}"
MYSQL_BACKUP_DIR="$BACKUP_DIR/mysql"
LOCAL_RETENTION_DAYS=30

S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:9000}"
S3_BUCKET="${S3_BUCKET:-piims-dev}"
MINIO_USER="${MINIO_USER:-minio}"
MINIO_PASS="${MINIO_PASS:-minio123}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MYSQL_FILE="$MYSQL_BACKUP_DIR/piims_${TIMESTAMP}.sql.gz"
MINIO_TARGET="$BACKUP_DIR/minio/$TIMESTAMP"

# ─── Setup ────────────────────────────────────────────────────────
mkdir -p "$MYSQL_BACKUP_DIR"
mkdir -p "$MINIO_TARGET"
mkdir -p "$BACKUP_DIR/logs"

LOG_FILE="$BACKUP_DIR/logs/backup_${TIMESTAMP}.log"

log() { echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $*" | tee -a "$LOG_FILE"; }

log "Starting PIIMS backup"

# ─── MySQL dump ───────────────────────────────────────────────────
log "Dumping MySQL database '$DB_NAME' to $MYSQL_FILE"

if ! command -v mysqldump &> /dev/null; then
  log "ERROR: mysqldump not installed"
  exit 1
fi

mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  "$DB_NAME" 2>> "$LOG_FILE" | gzip > "$MYSQL_FILE"

MYSQL_SIZE=$(du -h "$MYSQL_FILE" | cut -f1)
log "MySQL dump complete: $MYSQL_SIZE"

# ─── MinIO mirror ─────────────────────────────────────────────────
if command -v mc &> /dev/null; then
  log "Mirroring MinIO bucket '$S3_BUCKET'"

  mc alias set piims_backup "$S3_ENDPOINT" "$MINIO_USER" "$MINIO_PASS" --quiet
  mc mirror --quiet "piims_backup/$S3_BUCKET" "$MINIO_TARGET"

  MINIO_SIZE=$(du -sh "$MINIO_TARGET" | cut -f1)
  log "MinIO mirror complete: $MINIO_SIZE"
else
  log "WARNING: mc (MinIO client) not installed — skipping bucket backup"
fi

# ─── Retention cleanup ────────────────────────────────────────────
log "Cleaning up backups older than $LOCAL_RETENTION_DAYS days"
find "$MYSQL_BACKUP_DIR" -name "piims_*.sql.gz" -mtime +$LOCAL_RETENTION_DAYS -delete
find "$BACKUP_DIR/minio" -maxdepth 1 -type d -name "2*" -mtime +$LOCAL_RETENTION_DAYS -exec rm -rf {} \;

# ─── Summary ──────────────────────────────────────────────────────
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Backup complete — total backup dir size: $TOTAL_SIZE"
log "Log saved to: $LOG_FILE"

# ─── Verify gzip integrity ────────────────────────────────────────
log "Verifying gzip integrity"
if gzip -t "$MYSQL_FILE" 2>> "$LOG_FILE"; then
  log "✓ Backup integrity verified"
else
  log "✗ BACKUP CORRUPT — investigate immediately"
  exit 2
fi

log "Done."