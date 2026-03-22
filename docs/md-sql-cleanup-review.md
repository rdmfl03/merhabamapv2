# Markdown and SQL Cleanup Review

## Summary

- Tracked Markdown files: `10`
- Tracked SQL files: `5`
- Recommended to keep public: `8`
- Recommended private/local only: `6`
- Likely obsolete or redundant: `1`
- Keep but move/rename: `0`

Scope note:

- This review covers tracked `*.md` and `*.sql` files only.
- Bonus-sensitive patterns were checked as well:
  - `MERHABAMAP_*` and `SOURCES_SCHEMA_*` files are currently untracked and ignored, which matches the current public/private boundary.
  - `READONLY_*` and `DISCOVERY_*` files are still tracked and are the strongest candidates for private/local-only treatment.

## File Inventory

| file | type | purpose | references found | classification | recommendation | risk if removed |
|---|---|---|---|---|---|---|
| `CONTRIBUTING.md` | md | public contribution guidance | referenced in `README.md`, `docs/public-repo-checklist.md` | A. KEEP | keep public at repo root | medium: contributor onboarding degrades |
| `DISCOVERY_COLLECTOR_PLAN.md` | md | internal discovery/ingest planning note | no tracked references found | C. PRIVATE / LOCAL ONLY | remove from public repo, keep privately if still useful | low runtime risk, low-to-medium maintainer workflow risk |
| `DISCOVERY_SOURCE_REVIEW_GUIDE.md` | md | internal manual review guide for discovered sources | no tracked references found | C. PRIVATE / LOCAL ONLY | remove from public repo, keep privately if still useful | low runtime risk, medium review-process knowledge risk |
| `README.md` | md | main public project entry point | referenced in `docs/public-repo-checklist.md` | A. KEEP | keep public | high: public repo clarity suffers |
| `READONLY_DISCOVERY_SOURCE_SAMPLE.sql` | sql | local read-only SQL for reviewing discovery-v1 source samples | no tracked references found | C. PRIVATE / LOCAL ONLY | remove from public repo, keep as local/private helper if still needed | low runtime risk, low analyst convenience risk |
| `READONLY_SQL.sql` | sql | local read-only audit/query helper for dev DB inspection | no tracked references found | C. PRIVATE / LOCAL ONLY | remove from public repo, keep as local/private helper if still needed | low runtime risk, low analyst convenience risk |
| `SECURITY.md` | md | public security reporting policy | referenced in `docs/public-repo-checklist.md` | A. KEEP | keep public at repo root | medium: weakens security disclosure guidance |
| `docs/go-live-checklist.md` | md | launch and release operations checklist | no tracked references found | C. PRIVATE / LOCAL ONLY | move out of public repo unless intentionally exposed as public operations guidance | low runtime risk, medium operational-process risk |
| `docs/local-n8n.md` | md | public-safe optional local n8n setup doc without private workflows | referenced in `README.md` | A. KEEP | keep public as optional local setup guidance | low runtime risk, low optional-dev-workflow risk |
| `docs/moderation-runbook.md` | md | moderation operations playbook | no tracked references found | C. PRIVATE / LOCAL ONLY | move out of public repo unless explicitly approved for public visibility | low runtime risk, medium operational-process risk |
| `docs/netlify-deploy.md` | md | high-level deployment guidance | referenced in `README.md` | A. KEEP | keep public, optionally trim provider specificity later | low |
| `docs/public-repo-checklist.md` | md | one-time/public-repo cleanup checklist | no tracked references found | D. ARCHIVE OR REMOVE | archive or remove after cleanup is complete | low |
| `prisma/migrations/20260317193000_merhabamap_baseline/migration.sql` | sql | baseline Prisma migration | no direct tracked references; implicitly required by Prisma migration history and deploy scripts | A. KEEP | keep public in `prisma/migrations/` | high: migration history and deployment assumptions break |
| `prisma/migrations/20260320120000_add_normalized_ingest_events/migration.sql` | sql | Prisma migration adding normalized ingest events | no direct tracked references; implicitly required by Prisma migration history and deploy scripts | A. KEEP | keep public in `prisma/migrations/` | high |
| `prisma/migrations/20260320124500_add_staged_event_lifecycle_fields/migration.sql` | sql | Prisma migration for staged event lifecycle fields | no direct tracked references; implicitly required by Prisma migration history and deploy scripts | A. KEEP | keep public in `prisma/migrations/` | high |

## Classification Notes

### A. KEEP (public and necessary)

- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `docs/local-n8n.md`
- `docs/netlify-deploy.md`
- `prisma/migrations/20260317193000_merhabamap_baseline/migration.sql`
- `prisma/migrations/20260320120000_add_normalized_ingest_events/migration.sql`
- `prisma/migrations/20260320124500_add_staged_event_lifecycle_fields/migration.sql`

Why:

- these files support public understanding, contribution, security reporting, optional local setup, or required migration history
- they align with the current public/private boundary and do not obviously expose private operational details beyond an acceptable level

### B. KEEP BUT MOVE / RENAME

- none recommended with high confidence in this pass

Note:

- `docs/local-n8n.md` and `docs/netlify-deploy.md` could be renamed or regrouped later for polish, but there is no clear safety or maintainability need to move them right now

### C. PRIVATE / LOCAL ONLY

- `DISCOVERY_COLLECTOR_PLAN.md`
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
- `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
- `READONLY_SQL.sql`
- `docs/go-live-checklist.md`
- `docs/moderation-runbook.md`

Why:

- these files are either internal planning material, review-process guidance, read-only analyst SQL, or operational playbooks
- they are not referenced by setup, code, CI, or public docs in a way that makes them required
- they sit close to the categories AGENTS.md explicitly warns against exposing publicly:
  - internal audits
  - internal strategy notes
  - private operational playbooks

### D. ARCHIVE OR REMOVE

- `docs/public-repo-checklist.md`

Why:

- this appears to be a transitional repo-cleanup artifact rather than durable product, setup, or contributor documentation
- it is not referenced elsewhere
- once the public boundary is established, its ongoing value is low

## Public Files To Keep

- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `docs/local-n8n.md`
- `docs/netlify-deploy.md`
- all tracked Prisma migration SQL files under `prisma/migrations/`

## Internal/Private Files To Remove From Public Repo

- `DISCOVERY_COLLECTOR_PLAN.md`
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
- `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
- `READONLY_SQL.sql`
- `docs/go-live-checklist.md`
- `docs/moderation-runbook.md`

## Files To Archive

- `docs/public-repo-checklist.md`

## Files To Rename Or Move

- none with high confidence in this pass

## Files Requiring Manual Review

- `DISCOVERY_COLLECTOR_PLAN.md`
  - likely internal-only, but confirm whether maintainers still rely on it privately
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
  - likely internal-only, but confirm whether there is a current non-public review workflow it still supports
- `docs/go-live-checklist.md`
  - probably private/local-only, but confirm whether you intentionally want a public launch checklist
- `docs/moderation-runbook.md`
  - likely private/local-only, but confirm whether you intentionally want a public moderation standards document
- `docs/netlify-deploy.md`
  - safe to keep public, but worth a future review for how much provider-specific detail should remain

## Bonus Check: Sensitive Naming Patterns

### `MERHABAMAP_*`

- observed only as untracked local files in the working tree during prior repo checks
- classification: private/local only
- recommendation: keep ignored and out of git

### `SOURCES_SCHEMA_*`

- observed only as untracked local files in the working tree during prior repo checks
- classification: private/local only
- recommendation: keep ignored and out of git

### `READONLY_*`

- currently tracked:
  - `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
  - `READONLY_SQL.sql`
- classification: private/local only
- recommendation: remove from public repo unless you intentionally want to publish analyst SQL helpers

### `DISCOVERY_*`

- currently tracked:
  - `DISCOVERY_COLLECTOR_PLAN.md`
  - `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
- classification: private/local only
- recommendation: remove from public repo and keep privately if the material still supports internal discovery work

## Safe Cleanup Sequence

1. Confirm that no current maintainer workflow still depends on the `DISCOVERY_*` and `READONLY_*` files.
2. Remove the clearly internal/private root files from the public repo:
   - `DISCOVERY_COLLECTOR_PLAN.md`
   - `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
   - `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
   - `READONLY_SQL.sql`
3. Review and then remove or privatize the operations playbooks:
   - `docs/go-live-checklist.md`
   - `docs/moderation-runbook.md`
4. Archive or remove `docs/public-repo-checklist.md` once you no longer need a public-boundary checklist in-repo.
5. Re-run reference checks across `README.md`, `docs/`, `package.json`, `.github/`, `src/`, and `prisma/`.
6. Verify that only durable public docs and required migration SQL remain tracked.

## Conservative Recommendation

If you want the smallest safe next cleanup step, start with the unreferenced root files:

- `DISCOVERY_COLLECTOR_PLAN.md`
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
- `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
- `READONLY_SQL.sql`

They have no tracked references, do not appear required for runtime or setup, and are the clearest mismatch with the current public-repo boundary.
