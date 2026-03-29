import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDiscoveryMapPinsForCitySlug } from "@/server/queries/cities/get-public-city-page";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("city");
  const citySlug = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (!citySlug || !/^[a-z0-9-]+$/.test(citySlug)) {
    return NextResponse.json({ error: "Invalid city parameter" }, { status: 400 });
  }

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const data = await getDiscoveryMapPinsForCitySlug(citySlug, session?.user?.id);

  if (!data) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
