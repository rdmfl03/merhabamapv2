# Netlify Deployment

This project is a Next.js App Router application deployed with the Netlify Next.js runtime.

## Important Rules

- Add real environment variables in the Netlify UI.
- Do not commit real secrets, passwords, or API keys.
- Keep demo/dev-only flags disabled in production.
- Do not set a manual publish directory such as `.next` when using the Netlify Next.js runtime.

## Recommended Netlify Settings

- Node version: `20`
- Build command:

```bash
npm install && npx prisma generate && npm run build
```

- Publish directory: leave unset for the Netlify Next.js runtime

## Required Environment Variables in Netlify

### Runtime

- `NODE_ENV=production`
- `APP_ENV=production`
- `APP_NAME=MerhabaMap`
- `APP_URL=https://www.merhabamap.com`
- `DEFAULT_LOCALE=de`
- `LOG_LEVEL=info`
- `READINESS_ENABLE_DB_CHECK=true`

### Database

- `DATABASE_URL`

For DigitalOcean PostgreSQL, the production URL should include:

```text
sslmode=require
```

Example shape:

```text
postgresql://USER:PASSWORD@HOST:25060/defaultdb?sslmode=require
```

### Auth

- `AUTH_SECRET`
- `AUTH_URL=https://www.merhabamap.com`
- `AUTH_ENABLE_PASSWORD_LOGIN=true`
- `AUTH_DEMO_CREDENTIALS_ENABLED=false`
- `AUTH_ALLOW_CREDENTIALS_MOCK=false`

### Client / demo flags

- `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI=false`

### Email

- `EMAIL_TRANSPORT=resend`
- `RESEND_API_KEY`
- `EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES=60`

### Storage (only if used)

- `S3_REGION`
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

### Maps (optional MapTiler “Pastel”)

Same pattern as other secrets (e.g. `RESEND_API_KEY`): set **`MAPTILER_API_KEY`** in Netlify as a **secret** only. Do **not** use `NEXT_PUBLIC_*` for MapTiler — those values are embedded in the browser bundle and would be visible on a public site/repo.

When `MAPTILER_API_KEY` is set, the app serves MapTiler raster tiles through same-origin **`/api/map-tiles/...`**; the browser never receives the key. If unset, maps use OpenStreetMap only.

Remove any **legacy** MapTiler variable whose name starts with `NEXT_PUBLIC_` from Netlify.

### Netlify runtime helpers

- `NODE_VERSION=20`
- `NETLIFY_NEXT_SKEW_PROTECTION=true`

## Prisma Notes

- The repository already includes `npx prisma generate` in the recommended Netlify build command.
- No real database credentials should be stored in tracked files.
- Production should not depend on `.env.local`.

## Final Pre-Deploy Check

- `.env.production.example` is used only as a placeholder reference
- real production values exist in the Netlify UI
- `APP_URL` and `AUTH_URL` match the production domain
- demo flags are disabled
- mail provider is configured
- health and readiness endpoints respond after deployment
