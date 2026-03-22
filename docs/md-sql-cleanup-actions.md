# Markdown and SQL Cleanup Actions

## Scope

This document records the conservative cleanup actions taken after reviewing tracked Markdown and SQL files in the public MerhabaMap repository.

No business logic, schema, or runtime behavior was changed in this pass.

## Files Removed

- `DISCOVERY_COLLECTOR_PLAN.md`
  - decision: removed from the public repository
  - reason: internal discovery/ingest planning note with no tracked runtime, setup, CI, or documentation dependency
- `DISCOVERY_SOURCE_REVIEW_GUIDE.md`
  - decision: removed from the public repository
  - reason: internal manual review guide with no tracked runtime, setup, CI, or documentation dependency
- `READONLY_DISCOVERY_SOURCE_SAMPLE.sql`
  - decision: removed from the public repository
  - reason: local read-only analyst SQL helper with no tracked dependency
- `READONLY_SQL.sql`
  - decision: removed from the public repository
  - reason: local read-only audit/query helper with no tracked dependency

## Files Kept

- `AGENTS.md`
  - kept public as repository-level development guidance
  - reviewed for public safety and lightly sanitized to remove one-off task wording while preserving durable repo rules
- `README.md`
  - kept public as the main project entry point
- `CONTRIBUTING.md`
  - kept public for contribution guidance
- `SECURITY.md`
  - kept public for security reporting
- `docs/local-n8n.md`
  - kept public because it provides optional local setup guidance while clearly stating that operational workflows remain private
- `docs/netlify-deploy.md`
  - kept public because it remains useful high-level deployment guidance and does not currently expose secrets
- Prisma migration SQL files under `prisma/migrations/`
  - kept public because they are required for migration history and deployment consistency

## Borderline Docs Reviewed

### `docs/go-live-checklist.md`

- decision: leave unchanged but mark for manual decision
- current assessment:
  - useful operationally
  - not referenced by setup or source code
  - contains launch and release process detail rather than core public contributor guidance
- why not removed now:
  - it may still be intentionally useful to maintainers
  - removing it is safe technically, but the repository owner should confirm whether a public launch checklist is desired

### `docs/moderation-runbook.md`

- decision: leave unchanged but mark for manual decision
- current assessment:
  - useful as policy/process guidance
  - not referenced by setup or source code
  - contains moderation operations detail that may be more maintainer-facing than contributor-facing
- why not removed now:
  - no runtime risk, but public visibility vs. private operations is a product/process decision

### `docs/netlify-deploy.md`

- decision: keep public
- current assessment:
  - supports public setup/deployment understanding
  - already avoids real secrets
  - provider-specific, but still within acceptable public guidance bounds
- why kept:
  - it helps contributors and maintainers understand deployment expectations without exposing private workflow exports or credentials

## Files Needing Sanitization

- none changed in this pass

## Files Requiring Manual Review

- `docs/go-live-checklist.md`
- `docs/moderation-runbook.md`

## AGENTS.md Decision

- decision: keep public and add to the repository
- reason:
  - it contains only public-repo-safe development guidance
  - it reinforces the existing public/private boundary
  - it does not expose secrets, infrastructure details, private workflows, or internal operational values

## Non-Breaking Verification Performed

- verified that each removed file had no tracked references in:
  - `README.md`
  - public docs
  - `src/`
  - `scripts/`
  - `package.json`
  - `.github/`
  - `prisma/`
- verified that the only remaining mentions of removed files are inside analysis/review documents
- verified that no source code, scripts, config, migrations, or CI files depended on the removed files
- verified that no business logic or database schema was changed

## Cleanup Result

- the public repository is leaner and less cluttered with internal planning and analyst-only artifacts
- only clearly safe, unreferenced cleanup candidates were removed
- borderline public documents were reviewed conservatively and left in place pending explicit maintainer direction
