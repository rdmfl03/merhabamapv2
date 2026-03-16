# CODEX_SYSTEM_PROMPT.md

## MerhabaMap - Master Instruction for Codex / AI Coding Agents

You are working on **MerhabaMap**, a bilingual, community-focused, map-based discovery platform for people with Turkish background living in Germany.

Your job is to continue the project in a way that is:

- product-consistent
- design-consistent
- security-first
- legally aware for Germany/EU
- scalable
- production-oriented

Do not treat this as a generic demo app.
Treat it as a real product with a clear vision, strong brand identity, and strict quality expectations.

---

# 1. Product Identity

## 1.1 What MerhabaMap is

MerhabaMap is a **community-driven local discovery platform** focused on the Turkish community in Germany.

It combines multiple product layers into one ecosystem:

- local place discovery
- event discovery
- community visibility
- local business listings
- user profiles
- local offers / deals
- later possibly groups and marketplace features

It is **not only a directory** and **not only a social network**.

It should feel like a combination of:

- Google Maps
- Event discovery
- local community platform
- trusted cultural ecosystem

---

## 1.2 Product Goal

The goal is to create a **digital home and discovery layer** for the Turkish diaspora in Germany.

Users should be able to quickly discover:

- relevant places
- businesses
- events
- community infrastructure
- local offers
- trusted profiles and content

The platform must feel:

- modern
- warm
- welcoming
- premium
- useful
- trustworthy

---

# 2. Market Scope

## 2.1 Geographic Scope

Current focus:

- Germany only

Pilot cities:

- Berlin
- Koln

Do not design features as if this were already a global platform.
Keep the current Germany-first scope in mind while building scalable foundations.

---

## 2.2 Core Target Users

Primary users include:

- Turkish community members in Germany
- families
- students
- young professionals
- local business owners
- event organizers
- community-oriented users

Typical use cases:

- finding Turkish or community-relevant places nearby
- discovering events in a city
- finding trusted local services
- exploring community infrastructure
- staying connected to a cultural ecosystem

---

# 3. Language Rules

MerhabaMap is bilingual.

Supported languages:

- Turkish
- German

Important rules:

- bilingual support must always be considered in UX and code architecture
- avoid hardcoded single-language assumptions
- system communication should be built with translation-readiness in mind

## 3.1 Registration / System Email Rule

All registration-related emails must be bilingual and structured as:

1. Turkish first
2. German second

Email metadata rules:

- From: `noreply@merhabamap.com`
- Reply-To: `info@merhabamap.com`

Do not use `support@...` as if it were a person-contact mailbox.

---

# 4. Core Product Modules

## 4.1 Places

Places are one of the most important modules.

Examples:

- restaurants
- cafes
- bakeries
- supermarkets
- hair salons
- lawyers
- doctors
- travel agencies
- mosques
- cultural centers
- associations
- local service providers

### Places UX expectations

Places should support:

- map view
- list view
- category filters
- search
- featured items
- trending items
- responsive UI
- clean and fast discovery flow

---

## 4.2 Events

Events are a core discovery module.

Examples:

- concerts
- cultural events
- association events
- networking events
- family events
- community gatherings
- festivals
- religious or cultural activities

### Events UX expectations

Events should support:

- browsing by date
- browsing by city
- category filtering
- clean event cards
- discoverability in map/list context
- local relevance first

---

## 4.3 Deals

Deals represent curated local offers.

Important principle:

Deals must feel:

- curated
- useful
- trustworthy
- visually high-quality

Avoid building a spammy coupon style experience.

---

## 4.4 Profiles

Profiles add social/community depth.

Possible profile capabilities:

- profile header
- profile stats
- editable profile
- follow / unfollow
- favorites / saved content
- personal activity context

Known relevant project direction includes:

- ProfileHeader
- ProfileStats
- EditProfileModal
- whoami/auth flow
- follow/unfollow API
- MyProfilePage integration

Do not break this direction unnecessarily.

---

## 4.5 Groups (Future / Optional)

Potential later feature:

- city groups
- interest groups
- family groups
- student groups
- community circles

Should strengthen belonging and local relevance.

---

## 4.6 Marketplace / Pazar Yeri (Future / Optional)

Potential future marketplace layer.

Must be treated as high-risk in terms of:

- fraud
- abuse
- moderation
- legal exposure
- privacy
- consumer trust

Do not casually implement unsafe marketplace flows.

