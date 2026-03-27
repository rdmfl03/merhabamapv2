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
- Confirm backups are configured and tested (DB snapshots + restore test)
- Confirm rate limiting and basic abuse protection are enabled on public endpoints
- Confirm CORS, cookies, and secure headers (HSTS, CSP if applicable) are configured for production
- Confirm secrets are not present in client bundles (inspect build output)

## Repository Boundary & Ingest Safety

- Confirm strict separation between repositories:
  - `merhabamap` (this repo): production app, user-facing features, moderation, approved data only
  - `merhabamap-ingest`: external ingestion pipeline (read-only reference for AI)
- Confirm no ingest logic exists in this repository (no scraping, no raw import pipelines)
- Confirm no direct dependency on raw ingest data (only approved/reviewed data enters production tables)
- Confirm there are no endpoints or jobs that bypass manual review
- Confirm developers/AI understand:
  - implementation happens ONLY in this repository
  - `merhabamap-ingest` is NOT modified from here (no patches, no refactors, no code generation)

- Add a quick codebase scan check:
  - search for keywords: "scrape", "crawler", "apify", "raw_import", "auto_publish"
  - ensure none of these are implemented as production paths

- Confirm review-first contract:
  - ingest → review queue → manual approval → publish
  - there is no direct ingest → publish path

- Optional safety check:
  - if ingest changes are needed, they are documented as external tasks (not implemented here)

## Data and Content Checks

- Run `npm run db:generate`
- Run `npm run db:push` or the production migration workflow
- Ensure demo seed data is not used in production unless intentionally staged
- Review public pilot city pages for Berlin and Köln
- Review at least one place and one event page in both `de` and `tr`
- Confirm trust badges only appear where backend state supports them
- Confirm no personally identifiable information (PII) from external sources exists in production tables
- Confirm deduplication is effective (no obvious duplicate events/places)
- Confirm city scoping works (Berlin/Köln correctly filter data)

## Transactional Email Checks

- Verify signup sends a verification email
- Verify password reset sends a reset email
- Verify claim submission sends a confirmation email
- Verify claim approval/rejection sends a decision email
- Confirm sender identity:
  - `From: noreply@merhabamap.com`
  - `Reply-To: info@merhabamap.com`
- Verify double opt-in flow (email verification required before account is active)
- Verify unsubscribe / preferences (if applicable) are respected

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
- Confirm audit logging for admin actions (approvals, rejections, edits)
- Confirm role-based access control (RBAC) is enforced for admin routes

## Readiness and Safety Checks

- `GET /api/health` returns healthy
- `GET /api/ready` returns ready
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
- Optional: run smoke / e2e checks before opening rollout further

- Verify no endpoints expose or accept raw external ingest payloads
- Verify admin/moderation gates exist before any content becomes public
- Verify logs do not contain sensitive personal data from external sources
- Verify feature flags do not enable any auto-publish behavior
- Verify no background jobs can auto-publish content without moderation
- Verify API responses do not leak internal IDs or sensitive metadata unnecessarily
- Verify error responses are sanitized (no stack traces in production)

## AI & Guard System Verification

- Confirm `docs/ai-context.md` and `docs/ai-guard-system.md` are present and up to date
- Confirm developers are instructed to load both files in Cursor before coding
- Confirm repository boundary is understood:
  - implementation ONLY in `merhabamap`
  - `merhabamap-ingest` is read-only context
- Confirm no recent changes violated:
  - review-first ingest model
  - DB stability rules
  - DSGVO constraints

## Soft Launch Procedure

- Start with a limited cohort
- Review admin queues at least daily during the first week
- Use `VERIFIED` sparingly until the moderation process is routine
- Treat repeated claims/reports from the same user as a signal to review context before acting
- Expand rollout only after:
  - email flows are stable
  - moderation queues are manageable
  - core discovery pages and auth flows remain healthy

## Rollback Preparedness

- Confirm database rollback strategy exists (migrations reversible or backups ready)
- Confirm feature flags can disable risky features quickly
- Confirm deployment can be reverted to previous stable version
- Identify on-call contact for first 72h after launch
