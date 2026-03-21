# DB_AUDIT

## Scope

- database analyzed: local dev DB at `postgresql://localhost:5432/merhabamap_dev`
- all queries were read-only
- no inserts, updates, deletes, DDL, or workflow runtime mutations were performed

## High-Level Schema Observations

### Public schema contains two major groups

1. MerhabaMap application tables
2. n8n/runtime internal tables

This matters because `public` is crowded. Any later schema work must clearly separate product-core tables from n8n internals in reasoning, even if they currently live in the same schema.

### All public tables currently present

`_prisma_migrations`, `accounts`, `admin_action_logs`, `ai_quality_checks`, `ai_recheck_requests`, `annotation_tag_entity`, `auth_identity`, `auth_provider_sync_history`, `binary_data`, `business_claims`, `chat_hub_agent_tools`, `chat_hub_agents`, `chat_hub_messages`, `chat_hub_session_tools`, `chat_hub_sessions`, `chat_hub_tools`, `cities`, `credentials_entity`, `data_table`, `data_table_column`, `dynamic_credential_entry`, `dynamic_credential_resolver`, `dynamic_credential_user_entry`, `event_destinations`, `event_sources`, `events`, `execution_annotation_tags`, `execution_annotations`, `execution_data`, `execution_entity`, `execution_metadata`, `folder`, `folder_tag`, `ingest_runs`, `insights_by_period`, `insights_metadata`, `insights_raw`, `installed_nodes`, `installed_packages`, `invalid_auth_token`, `migrations`, `normalized_ingest_events`, `oauth_access_tokens`, `oauth_authorization_codes`, `oauth_clients`, `oauth_refresh_tokens`, `oauth_user_consents`, `organizers`, `place_categories`, `place_sources`, `places`, `processed_data`, `project`, `project_relation`, `project_secrets_provider_access`, `raw_ingest_items`, `reports`, `role`, `role_scope`, `saved_events`, `saved_places`, `scope`, `secrets_provider_connection`, `sessions`, `settings`, `shared_credentials`, `shared_workflow`, `sources`, `submissions`, `tag_entity`, `test_case_execution`, `test_run`, `user`, `user_action_tokens`, `user_api_keys`, `users`, `variables`, `verification_tokens`, `webhook_entity`, `workflow_builder_session`, `workflow_dependency`, `workflow_entity`, `workflow_history`, `workflow_publish_history`, `workflow_published_version`, `workflow_statistics`, `workflows_tags`

## Product vs Internal Safety Classification

### Production-critical product tables

- `cities`
- `place_categories`
- `places`
- `events`
- `users`
- `sessions`
- `reports`
- `business_claims`
- `admin_action_logs`
- `sources`

### Ingest-internal / review-oriented tables

- `raw_ingest_items`
- `normalized_ingest_events`
- `submissions`
- `event_sources`
- `place_sources`
- `ingest_runs`

### n8n/internal operational tables not part of MerhabaMap domain

- `workflow_entity`, `execution_entity`, `credentials_entity`, `shared_workflow`, `webhook_entity`, and the many other n8n support tables

These should not be used as domain building blocks for the new ingest architecture.

## Focus Table Counts

| table | rows |
|---|---:|
| `sources` | 61 |
| `raw_ingest_items` | 73 |
| `normalized_ingest_events` | 0 |
| `submissions` | 10 |
| `events` | 38 |
| `places` | 16 |
| `cities` | 82 |
| `place_categories` | 8 |
| `reports` | 3 |
| `business_claims` | 3 |
| `admin_action_logs` | 12 |
| `users` | 5 |
| `sessions` | 0 |

Auxiliary provenance/ingest tables:

- `event_sources`: 1
- `place_sources`: 6
- `ingest_runs`: 0

## Focus Tables: Practical Findings

### `sources`

Purpose:

- source registry for websites/platforms/profiles used by discovery and collector flows

Key columns that matter for future discovery/collector:

- `platform`
- `source_kind`
- `url`
- `trust_score`
- `discovery_method`
- `is_active`
- `last_checked_at`

Observed issues:

- vocabulary inconsistency is already present:
  - `platform`: `website`, `web`, `events`, `instagram`, `facebook`, `meetup`, `eventbrite`, `eventim`
  - `source_kind`: `WEBSITE`, `official_website`, `official_event_page`, `PROFILE`, `PAGE`, `PLATFORM`
- newer manually added “official” web sources have blank `discovery_method`
- discovery metadata is therefore partially useful, not complete

Sample observations:

