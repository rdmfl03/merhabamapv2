# Wiki Sync Rules

## Purpose
Ensure that the `merhabamap` implementation repository and the separate `merhabamap-wiki` repository remain aligned.

---

## Core Principle

The wiki repository is the source of truth for:
- architecture
- domain rules
- security
- compliance
- operational workflows
- major product decisions

The code repository implements these rules.

---

## Separation of Responsibility

### `merhabamap`
This repository contains:
- implementation
- application code
- ingest logic
- database-related code
- deployment-related code
- technical execution

### `merhabamap-wiki`
This repository contains:
- architecture documentation
- domain definitions
- security rules
- compliance rules
- operations guidance
- ADRs / decisions

Codex must not treat these repositories as interchangeable.

---

## When a Wiki Update Is Required

A wiki update is required if a code change affects any of the following:

### Architecture
- API structure
- database schema or migration rules
- ingest pipeline structure
- trust scoring or ranking behavior
- admin workflows or internal tooling behavior

### Domain Logic
- places
- events
- cities
- profiles
- business claims
- moderation/reporting
- saved/followed entities

### Security
- authentication
- authorization
- anti-spam
- abuse prevention
- admin permissions
- review or approval flows

### Operations
- ingest workflows
- manual review
- source handling
- data quality handling
- source health monitoring
- incident handling

### Compliance
- personal data handling
- email behavior
- source usage rules
- privacy-related logic
- deletion/correction/export behavior

---

## When a Wiki Update Is Usually Not Required

A wiki update is usually not required for:
- small UI styling changes
- typo fixes
- isolated bug fixes without behavior change
- refactors that do not change behavior
- internal cleanup with no architecture/domain/security/compliance impact

---

## Required Output From Codex

When a change affects wiki-relevant behavior, Codex must provide a **Wiki Update Summary** at the end of the task.

That summary must include:

1. What changed in the code
2. Why it matters
3. Which files in `merhabamap-wiki` should likely be updated
4. Whether a new ADR is recommended

---

## What Codex Must NOT Do In This Repository

- Do not try to edit the wiki repository from inside the code repository
- Do not invent future-facing documentation for unimplemented ideas
- Do not rewrite large documentation unnecessarily
- Do not silently introduce behavior that conflicts with documented wiki rules

---

## Rule of Thumb

If the implementation changes how the system behaves,
the wiki must eventually reflect it.