import type { ResolvedPlaceRatingSummary } from "@/lib/places";

/**
 * Google-Places-Darstellung (Lesen aus bestehender DB, keine API-Calls).
 *
 * Es gibt **keine** eigenen `google_*`-Spalten auf `Place`. Ingest soll v.a. schreiben:
 * - `PlaceRatingSource` mit `provider: GOOGLE`, `status: ACTIVE`, `ratingValue`, `ratingCount`,
 *   optional `externalRef` (= Google Place ID), `observedAt` (~ letzte bekannte Aktualisierung)
 * - Aggregat `displayRatingValue` / `displayRatingCount` / `ratingSummaryUpdatedAt` auf `Place`
 *
 * Spätere dedizierte Place-Felder (z. B. `googlePlaceId`) können hier optional ergänzt werden,
 * sobald das Schema sie liefert — aktuell: `externalRef` der GOOGLE-Rating-Zeile.
 */

export type GooglePlacesRatingSnapshot = {
  ratingValue: number;
  userRatingCount: number;
  lastSyncedAt: Date | null;
  /** Google Place ID, falls Ingest sie in `PlaceRatingSource.externalRef` ablegt. */
  googlePlaceId: string | null;
};

type DecimalLike = number | string | { toString(): string };

function toNumber(value: DecimalLike | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function normalizeObservedAt(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

type RatingSourceRow = {
  provider: string;
  status: string;
  ratingValue: DecimalLike | null | undefined;
  ratingCount: number;
  externalRef?: string | null;
  observedAt?: Date | string | null;
};

/**
 * Liefert die **aktive Google-Places-Bewertungszeile** aus `placeRatingSources`, sofern vorhanden.
 * Nur DB-Daten — keine Live-Abfrage bei Google.
 */

/** Genau eine aktive Quelle in der Anzeige-Attribution und diese ist Google. */
export function isAggregatedRatingFromGoogleOnly(
  summary: ResolvedPlaceRatingSummary | null,
): boolean {
  const sources = summary?.sources;
  if (!sources || sources.length !== 1) {
    return false;
  }
  return sources[0].provider === "GOOGLE";
}

export function getGooglePlacesRatingSnapshotFromPlace(place: {
  placeRatingSources?: RatingSourceRow[] | null;
}): GooglePlacesRatingSnapshot | null {
  const sources = place.placeRatingSources ?? [];
  const row = sources.find(
    (s) =>
      s.provider === "GOOGLE" &&
      s.status === "ACTIVE" &&
      s.ratingCount > 0,
  );
  if (!row) {
    return null;
  }
  const ratingValue = toNumber(row.ratingValue);
  if (ratingValue === null) {
    return null;
  }
  const id = row.externalRef?.trim();
  return {
    ratingValue,
    userRatingCount: row.ratingCount,
    lastSyncedAt: normalizeObservedAt(row.observedAt),
    googlePlaceId: id && id.length > 0 ? id : null,
  };
}