- `source-discovery-v1` inserted 13 website sources
- manual seed inserted social/platform sources
- recent direct additions created `web / official_website` and `web / official_event_page`

Recommendation for future use:

- absolutely reuse `sources`
- normalize future writes into a narrower vocabulary, but do not rewrite history destructively

### `raw_ingest_items`

Purpose:

- collector/parser landing table for raw candidate material

Key columns for future collector:

- `source_id`
- `entity_guess`
- `platform`
- `source_url`
- `external_id`
- `raw_title`
- `raw_text`
- `raw_datetime_text`
- `raw_location_text`
- `raw_payload_json`
- `language_hint`
- `city_guess`
- `status`
- `error_message`
- `processed_at`
- `ingested_at`

Observed issues:

- many recent error rows are structurally weak:
  - `ERROR / UNKNOWN` rows with `source_id IS NULL`
  - `source_url IS NULL`
  - `raw_title = Unknown Source`
- breakdown shows:
  - `ERROR / UNKNOWN = 38`
  - of those, `10` have no `source_id`
  - `10` have no `source_url`
- this is a strong sign the current collector pipeline can still lose source context on failures

What is missing for future robustness:

- no fetch status column
- no parser version
- no content hash
- no explicit source-response metadata fields except what is buried in `raw_payload_json`

Recommendation:

- keep `raw_ingest_items`, but future collector should preserve source identity and fetch outcome much more explicitly

### `normalized_ingest_events`

Purpose:

- staged normalized event review layer between raw ingest and product `events`

Current reality:

- row count is `0`
- schema exists and app review flow exists, but local operational dataset does not use it yet

Key columns:

- `raw_ingest_item_id`
- `event_id`
- `city_id`
- `title`
- `category`
- `venue_name`
- `starts_at`
- `source_url`
- `source_category`
- `normalization_status`
- `reviewed_by_user_id`
- `reviewed_at`
- `review_note`
- `promoted_at`

Risk implication:

- this is the right additive layer architecturally, but it is not yet the active local n8n path

### `submissions`

Purpose:

- review queue / moderation bridge for both user submissions and ingest-origin items

Key columns:

- `submission_type`
- `target_entity_type`
- `target_entity_id`
- `normalized_ingest_event_id`
- `submitted_by_user_id`
- `payload_json`
- `source_url`
- `status`
- `reviewed_by_user_id`
- `reviewed_at`

Observed issues:

- local data is legacy-heavy:
  - all current rows shown have `normalized_ingest_event_id` empty
- status breakdown:
  - `INGEST / EVENT / APPROVED = 3`
  - `INGEST / EVENT / PENDING = 3`
  - `INGEST / EVENT / REJECTED = 1`
  - plus a few user/place suggestion rows

Interpretation:

- the new staged event flow is implemented, but current local submissions still reflect the older ingest pattern

### `events`

Purpose:

- product-facing event table

Key columns for future integration:

- `city_id`
- `title`
- `category`
- `venue_name`
- `starts_at`
- `external_url`
- `moderation_status`
- `is_published`

Observed issues:

- many events are still moderation-pending:
  - `PENDING / unpublished = 26`
- duplicate protection exists via unique indexes on `(title, city_id, starts_at)`
- there are duplicate unique indexes for the same triple:
  - `events_unique_event`
  - `events_unique_title_city_starts_at`

That duplicate uniqueness is likely redundant and should be treated carefully in any later cleanup.

### `places`

Purpose:

- product-facing place table

Key columns:

- `category_id`
- `city_id`
- `owner_user_id`
- `website_url`
- `verification_status`
- `moderation_status`
- `is_published`

Observed issues:

- mostly approved but unverified local sample data
- verification and moderation are separate concepts and must stay so

### `cities`

Purpose:

- authoritative location anchor for Germany focus

Why critical:

- `city_id` is the current stable bridge for both `places` and `events`
- pilot cities are explicitly present:
  - `berlin`
  - `koeln`

This table should remain stable and central.

### `place_categories`

Purpose:

- authoritative category list for places

Current shape:

- only 8 curated categories
- already bilingual
- stable and small

This should be reused, not replaced.

### `reports`

Purpose:

- user/admin reporting against `places` and `events`

Notes:

- operationally sensitive
- should not be impacted by ingest redesign

### `business_claims`

Purpose:

- business-owner claim workflow on places

Notes:

- contains sensitive claimant info
- future ingest work should avoid touching this path

### `admin_action_logs`

Purpose:

- audit trail for moderation/admin operations

Why critical:

