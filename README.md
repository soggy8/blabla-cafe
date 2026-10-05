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

The app runs on `APP_PORT` (3000 by default). Keep PostgreSQL private and put the app behind the Pi’s HTTPS reverse proxy. Startup applies migrations, seeds an empty database, creates the initial owner once, and preserves the database and upload volumes.

The app sends a Content Security Policy and, outside development, `Strict-Transport-Security`. Serve the public site over HTTPS only.

Never expose port 5432, the Docker socket, `.env`, or the upload volume publicly.

## Backups

Install [`age`](https://age-encryption.org/), set `AGE_RECIPIENT`, and run:

```bash
./scripts/backup.sh
```

Copy encrypted archives off the Pi and test a restore before relying on them.

## Owner dashboard

- Add, edit, hide, feature, reorder, and delete menu items.
- Upload a photo per item. JPEG/PNG/WebP up to 8 MB is decoded, resized to 1600px, and rewritten as WebP; replaced or deleted photos are removed from disk.
- Add, rename, reorder, and hide categories. Hidden categories and their items disappear from the public site.
- Search items and browse them grouped by category.
- Slugs are generated from the Macedonian name when left empty.

## Owner security

- Argon2id password hashing.
- Opaque database-backed sessions; only token hashes are stored.
- `HttpOnly`, `SameSite=Lax`, and production `Secure` cookies.
- Login throttling with temporary blocking.
- Server-side authorization on every mutation and upload.
- `/admin` is excluded from search engines.

## Instagram

The site currently links to `@blablacafe14` posts listed in `data/menu.ts` and does not scrape Instagram. After the café authorizes its Professional account:

1. Create a Meta app with Instagram Login.
2. Request `instagram_business_basic`.
3. Set `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`, and current `META_GRAPH_VERSION`.
4. Schedule:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://cafe.example.com/api/meta/sync
```

Instagram has no new-media webhook, so this endpoint must be polled. Do not hotlink Instagram CDN images; those URLs expire.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
