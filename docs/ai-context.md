# MerhabaMap – Full System Context

## 1. Project Overview

MerhabaMap is a platform designed to connect Turkish communities in Germany.

The core idea is to provide a trusted, structured, and high-quality ecosystem for:
- Events
- Places (restaurants, services, cultural locations)
- Social interaction (future)
- Community discovery

The platform focuses on:
- Trust
- Quality over quantity
- Legal compliance (Germany / EU)
- Safe handling of data
- Gradual scaling

MerhabaMap is NOT a generic social network.
It is a curated, semi-controlled ecosystem.

**Tone vs. meaning:** “Curated” and “semi-controlled” refer to **review-first publishing**, moderation, and data responsibility—not a government portal, not official immigration/integration services, and not bureaucratic UX. User-facing language should stay **modern, open, and community-near** while keeping those safeguards. Binding rules for AI-assisted work (legal copy, security, ingest boundaries) are in **[ai-guard-system.md](ai-guard-system.md)**.

---

## 2. Core Principles

### 2.1 Security First
All development decisions must prioritize security over speed or convenience.

- Never expose sensitive data
- Always validate and sanitize inputs
- Avoid unsafe patterns
- No implicit trust in external data

---

### 2.2 DSGVO (GDPR) Compliance – CRITICAL

This project operates in Germany and must comply with DSGVO.

STRICT RULES:
- No personal data without clear purpose
- No storage of scraped personal data
- No tracking without explicit consent
- Data minimization is required
- Users must be able to request deletion
- No silent data collection

NEVER:
- Store names, emails, phone numbers from scraping
- Import user-generated content without consent

---

### 2.3 Review-First System (VERY IMPORTANT)

MerhabaMap does NOT auto-publish data.

All external data must go through:

1. Discovery
2. Parsing
3. Validation (AI + rules)
4. Manual review
5. Publish

This is a HARD RULE.

---

### 2.4 Stability Over Speed

- Do not break existing systems
- Do not refactor aggressively
- Prefer incremental improvements

---

## 3. Technical Architecture

### 3.1 Stack

- Frontend: Next.js
- Backend: Node.js / API routes
- Database: PostgreSQL (DigitalOcean Managed DB)
- Automation: n8n
- Hosting: Netlify

---

### 3.2 System Structure

Main repository components (THIS repository):

- User System
- Events System
- Places System
- Cities System
- Admin / Moderation Layer
- Approved data intake (reviewed only)

External related system (READ-ONLY for AI):

- merhabamap-ingest (separate repository, no implementation allowed here)

---

### 3.3 Database Philosophy

- Schema must remain stable
- Never delete core columns
- Add new tables instead of breaking old ones
- Use foreign keys via IDs
- Avoid duplication

---

### 3.4 Database Contract with Ingest (CRITICAL)

The current database schema and database structure of the main MerhabaMap app must be treated as a stable contract.

This is especially important because:
- the separate repository `merhabamap-ingest` depends on the production data model and its expected structure
- uncontrolled schema changes in the main app can break ingest assumptions, mappings, review flows, or downstream processing

Rules:
- The AI must LEARN the current database schema before suggesting any data-related implementation
- The AI must treat the existing schema as fixed unless the user explicitly approves a schema change
- The AI must NOT rename, delete, repurpose, or restructure core tables or core relations
- The AI must NOT introduce breaking schema changes
- The AI must NOT change semantics of existing columns
- The AI must NOT add required columns to core tables without explicit approval
- The AI must NOT change enums, identifiers, or relational assumptions that may affect ingest compatibility

The existing database structure is not just an implementation detail.
It is part of the system contract between the main app and surrounding workflows.

If a feature request appears to need a schema change, the AI must first:
1. explain why
2. explain the compatibility risk
3. prefer a no-schema-change solution if possible
4. wait for explicit approval before proposing structural DB changes

---

## 4. Database Overview

### Core Tables

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

### Cities

Currently:
- Berlin
- Köln

Future:
- predefined list of major German cities

---

## 5. Ingest Pipeline (Context Only – External System)

### Purpose

To safely import and process external data.

NOTE:
This pipeline is primarily implemented in the separate repository "merhabamap-ingest".
This section exists for understanding only.

---

### 5.1 Sources (Planned)

- Instagram
- Facebook
- TikTok
- Google Maps

---

### 5.2 Pipeline Flow

1. Discovery (scrapers / Apify)
2. Raw data collection
3. Parsing & structuring
4. AI validation
5. Deduplication
6. Relevance filtering
7. Risk assessment
8. Manual approval
9. Publishing

This flow must NOT be reimplemented inside the main app.

---

### 5.3 Rules

- NO automatic publishing
- NO direct DB writes from external sources
- ALWAYS validate data
- ALWAYS check duplicates

---

