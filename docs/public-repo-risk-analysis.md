# Public Repo Risk Analysis

## Scope

This document is Phase 1 only. It analyzes public-repo readiness risks in the current MerhabaMap repository without implementing remediation.

MerhabaMap-specific constraints that must be preserved during any later cleanup:

- Germany-first product scope
- bilingual Turkish/German behavior
- `noreply@merhabamap.com` and `Reply-To: info@merhabamap.com` conventions where relevant
- security-first and GDPR-aware posture
- no exposure of real user data
- no unnecessary exposure of internal operational details

## Repository Snapshot

- Local env files exist in the working tree: `.env.local`, `.env.test.local`
- Local/generated directories exist in the working tree: `node_modules/`, `.next/`
- These local/generated items are currently ignored and not tracked
- There are tracked n8n workflow exports in the repository
- There are tracked operational/audit documents in the repo root
- There are tracked public-facing docs with absolute local paths and deployment notes

## Current Repository Risk Inventory

| ID | Risk | Where | Severity |
|---|---|---|---|
| R1 | Hard-coded external AI API key in tracked workflow exports | tracked AI-related n8n workflow export files | critical |
| R2 | Tracked operational audit docs expose internal structure and local environment details | `DB_AUDIT.md`, `REPO_AUDIT.md` | high |
| R3 | Absolute machine-specific paths committed in tracked docs | `README.md`, `docs/local-n8n.md`, `REPO_AUDIT.md` | high |
| R4 | Tracked n8n workflow exports expose operational internals, credential handles, webhook identifiers, SQL, and internal process details | tracked n8n workflow export files | high |
| R5 | Public README is not public-ready and foregrounds internal/demo details | `README.md` | medium |
| R6 | Demo credentials are explicitly documented in tracked source and docs | `README.md`, `src/lib/dev/demo-accounts.ts`, `tests/e2e/helpers/auth.ts`, `prisma/seed.ts` | medium |
| R7 | Security/documentation mismatch around database migration story | `README.md`, `prisma/migrations/*`, `.github/workflows/quality.yml` | medium |
| R8 | Health endpoint exposes environment and demo-auth state | `src/app/api/health/route.ts` | medium |
| R9 | Local env files/build artifacts exist in the working tree and are publish-process hazards even though they are ignored | `.env.local`, `.env.test.local`, `.next/`, `node_modules/` | medium |
| R10 | Local filesystem artifacts present in working tree | `.DS_Store`, `workflows/.DS_Store`, `docs/.DS_Store`, `src/.DS_Store`, `src/app/.DS_Store`, `src/app/api/.DS_Store`, `src/app/api/ingest/.DS_Store` | low |
| R11 | Deployment docs expose provider-specific operational assumptions that may be too specific for a public maintainer-facing repo | `docs/netlify-deploy.md`, `README.md` | low |
| R12 | n8n/local workflow docs are safe in principle but currently mix local setup with internal ingest operations and private implementation detail | `docs/local-n8n.md`, `docker-compose.n8n.yml`, tracked n8n workflow export files | medium |

## Detailed Findings

### R1. Hard-coded external AI API key in tracked workflow exports

- What the issue is:
  The repository contains a hard-coded Google Gemini API key inside tracked n8n workflow JSON exports.
- Where it exists:
  - tracked AI-related n8n workflow export files
- Severity:
  critical
- What could break if we change it:
  Existing local workflow imports that rely on the embedded key would stop working until the key is replaced by a proper credential/env-based setup.
- What could happen if we do NOT change it:
  Third parties could reuse the key, incur cost, exhaust quota, or inspect/abuse the connected AI workflow path. This is the strongest blocker to making the repo public.
- Recommended remediation:
  Remove the embedded key from workflow JSON exports, rotate the compromised key outside git, and switch the workflows to environment-backed or n8n-credential-backed configuration before public release.
