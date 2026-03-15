# merhabamapv2
MerhabaMap – A platform connecting Turks worldwide through places, events, communities, and local discovery.

## Local development data

Use the Prisma seed to load a realistic MVP demo dataset:

- `npm run db:migrate`
- `npm run db:generate`
- `npm run db:seed`

For a full local reset + reseed:

- `npm run db:reseed`

Or run the full setup flow on a fresh database:

- `npm run db:setup`

For production/staging migrations without interactive prompts:

- `npm run db:migrate:deploy`

## Demo credentials

Demo credentials are available only when:

- `AUTH_DEMO_CREDENTIALS_ENABLED=true`
- `APP_ENV` is not `production`

Optional in-app demo account hints are shown only when:

- `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI=true`

Seeded demo users:

- `demo.user@example.com`
- `demo.business@example.com`
- `demo.moderator@example.com`
- `demo.admin@example.com`
- `demo.fresh@example.com`

All demo users use the same password:

- `DemoPass!123`

These accounts exist only for local/staging development and should not be exposed in production.

## Environment and deployment

Required production variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `APP_URL`
- `APP_ENV=production`

Recommended runtime variables:

- `LOG_LEVEL=info`
- `READINESS_ENABLE_DB_CHECK=true`

Production safety defaults:

- keep `AUTH_DEMO_CREDENTIALS_ENABLED=false`
- keep `AUTH_ALLOW_CREDENTIALS_MOCK=false`
- keep `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI=false`
- use a strong random `AUTH_SECRET`
- run `npm run db:migrate:deploy` before serving traffic

Health and readiness endpoints:

- `GET /api/health`
- `GET /api/ready`

`/api/health` is a lightweight liveness check.
`/api/ready` optionally verifies database connectivity and returns `503` if the app is not ready.

## Production notes

- Runtime logs are structured and redact common sensitive fields.
- Demo helpers are environment-gated and must remain disabled in production.
- Security headers are configured in `next.config.ts`.
- Admin and business access remain server-side role protected.
- Seed/demo content is intended for local and staging use, not for production initialization.
