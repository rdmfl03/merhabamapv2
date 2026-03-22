# AGENTS.md — MerhabaMap project rules

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

## Definition of done
A change is only done if:
- it is public-repo-safe
- it does not expose secrets or internal operations
- it does not break app behavior
- docs remain consistent
- only intended files are included
