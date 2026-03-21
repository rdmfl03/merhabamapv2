-- Read-only sample for manually reviewing newly discovered sources.
-- Intended for the local development database only.
-- No INSERT / UPDATE / DELETE statements.

-- Latest discovery-v1 sources, newest first
SELECT
  id,
  name AS source_name,
  url AS source_url,
  platform,
  source_kind,
  trust_score,
  discovery_method,
  is_public,
  is_active,
  notes,
  created_at,
  updated_at
FROM sources
WHERE discovery_method = 'discovery-v1'
ORDER BY created_at DESC
LIMIT 30;

-- Same sample, but only likely review-candidate pages with event-ish paths
SELECT
  id,
  name AS source_name,
  url AS source_url,
  platform,
  source_kind,
  trust_score,
  discovery_method,
  notes,
  created_at,
  updated_at
FROM sources
WHERE discovery_method = 'discovery-v1'
  AND url ~* '(veranstaltung|veranstaltungen|event|events|kalender|programm|termine|festival)'
ORDER BY created_at DESC
LIMIT 30;

-- Quick duplicate/near-duplicate view by normalized host
WITH discovery_sources AS (
  SELECT
    id,
    name,
    url,
    trust_score,
    created_at,
    regexp_replace(lower(regexp_replace(url, '^https?://', '')), '^www\\.', '') AS url_without_protocol,
    split_part(regexp_replace(lower(regexp_replace(url, '^https?://', '')), '^www\\.', ''), '/', 1) AS host
  FROM sources
  WHERE discovery_method = 'discovery-v1'
)
SELECT
  host,
  COUNT(*) AS source_count,
  MIN(created_at) AS first_seen_at,
  MAX(created_at) AS last_seen_at,
  string_agg(url, E'\n' ORDER BY created_at DESC) AS urls
FROM discovery_sources
GROUP BY host
HAVING COUNT(*) > 1
ORDER BY source_count DESC, last_seen_at DESC;

-- Review-friendly sample with a short why_discovered hint derived from notes
SELECT
  id,
  name AS source_name,
  url AS source_url,
  trust_score,
  discovery_method,
  CASE
    WHEN notes ILIKE '%positives=%' THEN notes
    ELSE 'DISCOVERY_REVIEW_REQUIRED'
  END AS why_discovered,
  created_at
FROM sources
WHERE discovery_method = 'discovery-v1'
ORDER BY created_at DESC
LIMIT 30;
