-- READONLY_SQL.sql
-- All queries in this file are read-only.
-- They were used or prepared for the MerhabaMap repo + local dev DB audit.

-- ------------------------------------------------------------------
-- 1. Public schema table inventory
-- ------------------------------------------------------------------
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ------------------------------------------------------------------
-- 2. Focus-table column inventory
-- ------------------------------------------------------------------
WITH cols AS (
  SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
),
pk AS (
  SELECT kc.table_name, kc.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kc
    ON tc.constraint_name = kc.constraint_name
   AND tc.table_schema = kc.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
)
SELECT
  cols.table_name,
  cols.column_name,
  cols.data_type,
  cols.is_nullable,
  COALESCE(cols.column_default, '') AS column_default,
  CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_pk
FROM cols
LEFT JOIN pk
  ON pk.table_name = cols.table_name
 AND pk.column_name = cols.column_name
WHERE cols.table_name IN (
  'sources',
  'raw_ingest_items',
  'normalized_ingest_events',
  'submissions',
  'events',
  'places',
  'cities',
  'place_categories',
  'reports',
  'business_claims',
  'admin_action_logs',
  'users',
  'sessions'
)
ORDER BY cols.table_name, cols.ordinal_position;

-- ------------------------------------------------------------------
-- 3. Focus-table foreign keys
-- ------------------------------------------------------------------
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'sources',
    'raw_ingest_items',
    'normalized_ingest_events',
    'submissions',
    'events',
    'places',
    'cities',
    'place_categories',
    'reports',
    'business_claims',
    'admin_action_logs',
    'users',
    'sessions'
  )
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- ------------------------------------------------------------------
-- 4. Focus-table primary and unique constraints
-- ------------------------------------------------------------------
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  AND tc.table_name IN (
    'sources',
    'raw_ingest_items',
    'normalized_ingest_events',
    'submissions',
    'events',
    'places',
    'cities',
    'place_categories',
    'reports',
    'business_claims',
    'admin_action_logs',
    'users',
    'sessions'
  )
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type DESC, tc.constraint_name;

-- ------------------------------------------------------------------
-- 5. Focus-table indexes
-- ------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'sources',
    'raw_ingest_items',
    'normalized_ingest_events',
    'submissions',
    'events',
    'places',
    'cities',
    'place_categories',
    'reports',
    'business_claims',
    'admin_action_logs',
    'users',
    'sessions'
  )
ORDER BY tablename, indexname;

-- ------------------------------------------------------------------
-- 6. Focus-table row counts
-- ------------------------------------------------------------------
SELECT 'sources' AS table_name, COUNT(*) FROM sources
UNION ALL SELECT 'raw_ingest_items', COUNT(*) FROM raw_ingest_items
UNION ALL SELECT 'normalized_ingest_events', COUNT(*) FROM normalized_ingest_events
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'places', COUNT(*) FROM places
UNION ALL SELECT 'cities', COUNT(*) FROM cities
UNION ALL SELECT 'place_categories', COUNT(*) FROM place_categories
UNION ALL SELECT 'reports', COUNT(*) FROM reports
UNION ALL SELECT 'business_claims', COUNT(*) FROM business_claims
UNION ALL SELECT 'admin_action_logs', COUNT(*) FROM admin_action_logs
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
ORDER BY table_name;

-- ------------------------------------------------------------------
-- 7. Source distribution
-- ------------------------------------------------------------------
SELECT
  platform,
  source_kind,
  COUNT(*) AS count,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen,
  COALESCE(discovery_method, '') AS discovery_method
FROM sources
GROUP BY platform, source_kind, COALESCE(discovery_method, '')
ORDER BY count DESC, platform, source_kind;

-- ------------------------------------------------------------------
-- 8. Raw ingest quality/status distribution
-- ------------------------------------------------------------------
SELECT
  status,
  entity_guess,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE source_id IS NULL) AS without_source_id,
  COUNT(*) FILTER (WHERE source_url IS NULL OR source_url = '') AS without_source_url
FROM raw_ingest_items
GROUP BY status, entity_guess
ORDER BY count DESC;

-- ------------------------------------------------------------------
-- 9. Submission distribution
-- ------------------------------------------------------------------
SELECT
  submission_type,
  target_entity_type,
  status,
  COUNT(*)
