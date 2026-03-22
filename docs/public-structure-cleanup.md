# Public Structure Cleanup

## What Was Analyzed

This review focused only on these areas:

1. GitHub-facing messaging and Germany-first positioning
2. Discovery/Readonly cleanup candidates in the repo root
3. README top-section consistency
4. Root-level public clutter where safe to reduce

Files and areas checked:

- `README.md`
- `package.json`
- `docker-compose.n8n.yml`
- root-level markdown/sql/helper files
- references in `README.md`, `docs/`, `src/`, `scripts/`, `tests/`, `package.json`, `prisma/`, and `.github/`

## Findings

### Messaging consistency

- `README.md` already matched the Germany-first product positioning closely
- one small wording mismatch remained in the top line versus the requested canonical phrasing
- `package.json` contained a description that was directionally consistent, but not aligned with the cleaner GitHub-facing description

### Root cleanup candidates

- `DISCOVERY_COLLECTOR_PLAN.md`
  - already removed previously
  - no runtime/setup/CI dependency found
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
  - already removed previously
  - no runtime/setup/CI dependency found
- `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
  - already removed previously
  - no runtime/setup/CI dependency found
- `READONLY_SQL.sql`
  - already removed previously
  - no runtime/setup/CI dependency found
- `docker-compose.n8n.yml`
  - still present
  - referenced by `docs/local-n8n.md`
  - still useful for optional local setup
  - not safe to remove without also changing the documented local workflow

### Root structure

- the public repo root is materially cleaner than before
- the main remaining root clutter comes from local ignored/private artifacts in the working tree, not from tracked public files
- no clearly safe additional root move/removal was found in this pass

## What Was Changed

- updated the README top line to the canonical wording:
  - `Germany-first community platform for discovering local places, events and connections within the Turkish diaspora in Germany.`
- updated `package.json` description to a GitHub-friendly repository description:
  - `Germany-first community platform for Turkish diaspora discovery (places, events, connections).`

## What Was Intentionally Not Changed

- `docker-compose.n8n.yml`
  - kept in the repo because `docs/local-n8n.md` still depends on it for optional local setup
- `docs/local-n8n.md`
  - kept unchanged because it already clearly states that operational workflows are private
- `docs/go-live-checklist.md`
  - left unchanged pending manual review
- `docs/moderation-runbook.md`
  - left unchanged pending manual review
- any runtime, build, schema, migration, or app logic files

## Manual Review Remaining

- `docs/go-live-checklist.md`
  - still more operational than contributor-facing
  - keep or privatize is a maintainer decision
- `docs/moderation-runbook.md`
  - still more maintainership/moderation-policy oriented than contributor-facing
  - keep or privatize is a maintainer decision

## Why Each Safe Decision Was Safe

- `README.md`
  - wording-only change
  - no command, reference, or setup flow changed
- `package.json` description
  - metadata-only change
  - does not affect runtime, build, schema, or setup
- no additional root file removals were made because no further clearly safe candidates remained

## Verification Performed

- checked current root file inventory
- checked current README wording against the Germany-first positioning
- checked references for cleanup candidates including `docker-compose.n8n.yml`
- confirmed `docker-compose.n8n.yml` is referenced by `docs/local-n8n.md`
- confirmed previously removed Discovery/Readonly files are absent and not required by setup/code/CI
- confirmed no business logic or schema files were changed in this pass

## Final Conclusion

The repository remained non-breaking in this pass.

Only metadata and messaging were adjusted, and no required runtime/setup/deployment files were removed.
The public messaging is now more consistent with the current Germany-first positioning, while the remaining borderline documentation is explicitly left for manual maintainer review instead of being changed blindly.
