# Bla Bla Cafe

Macedonian-first website prototype for Bla Bla Cafe in Strumica. It includes a public menu, secure owner dashboard, PostgreSQL persistence, optimized uploads, and a server-only Instagram synchronization boundary.

## Prototype mode

The public site works without environment variables using verified seed content:

- `/` — landing page
- `/menu` — searchable menu
- `/admin` — setup status or owner dashboard
- `/api/health` — application/database health

```bash
npm install
npm run dev
```

## Local PostgreSQL

Copy `.env.example` to `.env`, replace every placeholder, and start PostgreSQL.

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` creates or updates the owner when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

## Raspberry Pi deployment

The image uses Node 22 Alpine and supports ARM64. Put Docker data and this project on an SSD rather than an SD card.

```bash
cp .env.example .env
# edit .env
docker compose up -d --build
docker compose ps
```

The app runs on `APP_PORT` (3000 by default). Keep PostgreSQL private and put the app behind the Pi’s existing HTTPS reverse proxy. Startup applies migrations, seeds an empty database, creates the initial owner once, and preserves database/upload volumes.

Never expose port 5432, the Docker socket, `.env`, or the upload volume publicly.

## Backups

Install [`age`](https://age-encryption.org/), set `AGE_RECIPIENT`, and run:

```bash
./scripts/backup.sh
```

Copy encrypted archives off the Pi and test a restore before launch.

## Owner security

- Argon2id password hashing.
- Opaque database-backed sessions; only token hashes are stored.
- `HttpOnly`, `SameSite=Lax`, and production `Secure` cookies.
- Login throttling with temporary blocking.
- Server-side authorization on every mutation and upload.
- JPEG/PNG/WebP uploads are decoded, resized, and rewritten as WebP.

The dashboard supports item creation, editing, visibility, featured state, ordering, and deletion. Category management and image selection can be expanded when the full menu arrives.

## Instagram

The prototype links to verified `@blablacafe14` posts and does not scrape Instagram. After the café authorizes its Professional account:

1. Create a Meta app with Instagram Login.
2. Request `instagram_business_basic`.
3. Set `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`, and current `META_GRAPH_VERSION`.
4. Schedule:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://cafe.example.com/api/meta/sync
```

Instagram has no new-media webhook, so this endpoint must be polled. Facebook Page syncing remains separate because no official café Page was verified.

## Content handoff

Replace prototype art with original café assets and complete the menu through `/admin`. Do not hotlink Google Maps or Instagram CDN images; those URLs expire and do not establish reuse rights.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
