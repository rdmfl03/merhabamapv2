import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { LOCALE_COOKIE_NAME } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const pathname = request.nextUrl.pathname;
  const maybeLocale = pathname.split("/")[1];

  if (maybeLocale === "de" || maybeLocale === "tr") {
    response.cookies.set(LOCALE_COOKIE_NAME, maybeLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|.*\\..*).*)"],
};
