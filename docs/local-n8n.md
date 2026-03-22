# Local n8n

This setup is for local workflow runs only. It does not connect to any remote database.
Operational workflows are managed privately and are not included in the public repository.

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

## Configure Postgres in n8n

Create a new `Postgres` credential in the n8n UI and use:

- `Host`: `host.docker.internal`
- `Port`: `5432`
- `Database`: `merhabamap_dev`
- `User`: your local PostgreSQL user
- `Password`: your local PostgreSQL password, if your local setup uses one
- `SSL`: disabled

This points n8n at the local development database on the host machine, not a containerized database and not any remote database.

## Private Workflow Note

Workflow definitions are intentionally kept out of the public repository for security reasons.
If you operate a local n8n instance, import only your own private workflow definitions and configure your own local credentials and secrets before execution.

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
