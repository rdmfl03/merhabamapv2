# DISCOVERY_COLLECTOR_PLAN

## Planning Principles

- keep core schema stable
- preserve `city_id` as the anchor for `events` and `places`
- prefer additive ingest/source layers over replacement
- keep Germany-only assumptions explicit
- minimize personal data retention and avoid unnecessary long-term HTML storage
- reuse existing tables where they are already close to the target job

## What Should Be Kept

### Keep as-is

- `cities`
- `place_categories`
- `places`
- `events`
- moderation/report/business claim flows
- `admin_action_logs`

### Keep and reuse for ingest

- `sources` as the source registry
- `raw_ingest_items` as the raw candidate landing table
- `normalized_ingest_events` as the staged normalized event layer
- `submissions` as the review bridge
- `event_sources` and `place_sources` as provenance link tables
- `ingest_runs` as the place to add run-level observability instead of inventing another run table

## What Should Not Be Replaced

- do not replace `sources` with a brand-new registry table
- do not bypass `events` / `places` with a parallel product entity model
- do not replace `cities` mapping with free-text city handling
- do not delete or repurpose `raw_ingest_items`
- do not remove `submissions`; instead make new ingest review paths land there more cleanly

## What Should Be Added

### Additive source/ingest layer

Recommended additions:

1. a source validation/run layer built on top of `ingest_runs`
2. richer structured source profile output before raw candidate persistence
3. optional new additive tables only if needed:
   - `source_profiles`
   - `source_fetch_attempts`
   - `source_candidate_pages`

These would be low-risk because they do not alter product entities and can be rolled out in parallel.

### Why these additions

- current `sources` is too registry-like to carry all fetch and validation detail
- current `raw_ingest_items` is too late in the pipeline to represent source-health and fetch-quality cleanly
- `ingest_runs` exists but is unused; it should become the run-level spine

## Recommended New Tables

Only if truly needed, and only additively:

### `source_profiles`

Purpose:

- persist the normalized structured result of a source fetch
- data-minimized alternative to storing full HTML as the primary long-term basis

Suggested fields:

- `id`
- `source_id`
- `run_id`
- `final_url`
- `fetch_status`
- `http_status`
- `content_type`
- `checked_at`
- `title`
- `meta_description`
- `detected_languages`
- `contact_emails`
- `contact_phones`
- `addresses`
- `social_links`
- `navigation_links_json`
- `news_links_json`
- `event_links_json`
- `notes_json`
- `raw_html_preview`
- `raw_html_stored`
- `error_code`
- `error_message`

### `source_fetch_attempts`

Purpose:

- operational debugging and retry audit

Suggested fields:

- `id`
- `source_id`
- `run_id`
- `attempted_at`
- `fetch_status`
- `http_status`
- `error_code`
- `error_message`
- `duration_ms`

### `source_candidate_pages`

Purpose:

- explicit record of detail-page candidates before raw item creation

Suggested fields:

- `id`
- `source_id`
- `run_id`
- `candidate_url`
- `candidate_type`
- `score`
- `selection_reason_json`
- `status`
- `fetched_at`

## Recommended Workflow Architecture

### 1. Source Discovery v1

Inputs:

- existing trusted seed sources

Steps:

1. load active seed sources from `sources`
2. fetch source pages
3. extract candidate outbound links
4. score likely source candidates
5. insert new source registry rows into `sources`
6. create `ingest_runs` row for observability

Writes:

- `sources`
- `ingest_runs`

### 2. Source Normalization / Validation

Inputs:

- active `sources`

Steps:

1. fetch source page
2. classify fetch outcome:
   - success
   - dns error
   - tls error
   - timeout
   - http error
   - blocked
   - unknown error
3. normalize into structured source profile
4. extract navigation/news/event links
5. persist run metadata

Writes:

- `ingest_runs`
- optionally `source_profiles`
- optionally `source_fetch_attempts`

### 3. Candidate Fetch

Inputs:

- event-link candidates from source normalization

Steps:

1. select candidate detail pages
2. fetch candidate pages
3. classify page quality
4. keep source context attached

Writes:

- optionally `source_candidate_pages`
- or directly `raw_ingest_items` if quality is high enough

### 4. Candidate Parse

Inputs:

- candidate page fetch result

Steps:

1. extract title
2. extract datetime text
3. extract location text
4. extract source metadata and payload preview
5. compute conservative `entity_guess`, `city_guess`, `language_hint`

Writes:

- `raw_ingest_items`

### 5. Event Validation

Inputs:

- raw event-like items

Steps:

1. normalize fields
2. resolve `city_id`
3. conservative duplicate check
4. create or update `normalized_ingest_events`
5. create `submissions` rows for review

Writes:

- `normalized_ingest_events`
- `submissions`

### 6. Optional Review Queue

Inputs:

- `submissions`
- `normalized_ingest_events`

Steps:

1. admin reviews staged event
2. promote or reject
3. on promote, create `events`
4. backfill provenance

Writes:

- `events`
- `normalized_ingest_events`
- `submissions`
- ideally `event_sources`
- `admin_action_logs`

## Recommended Reuse of Existing Fields

### Use directly

- `sources.url`
- `sources.platform`
- `sources.source_kind`
- `sources.trust_score`
- `sources.discovery_method`
- `sources.last_checked_at`
- `raw_ingest_items.city_guess`
- `raw_ingest_items.language_hint`
- `raw_ingest_items.status`
- `raw_ingest_items.error_message`
- `normalized_ingest_events.normalization_status`
- `submissions.normalized_ingest_event_id`
- `events.city_id`
- `places.city_id`

### Extend additively rather than mutate in place

- source taxonomy normalization
- fetch/error metadata
- parser diagnostics
- provenance links

## What Comes First

### Recommended build order

1. wire `ingest_runs` into any new discovery/collector work
2. build structured source normalization output
3. add explicit candidate-page staging
4. connect validated event candidates into `normalized_ingest_events`
5. only then consider replacing older raw-to-event operational paths

### Why this order

- current DB proves the product core already works
- current pain is upstream: inconsistent source discovery, weak collector robustness, and poor run observability
- staged event review already exists in code, so upstream improvements can feed it rather than requiring a new moderation model

## Explicit Non-Goals for v1/v2

- no destructive schema rewrite
- no internationalization of ingest scope beyond Germany
- no replacement of `city_id` with free-text geography
- no broad AI-first ingest path that bypasses deterministic staging
- no permanent full-HTML storage as the primary long-term data source

## Final Recommendation

Build a new additive Discovery v1 + Collector v2 around:

- `sources` as the registry
- `ingest_runs` as the run spine
- `raw_ingest_items` as the raw landing zone
- `normalized_ingest_events` + `submissions` as the review boundary
- `event_sources` / `place_sources` as provenance outputs after promotion

Do not replace the current core schema. Add a clearer source/fetch/validation layer in front of it.
