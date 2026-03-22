# MerhabaMap

Germany-first community platform for discovering local places, events, and connections within the Turkish diaspora in Germany.

## Problem

People with Turkish background in Germany often discover places, events, and community infrastructure through fragmented channels.
MerhabaMap aims to provide a clearer, structured local discovery layer with bilingual Turkish/German support and a trust-aware product approach.

## Approach

MerhabaMap combines structured data, moderation, and community-driven contributions to improve discovery quality and reduce noise.
The product is designed to stay security-aware, privacy-aware, and conservative around trust signals.

## Features

- places and local business discovery
- event discovery
- bilingual Turkish/German UX
- user profiles and saved content
- community submissions and moderation workflows

## Tech Stack

- Next.js / React
- Node.js / API routes
- PostgreSQL / Prisma
- NextAuth
- AI-assisted data processing and moderation

## Getting Started

### Prerequisites

- Node.js `20` or current LTS
- npm
- PostgreSQL

### Installation

```bash
git clone https://github.com/rdmfl03/merhabamapv2
cd merhabamapv2
npm install
```

### Environment

Create local env files from the examples:

```bash
cp .env.example .env.local
cp .env.test.example .env.test.local
```

Then configure the database values for your local PostgreSQL setup.

### Database Setup

```bash
npm run db:setup
```

### Run Locally

```bash
npm run dev
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Optional setup and deployment guidance:

- [docs/local-n8n.md](docs/local-n8n.md)
- [docs/netlify-deploy.md](docs/netlify-deploy.md)

Operational workflows such as private automation and ingestion pipelines are intentionally not included in the public repository.

## Security & Privacy

MerhabaMap handles user-generated content and location-based data.
Security, abuse prevention, and GDPR compliance for Germany/EU are core design principles.

Please do not commit secrets, private operational details, or real user data.
See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Contributing

Contributions are welcome.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## Status

Actively developed and tested locally before production rollout.
Current focus is on data quality, moderation workflows, and secure infrastructure.
