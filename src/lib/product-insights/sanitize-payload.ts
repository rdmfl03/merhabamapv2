import type { AppLocale } from "@/i18n/routing";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const SURFACE_RE = /^[a-z0-9_]{1,40}$/;
/** Prisma-style cuid */
const CUID_RE = /^c[a-z0-9]{20,32}$/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function sanitizeProductInsightPayload(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (raw.locale === "de" || raw.locale === "tr") {
    out.locale = raw.locale;
  }

  if (typeof raw.authenticated === "boolean") {
    out.authenticated = raw.authenticated;
  }

  if (typeof raw.surface === "string" && SURFACE_RE.test(raw.surface)) {
    out.surface = raw.surface;
  }

  if (
    raw.entityType === "place" ||
    raw.entityType === "event" ||
    raw.entityType === "city" ||
    raw.entityType === "collection" ||
    raw.entityType === "category"
  ) {
    out.entityType = raw.entityType;
  }

  if (raw.browseMode === "index" || raw.browseMode === "detail") {
    out.browseMode = raw.browseMode;
  }

  if (typeof raw.citySlug === "string" && SLUG_RE.test(raw.citySlug)) {
    out.citySlug = raw.citySlug;
  }

  if (typeof raw.categorySlug === "string" && SLUG_RE.test(raw.categorySlug)) {
    out.categorySlug = raw.categorySlug;
  }

  if (typeof raw.collectionId === "string" && CUID_RE.test(raw.collectionId)) {
    out.collectionId = raw.collectionId;
  }

  if (typeof raw.placeId === "string" && CUID_RE.test(raw.placeId)) {
    out.placeId = raw.placeId;
  }

  if (typeof raw.eventId === "string" && CUID_RE.test(raw.eventId)) {
    out.eventId = raw.eventId;
  }

  if (raw.participationIntent === "interested" || raw.participationIntent === "going") {
    out.participationIntent = raw.participationIntent;
  }

  if (raw.shareMethod === "native" || raw.shareMethod === "copy") {
    out.shareMethod = raw.shareMethod;
  }

  if (typeof raw.hasQuery === "boolean") {
    out.hasQuery = raw.hasQuery;
  }

  if (typeof raw.hasCityFilter === "boolean") {
    out.hasCityFilter = raw.hasCityFilter;
  }

  if (typeof raw.saveAdded === "boolean") {
    out.saveAdded = raw.saveAdded;
  }

  if (typeof raw.cityFollowed === "boolean") {
    out.cityFollowed = raw.cityFollowed;
  }

  if (raw.feedMode === "default" || raw.feedMode === "local") {
    out.feedMode = raw.feedMode;
  }

  return out;
}

export function coerceProductInsightPayload(
  input: unknown,
  defaults: { locale: AppLocale; authenticated: boolean },
): Record<string, unknown> {
  const base = isPlainObject(input) ? input : {};
  return sanitizeProductInsightPayload({
    ...base,
    locale: base.locale ?? defaults.locale,
    authenticated: base.authenticated ?? defaults.authenticated,
  });
}
