import { NextResponse } from "next/server";

import { getMapTilerApiKeyForRequest } from "@/lib/maptiler-server";

const MAPTILER_PASTEL =
  "https://api.maptiler.com/maps/pastel" as const;

function parseTileIndex(raw: string) {
  const cleaned = raw.replace(/\.png$/i, "");
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }
  const n = Number(cleaned);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const key = getMapTilerApiKeyForRequest();
  if (!key) {
    return new NextResponse("Map tiles not configured", { status: 503 });
  }

  const { z: zs, x: xs, y: ys } = await context.params;
  const z = parseTileIndex(zs);
  const x = parseTileIndex(xs);
  const y = parseTileIndex(ys);

  if (z === null || x === null || y === null || z > 22) {
    return new NextResponse("Invalid tile coordinates", { status: 400 });
  }

  const dim = 2 ** z;
  if (x >= dim || y >= dim) {
    return new NextResponse("Tile out of range", { status: 400 });
  }

  const upstream = `${MAPTILER_PASTEL}/${z}/${x}/${y}.png?key=${encodeURIComponent(key)}`;
  const upstreamRes = await fetch(upstream, {
    next: { revalidate: 86400 },
    headers: { Accept: "image/png,image/*" },
  });

  if (!upstreamRes.ok) {
    return new NextResponse("Upstream tile error", { status: upstreamRes.status });
  }

  const contentType = upstreamRes.headers.get("content-type") ?? "image/png";
  const body = upstreamRes.body;
  if (!body) {
    return new NextResponse("Empty tile", { status: 502 });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
