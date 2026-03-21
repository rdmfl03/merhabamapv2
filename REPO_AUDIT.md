# REPO_AUDIT

## Scope

This audit is read-only and based on:

- repository files in `workflows/n8n`, `prisma`, `src`, and `docs`
- local development database observations from `postgresql://localhost:5432/merhabamap_dev`

No database mutations, workflow imports, or runtime n8n UI state were used.

## Relevant Files

### Workflow exports

- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Collector Stable Final.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Collector%20Stable%20Final.json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Source Discovery Engine v1 Fixed.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Source%20Discovery%20Engine%20v1%20Fixed.json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Event Builder v7.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Event%20Builder%20v7.json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap AI Plausibility Checker v2 (Events).json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20AI%20Plausibility%20Checker%20v2%20(Events).json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap AI Plausibility Checker v2 (Places).json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20AI%20Plausibility%20Checker%20v2%20(Places).json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap AI Recheck Worker v2.2.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20AI%20Recheck%20Worker%20v2.2.json)

### Schema and migrations

- [`/Users/eoflu/merhabamap/prisma/schema.prisma`](/Users/eoflu/merhabamap/prisma/schema.prisma)
- [`/Users/eoflu/merhabamap/prisma/migrations/20260317193000_merhabamap_baseline/migration.sql`](/Users/eoflu/merhabamap/prisma/migrations/20260317193000_merhabamap_baseline/migration.sql)
- [`/Users/eoflu/merhabamap/prisma/migrations/20260320120000_add_normalized_ingest_events/migration.sql`](/Users/eoflu/merhabamap/prisma/migrations/20260320120000_add_normalized_ingest_events/migration.sql)
- [`/Users/eoflu/merhabamap/prisma/migrations/20260320124500_add_staged_event_lifecycle_fields/migration.sql`](/Users/eoflu/merhabamap/prisma/migrations/20260320124500_add_staged_event_lifecycle_fields/migration.sql)

### Ingest and submission code paths

- [`/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts`](/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts)
- [`/Users/eoflu/merhabamap/src/app/api/ingest/place/route.ts`](/Users/eoflu/merhabamap/src/app/api/ingest/place/route.ts)
- [`/Users/eoflu/merhabamap/src/server/actions/admin/review-normalized-ingest-event.ts`](/Users/eoflu/merhabamap/src/server/actions/admin/review-normalized-ingest-event.ts)
- [`/Users/eoflu/merhabamap/src/server/actions/submissions/submit-event-suggestion.ts`](/Users/eoflu/merhabamap/src/server/actions/submissions/submit-event-suggestion.ts)
- [`/Users/eoflu/merhabamap/src/lib/ingest/event-duplicates.ts`](/Users/eoflu/merhabamap/src/lib/ingest/event-duplicates.ts)
- [`/Users/eoflu/merhabamap/src/config/ingest-allowlist.ts`](/Users/eoflu/merhabamap/src/config/ingest-allowlist.ts)

### Admin visibility and review

- [`/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-sources.ts`](/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-sources.ts)
- [`/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-raw-ingest-items.ts`](/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-raw-ingest-items.ts)
- [`/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-submissions.ts`](/Users/eoflu/merhabamap/src/server/queries/admin/list-admin-submissions.ts)
- [`/Users/eoflu/merhabamap/src/server/queries/admin/get-admin-staged-event-ingest-overview.ts`](/Users/eoflu/merhabamap/src/server/queries/admin/get-admin-staged-event-ingest-overview.ts)
- [`/Users/eoflu/merhabamap/src/app/[locale]/admin/ingest/page.tsx`](/Users/eoflu/merhabamap/src/app/%5Blocale%5D/admin/ingest/page.tsx)
- [`/Users/eoflu/merhabamap/src/app/[locale]/admin/ingest/raw-items/page.tsx`](/Users/eoflu/merhabamap/src/app/%5Blocale%5D/admin/ingest/raw-items/page.tsx)
- [`/Users/eoflu/merhabamap/src/app/[locale]/admin/ingest/submissions/page.tsx`](/Users/eoflu/merhabamap/src/app/%5Blocale%5D/admin/ingest/submissions/page.tsx)
- [`/Users/eoflu/merhabamap/src/app/[locale]/admin/ingest/sources/page.tsx`](/Users/eoflu/merhabamap/src/app/%5Blocale%5D/admin/ingest/sources/page.tsx)

### Local n8n operating guidance

- [`/Users/eoflu/merhabamap/docs/local-n8n.md`](/Users/eoflu/merhabamap/docs/local-n8n.md)
- [`/Users/eoflu/merhabamap/README.md`](/Users/eoflu/merhabamap/README.md)

## Workflow Inventory

| Workflow | Nodes | Export active flag | Operational role | Notes |
|---|---:|---|---|---|
| `MerhabaMap Collector Stable Final.json` | 13 | `false` | candidate fetch + raw ingest persistence | writes to `raw_ingest_items`, updates `sources.last_checked_at` |
| `MerhabaMap Source Discovery Engine v1 Fixed.json` | 11 | `false` | source discovery | inserts into `sources` with `discovery_method = source-discovery-v1` |
| `MerhabaMap Event Builder v7.json` | 13 | `false` | raw event selection + event ingest trigger | reads `raw_ingest_items`, posts to `/api/ingest/event`, updates raw statuses |
| `MerhabaMap AI Plausibility Checker v2 (Events).json` | 9 | `false` | AI review support for events | separate moderation aid, not core ingest |
| `MerhabaMap AI Plausibility Checker v2 (Places).json` | 9 | `false` | AI review support for places | separate moderation aid, not core ingest |
| `MerhabaMap AI Recheck Worker v2.2.json` | 28 | `false` | AI recheck orchestration | likely downstream moderation/quality workflow |