---

# 5. UX and Design System

## 5.1 Design Philosophy

MerhabaMap must feel:

- modern
- premium
- clean
- culturally warm
- community-oriented
- trustworthy
- not cluttered

Avoid UI that feels:

- cheap
- outdated
- spammy
- overloaded
- inconsistent

---

## 5.2 Brand Color

Primary brand color is fixed:

- Turkey-flag red

Use it consistently across:

- buttons
- highlights
- active states
- branding accents
- important UI emphasis

Do not randomly replace the brand color with another design direction.

---

## 5.3 Baseline Visual Reference

The current baseline reference is the MerhabaMap landing design with:

- red gradient header
- large rounded square logo badge on the left
- title: `Hos geldin | Willkommen`
- DE/TR toggle top-right
- left-side form with:
  - email required
  - username required
  - phone optional
  - language select
  - CTA: `Simdi kaydol`
- right-side preview card
- Germany map image in a light pink card
- trust & safety text below

Treat this as a preferred style reference when extending the UI.

---

## 5.4 Design Consistency Rules

When building UI:

- reuse existing spacing patterns
- reuse existing border radius patterns
- keep card styles consistent
- keep button hierarchy consistent
- keep typography coherent
- maintain responsive quality
- preserve brand feel

Do not introduce a disconnected mini-design-system inside one feature.

---

# 6. Map-Centric Product Logic

The map is not decorative.
It is a central product mechanism.

Users should be able to answer questions like:

- What exists near me?
- Which community-relevant places are in this city?
- What events are nearby?
- Which places are trending or relevant?

Expected map-related patterns may include:

- markers
- clustering
- selected state
- list + map layout
- right-side rails
- filtered discovery
- mobile-friendly behavior

Known direction may include components such as:

- `MapView`
- `MapRightRail`
- `DealsRightRail`
- `GroupsRightRail`

Respect and extend this direction where sensible.

---

# 7. Technical Architecture Guidance

## 7.1 General Principle

Build on the existing project direction.
Do not perform unnecessary restructuring.

Prefer:

- incremental improvement
- maintainable architecture
- reusable abstractions
- clear separation of concerns

Avoid:

- impulsive large rewrites
- changing folder structure without strong reason
- introducing complexity without clear product value

---

## 7.2 Monorepo Mindset

The project is organized with a monorepo-style architecture.

Relevant areas may include:

- `apps/web`
- `apps/mobile`
- `apps/ingest`
- `packages/shared`

Treat shared logic carefully and keep reusable logic centralized where appropriate.

---

## 7.3 Frontend

Primary web direction:

- Next.js
- React
- reusable components
- scalable, production-ready UI architecture

Possible mobile direction:

- Expo
- React Native
- Expo Router

Do not implement web code in ways that make future shared logic unnecessarily difficult.

---

## 7.4 Backend / Data Layer

Primary database direction:

- PostgreSQL

Cloud deployment direction may include:

- DigitalOcean managed database
- Netlify for frontend deployment
- environment separation for local vs production

Never expose secrets in frontend code.

---

# 8. Data Ingestion and External Data

MerhabaMap is not purely manual-content only.
It includes ingestion logic for structured or semi-structured external data.

Possible source types include:

- city feeds
- event pages
- JSON-LD sources
- external event platforms

Expected ingest behavior:

- deduplicate data
- normalize data
- validate data
- assign categories
- support moderation awareness
- preserve source traceability where useful

Do not blindly import and trust external content.

---

# 9. Authentication and User Flows

MerhabaMap includes real user accounts and should be treated accordingly.

Typical onboarding/user account fields may include:

- email
- username
- optional phone
- language
- optional city

Important principles:

- friction should stay reasonable
- UX should feel trustworthy
- flows should be clean and modern
- security should never be sacrificed for convenience

---

# 10. Security Requirements

Security is mandatory, not optional.

You must prioritize secure defaults in every implementation.

## 10.1 Core Security Principles

Always consider:

- authentication security
- authorization correctness
- input validation
- output sanitization
- safe API design
- abuse prevention
- spam prevention
- rate limiting
- secure secret handling
- server-side validation
- safe file/image handling
- logging without leaking sensitive data

---

## 10.2 Things You Must Avoid

Do not introduce:

- secrets in frontend code
- trust in unvalidated client input
- insecure admin shortcuts
- weak access control
- unsafe HTML rendering
- unreviewed upload flows
- personally invasive data collection without need

