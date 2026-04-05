# AGENTS.md — MerhabaMap project rules

## AI and compliance context

For **legal-risk copy**, **DSGVO-style privacy expectations**, **ingest/repo boundaries**, and **product positioning** (community platform vs. state-like claims), follow **[docs/ai-guard-system.md](docs/ai-guard-system.md)** in addition to this file. Full system context: **[docs/ai-context.md](docs/ai-context.md)**.

## Project status
MerhabaMap is a PUBLIC repository.
Always assume that any code, docs, config, examples, comments, commit messages, and file changes may be visible to external users.

## Core rule
Develop in a public-repo-safe way by default.
Do not introduce, restore, or expose anything that should remain private.

## Public/private boundary
Keep these private and out of the repository unless explicitly asked otherwise:
- secrets, tokens, API keys, credentials
- `.env.local`, `.env.*.local`, private env values
- internal-only audit files
- local machine paths such as `/Users/...`
- operational workflow exports (for example private n8n workflows)
- internal infrastructure details, webhook IDs, credential handles
- real user data, logs, dumps, production data, debug traces with sensitive content

If something is useful conceptually but not safe publicly, replace it with:
- a sanitized example
- a template
- a short public-safe explanation

## Security and privacy posture
This project is security-sensitive and GDPR-sensitive.
Prefer conservative changes.
Never weaken security for convenience.
Avoid exposing environment state, auth state, internal flags, or operational details in APIs, docs, or examples.

## Non-breaking requirement
Do not break the app while cleaning up or implementing features.
Before changing anything that may affect runtime, auth, setup, build, deployment, APIs, or database behavior:
- inspect usage first
- choose the least invasive change
- prefer sanitizing over deleting
- stop and report if the safe path is unclear

## Database (for AI / maintainers)
- **No default local Postgres:** Development and deployments typically use a **remote managed database** (e.g. DigitalOcean). `DATABASE_URL` comes from private env (e.g. `.env.local`), not from the repo. Never commit credentials, connection strings, or hostnames into the public repo.
- **Apply migrations** against that database with: `npm run db:migrate:deploy` (uses `scripts/run-with-env.mjs` to load env). Do not assume `localhost:5432` is available when running Prisma commands in automation.
- **HTTP 500 in local dev** with a remote DB often means **Postgres rejected connections** (“too many clients” / connection slots reserved). Use **one** `npm run dev` at a time, prefer the host’s **pooled** URL if available, and/or set `connection_limit` on `DATABASE_URL`. The app applies a conservative default pool cap only when the URL omits `connection_limit`.
- Unit tests that need a DB may fail without a running database; that is an environment limitation, not necessarily a code defect.

## Repo-specific rules
- This repo is Germany-first in scope.
- Preserve bilingual Turkish/German behavior where relevant.
- Operational workflows are intentionally private and should not be reintroduced.
- Keep public documentation concise, accurate, and professional.
- Do not invent claims, metrics, or production status.
- Current status should be presented as: actively developed and tested locally before production rollout.

## Allowed public docs
Public-facing docs should focus on:
- what the product does
- local setup
- contribution guidance
- security reporting
- high-level deployment guidance only

Avoid internal strategy notes, internal audits, internal migration scratch files, and maintainers’ private operational playbooks unless explicitly marked safe for public visibility.

## Change process
For any substantial change:
1. Briefly assess risks first.
2. Call out what could break.
3. Implement the smallest safe change.
4. Verify affected references, docs, and commands.
5. Summarize what changed and any remaining manual follow-up.

## Git hygiene
Never use broad staging commands like `git add .` unless explicitly requested.
Stage only intended files.
Be extra careful with deletions and untracked files.

## UI — Farbkonvention Türkis (verbindlich)

Wenn in diesem Projekt von **Türkis** die Rede ist (Copy, Tickets, Reviews, AI-Hinweise), ist damit **ausschließlich** diese Farbe gemeint:

- **Hex:** `#30D5C8`  
- Kein anderes Türkis-, Cyan- oder Teal-Nuance „aus dem Bauch“, kein generisches `tailwind` `cyan-*` / `teal-*`, solange es nicht **explizit** auf `#30D5C8` (bzw. ein dafür definiertes Design-Token) gemappt ist.

**Verwendung:** Türkis ist **nur** für (1) die **kompakten Karten-Einstiegs-Buttons** in Kontextlisten (Orts-/Event-Karten und -Listenzeilen: Icon-Button zur **Discovery-Karte**) und (2) den **„Mein Standort“-Marker** auf der Karte (`.merhaba-location-marker__*` in `globals.css`). Nicht für Fließtext-Links, nicht als Ersatz für **Brand-Rot** (`text-brand` / `--brand`), nicht für beliebige Primär-CTAs, nicht als Hintergrund großer Flächen.

**Nicht verwechseln:**

- **Brand / Akzent rot** (`text-brand`, `bg-brand`, Karten-Popup-CTAs u. a.) bleiben eigenständig (Türkeiflaggen-Rot).
- **Sonstige Karten-Chrome** (Cluster, Pin-Glyphen, Popover) nutzt eigene Paletten und ist **nicht** automatisch Türkis.

**Technische Abbildung:** `--turquoise` / `--turquoise-hover` in `src/app/globals.css` (Standort-Marker nutzt dieselben RGB-Werte als literale `rgba(48, 213, 200, …)` wegen Parser-Kompatibilität); Tailwind `bg-turquoise`, `hover:bg-turquoise-dark`, `ring-turquoise` in `tailwind.config.ts`.

**Audit — Map-Icon-Buttons (Discovery):**

- `src/components/places/place-card.tsx`
- `src/components/events/event-card.tsx`
- `src/components/social/profile-saved-list-rows.tsx` (Ort- und Event-Zeile)

**Audit — „Mein Standort“:** `.merhaba-location-marker__*` in `src/app/globals.css` (nutzt dieselben CSS-Variablen).

Neue oder geänderte UI: nur diese Token verwenden, Brand-Rot unverändert lassen.

## Definition of done
A change is only done if:
- it is public-repo-safe
- it does not expose secrets or internal operations
- it does not break app behavior
- docs remain consistent
- only intended files are included
