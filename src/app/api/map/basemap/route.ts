import { NextResponse } from "next/server";

import { isStadiaConfigured } from "@/lib/stadia-server";

export const dynamic = "force-dynamic";

/**
 * Liefert nur ein Boolean — kein API-Key.
 * Client aktiviert die gehostete Basemap nach Mount, damit Runtime-Secrets sauber greifen.
 */
export async function GET() {
  return NextResponse.json(
    { basemapEnabled: isStadiaConfigured() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
