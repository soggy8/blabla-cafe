# Handoff checklist

Work through this with the client. Tick each item when done.

## Accounts and ownership

- [ ] Domain registered in the **client's** name; DNS points at the Raspberry Pi's public address.
- [ ] Hardware (Pi, SSD) belongs to the client; note where it physically lives and who can power-cycle it.
- [ ] Router forwards 80/443 to the Pi (or a tunnel is set up); port 5432 and the Docker socket are **not** exposed.
- [ ] GitHub repository access: client org/account owns or is added as owner.
- [ ] Meta developer app and the Instagram Professional account are owned by the client.
- [ ] Password manager entry shared with the client: owner login, `.env` contents, backup key.

## First deployment

- [ ] `cp .env.example .env` and fill **every** value with generated secrets (`openssl rand -base64 32`).
- [ ] `NEXT_PUBLIC_SITE_URL` is the final `https://` address (it is baked into the image at build time).
- [ ] Reverse proxy terminates HTTPS and forwards `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and **appends** to `X-Forwarded-For` (see README → Reverse proxy).
- [ ] `docker compose up -d --build`; `docker compose ps` shows `app` healthy.
- [ ] `https://DOMAIN/api/health` returns `{"ok":true,"database":true}`.
- [ ] Owner logs in and **changes the initial password**; after that `ADMIN_PASSWORD` in `.env` is ignored (it only seeds the first owner), so replace it with a random value rather than leaving the old password in the file.
- [ ] Menu, prices, phone, address and opening hours are verified by the client (see "Business details" below).
- [ ] Placeholder promotions (seeded once from Instagram posts of Aug–Sep 2026: morning combo, school offer, weekend beer + board — the last one hidden) are confirmed, edited or removed by the client under **Промоции**.

## Monitoring

- [ ] Create a check at healthchecks.io (or similar) and put its URL in `HEALTHCHECK_PING_URL`; set it to alert the client **and** the maintainer by e-mail/SMS. The scheduler pings it every minute while the site is healthy, so an outage or a powered-off Pi triggers an alert.
- [ ] Optional: external HTTP monitor (UptimeRobot etc.) on `https://DOMAIN/api/health`.
- [ ] `docker compose logs -f scheduler` shows `instagram sync:` lines every 6 hours.

## Instagram

- [ ] Instagram Professional account authorized; `INSTAGRAM_USER_ID` and a **long-lived** `INSTAGRAM_ACCESS_TOKEN` set in `.env`.
- [ ] After a sync, the homepage shows real posts.
- [ ] Token refresh is automatic (the app renews it weekly and stores the renewed token in the database). If the site goes 60+ days without a successful sync (Pi off, etc.) the token expires: generate a new one in the Meta dashboard and paste it into `.env`.

## Backups

- [ ] Install `age` on the Pi; generate a key pair on the **maintainer's/client's computer** (`age-keygen`), put only the public key in `AGE_RECIPIENT`. Keep the private key in the password manager — without it backups are useless.
- [ ] Schedule `scripts/backup.sh` (cron/systemd timer, daily) and copy the archives off the Pi (second disk, cloud storage, or another computer).
- [ ] **Do a real restore test** with `scripts/restore.sh` on a spare machine and confirm menu, prices and photos return. Record the date: ______

## Business details that are not editable in the dashboard

These live in code; changing them needs a developer and a rebuild (`docker compose up -d --build`):

| What | Where |
| --- | --- |
| Address, phone, opening hours (structured data for Google) | `components/business-json-ld.tsx` |
| Address/phone/hours shown on the page | `app/page.tsx`, `components/hero-motion.tsx` |
| Page title / description | `app/layout.tsx` |
| Instagram handle / links | `app/page.tsx`, `app/menu/page.tsx`, `data/menu.ts` |

## Support and maintenance

- [ ] Agree who does security updates (`npm audit`, base-image rebuilds — suggested monthly) and who pays for them.
- [ ] Agree response times and the contact channel; fill in the contact line in `docs/UPUTSTVO-ZA-SOPSTVENIK.md`.
- [ ] Give the client the printed/PDF owner guide: `docs/UPUTSTVO-ZA-SOPSTVENIK.md`.
- [ ] "Powered by ESTADA" footer link: confirmed with the client.

## Recovery cheat sheet

| Situation | Action |
| --- | --- |
| Owner forgot the password | In `.env` set `ADMIN_PASSWORD=<new>` and `RESET_ADMIN_PASSWORD=1`, run `docker compose up -d app`, log in, then remove `RESET_ADMIN_PASSWORD` (the new password stays). All sessions are revoked. |
| Site down | `docker compose ps`, `docker compose logs --tail 100 app`, `docker compose up -d`. |
| Data lost / bad edit | `AGE_IDENTITY=key.txt ./scripts/restore.sh backups/<file>.age` |
| Instagram posts stale | `docker compose logs scheduler`; if the token expired, paste a new token into `.env` and `docker compose up -d app scheduler`. |
