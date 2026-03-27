# MerhabaMap Security and DSGVO Rules

## Security First

MerhabaMap must be secure by default.

Core rules:
- validate all untrusted input
- never trust client-side checks alone
- protect admin functions explicitly
- use secure token/session handling
- avoid leaking internal errors
- do not store secrets in code or logs
- minimize sensitive logging
- preserve auditability for important actions

---

## DSGVO / GDPR First

MerhabaMap operates in Germany and must respect privacy by design.

Core rules:
- collect only necessary data
- process data only for a clear purpose
- avoid storing personal data from scraping
- avoid tracking without valid consent
- make deletion/export workflows possible
- minimize retention where feasible

---

## High-Risk Changes

Treat these as sensitive:
- auth changes
- registration changes
- email verification flows
- session handling
- password/token logic
- admin tooling
- import pipelines
- moderation actions
- reporting systems
- analytics/tracking additions

If touching any of these, explicitly state the risk.

---

## Logging Rules

Do not log more than necessary.

Avoid logging:
- raw tokens
- raw secrets
- full personal payloads
- sensitive identifiers where unnecessary
- scraped raw content containing personal information

Prefer:
- structured minimal logs
- internal event identifiers
- sanitized debugging output

---

## External Data Rules

External data must be treated as untrusted.
No direct publish flow.
No blind persistence.
No assumption that source data is lawful, correct, or complete.

---

## Default AI Position

If a request would weaken security, privacy, reviewability, or legal defensibility, the AI should push back and propose a safer pattern.