- Remediation status:
  safe now for file cleanup, but key rotation itself needs manual review because it happens outside the repo.

### R2. Tracked operational audit docs expose internal structure and local environment details

- What the issue is:
  The repo contains tracked audit documents that enumerate internal tables, workflows, local database addresses, internal review flows, and repository risk posture.
- Where it exists:
  - `DB_AUDIT.md`
  - `REPO_AUDIT.md`
- Severity:
  high
- What could break if we change it:
  Internal team context is lost unless the material is moved to a private location or rewritten into a public-safe form.
- What could happen if we do NOT change it:
  The public repo would disclose more internal operational detail than necessary, including database topology and ingestion workflow assumptions.
- Recommended remediation:
  Remove these files from public tracking or rewrite them into sanitized, contributor-facing architecture notes.
- Remediation status:
  safe now.

### R3. Absolute machine-specific paths committed in tracked docs

- What the issue is:
  Some tracked docs contain absolute local filesystem paths tied to one developer machine.
- Where it exists:
  - `README.md`
  - `docs/local-n8n.md`
  - `REPO_AUDIT.md`
- Severity:
  high
- What could break if we change it:
  Nothing functional; only links in local markdown readers may need to be replaced with relative paths.
- What could happen if we do NOT change it:
  Public documentation looks unpolished, leaks machine-specific details, and reduces trust in repo hygiene.
- Recommended remediation:
  Replace absolute paths with relative repo paths or plain text references.
- Remediation status:
  safe now.

### R4. Tracked n8n workflow exports expose operational internals, credential handles, webhook identifiers, SQL, and internal process details

- What the issue is:
  The tracked n8n exports include internal SQL queries, credential names and IDs, webhook IDs, workflow topology, and internal moderation/recheck logic.
- Where it exists:
  - tracked n8n workflow export files
- Severity:
  high
- What could break if we change it:
  Contributors may lose importable local workflow snapshots unless sanitized replacements are provided.
- What could happen if we do NOT change it:
  The repo would publish more internal ingestion/moderation implementation detail than necessary, including identifiers and exact SQL against internal tables.
- Recommended remediation:
  Sanitize and keep only intentionally public workflow templates, or move detailed operational exports to a private repository if they are not required for open-source collaboration.
- Remediation status:
  safe with verification. Some workflows may still be needed for local developer setup.

### R5. Public README is not public-ready and foregrounds internal/demo details

- What the issue is:
  The README currently presents the project as `merhabamapv2`, foregrounds demo credentials and local ops, and is not structured like a public maintainer-facing repository introduction.
- Where it exists:
  - `README.md`
- Severity:
  medium
- What could break if we change it:
  Nothing functional, but onboarding expectations and internal habits may need a new home in docs.
- What could happen if we do NOT change it:
  The public repo will appear under-documented, overly internal, and less credible for open-source review or maintainer-program submission.
- Recommended remediation:
  Rewrite the README to explain the product honestly, preserve Germany-first and bilingual scope, move sensitive/internal setup detail into narrower docs, and keep only example-based env setup.
- Remediation status:
  safe now.

### R6. Demo credentials are explicitly documented in tracked source and docs

- What the issue is:
  Shared demo accounts and password are visible in docs and source. They are for local/dev use, but they are highly discoverable.
- Where it exists:
  - `README.md`
  - `src/lib/dev/demo-accounts.ts`
  - `tests/e2e/helpers/auth.ts`
  - `prisma/seed.ts`
- Severity:
  medium
- What could break if we change it:
  E2E tests and seed assumptions can break if credentials are changed carelessly.
- What could happen if we do NOT change it:
  Reviewers may interpret the repo as relying on insecure shared credentials. Even though these are demo-only, the public presentation is weak.
- Recommended remediation:
  Keep the demo path only if clearly scoped to local/test environments, reduce README prominence, and consider consolidating the values in one clearly test-only location.
- Remediation status:
  safe with verification.

