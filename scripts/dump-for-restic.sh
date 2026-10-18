#!/bin/sh
# Writes an unencrypted dump of the database and uploaded photos into
# $BACKUP_DIR (default ./backups) so a backup tool that already encrypts and
# ships off-site (restic, borg, ...) can pick them up. Keeps the newest $KEEP
# pairs. Use scripts/backup.sh instead when the archive itself must be encrypted.
#
# Run from the project directory; pass the compose files on the command line
# when the stack uses an override, e.g.
#   COMPOSE="docker compose -f compose.yaml -f compose.prod.yaml" ./scripts/dump-for-restic.sh
set -eu
cd "$(dirname "$0")/.."

: "${BACKUP_DIR:=./backups}"
: "${KEEP:=7}"
: "${COMPOSE:=docker compose}"

umask 077
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
tmp="$BACKUP_DIR/.tmp-$stamp"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp"

$COMPOSE exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$tmp/database.dump"
$COMPOSE exec -T app tar -czf - -C /app/storage/uploads . > "$tmp/uploads.tar.gz"

# A dump that is empty or not a valid archive must never replace a good one.
[ -s "$tmp/database.dump" ] || { echo "Empty database dump" >&2; exit 1; }
$COMPOSE exec -T db pg_restore --list < "$tmp/database.dump" > /dev/null
gzip -t "$tmp/uploads.tar.gz"

mv "$tmp/database.dump" "$BACKUP_DIR/database-$stamp.dump"
mv "$tmp/uploads.tar.gz" "$BACKUP_DIR/uploads-$stamp.tar.gz"

for prefix in database uploads; do
  ls -1t "$BACKUP_DIR/$prefix-"* 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do rm -f "$old"; done
done
echo "Backup written: $BACKUP_DIR/*-$stamp.*"
