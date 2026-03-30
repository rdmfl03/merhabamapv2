# Contributing

## Before You Start

- read [docs/ai-guard-system.md](docs/ai-guard-system.md) if you use AI tools or touch user-facing copy, privacy, or security-sensitive areas (Germany/EU expectations, platform messaging)
- treat MerhabaMap as a real production-oriented application
- preserve Germany-first scope and bilingual Turkish/German behavior
- avoid changes that weaken auth, moderation, privacy, or safety checks
- do not commit secrets, private data, or machine-specific local files

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Copy `.env.test.example` to `.env.test.local`.
4. Configure local PostgreSQL databases.
5. Run `npm run db:setup`.

## Expected Checks

Run the relevant checks for the area you changed:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

If your change affects database setup, auth, moderation, ingest, or deployment behavior, include notes about local verification and risk.

## Change Guidelines

- keep changes minimal and reversible
- prefer documented follow-up over risky cleanup
- preserve public-safe docs and example env files
- avoid inventing product claims, metrics, or unsupported workflows
- keep Turkish/German content and locale-aware behavior intact

## Security-Sensitive Areas

Be especially careful in:

- `src/app/api/**`
- `src/lib/auth/**`
- `src/server/actions/admin/**`
- `prisma/**`
- env handling and deployment docs
- workflow and ingest-related files

If a change feels operationally risky, document it and ask for maintainer review instead of forcing it.