### R7. Security/documentation mismatch around database migration story

- What the issue is:
  The README says the repository does not maintain checked-in Prisma migrations history, but checked-in migrations do exist. CI also uses `db:push`, which suggests a local-first sync path rather than a pure migration-driven story.
- Where it exists:
  - `README.md`
  - `prisma/migrations/20260317193000_merhabamap_baseline/migration.sql`
  - `prisma/migrations/20260320120000_add_normalized_ingest_events/migration.sql`
  - `prisma/migrations/20260320124500_add_staged_event_lifecycle_fields/migration.sql`
  - `.github/workflows/quality.yml`
- Severity:
  medium
- What could break if we change it:
  Incorrect docs rewrites could push contributors toward the wrong DB setup flow.
- What could happen if we do NOT change it:
  Public contributors may misunderstand schema expectations, break local setup, or make unsafe assumptions about production migration practice.
- Recommended remediation:
  Rewrite the docs to distinguish local development setup from production deployment, and state exactly when `db:push` vs migrations are expected.
- Remediation status:
  safe now.

### R8. Health endpoint exposes environment and demo-auth state

- What the issue is:
  `/api/health` returns `env`, version, uptime, timestamp, and `demoAuthEnabled`. This is convenient operationally but exposes implementation state publicly.
- Where it exists:
  - `src/app/api/health/route.ts`
- Severity:
  medium
- What could break if we change it:
  Existing monitoring or internal diagnostics may rely on the current shape.
- What could happen if we do NOT change it:
  A public deployment exposes unnecessary runtime detail and a signal about whether demo auth is enabled.
- Recommended remediation:
  Consider reducing the public payload to a minimal liveness contract, or gate richer details behind protected/internal checks.
- Remediation status:
  risky / requires manual approval, because runtime monitoring assumptions may depend on it.

### R9. Local env files/build artifacts exist in the working tree and are publish-process hazards even though they are ignored

- What the issue is:
  Local env files and build/dependency directories exist in the working tree. They are ignored, but a sloppy release/archive process could still publish them outside git.
- Where it exists:
  - `.env.local`
  - `.env.test.local`
  - `.next/`
  - `node_modules/`
- Severity:
  medium
- What could break if we change it:
  Removing local files from the working tree could disrupt the current local setup for maintainers.
- What could happen if we do NOT change it:
  If someone zips the workspace instead of publishing from git, local secrets and bulky artifacts could leak.
- Recommended remediation:
  Keep them ignored, verify `.gitignore` stays strict, and avoid release processes that package the raw workspace.
- Remediation status:
  safe now for documentation and ignore-rule hardening; local-file deletion needs user intent.

### R10. Local filesystem artifacts present in working tree

- What the issue is:
  Multiple `.DS_Store` files exist locally.
- Where it exists:
  - `.DS_Store`
  - `workflows/.DS_Store`
  - `docs/.DS_Store`
  - `src/.DS_Store`
  - `src/app/.DS_Store`
  - `src/app/api/.DS_Store`
  - `src/app/api/ingest/.DS_Store`
- Severity:
  low
- What could break if we change it:
  Nothing meaningful.
- What could happen if we do NOT change it:
  Low-grade repo hygiene issues or accidental inclusion in ad-hoc archive bundles.
- Recommended remediation:
  Keep ignoring them and remove local copies when doing public-release cleanup.
- Remediation status:
  safe now.

### R11. Deployment docs expose provider-specific operational assumptions

- What the issue is:
  Some docs are tightly framed around Netlify and DigitalOcean. That is not inherently unsafe, but it narrows the public story and reveals infrastructure assumptions that may not all belong in the main public docs.
- Where it exists:
  - `docs/netlify-deploy.md`
  - `README.md`
- Severity:
  low
- What could break if we change it:
  Internal deployment convenience could be reduced if the docs are over-generalized.
