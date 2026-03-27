# MerhabaMap Moderation Runbook

This runbook is an operational draft for the MVP. It should be reviewed by the product and operations team before broader rollout.

## Reports

### When a report is `OPEN`

- Check whether the target is a place or an event
- Review the reason and any optional details
- If the report looks credible, move it to `IN_REVIEW`
- If the report is clearly low quality or abusive, reject it without adding trust claims to the UI

### When a report is `IN_REVIEW`

- Check the affected public page
- Compare the reported information with the currently displayed information
- For links, only keep URLs that are expected and safe to expose
- Resolve the report after the public data has been corrected or confirmed

### Repeated bad reports

- Treat repeated low-quality reports as an abuse signal, not automatically as valid moderation evidence
- If one user repeatedly reports the same target in a short period, review their pattern before taking action
- Do not expose moderation reasoning publicly

## Claims

### Pending claims

- Check whether the claimant message is coherent
- Check whether contact details are plausible
- Review any evidence notes
- Check whether there is already an owner linked to the place

### Approving a claim

- Approve only when the ownership link looks credible enough for MVP standards
- Approval links the place to the claimant account and sets the place to `CLAIMED`
- `CLAIMED` does not mean MerhabaMap has independently verified all public information

### Rejecting a claim

- Reject when evidence is too weak, conflicting, or obviously spammy
- Do not disclose internal moderation notes in public surfaces or user emails

### Suspicious claims

- Watch for repeated claims across unrelated businesses
- Watch for clearly copied messages or low-context evidence
- If unsure, leave the place unverified and avoid upgrading to `VERIFIED`

## Trust States

- `UNVERIFIED`
  - no approved ownership relationship and no MerhabaMap confirmation
- `CLAIMED`
  - an ownership claim was approved
- `VERIFIED`
  - MerhabaMap additionally confirmed key information

Use `VERIFIED` conservatively. It should remain a higher-confidence state than `CLAIMED`.

## External Links

- Treat external event or business links carefully
- Keep only links that are relevant to the displayed entity
- Remove or reject obviously unsafe, unrelated, or misleading links
- MerhabaMap should not imply endorsement of third-party sites beyond linking them

## Soft Launch Rhythm

- Check open reports daily
- Check pending claims daily
- Review recent admin actions for consistency
- If moderation volume becomes hard to manage, slow rollout before adding more surface area

# MerhabaMap Moderation Runbook (Production)

This runbook defines the operational standards for moderation in MerhabaMap.
It is designed for production use under German/EU (DSGVO) requirements and a review-first data model.

---

## Scope & Principles

- Moderation operates ONLY on **review-stage or already published data**.
- All external/ingest-originated data is **untrusted until reviewed**.
- No auto-publish: every item must pass **validation → moderation → controlled publish**.
- **Do not disclose internal reasoning** publicly.
- Prefer **safety, accuracy, and legal compliance** over speed.

### Repository Boundary (Critical)

- This repository (`merhabamap`) is the **only place where production decisions and code apply**.
- `merhabamap-ingest` is **read-only context** (no code changes, no patches, no refactors from here).
- Do NOT recreate ingest logic here; moderation consumes **reviewable inputs**, not raw pipelines.

---

## Roles & Access

- **Moderator**: reviews reports/claims, updates states, corrects content.
- **Admin**: can override decisions, manage users, and audit actions.

Requirements:
- Enforce **RBAC** for `/admin` routes.
- All actions must be **audited** (who, what, when, before/after state).

---

## SLAs (Targets)

- New reports: triage within **24h**
- Pending claims: initial review within **24–48h**
- High-risk content (safety/legal): **same-day** handling

---

## Reports

### When a report is `OPEN`

- Identify target (place/event)
- Review reason + details
- If credible → move to `IN_REVIEW`
- If clearly abusive/low-quality → **reject** (no trust signals added)

### When a report is `IN_REVIEW`

- Check the public page and compare reported vs displayed data
- Verify links and fields are **relevant and safe**
- Correct data if needed
- Resolve report after correction or confirmation

### Repeated bad reports

- Treat as **abuse signal**, not evidence
- Check reporter pattern before action
- Do not expose internal reasoning

---

## Claims (Business Ownership)

### Pending claims

- Check message coherence and contact plausibility
- Review evidence notes
- Check if an owner already exists

### Approving a claim

- Approve only when **credibility threshold** is met (MVP standard)
- Set state to `CLAIMED` and link account
- Note: `CLAIMED` ≠ fully verified by MerhabaMap

### Rejecting a claim

- Reject if evidence is weak/conflicting/spammy
- Do not disclose internal notes publicly or via email

### Suspicious claims

- Repeated claims across unrelated businesses
- Copied/low-context messages
- If unsure → keep `UNVERIFIED`, avoid upgrading to `VERIFIED`

---

## Trust States

- `UNVERIFIED` – no approved ownership and no confirmation
- `CLAIMED` – ownership claim approved
- `VERIFIED` – MerhabaMap confirmed key information

Use `VERIFIED` **conservatively**; it must be higher confidence than `CLAIMED`.

---

## External Links Policy

- Keep only **relevant, expected, and safe** links
- Remove misleading/unrelated/unsafe links
- Do not imply endorsement of third-party sites

---

## Data Safety & DSGVO

- Do not store or expose **unnecessary personal data**
- Never import or display **scraped personal data** without lawful basis
- Minimize logs; avoid PII in logs
- Ensure deletion/export paths exist where applicable

---

## Ingest Awareness (No Bypass)

- Moderation must never approve **raw ingest payloads** blindly
- Required path:
  1. validation
  2. deduplication
  3. moderation (this runbook)
  4. controlled publish
- There must be **no direct raw-ingest → public** path

---

## Decision Logging (Audit)

For each action, record:
- actor (user/admin id)
- action type (approve/reject/edit)
- target id (event/place/report/claim)
- timestamp
- before/after state
- optional internal note (never public)

---

## Escalation

Escalate to Admin if:
- legal risk (defamation, IP, safety)
- coordinated abuse/spam patterns
- uncertain ownership with potential harm

---

## Daily Operations

- Check **open reports**
- Check **pending claims**
- Review **recent admin actions** for consistency
- If volume is high → **slow rollout** before adding new sources/surfaces

---

## Quality Checklist (Quick)

- No PII from external sources visible
- No duplicate entries after deduplication
- City scoping correct (e.g., Berlin/Köln)
- Links safe and relevant
- Trust state appropriate (`VERIFIED` used sparingly)

---

## Do / Don’t Summary

**Do**
- Validate, verify, and document decisions
- Keep boundaries: main app vs ingest
- Prefer conservative decisions

**Don’t**
- Auto-publish or bypass review
- Mix ingest logic into this repo
- Expose internal moderation reasoning
- Store or log unnecessary personal data