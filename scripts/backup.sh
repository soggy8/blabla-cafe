#!/bin/sh
set -eu

: "${BACKUP_DIR:=./backups}"
: "${AGE_RECIPIENT:?Set AGE_RECIPIENT to your age public key}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

mkdir -p "$BACKUP_DIR"
docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > "$workdir/database.dump"
docker compose exec -T app tar -czf - -C /app/storage/uploads . \
  > "$workdir/uploads.tar.gz"

tar -czf - -C "$workdir" database.dump uploads.tar.gz \
  | age -r "$AGE_RECIPIENT" \
  > "$BACKUP_DIR/blabla-$timestamp.tar.gz.age"

find "$BACKUP_DIR" -type f -name 'blabla-*.age' -mtime +30 -delete
echo "Encrypted backup created: $BACKUP_DIR/blabla-$timestamp.tar.gz.age"
