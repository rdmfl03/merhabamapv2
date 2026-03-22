# MerhabaMap

Germany-first bilingual community discovery for the Turkish diaspora in Germany.

## Problem

People with Turkish background in Germany often discover places, events, and community infrastructure through fragmented channels. MerhabaMap aims to provide a clearer local discovery layer with Turkish/German support and a trust-aware product approach.

## Features

- places and local business discovery
- event discovery
- bilingual Turkish/German UX
- user profiles and saved content
- community submissions and moderation workflows

## Tech Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- Vitest and Playwright

## Local Development

1. Use Node `20` or any version `>=18.18.0`.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Copy `.env.test.example` to `.env.test.local`.
5. Configure local PostgreSQL databases.
6. Run `npm run db:setup`.
7. Start the app with `npm run dev`.

Common checks:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Deployment guidance and local orchestration notes are available in:

- [docs/netlify-deploy.md](docs/netlify-deploy.md)
- [docs/local-n8n.md](docs/local-n8n.md)

Operational workflows such as n8n definitions are intentionally kept private and are not part of the public repository.

## Security & Privacy

MerhabaMap should remain security-first and GDPR-aware. Do not commit secrets, private operational details, or real user data. Transactional emails use `noreply@merhabamap.com` with `Reply-To: info@merhabamap.com`.

See [SECURITY.md](SECURITY.md) for reporting guidance and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations.

## Status

Actively developed and tested locally before production rollout.
