import { NextResponse } from "next/server";

import { getDiscoveryMapPinsForCitySlug } from "@/server/queries/cities/get-public-city-page";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("city");
  const citySlug = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (!citySlug || !/^[a-z0-9-]+$/.test(citySlug)) {
    return NextResponse.json({ error: "Invalid city parameter" }, { status: 400 });
  }

  const data = await getDiscoveryMapPinsForCitySlug(citySlug);

  if (!data) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
