# Public Repo Checklist

Use this checklist before treating the repository as public-ready.

## Secrets and Sensitive Data

- no real credentials, API keys, or tokens are committed
- no local env files are tracked
- no real user data or private moderation data is committed
- workflow-related docs do not expose unnecessary operational secrets
- operational workflows (for example n8n) are intentionally kept private for security reasons

## Repository Hygiene

- no `node_modules`, `.next`, caches, or local build output are tracked
- no machine-specific absolute paths remain in tracked docs
- example env files remain available for setup
- generated local artifacts such as `.DS_Store` are ignored

## Documentation

- `README.md` is public-facing, accurate, and minimal
- `CONTRIBUTING.md` exists and matches the current workflow
- `SECURITY.md` exists and avoids public vulnerability disclosure details
- deployment docs do not expose unnecessary private infrastructure details

## Product Constraints

- Germany-first scope is preserved
- Turkish/German bilingual behavior is preserved
- security-first and GDPR-aware posture is preserved
- `noreply@merhabamap.com` and `Reply-To: info@merhabamap.com` conventions remain accurate where documented

## Final Review

- remaining risky cleanup items are documented separately
- runtime-facing changes were verified before release
- manual secret rotation is complete for any previously exposed credentials
- no tracked references remain to private workflow export directories
