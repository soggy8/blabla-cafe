#!/bin/sh
# Runs inside the `scheduler` compose service: checks the site every minute,
# pings an optional external dead-man's-switch, and syncs Instagram every 6h.
#
#   APP_URL          internal address of the app (default http://app:3000)
#   CRON_SECRET      bearer token for /api/meta/sync
#   HEALTHCHECK_PING_URL  optional healthchecks.io-style URL; pinged only while
#                    the app is healthy, so silence raises the alert
set -u

APP_URL="${APP_URL:-http://app:3000}"
SYNC_EVERY="${SYNC_EVERY_SECONDS:-21600}"
last_sync=0

log() { echo "$(date -u +%FT%TZ) $*"; }

while :; do
  if curl -fsS -m 10 -o /dev/null "$APP_URL/api/health"; then
    [ -n "${HEALTHCHECK_PING_URL:-}" ] && curl -fsS -m 10 -o /dev/null "$HEALTHCHECK_PING_URL" || true
  else
    log "health check FAILED"
  fi

  now="$(date +%s)"
  if [ $((now - last_sync)) -ge "$SYNC_EVERY" ]; then
    if out="$(curl -fsS -m 120 -X POST -H "Authorization: Bearer ${CRON_SECRET:-}" "$APP_URL/api/meta/sync" 2>&1)"; then
      log "instagram sync: $out"
    else
      log "instagram sync FAILED: $out"
    fi
    last_sync="$now"
  fi
  sleep 60
done
