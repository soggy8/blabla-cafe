#!/bin/sh
# Restores an encrypted backup made by scripts/backup.sh into the running
# compose stack. DESTRUCTIVE: replaces the database and the uploaded photos.
#
#   AGE_IDENTITY=~/age-key.txt ./scripts/restore.sh backups/blabla-<stamp>.tar.gz.age
#   add --yes to skip the confirmation prompt
set -eu

archive="${1:?Usage: restore.sh <backup.tar.gz.age> [--yes]}"
: "${AGE_IDENTITY:?Set AGE_IDENTITY to the path of your age private key}"
[ -f "$archive" ] || { echo "No such file: $archive" >&2; exit 1; }

if [ "${2:-}" != "--yes" ]; then
  printf 'This REPLACES the live database and uploads with %s. Type "restore" to continue: ' "$archive"
  read -r answer
  [ "$answer" = "restore" ] || { echo "Aborted."; exit 1; }
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

age -d -i "$AGE_IDENTITY" -o "$workdir/backup.tar.gz" "$archive"
tar -xzf "$workdir/backup.tar.gz" -C "$workdir"
[ -f "$workdir/database.dump" ] && [ -f "$workdir/uploads.tar.gz" ] \
  || { echo "Archive is missing database.dump or uploads.tar.gz" >&2; exit 1; }

docker compose stop app scheduler
docker compose exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
  < "$workdir/database.dump"

# Uploads are restored through the app container itself so the files keep the
# volume's ownership and security labels.
docker compose up -d --wait app
docker compose exec -T --user root app sh -c \
  'find /app/storage/uploads -mindepth 1 -delete && tar -xzf - -C /app/storage/uploads && chown -R nextjs:nodejs /app/storage/uploads' \
  < "$workdir/uploads.tar.gz"

docker compose up -d scheduler
echo "Restore complete. Check the site and the dashboard."
