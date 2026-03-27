# MerhabaMap Database Change Policy

## Purpose

This document defines the rules for working with the main MerhabaMap database schema.

The database schema is considered a protected system contract.

This is especially important because:
- the main app depends on stable production behavior
- the separate repository `merhabamap-ingest` may depend on current structure and semantics
- uncontrolled DB changes can break ingest compatibility, review logic, or moderation assumptions

---

## Core Rule

By default, the AI must assume:

- the current DB schema is correct
- the current DB structure is intentional
- schema changes are high risk
- no schema changes should be made unless explicitly approved

---

## What the AI Must Do First

Before suggesting any DB-related change, the AI must:

1. inspect the current schema, models, migrations, and relations
2. understand the existing data flow
3. preserve compatibility with current production assumptions
4. prefer no-schema-change solutions

---

## What the AI Must NOT Do

Without explicit user approval, the AI must NOT:

- rename tables
- drop tables
- rename columns
- remove columns
- repurpose existing fields
- change relation meaning
- change production entity semantics
- add required fields to core entities
- introduce breaking migrations
- restructure the schema to fit a convenience implementation

---

## Core Tables to Protect

These tables are especially sensitive and must not be changed lightly:

- users
- places
- events
- cities
- place_categories
- saved_places
- saved_events
- reports
- business_claims
- admin_action_logs
- sessions
- verification_tokens

---

## User Suggestions Rule

User suggestions are handled in the main app.

However:
- user suggestions do NOT justify breaking the production schema
- user suggestions must not directly rewrite core data structures
- user suggestions should go through review-first handling
- app-layer handling is preferred over schema changes

If support for user suggestions seems to require DB changes:
- first propose a non-breaking alternative
- explicitly describe ingest compatibility risk
- wait for explicit approval

---

## Compatibility Rule

The AI must always consider possible compatibility impact on:

- `merhabamap-ingest`
- moderation workflows
- review-first content handling
- production stability
- existing admin tooling

---

## Safe Default

When in doubt:
- do not change the schema
- keep the structure stable
- solve the task in the application layer
- ask for explicit approval before any structural DB proposal