### 5.4 Risks

- Spam
- Fake events
- Duplicate entries
- Personal data leakage

---

## 5.5 External Repository: merhabamap-ingest (STRICT SEPARATION)

The repository "merhabamap-ingest" is a separate system responsible for ingestion only.

Responsibilities of merhabamap-ingest:
- discovery (scraping, APIs, Apify)
- raw data collection
- parsing and structuring
- pre-validation and enrichment

Responsibilities of main MerhabaMap app:
- handling ONLY approved and reviewed data
- storing production-ready entities (events, places)
- user-facing features

### Critical Rules

The AI may use merhabamap-ingest as a read-only reference.

The AI is strictly NOT allowed to:
- generate code for merhabamap-ingest
- modify merhabamap-ingest
- propose patches for merhabamap-ingest
- suggest refactors inside merhabamap-ingest
- write implementation-ready changes for merhabamap-ingest
- move ingest logic into this repository

The AI must treat THIS repository as the only place where code is implemented.

The main app must NEVER:
- depend on raw ingest data
- import unvalidated external data
- bypass review or moderation

### If Ingest Changes Are Needed

The AI must explicitly state:
"This belongs to the merhabamap-ingest repository and is outside the implementation scope of this repository."

The AI may then:
- describe the dependency at a high level
- suggest safe interfaces from main app perspective

The AI must NOT provide ingest-repo code.

---

## 6. Event System

### Structure

Events include:
- title
- description
- date/time
- location
- category
- city_id

---

### Rules

- Must be relevant to Turkish community
- Must not contain harmful content
- Must not include personal data without consent

---

## 7. Places System

Places represent:

- Restaurants
- Cafés
- Cultural spaces
- Services

---

### Rules

- Must be real, verifiable
- No fake listings
- No spam entries

---

## 8. User System

### Features

- Registration (email-based)
- Authentication
- Save events / places
- Profile system

---

### Email Rules

- Always bilingual:
  Turkish first, then German

---

### Email Technical Rules

- From: noreply@merhabamap.com
- Reply-To: info@merhabamap.com

---

## 8.1 User Suggestions Policy

User suggestions are accepted in the main MerhabaMap app.

Examples:
- suggesting a new place
- suggesting a new event
- proposing a correction to an existing entry
- reporting outdated or wrong public information

Rules:
- User suggestions belong to the main app, not to the external ingest repository
- User suggestions must NOT be treated as raw external ingest input
- User suggestions must NOT directly modify production entities without review
- User suggestions must enter a moderation-first or review-first path
- The AI must prefer app-layer handling and review workflows over schema changes

Important:
The AI must not change the core production schema just to support user suggestions unless the user explicitly approves such a structural change.
Default behavior is:
- keep schema stable
- use existing review/moderation concepts where possible
- avoid DB contract changes that could affect `merhabamap-ingest`

---

## 9. Design System

### Colors

- Primary: Turkey flag red
- Secondary: White
- Neutral: Grey tones

---

### UI Principles

- Clean
- Minimal
- Accessible
- Mobile-first

---

## 10. Admin & Moderation

Admin tools are required for:

- Reviewing events
- Approving content
- Handling reports
- Managing claims

---

## 11. Security Guidelines

ALWAYS:

- Validate inputs
- Sanitize outputs
- Use parameterized queries
- Avoid exposing internal APIs
- Use secure tokens

---

## 12. Forbidden Actions (VERY IMPORTANT)

NEVER:

- Auto-import external data into production
- Store scraped personal data
- Break DB schema
- Expose private endpoints
- Trust external input blindly
- Mix ingest logic into the main application
- Generate or modify code for merhabamap-ingest

---

## 13. Development Rules for AI

When generating code:

- Do not break existing functionality
- Do not rename critical DB fields
- Do not remove existing logic
- Prefer additive changes
- Explain risky decisions
- Implement code ONLY in this repository
- Treat merhabamap-ingest as read-only context

---

## 14. AI Behavior Instructions

You are acting as a senior engineer working on MerhabaMap.

You must:

- Prioritize safety over speed
- Highlight risks before implementation
- Respect DSGVO rules
- Avoid unsafe shortcuts
- Suggest improvements when needed
- Only write code for this repository
- Clearly separate ingest vs main system responsibilities

---

## 15. Long-Term Vision

MerhabaMap aims to become:

- The central platform for Turkish communities in Germany
- A trusted data source for events and places
- A scalable system across cities

---

## 16. Current Development Stage

- Early-stage product
- Core schema exists
- Initial data in Berlin & Köln
- Ingest pipeline developed in separate repository

---

## 17. Key Philosophy

MerhabaMap is NOT about:

- Maximum data
- Fast scraping
- Automation without control

MerhabaMap IS about:

- Trust
- Quality
- Safety
- Sustainability