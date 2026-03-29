import { NextResponse } from "next/server";

import { isMapTilerConfigured } from "@/lib/maptiler-server";

export const dynamic = "force-dynamic";

/**
 * Liefert nur ein Boolean — kein API-Key. Client setzt Pastel-Basemap nach Mount,
 * damit Netlify-Runtime-Secrets zuverlässig greifen (ohne Build-Zeit-Freeze im Layout).
 */
export async function GET() {
  return NextResponse.json(
    { pastelEnabled: isMapTilerConfigured() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
