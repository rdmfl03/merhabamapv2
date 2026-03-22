# MerhabaMap

MerhabaMap is a Germany-first community platform for people with Turkish background living in Germany. The application is bilingual in Turkish and German and combines local discovery, places, events, profiles, submissions, and moderation workflows in one product.

This repository is production-oriented software, not a demo app. It includes local development and test helpers, but public contributors should treat security, privacy, moderation, and GDPR-aware handling as core project constraints.

## Scope

- Germany-first rollout
- bilingual Turkish/German UX and system communication
- community discovery across places, events, and related local participation flows
- moderation, auth, and compliance-sensitive behavior preserved by default

## Tech Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- Playwright and Vitest

## Local Setup

1. Use Node `20` or any version `>=18.18.0`.
2. Install dependencies with `npm install`.
3. Copy example env files:
   - `cp .env.example .env.local`
   - `cp .env.test.example .env.test.local`
4. Update both files to point to local PostgreSQL databases.
5. Run `npm run db:setup`.

Example env files included in the repo:

- `.env.example`
- `.env.test.example`
- `.env.production.example`
- `.env.n8n.example`

Local scripts are designed around `.env.local` for development and `.env.test.local` for tests. Real production secrets should never be committed.

## Development Commands

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:smoke`
- `npm run build`
- `npm run prisma:validate`

Useful database helpers:

- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:reseed`

The repository includes checked-in Prisma migrations and also supports local `db:push`-based development flows. Use the approach documented for your environment rather than assuming production and local database workflows are identical.

## Seed Data and Local Demo Helpers

The repository contains seed data and local demo/test helpers to support development, onboarding, and automated tests. These are for local or controlled non-production use only and must remain disabled in production environments.

## Operational Workflows

Operational workflows, including n8n-based automation, are managed privately and are not included in the public repository.

If you need local orchestration infrastructure, use the public-safe setup guidance in [docs/local-n8n.md](docs/local-n8n.md) and configure your own private workflows and credentials.

## Deployment Notes

High-level deployment guidance is documented in [docs/netlify-deploy.md](docs/netlify-deploy.md). Keep deployment secrets in your hosting platform, not in tracked files.

Production expectations include:

- strong `AUTH_SECRET`
- demo flags disabled
- production database credentials managed outside git
- transactional email configured safely

## Security and Privacy

- transactional emails use `noreply@merhabamap.com` with `Reply-To: info@merhabamap.com`
- the project should remain security-first and GDPR-aware
- do not commit real credentials, tokens, user data, or private infrastructure values
- do not weaken auth, moderation, or safety checks for convenience

See [SECURITY.md](SECURITY.md) for reporting guidance.

## Contributing

Contribution guidance is available in [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes minimal, reversible, and well-documented, especially around auth, moderation, env handling, database behavior, and bilingual content.
