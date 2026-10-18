# Bla Bla Cafe

Macedonian website for Bla Bla Cafe, Маршал Тито 146, Струмица. It includes the public site and full menu, a password-protected owner dashboard, PostgreSQL persistence, optimized photo uploads, and a server-only Instagram synchronization boundary.

## Routes

- `/` — landing page
- `/menu` — full menu with category filter and search
- `/admin` — owner dashboard (setup notice when no database is configured)
- `/api/health` — application/database health
- `/robots.txt`, `/sitemap.xml` — search engine metadata

## Development

The public site runs without environment variables using the bundled menu in `data/menu.ts`:

```bash
npm install
npm run dev
```

To work on the dashboard, copy `.env.example` to `.env`, replace every placeholder, start PostgreSQL, and run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` creates or updates the owner when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

> `db:seed` overwrites menu items and categories that exist in `data/menu.ts` with the bundled values, including prices and names edited in the dashboard. Items and categories created in the dashboard are kept. On a live database, only run it when you intend to reset the menu.

## Raspberry Pi deployment

The image uses Node 22 Alpine and supports ARM64. Put Docker data and this project on an SSD rather than an SD card.

```bash
cp .env.example .env
# edit .env — set NEXT_PUBLIC_SITE_URL to the public https:// address
docker compose up -d --build
docker compose ps
```

The app runs on `APP_PORT` (3000 by default), published on `127.0.0.1` only (`APP_BIND` changes that). Keep PostgreSQL private and put the app behind the Pi’s HTTPS reverse proxy. Startup applies migrations, seeds an empty database, creates the initial owner once, and preserves the database and upload volumes.

Compose starts three services: `db`, `app`, and `scheduler`. The scheduler checks `/api/health` every minute (pinging `HEALTHCHECK_PING_URL` while healthy) and calls the Instagram sync every 6 hours.

### Reverse proxy

The proxy must forward the original host and **append** the client address to `X-Forwarded-For`. The login throttle trusts only the last entry of that header, so the app must not be reachable except through the proxy. Caddy does all of this by default:

```
cafe.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

nginx needs it spelled out; without `X-Forwarded-Host` the dashboard rejects every action:

```
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $http_host;
  proxy_set_header X-Forwarded-Host $http_host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The app sends a Content Security Policy and, outside development, `Strict-Transport-Security`. Serve the public site over HTTPS only.

Never expose port 5432, the Docker socket, `.env`, or the upload volume publicly.

## Backups

Install [`age`](https://age-encryption.org/), set `AGE_RECIPIENT`, and run:

```bash
./scripts/backup.sh
```

Copy encrypted archives off the Pi, and schedule the script (cron or a systemd timer) — it does not run by itself.

Restore with the private key (this replaces the live database and photos):

```bash
AGE_IDENTITY=~/age-key.txt ./scripts/restore.sh backups/blabla-<timestamp>.tar.gz.age
```

Restore has been tested end to end against the Docker stack. Repeat it on your own hardware before relying on backups.

## Owner dashboard

- Add, edit, hide, feature, reorder, and delete menu items.
- Upload a photo per item. JPEG/PNG/WebP up to 8 MB is decoded, resized to 1600px, and rewritten as WebP; replaced or deleted photos are removed from disk.
- Add, rename, reorder, and hide categories. Hidden categories and their items disappear from the public site.
- Search items and browse them grouped by category.
- Slugs are generated from the Macedonian name when left empty.

## Forgotten password

Set `ADMIN_PASSWORD=<new password>` and `RESET_ADMIN_PASSWORD=1` in `.env`, run `docker compose up -d app`, log in, then remove `RESET_ADMIN_PASSWORD`. All existing sessions are revoked.

## Owner security

- Argon2id password hashing.
- Opaque database-backed sessions; only token hashes are stored.
- `HttpOnly`, `SameSite=Lax`, and production `Secure` cookies.
- Login throttling per client address (5 failures) and per account (20), with a 15-minute block.
- Server-side authorization on every mutation and upload.
- `/admin` is excluded from search engines.

## Instagram

Without credentials the homepage shows the posts listed in `data/menu.ts`. After the café authorizes its Professional account:

1. Create a Meta app with Instagram Login and request `instagram_business_basic`.
2. Generate a long-lived token and set `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`, and the current `META_GRAPH_VERSION` in `.env`.
3. `docker compose up -d` — the `scheduler` service syncs every 6 hours. To run one by hand:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/meta/sync
```

Instagram has no new-media webhook, so the sync polls. Images are copied into the upload volume because Instagram CDN URLs expire.

The long-lived token lasts 60 days. Each sync renews it once it is a week old and keeps the renewed token in the database (a newly pasted `.env` token always wins). If the site is off for 60+ days the token expires and a new one must be generated.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm audit --omit=dev
npm run build
```

Tests run against an in-memory PostgreSQL (PGlite) with the real migrations, so no database is needed. GitHub Actions runs the same checks plus a Docker build (`.github/workflows/ci.yml`).

## Handoff

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for the client handoff checklist and recovery cheat sheet, and [`docs/UPUTSTVO-ZA-SOPSTVENIK.md`](docs/UPUTSTVO-ZA-SOPSTVENIK.md) for the owner guide (Macedonian).
