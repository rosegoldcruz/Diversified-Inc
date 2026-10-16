# Deploying Diversified OS on Railway

Services (one Railway project per environment):

| Service | Source | Notes |
|---|---|---|
| `web` | this repo (`Dockerfile`, `railway.json`) | Next.js 14 app + API routes. Health check: `GET /api/health`. Listens on `$PORT`. |
| `Postgres` | Railway PostgreSQL | Source of truth. Accessed with `pg` (no ORM). |
| Volume | attached to `web` at `/data` | Durable uploads. `FILE_STORAGE_DIR=/data/uploads`. |

## Database

Fresh database: `DATABASE_URL=... bash scripts/migrate.sh` (base schema in
`db/000-base-schema.sql`, then the idempotent `scripts/migrate-*.sql`). `lib/schema.ts`
also runs a small idempotent bootstrap at first request.
Never point staging at the production database.

## Environment variables

Required:
- `DATABASE_URL` — reference the Railway Postgres service: `${{Postgres.DATABASE_URL}}`
- `SESSION_SECRET` — long random string (secret)
- `FILE_STORAGE_DIR=/data/uploads` (mount a Railway volume at `/data`)
- `APP_URL`, `NEXT_PUBLIC_APP_URL` — the public Railway domain (NEXT_PUBLIC_* is baked at build time)

Auth (ZITADEL OIDC):
- `ZITADEL_DISCOVERY_URL`, `ZITADEL_CLIENT_SECRET` (secret), `ZITADEL_REDIRECT_URI` (`$APP_URL/api/auth/callback`), `ZITADEL_POST_LOGOUT_REDIRECT_URI`
- Optional bootstrap admin: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`

Cookies: session cookies are `HttpOnly; SameSite=Lax` and `Secure` in production.
Override with `COOKIE_SECURE=true|false` only if needed.

AI (optional): `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_MODEL`.

Automations (optional): `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `N8N_BASE_URL`, `N8N_*_WEBHOOK`, `NOCODB_BASE_URL`.

Microsoft 365 / Graph has been removed; no `MICROSOFT_*` variables are used.
