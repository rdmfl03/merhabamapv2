# MerhabaMap Go-Live Checklist

This checklist is intentionally short and operational. It is not legal advice or a substitute for infrastructure-specific runbooks.

## Before Production Rollout

- Confirm `APP_URL`, `AUTH_URL`, `AUTH_SECRET`, and `DATABASE_URL` are set for production.
- Confirm `EMAIL_TRANSPORT` is explicitly configured and the provider is working.
- Confirm demo/dev-only flags are disabled in production:
  - `AUTH_DEMO_CREDENTIALS_ENABLED=false`
  - `AUTH_ALLOW_CREDENTIALS_MOCK=false`
  - `NEXT_PUBLIC_ENABLE_DEV_DEMO_UI=false`
- Confirm legal placeholders have been replaced:
  - `Impressum`
  - privacy contact details
  - responsible entity information
- Confirm the first real admin account can sign in and access:
  - `/de/admin`
  - `/tr/admin`

## Data and Content Checks

- Run `npm run db:generate`
- Run `npm run db:push` or the production migration workflow
- Ensure demo seed data is not used in production unless intentionally staged
- Review public pilot city pages for Berlin and Köln
- Review at least one place and one event page in both `de` and `tr`
- Confirm trust badges only appear where backend state supports them

## Transactional Email Checks

- Verify signup sends a verification email
- Verify password reset sends a reset email
- Verify claim submission sends a confirmation email
- Verify claim approval/rejection sends a decision email
- Confirm sender identity:
  - `From: noreply@merhabamap.com`
  - `Reply-To: info@merhabamap.com`

## Operations and Moderation Checks

- Confirm reports can be submitted and appear in the admin queue
- Confirm claims can be submitted and appear in the admin queue
- Confirm moderators/admins understand:
  - `CLAIMED` means an ownership claim was approved
  - `VERIFIED` means MerhabaMap additionally confirmed key information
- Confirm soft-launch owners know who checks:
  - open reports
  - pending claims
  - suspicious or repeated submissions

## Readiness and Safety Checks

- `GET /api/health` returns healthy
- `GET /api/ready` returns ready
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
- Optional: run smoke / e2e checks before opening rollout further

## Soft Launch Procedure

- Start with a limited cohort
- Review admin queues at least daily during the first week
- Use `VERIFIED` sparingly until the moderation process is routine
- Treat repeated claims/reports from the same user as a signal to review context before acting
- Expand rollout only after:
  - email flows are stable
  - moderation queues are manageable
  - core discovery pages and auth flows remain healthy
