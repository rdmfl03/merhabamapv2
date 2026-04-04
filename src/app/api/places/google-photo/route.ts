import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * @deprecated Nutze `/api/google-photo`. Permanente Weiterleitung für alte Aufrufer.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/api/google-photo";
  return NextResponse.redirect(url, 308);
}