## What Is Likely Current vs Legacy

### Likely current / maintained

- `Collector Stable Final`
- `Source Discovery Engine v1 Fixed`
- `Event Builder v7`
- the staged event ingest code in the app (`normalized_ingest_events`, admin review action, admin ingest overview)

Reasoning:

- naming indicates promoted versions: `Stable Final`, `Fixed`, `v7`, `v2.2`
- repo docs explicitly point local n8n users to import the tracked collector export
- database contains `sources.discovery_method = source-discovery-v1`, proving the discovery workflow family has been run against the DB
- database contains recent `raw_ingest_items` from the collector and legacy ingest submissions from the event builder path

### Likely older operational residue or not fully adopted

- staged event ingest is implemented in app code and schema, but not yet visibly used in the local dev dataset:
  - `normalized_ingest_events` count is `0`
  - all existing ingest submissions have `normalized_ingest_event_id IS NULL`
- `ingest_runs` exists in schema but local count is `0`
- `event_sources` and `place_sources` exist and are useful, but current counts are low relative to core entities:
  - `event_sources = 1`
  - `place_sources = 6`

### What cannot be proven from the repo alone

- which workflow is active in a live n8n instance right now
- whether the exported `active: false` flags reflect runtime state

Because [`/Users/eoflu/merhabamap/docs/local-n8n.md`](/Users/eoflu/merhabamap/docs/local-n8n.md) describes manual import/export usage, the JSONs should be treated as tracked workflow snapshots, not authoritative live runtime state.

## Current Functional Flow in the Repo

### Source discovery

- Source discovery workflow reads active `sources`
- discovers candidate URLs
- inserts new `sources`

### Candidate collection

- Collector reads active website `sources`
- fetches HTML
- parses source page
- inserts into `raw_ingest_items`
- updates `sources.last_checked_at`

### Raw event processing

- Event Builder reads `raw_ingest_items` with event-ish candidates
- applies heuristic filtering
- calls [`/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts`](/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts)
- updates raw item status afterward

### Event ingest in app code

- `/api/ingest/event` now writes:
  - raw imported payload to `raw_ingest_items`
  - normalized staging row to `normalized_ingest_events`
  - `Submission` pointing to the staged event
- admin review action can promote a staged normalized event into a real `events` row

### Parallel user-driven submission path

- user event suggestions still create `events` directly plus `submissions`
- this is separate from n8n collector/discovery

## Obsolescence / Drift Risks

### Clear drift signals

- collector currently writes directly to `raw_ingest_items` with its own parser payload shape
- staged normalized ingest layer exists, but local n8n workflow family still appears centered on `raw_ingest_items`
- vocabulary drift in `sources`:
  - `platform`: `website`, `web`, `events`, `instagram`, `facebook`, `meetup`, `eventbrite`, `eventim`
  - `source_kind`: `WEBSITE`, `official_website`, `official_event_page`, `PROFILE`, `PAGE`, `PLATFORM`

### Current instability hotspots

- recent `raw_ingest_items` contain collector-generated `ERROR` rows with no `source_id` and no `source_url`
- this strongly suggests current collector robustness issues in the source parse step
- `normalized_ingest_events` is available but not operationally populated in the local DB

## Files We Should Not Touch Casually

### Highest-risk app files

- [`/Users/eoflu/merhabamap/prisma/schema.prisma`](/Users/eoflu/merhabamap/prisma/schema.prisma)
- baseline and ingest migrations under [`/Users/eoflu/merhabamap/prisma/migrations`](/Users/eoflu/merhabamap/prisma/migrations)
- [`/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts`](/Users/eoflu/merhabamap/src/app/api/ingest/event/route.ts)
- [`/Users/eoflu/merhabamap/src/server/actions/admin/review-normalized-ingest-event.ts`](/Users/eoflu/merhabamap/src/server/actions/admin/review-normalized-ingest-event.ts)
- [`/Users/eoflu/merhabamap/src/server/actions/submissions/submit-event-suggestion.ts`](/Users/eoflu/merhabamap/src/server/actions/submissions/submit-event-suggestion.ts)

### Highest-risk workflow exports

- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Collector Stable Final.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Collector%20Stable%20Final.json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Event Builder v7.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Event%20Builder%20v7.json)
- [`/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap Source Discovery Engine v1 Fixed.json`](/Users/eoflu/merhabamap/workflows/n8n/MerhabaMap%20Source%20Discovery%20Engine%20v1%20Fixed.json)

These three are directly tied to source ingestion and raw item creation. Any replacement should be additive until the new path proves itself.

## Recommendations

- Keep the current app ingest schema and moderation core intact.
- Treat `sources`, `raw_ingest_items`, `normalized_ingest_events`, `submissions`, `event_sources`, `place_sources`, and `ingest_runs` as the canonical ingest/source surface.
- Do not replace the current collector in place first. Build a parallel Discovery v1 + Collector v2 path and measure it.
- Normalize vocabulary additively rather than rewriting historical `sources` data.
- Preserve tracked workflow exports; use new files or explicitly versioned successors rather than silent overwrite.