- What could happen if we do NOT change it:
  The repo may look less portable and reveal more platform detail than needed for an open maintainer-facing submission.
- Recommended remediation:
  Keep high-level deployment notes public, but move sensitive/provider-specific operational detail into narrower docs if not needed.
- Remediation status:
  safe with verification.

### R12. n8n/local workflow docs currently mix local setup with internal ingest operations

- What the issue is:
  The local n8n guidance is partly public-safe, but it currently points directly at detailed operational workflow exports and ingest tables.
- Where it exists:
  - `docs/local-n8n.md`
  - `docker-compose.n8n.yml`
  - tracked n8n workflow export files
- Severity:
  medium
- What could break if we change it:
  Local developer setup may become harder if public-safe replacements are not equally usable.
- What could happen if we do NOT change it:
  The public repo exposes more ingestion and moderation workflow detail than necessary.
- Recommended remediation:
  Rewrite local n8n docs to point to sanitized workflow templates and clearly separate local-only setup from internal operations.
- Remediation status:
  safe with verification.

## Category-Specific Notes

### Secrets exposure risks

- Confirmed critical issue: hard-coded Gemini API key in tracked workflow JSON
- No tracked `.env.local` or `.env.test.local` files were found
- Example env files are present and appear placeholder-based rather than containing real secrets

### Committed local env files

- None currently tracked
- Local copies exist in the working tree and are a release-process risk, not a git-tracked leak at the moment

### Committed build artifacts

- No tracked `.next/`, `coverage/`, `playwright-report/`, or `node_modules/` were found

### Committed dependency/vendor artifacts

- No tracked `node_modules/` were found

### Committed git internals

- No accidental tracked `.git/` content was found

### Machine-specific paths

- Present in tracked docs and should be removed before public release

### Accidental production/staging references

- Present, but mostly high-level and intentional:
  - `https://www.merhabamap.com`
  - Netlify references
  - DigitalOcean PostgreSQL example shape
- These should be reviewed for how much infrastructure detail should remain public

### Test/demo credentials exposure

- Demo credentials are intentionally present for local/test flows
- Public-safe only if they remain clearly local/dev-only and do not dominate the public onboarding story

### GDPR/privacy risks

- No obvious real user data dump was found in tracked files inspected here
- Risk is primarily overexposure of operational internals, moderation processes, and local DB observations, not a committed production user dataset

### Security/documentation mismatch risks

- README migration guidance currently conflicts with the repository state
- Public docs currently over-mix internal ops and contributor onboarding

### CI/CD or deployment breakage risks

- Cleanup around docs and ignored files is low risk
- Changes to env handling, health endpoints, workflow exports, or deployment notes require verification because CI/local setup may depend on them

### Database/schema/migration risks

- Prisma schema and checked-in migrations should remain
- Cleanup must not alter schema, migration files, or deployment assumptions unless explicitly verified

### n8n/workflow exposure risks

- This is the biggest public-safety area after the exposed API key
- Workflow exports currently expose:
  - embedded external API key
  - credential IDs and names
  - webhook ID
  - internal SQL and table names
  - internal moderation/recheck flow logic

## Public Repo Preparation Plan

### Files/folders that should likely be removed from git tracking

- `DB_AUDIT.md`
- `REPO_AUDIT.md`

These are strong candidates for removal from the public repo or migration to a private/internal knowledge location.

### Files that should remain

- `src/**`
- `prisma/**`
- `.github/workflows/quality.yml`
- `.env.example`
- `.env.test.example`
- `.env.production.example`
- `.env.n8n.example`
- `docker-compose.n8n.yml`
- public-safe docs such as:
  - `README.md`
  - `CONTRIBUTING.md` if created
  - `SECURITY.md` if created
  - `docs/public-repo-checklist.md` if created
  - `docs/go-live-checklist.md` after review
  - `docs/moderation-runbook.md` after review

### Files that should likely be replaced with examples/templates or sanitized variants

