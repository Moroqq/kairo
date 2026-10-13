#!/usr/bin/env bash
#
# → /usr/local/bin/kairo-backup.sh
#
# Снимок базы раз в сутки. Используется `sqlite3 .backup`, а не копирование
# файла: база в режиме WAL, и обычный cp может застать её на середине
# транзакции — получится битый снимок, о чём узнаешь только при восстановлении.

set -euo pipefail

DB="${KAIRO_DB_PATH:-/opt/kairo-server/server/data/kairo.db}"
DEST="${KAIRO_BACKUP_DIR:-/opt/kairo-backups}"
KEEP_DAYS="${KAIRO_BACKUP_KEEP_DAYS:-7}"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="$DEST/kairo-$STAMP.db"

mkdir -p "$DEST"
chmod 700 "$DEST"

[[ -f "$DB" ]] || { echo "базы нет: $DB" >&2; exit 1; }

sqlite3 "$DB" ".backup '$OUT'"
gzip -9 "$OUT"
chmod 600 "$OUT.gz"

# Чистим старое только после успешного снимка — иначе неудачный прогон
# за неделю тихо съел бы все копии.
find "$DEST" -name 'kairo-*.db.gz' -mtime "+$KEEP_DAYS" -delete

echo "$(date -u +%FT%TZ) ok $OUT.gz ($(du -h "$OUT.gz" | cut -f1))"
