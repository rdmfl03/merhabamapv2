import { NextRequest, NextResponse } from "next/server";

import { isGooglePlacesPhotoResourceName } from "@/lib/google-places-photo-resource";
import { prisma } from "@/lib/prisma";
import { publicPlaceVisibilityWhere } from "@/server/queries/places/shared";

export const dynamic = "force-dynamic";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

const DEFAULT_PLACE_FIRST_PHOTO_HEIGHT = 400;
const MAX_HEIGHT_CAP = 1000;

type GooglePlacePhotosPayload = {
  photos?: Array<{ name?: string }>;
};

function parseHeightPx(raw: string | null): { ok: true; value: number } | { ok: false } {
  if (raw == null || raw.trim() === "") {
    return { ok: true, value: DEFAULT_PLACE_FIRST_PHOTO_HEIGHT };
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_HEIGHT_CAP) {
    return { ok: false };
  }
  return { ok: true, value: n };
}

function isValidPlaceIdQuery(value: string): boolean {
  const t = value.trim();
  if (t.length < 4 || t.length > 512) {
    return false;
  }
  if (t.includes("..") || t.includes("\\")) {
    return false;
  }
  if (t.includes("/")) {
    return false;
  }
  return true;
}

function normalizeGooglePlaceId(input: string): { apiId: string; dbCandidates: string[] } {
  const t = input.trim();
  const bare = t.startsWith("places/") ? t.slice("places/".length).trim() : t;
  const dbCandidates = Array.from(new Set([t, bare].filter((s) => s.length > 0)));
  return { apiId: bare, dbCandidates };
}

async function isAuthorizedGooglePlaceId(dbCandidates: string[]): Promise<boolean> {
  const row = await prisma.placeRatingSource.findFirst({
    where: {
      provider: "GOOGLE",
      status: "ACTIVE",
      externalRef: { in: dbCandidates },
      place: publicPlaceVisibilityWhere,
    },
    select: { id: true },
  });
  return row != null;
}

async function fetchAndStreamGooglePhoto(
  mediaUrl: URL,
  apiKey: string,
): Promise<Response | NextResponse> {
  let imageRes: Response;
  try {
    imageRes = await fetch(mediaUrl.toString(), {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });
  } catch {
    return NextResponse.json({ error: "places_media_upstream_failed" }, { status: 500 });
  }

  if (imageRes.status === 404) {
    return NextResponse.json({ error: "no_photos" }, { status: 404 });
  }

  if (!imageRes.ok) {
    return NextResponse.json({ error: "places_media_failed" }, { status: 500 });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "places_media_invalid" }, { status: 500 });
  }

  if (imageRes.body == null) {
    return NextResponse.json({ error: "places_media_empty" }, { status: 500 });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(imageRes.body, {
    status: 200,
    headers,
  });
}

async function handlePhotoByPlaceId(
  request: NextRequest,
  placeIdRaw: string,
  apiKey: string,
): Promise<Response | NextResponse> {
  const { apiId, dbCandidates } = normalizeGooglePlaceId(placeIdRaw);
  if (!isValidPlaceIdQuery(apiId)) {
    return NextResponse.json({ error: "invalid_place_id" }, { status: 400 });
  }

  const maxH = parseHeightPx(
    request.nextUrl.searchParams.get("maxHeight") ??
      request.nextUrl.searchParams.get("maxHeightPx"),
  );
  if (!maxH.ok) {
    return NextResponse.json({ error: "invalid_max_height" }, { status: 400 });
  }

  const allowed = await isAuthorizedGooglePlaceId(dbCandidates);
  if (!allowed) {
    return NextResponse.json({ error: "place_not_found" }, { status: 404 });
  }

  const placeUrl = `${PLACES_API_BASE}/places/${encodeURIComponent(apiId)}`;
  let placeRes: Response;
  try {
    placeRes = await fetch(placeUrl, {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "photos",
      },
    });
  } catch {
    return NextResponse.json({ error: "places_upstream_failed" }, { status: 500 });
  }

  if (placeRes.status === 404) {
    return NextResponse.json({ error: "place_not_found" }, { status: 404 });
  }

  if (!placeRes.ok) {
    return NextResponse.json({ error: "places_metadata_failed" }, { status: 500 });
  }

  let payload: GooglePlacePhotosPayload;
  try {
    payload = (await placeRes.json()) as GooglePlacePhotosPayload;
  } catch {
    return NextResponse.json({ error: "places_metadata_invalid" }, { status: 500 });
  }

  const firstPhotoName = payload.photos?.[0]?.name?.trim();
  if (!firstPhotoName || !isGooglePlacesPhotoResourceName(firstPhotoName)) {
    return NextResponse.json({ error: "no_photos" }, { status: 404 });
  }

  const mediaUrl = new URL(`${PLACES_API_BASE}/${firstPhotoName}/media`);
  mediaUrl.searchParams.set("maxHeightPx", String(maxH.value));

  return fetchAndStreamGooglePhoto(mediaUrl, apiKey);
}

/**
 * Öffentliches Google-Place-Foto: **nur** `placeId` + Autorisierung über `place_rating_sources`.
 * Kein `photoName` / `mediaAssetId` — gleiches Verhalten für alle Places (keine Sonderlogik über `media_assets`).
 */
export async function GET(request: NextRequest) {
  const placeIdRaw = request.nextUrl.searchParams.get("placeId");
  if (placeIdRaw == null || !placeIdRaw.trim()) {
    return NextResponse.json({ error: "missing_place_id" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "google_places_not_configured" }, { status: 503 });
  }

  return handlePhotoByPlaceId(request, placeIdRaw, apiKey);
}
