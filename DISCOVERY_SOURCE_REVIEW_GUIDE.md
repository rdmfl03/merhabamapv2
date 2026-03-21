# Discovery Source Review Guide

## Purpose

Use this guide to manually review newly discovered sources from `MerhabaMap Discovery v1` before treating them as high-confidence long-term event sources.

The goal is not perfect precision in one pass. The goal is a fast, consistent review of 20-30 newly discovered sources.

## Review Matrix

Copy this table into your review notes and fill one row per discovered source.

| source_url | source_name | why_discovered | is_real_event_source | source_type_guess | event_signal_strength | turkish_relevance | legal_or_generic_page | duplicate_or_near_duplicate | keep_as_source | review_note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | yes / no / unclear | venue / community / cultural_association / mosque / festival / restaurant / media / other | strong / medium / weak / none | high / medium / low / none | yes / no | yes / no / unclear | yes / no / review |  |

## Quick Decision Rules

### A real event source is usually:

- a page or domain that regularly publishes actual events, programs, calendars, workshops, festivals, concerts, or community gatherings
- a venue, festival organizer, cultural association, mosque/community site, or calendar page with recurring public event information
- a source where event discovery feels like a primary function, not an accidental side effect

### A generic or weak source is usually:

- a legal page such as impressum, datenschutz, privacy, contact, login, donation
- a general news/media page without a stable event section
- a restaurant page with no recurring event program
- a root homepage with vague community language but no usable event path or recurring event content
- a thin category page with no clear signal that it helps discover real event detail pages

### Restaurant, media, and generic pages

- `restaurant`:
  keep only if the page clearly publishes recurring events, live music, cultural nights, or a program calendar
- `media`:
  usually `no` unless it acts as a stable event calendar, not just articles or announcements
- `community` / `mosque` / `cultural_association`:
  keep when the source has a clear events/program section, not just organizational info

## Keep-As-Source Logic

- `keep_as_source = yes`
  - clearly event-oriented
  - stable event/program/calendar page or domain
  - Turkish relevance is medium or high
  - not a legal/generic page
- `keep_as_source = no`
  - legal/generic page
  - duplicate of an already better source
  - no meaningful event discovery value
  - Turkish relevance is none and event signal is weak or none
- `keep_as_source = review`
  - some event signs are present, but page type is ambiguous
  - could be useful as a niche source, but needs a second look
  - near-duplicate or secondary version of another source

## Suggested 6-Step Review Flow

1. Open the source URL and classify the page type in under 30 seconds.
2. Check whether the page publishes actual event/program content or just generic organization/news content.
3. Assess Turkish relevance from page language, community context, naming, or program focus.
4. Mark legal/generic pages immediately as `no`.
5. Compare obvious duplicates on the same domain or near-identical event paths.
6. Set `keep_as_source` and leave one short `review_note` explaining the decision.

## Notes For Consistency

- Prefer one strong event/calendar page over many near-duplicate pages on the same domain.
- Prefer event discovery value over brand/name familiarity.
- Keep doubtful but potentially valuable sources as `review`, not `yes`.
- Stay conservative on legal, login, donation, and pure contact pages.
