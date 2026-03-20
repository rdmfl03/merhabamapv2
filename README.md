# merhabamapv2
MerhabaMap – A platform connecting Turks worldwide through places, events, communities, and local discovery.

## Local development data

Use the Prisma seed to load a realistic MVP demo dataset:

- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`

For a full local reset + reseed:

- `npm run db:reseed`

Or run the full setup flow on a fresh database:

- `npm run db:setup`

For production/staging migrations without interactive prompts:

- `npm run db:migrate:deploy`

## Testing

Recommended local test flow:

- `npm run test:e2e:setup`
- `npm run test:unit`
- `npm run test:smoke`

Available quality commands:

- `npm run lint`
- `npm run typecheck`
- `npm run prisma:validate`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`
- `npm run ci:check`

The E2E suite is seed-driven and expects the demo accounts and demo content from `prisma/seed.ts`.
Playwright uses the normal sign-in flow with seeded credentials. No production auth shortcut is introduced for tests.

Recommended local validation order:

1. use Node `20` or any version `>=18.18.0`
2. `npm install`
3. `cp .env.example .env.local`
4. `cp .env.test.example .env.test.local`
5. update both files to use your local PostgreSQL databases
6. ensure `.env.local` points to `merhabamap_dev` and `.env.test.local` points to `merhabamap_test`
7. `npm run db:setup`
8. `NODE_ENV=test npm run db:push && NODE_ENV=test npm run db:seed`
9. `npm run prisma:validate`
10. `npm run lint`
11. `npm run typecheck`
12. `npm run test:unit`
13. `npm run build`
14. `npm run test:smoke`

`db:push` is the stable local baseline right now because the repository does not yet maintain a checked-in Prisma migrations history. `db:migrate` should only be used when you are intentionally creating a new migration.
If you use `nvm`, the repository now includes an `.nvmrc` file pointing to Node 20.
Repository scripts now use this env-file layout:

- local development: `.env.local`
- unit/integration/e2e tests: `.env.test.local`
- production: deployment platform environment variables, not local env files

The local defaults are:

- dev database: `postgresql://localhost:5432/merhabamap_dev`
- test database: `postgresql://localhost:5432/merhabamap_test`

Repository scripts intentionally ignore `.env` to avoid accidental use of a real remote database during local work.
If no local env file exists yet, repository scripts fall back to `.env.example` for development convenience and `.env.test.example` for test setup guidance.

Current E2E coverage focuses on:

- public landing and discovery smoke
- locale-aware route smoke
- sign-in and onboarding redirect/completion
- save/unsave flows
- claim/report submission smoke
- admin access protection
- business owner access protection

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
- `AUTH_ENABLE_PASSWORD_LOGIN=true`
- `EMAIL_TRANSPORT=resend`
- `RESEND_API_KEY` when `EMAIL_TRANSPORT=resend`
- `NODE_VERSION=20`

Recommended runtime variables:

- `LOG_LEVEL=info`
- `READINESS_ENABLE_DB_CHECK=true`
- `EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES=60`

Production safety defaults:

- keep `AUTH_DEMO_CREDENTIALS_ENABLED=false`
- keep `AUTH_ALLOW_CREDENTIALS_MOCK=false`
- keep `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI=false`
- use a strong random `AUTH_SECRET`
- keep transactional mail on a real provider in production
- run `npm run db:migrate:deploy` before serving traffic

Health and readiness endpoints:

- `GET /api/health`
- `GET /api/ready`

`/api/health` is a lightweight liveness check.
`/api/ready` optionally verifies database connectivity and returns `503` if the app is not ready.

## Netlify deployment

- Canonical production env template: `.env.production.example`
- Add real production secrets manually in the Netlify UI
- Recommended Netlify build command:
  - `npm install && npx prisma generate && npm run build`
- Do not set a manual publish directory like `.next` for the Netlify Next.js runtime
- Use Node `20`
- For DigitalOcean PostgreSQL, set `DATABASE_URL` with `sslmode=require`
- Keep demo flags disabled in production
- Full deployment notes: `docs/netlify-deploy.md`

## Production notes

- Runtime logs are structured and redact common sensitive fields.
- Demo helpers are environment-gated and must remain disabled in production.
- Security headers are configured in `next.config.ts`.
- Admin and business access remain server-side role protected.
- Seed/demo content is intended for local and staging use, not for production initialization.
- Transactional emails use `noreply@merhabamap.com` with `Reply-To: info@merhabamap.com`.
- All transactional emails are bilingual with Turkish first and German second.
- Password reset and email verification use hashed one-time tokens with expiry.

## Launch operations

- Go-live checklist: `docs/go-live-checklist.md`
- Moderation runbook: `docs/moderation-runbook.md`

For the MVP soft launch, keep rollout intentionally narrow and review these queues daily:

- open reports
- pending claims
- claimed places that may need verification review
- transactional email health