FROM submissions
GROUP BY submission_type, target_entity_type, status
ORDER BY COUNT(*) DESC;

-- ------------------------------------------------------------------
-- 10. Event moderation distribution
-- ------------------------------------------------------------------
SELECT moderation_status, is_published, COUNT(*)
FROM events
GROUP BY moderation_status, is_published
ORDER BY COUNT(*) DESC;

-- ------------------------------------------------------------------
-- 11. Place moderation/verification distribution
-- ------------------------------------------------------------------
SELECT moderation_status, verification_status, is_published, COUNT(*)
FROM places
GROUP BY moderation_status, verification_status, is_published
ORDER BY COUNT(*) DESC;

-- ------------------------------------------------------------------
-- 12. Example rows: sources
-- ------------------------------------------------------------------
SELECT
  id,
  name,
  platform,
  source_kind,
  LEFT(url, 120) AS url,
  is_active,
  trust_score,
  discovery_method,
  created_at
FROM sources
ORDER BY created_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 13. Example rows: raw_ingest_items
-- ------------------------------------------------------------------
SELECT
  id,
  source_id,
  platform,
  entity_guess,
  status,
  LEFT(COALESCE(source_url, ''), 100) AS source_url,
  LEFT(COALESCE(raw_title, ''), 100) AS raw_title,
  ingested_at,
  processed_at
FROM raw_ingest_items
ORDER BY ingested_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 14. Example rows: events
-- ------------------------------------------------------------------
SELECT
  e.id,
  LEFT(e.title, 80) AS title,
  c.slug AS city_slug,
  e.category,
  e.starts_at,
  e.moderation_status,
  e.is_published,
  LEFT(COALESCE(e.external_url, ''), 100) AS external_url
FROM events e
JOIN cities c ON c.id = e.city_id
ORDER BY e.created_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 15. Example rows: places
-- ------------------------------------------------------------------
SELECT
  p.id,
  LEFT(p.name, 80) AS name,
  c.slug AS city_slug,
  pc.slug AS category_slug,
  p.moderation_status,
  p.verification_status,
  p.is_published,
  LEFT(COALESCE(p.website_url, ''), 100) AS website_url
FROM places p
JOIN cities c ON c.id = p.city_id
JOIN place_categories pc ON pc.id = p.category_id
ORDER BY p.created_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 16. Example rows: cities
-- ------------------------------------------------------------------
SELECT
  id,
  slug,
  name_de,
  name_tr,
  country_code,
  is_pilot,
  state_code
FROM cities
ORDER BY is_pilot DESC, slug ASC
LIMIT 12;

-- ------------------------------------------------------------------
-- 17. Example rows: place_categories
-- ------------------------------------------------------------------
SELECT
  id,
  slug,
  name_de,
  name_tr,
  sort_order
FROM place_categories
ORDER BY sort_order, slug;

-- ------------------------------------------------------------------
-- 18. Example rows: submissions
-- ------------------------------------------------------------------
SELECT
  id,
  submission_type,
  target_entity_type,
  LEFT(COALESCE(source_url, ''), 100) AS source_url,
  status,
  normalized_ingest_event_id,
  created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 19. Example rows: users (redacted)
-- ------------------------------------------------------------------
SELECT
  id,
  role,
  preferred_locale,
  onboarding_city_id IS NOT NULL AS has_onboarding_city,
  email IS NOT NULL AS has_email,
  created_at
FROM users
ORDER BY created_at DESC;

-- ------------------------------------------------------------------
-- 20. Example rows: admin_action_logs
-- ------------------------------------------------------------------
SELECT
  id,
  action_type,
  target_type,
  LEFT(target_id, 24) AS target_id_prefix,
  created_at
FROM admin_action_logs
ORDER BY created_at DESC
LIMIT 8;

-- ------------------------------------------------------------------
-- 21. Provenance/support table counts
-- ------------------------------------------------------------------
SELECT COUNT(*) AS event_sources_count FROM event_sources;
SELECT COUNT(*) AS place_sources_count FROM place_sources;
SELECT COUNT(*) AS ingest_runs_count FROM ingest_runs;