- valuable for review traceability
- future ingest moderation actions should continue logging here rather than inventing a parallel audit path

### `users` and `sessions`

Purpose:

- auth and moderation identity

Safety notes:

- local dataset is small
- `sessions` is currently empty
- user examples were intentionally redacted to role/locale/presence flags only in analysis

## Foreign Keys

Focus-table FKs found:

- `raw_ingest_items.source_id -> sources.id`
- `normalized_ingest_events.raw_ingest_item_id -> raw_ingest_items.id`
- `normalized_ingest_events.event_id -> events.id`
- `normalized_ingest_events.city_id -> cities.id`
- `submissions.reviewed_by_user_id -> users.id`
- `submissions.submitted_by_user_id -> users.id`
- `events.city_id -> cities.id`
- `places.city_id -> cities.id`
- `places.category_id -> place_categories.id`
- `places.owner_user_id -> users.id`
- `places.verified_by_user_id -> users.id`
- `reports.place_id -> places.id`
- `reports.event_id -> events.id`
- `reports.user_id -> users.id`
- `reports.reviewed_by_user_id -> users.id`
- `business_claims.user_id -> users.id`
- `business_claims.place_id -> places.id`
- `business_claims.reviewed_by_user_id -> users.id`
- `admin_action_logs.actor_user_id -> users.id`
- `users.onboarding_city_id -> cities.id`
- `sessions.user_id -> users.id`

## Unique Constraints and Index Notes

Important unique/index observations:

- `sources.url` unique
- `cities.slug` unique
- `cities.ags` unique when present
- `place_categories.slug` unique
- `places.slug` unique
- `events.slug` unique
- `events` also has two unique indexes on `(title, city_id, starts_at)`; likely redundant
- `normalized_ingest_events.raw_ingest_item_id` unique
- `normalized_ingest_events.event_id` unique
- `sessions.session_token` unique
- `users.email` unique
- `users.username` unique

Important performance indexes already available:

- `sources` by `is_active`, `platform`, `source_kind`, `trust_score`
- `raw_ingest_items` by `entity_guess`, `platform`, `status`, `ingested_at`, `processed_at`, `source_id`
- `normalized_ingest_events` by `city_id`, `normalization_status`, `starts_at`, `reviewed_by_user_id`
- `submissions` by `submission_type`, `status`, `target_entity_type`, `target_entity_id`, `normalized_ingest_event_id`

## Current Data Flow Inferred From DB + Repo

### How a source currently gets into `sources`

- manual seed path
- source discovery workflow path (`discovery_method = source-discovery-v1`)
- direct additions without discovery metadata

### How a source currently becomes a raw item

- collector workflow reads active website sources
- fetches HTML
- parses source page
- inserts one row into `raw_ingest_items`

### How a raw item currently may become an event

Two paths exist:

1. legacy-ish operational path
   - Event Builder reads `raw_ingest_items`
   - posts to `/api/ingest/event`
   - raw item status updated after call

2. new staged app path
   - `/api/ingest/event` creates `normalized_ingest_events`
   - admin reviews staged event
   - promotion action creates `events`

But in the local DB, path 2 is not yet visibly populated.

## Missing or Weak Links

- `ingest_runs` exists but is unused
- no explicit fetch status or fetch classification on `raw_ingest_items`
- no parser version on `raw_ingest_items`
- no content hash on raw items
- staged normalization layer exists but is not yet carrying real local workflow volume
- provenance tables `event_sources` and `place_sources` exist but are underused

## Safety / Stability Assessment

### Low-risk additive areas

- new ingest/source staging tables
- new read models / admin visibility
- additive workflow tables for discovery and fetch diagnostics
- better provenance links to `sources`, `event_sources`, `place_sources`

### Higher-risk areas

- changing `events`, `places`, `cities`, `place_categories`
- rewriting `sources` vocab in place
- altering submission semantics without migration plan
- changing moderation/report/business-claim tables or flows

### Berlin/Köln live-data sensitivity

- both pilot cities are explicit, real anchors in `cities`
- current local `events` and `places` are already tied to `city_id`
- any future ingest redesign must preserve city linkage as the core product location key

## Concrete Observations

- `normalized_ingest_events = 0` is the strongest sign that the new staged event layer is not yet active in the local operational pipeline
- `raw_ingest_items` contains fresh broken collector outputs with missing source identity
- `sources` is already the right registry table, but source taxonomy is inconsistent
- `event_sources`, `place_sources`, and `ingest_runs` are promising existing pieces that should be reused more, not abandoned