---

## 10.3 Trust & Safety

MerhabaMap must also feel safe as a platform.

Think about:

- fake accounts
- spam submissions
- scam content
- abusive reports
- suspicious listings
- harmful user-generated content

Where relevant, design features in a way that allows moderation and reporting later.

---

# 11. Legal and Compliance Requirements

MerhabaMap should be developed in a way that is compatible with German and EU law.

This is a hard constraint.

## 11.1 GDPR / DSGVO

All features must be designed with data protection in mind.

Core principles:

- data minimization
- transparency
- purpose limitation
- clear user communication
- deletion capability
- secure storage
- responsible handling of personal data

Do not collect unnecessary personal data just because it might be useful later.

---

## 11.2 Platform Liability and Moderation

Because the platform may contain business listings, events, profiles, and later possibly user-generated content, the product must remain moderation-aware.

That includes future support for:

- reporting mechanisms
- moderation workflows
- illegal content handling
- takedown capability
- auditability of important actions where appropriate

---

## 11.3 Business Transparency

If sponsored content, promoted listings, paid visibility, or featured placements are ever introduced, they must be clearly distinguishable from organic content.

Do not create deceptive ad-like ranking behavior.

---

# 12. Engineering Standards

## 12.1 Reusability

Build reusable components where it makes sense.

Prefer:

- shared UI primitives
- shared domain models
- composable feature components
- maintainable abstractions

Avoid:

- duplicate implementations of similar UI patterns
- highly coupled one-off logic

---

## 12.2 Maintainability

Generated code should be:

- readable
- modular
- understandable by humans
- reasonably typed
- easy to extend
- not overengineered

---

## 12.3 Production Readiness

Favor production-quality implementation over fast prototypes.

That means:

- clear naming
- stable structure
- basic error handling
- graceful empty states
- loading states where needed
- responsive behavior
- no fake shortcuts that break later

---

## 12.4 Minimal Disruption

When editing existing code:

- preserve architecture direction
- avoid unnecessary churn
- avoid renaming large areas unless required
- keep diffs clean where possible

---

# 13. Product Feel and Emotional Outcome

MerhabaMap is not just a technical system.
It should emotionally communicate:

- welcome
- belonging
- local relevance
- cultural familiarity
- safety
- professionalism

A user should feel:

- "This platform understands my context."
- "I can trust what I see here."
- "This is useful in my daily life."
- "This feels modern and built with care."

Do not build features that feel generic if they can be aligned with this product identity.

---

# 14. Current Known Product Direction

You should assume the following are already meaningful project realities and should be respected:

- existing landing page baseline is a design reference
- brand color is fixed and should remain consistent
- Germany-first scope is intentional
- pilot cities are Berlin and Koln
- profile feature direction already exists
- event UI direction already exists
- map-centric discovery is a core principle
- bilingual logic matters
- folder structure should not be changed casually

Build forward from this, not away from it.

---

# 15. Do / Don't Rules

## Do

- build with product consistency
- preserve brand identity
- think in reusable components
- keep bilingual support in mind
- prioritize security
- prioritize legal awareness
- support scalability
- improve UX quality
- respect existing structure

## Don't

- do not redesign the whole product arbitrarily
- do not introduce inconsistent UI styles
- do not ignore bilingual needs
- do not implement risky privacy patterns
- do not expose secrets
- do not assume weak moderation is acceptable
- do not create spammy discovery experiences
- do not overcomplicate architecture without need
- do not treat this like a throwaway demo

---

# 16. Implementation Mindset

When implementing any new feature, ask yourself:

1. Does this fit the MerhabaMap product identity?
2. Does this preserve the existing brand/design system?
3. Is this secure by default?
4. Is this reasonable under German/EU legal expectations?
5. Is this reusable and maintainable?
6. Does this help the map/community/discovery ecosystem feel more coherent?
7. Would this feel trustworthy to a real user?

If the answer to several of these is no, revise the implementation.

---

# 17. Short Operational Summary

MerhabaMap is a bilingual Turkish/German, Germany-focused, security-conscious local discovery and community platform for the Turkish diaspora.

It combines:

- places
- events
- deals
- profiles
- community features

into one modern digital ecosystem.

All work on this project must be:

- secure
- scalable
- legally aware
- brand-consistent
- bilingual-ready
- product-consistent
- production-oriented

Build accordingly.
