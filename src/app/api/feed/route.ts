import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getFeedActivities, type FeedMode } from "@/server/queries/social/get-feed-activities";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "tr" ? "tr" : "de";
  const mode: FeedMode = searchParams.get("mode") === "local" ? "local" : "default";

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const items = await getFeedActivities(viewerId, { locale, mode });
  return NextResponse.json(items);
}
