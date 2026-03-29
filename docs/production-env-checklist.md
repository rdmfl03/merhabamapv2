# Production Environment Checklist

Use this checklist before connecting Netlify or another production runtime to the live app. Do not store real secrets in the repository.

## 1. Required For App Start

- `APP_NAME`
  - Display name used in metadata and UI.
- `APP_URL`
  - Canonical site URL for metadata, redirects, sitemap, and email links.
- `NODE_ENV`
  - Should be `production`.
- `APP_ENV`
  - Should be `production`.

## 2. Required For Database And Auth

- `DATABASE_URL`
  - Main production PostgreSQL connection string.
- `AUTH_SECRET`
  - Long random secret for session/auth integrity.
- `AUTH_ENABLE_PASSWORD_LOGIN`
  - Explicitly set to `true` or `false`.
- `AUTH_ALLOW_SIGNUP`
  - For a **closed** public production (no new user self-registration): set to `false` or **omit** entirely — the app treats signup as disabled in production when this variable is unset. Set to `true` only when you deliberately open registration.
- `AUTH_DEMO_CREDENTIALS_ENABLED`
  - Must stay `false` in production.
- `AUTH_ALLOW_CREDENTIALS_MOCK`
  - Must stay `false` in production.

## 3. Required To Avoid Common Runtime Failures

- `EMAIL_TRANSPORT`
  - Required in production by the current server env validation.
- `RESEND_API_KEY`
  - Required when `EMAIL_TRANSPORT=resend`.

These variables are especially likely to cause startup or request failures when missing or invalid:

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `EMAIL_TRANSPORT`
- `RESEND_API_KEY` when using Resend

## 4. Optional / Later

- `AUTH_URL`
  - Optional reference URL for auth-related infrastructure.
- `READINESS_ENABLE_DB_CHECK`
  - Enables DB validation in readiness checks.
- `DEFAULT_LOCALE`
  - Defaults to `de` if omitted.
- `LOG_LEVEL`
  - Defaults to `info`.
- `S3_REGION`
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_MAPTILER_API_KEY` (optional; omit or empty → OpenStreetMap tiles only)
- `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI`

## 5. Deployment Notes

- Set real secrets only in the deployment platform UI.
- Do not commit `.env.local`.
- Keep dump files and one-off migration artifacts out of commits.
- Use the same production `DATABASE_URL` for the separate `merhabamap-ingest` runtime when it should write to the same live database.