- tracked n8n workflow export files
- `docs/local-n8n.md`
- `README.md`

Sanitized variants should remove embedded secrets, machine-specific paths, credential IDs, and unnecessary internal operational detail.

### Docs that need rewriting for public visibility

- `README.md`
- `docs/local-n8n.md`
- `docs/netlify-deploy.md`
- `docs/go-live-checklist.md`
- `docs/moderation-runbook.md`
- `docs/CODEX_SYSTEM_PROMPT.md`

`docs/CODEX_SYSTEM_PROMPT.md` is not a leak in the same class as the API key, but it is internal maintainer instruction material and should be reviewed before public release.

### Safe sequencing plan

1. Remove or rotate hard-coded secrets from tracked workflow exports.
2. Remove internal audit documents from public tracking or replace them with sanitized public docs.
3. Rewrite README and local-n8n docs to eliminate absolute paths and reduce internal-only detail.
4. Sanitize n8n workflow exports or move them to a private/internal location.
5. Review deployment and operational docs for public-safe wording.
6. Verify `.gitignore`, env examples, and developer setup docs still support local onboarding.
7. Only after that, consider runtime-facing behavioral changes such as health endpoint tightening.

## Change Safety Matrix

### Safe now

- Remove tracked internal audit docs from public tracking:
  - `DB_AUDIT.md`
  - `REPO_AUDIT.md`
- Replace absolute local paths in tracked docs
- Rewrite `README.md` for public visibility
- Clarify migration/setup docs to match current repo reality
- Harden `.gitignore` if needed around local/generated artifacts
- Add public-facing docs such as `CONTRIBUTING.md`, `SECURITY.md`, and `docs/public-repo-checklist.md`

### Safe with verification

- Sanitize and keep selected private workflow exports if they remain in a non-public location
- Rewrite `docs/local-n8n.md`
- Rewrite `docs/netlify-deploy.md`
- Reduce public prominence of demo credentials while preserving local/e2e setup
- Review `docs/go-live-checklist.md` and `docs/moderation-runbook.md` for public-safe scope
- Review `docs/CODEX_SYSTEM_PROMPT.md` for whether it belongs in the public repo

### Risky / requires manual approval

- Rotating the exposed external API key
- Changing runtime health/readiness response shape
- Removing workflows entirely if the current team still uses them for local operations
- Altering auth/demo runtime behavior rather than documentation and presentation
- Any schema, migration, or deployment logic changes

## MerhabaMap-Specific Constraint Callouts

- Preserve Germany-first scope in public docs. Do not rewrite the project as generic/global.
- Preserve bilingual Turkish/German expectations in public docs and contribution guidance.
- Preserve the documented email sender convention where relevant:
  - From: `noreply@merhabamap.com`
  - Reply-To: `info@merhabamap.com`
- Preserve the security-first and GDPR-aware framing.
- Do not expose real user data, private moderation notes, or unnecessary operational internals.
- Avoid weakening auth, moderation, ingestion, or compliance safeguards during cleanup.

## Top 10 Risks Summary

1. Hard-coded Gemini API key in tracked n8n workflow exports.
2. Tracked internal audit docs expose local DB and workflow internals.
3. Absolute local machine paths are committed in tracked docs.
4. n8n workflow exports leak credential handles, webhook IDs, SQL, and operational logic.
5. README is not public-ready and overemphasizes internal/demo details.
6. Demo credentials are too prominent in public-facing docs and source.
7. Migration/setup docs do not accurately match the checked-in migration state.
8. `/api/health` exposes environment and demo-auth state publicly.
9. Local env/build artifacts exist in the workspace and need release-process discipline.
10. Public docs currently reveal more deployment and internal ops detail than necessary.

## Phase 1 Outcome

The repository is not public-ready yet. The single strongest blocker is the embedded external API key in tracked workflow exports. After that, the main work is documentation and workflow sanitization rather than product logic changes.
