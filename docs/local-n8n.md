# Local n8n


This setup is for local workflow runs only. It does not connect to any remote database.
Operational workflows are managed privately and are not included in the public repository.

## Safety Notice

This local n8n setup is for development and testing support only.
It must not be treated as a production publishing path.

Rules:
- n8n must NOT directly publish content to production-facing entities
- n8n must NOT bypass review or moderation workflows
- n8n must NOT write raw external ingest data into approved production tables
- n8n outputs must always remain reviewable and controlled

Repository boundary:
- `merhabamap` (this repository) is the main app and the only repository where implementation happens
- `merhabamap-ingest` is a separate ingest repository and is read-only context for AI
- ingest logic must not be reimplemented or simulated here

If a workflow change would affect ingestion behavior, treat it as an ingest-side concern and do not implement equivalent ingest logic in this repository.

## Start n8n

1. Copy the local n8n env template:
   - `cp .env.n8n.example .env.n8n.local`
2. Edit `.env.n8n.local` and set:
   - `N8N_BASIC_AUTH_USER`
   - `N8N_BASIC_AUTH_PASSWORD`
   - `N8N_ENCRYPTION_KEY`
3. Start n8n:
   - `docker compose -f docker-compose.n8n.yml --env-file .env.n8n.local up -d`
4. Open:
   - `http://localhost:5678`

To stop it:

- `docker compose -f docker-compose.n8n.yml --env-file .env.n8n.local down`

## Repository Boundary Reminder

This document may reference ingest-related tables or local validation flows, but that does not make this repository the ingest implementation repository.

Keep the separation strict:
- local n8n here may support controlled local checks or review-stage workflows
- `merhabamap-ingest` remains the separate repository for ingestion logic
- do not turn local n8n usage in this repository into a hidden ingest pipeline

## Configure Postgres in n8n

Create a new `Postgres` credential in the n8n UI and use:

- `Host`: `host.docker.internal`
- `Port`: `5432`
- `Database`: `merhabamap_dev`
- `User`: your local PostgreSQL user
- `Password`: your local PostgreSQL password, if your local setup uses one
- `SSL`: disabled

This points n8n at the local development database on the host machine, not a containerized database and not any remote database.

### Important Safety Warning

Even in local development:
- do not create workflows that auto-publish external content
- do not bypass manual review gates
- do not treat local workflow success as approval for production automation
- do not assume external source data is valid, lawful, or complete

## Private Workflow Note

Workflow definitions are intentionally kept out of the public repository for security reasons.
If you operate a local n8n instance, import only your own private workflow definitions and configure your own local credentials and secrets before execution.

## Review-First Reminder

Any raw ingest-related data visible in local development must still be treated as untrusted.

Before anything could ever become production-relevant, it must pass:
1. validation
2. deduplication
3. moderation or manual approval
4. controlled publish logic

There must be no direct raw-ingest-to-public path.

## Validate a fresh raw ingest result

After the run, check whether new raw rows were created:

```sql
select max(ingested_at) as latest_raw_ingest_at,
       count(*) filter (where entity_guess = 'EVENT') as total_event_raw_items
from raw_ingest_items;
```

And inspect the newest event rows:

```sql
select left(coalesce(raw_title, ''), 100) as raw_title,
       source_url,
       ingested_at
from raw_ingest_items
where entity_guess = 'EVENT'
order by ingested_at desc
limit 20;
```
