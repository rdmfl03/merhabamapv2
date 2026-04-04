import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "@/app/globals.css";
import { MapBasemapProvider } from "@/components/maps/map-basemap-context";
import { isAppLocale, routing } from "@/i18n/routing";
import { appConfig } from "@/lib/app-config";
import { isStadiaConfigured } from "@/lib/stadia-server";

/** Set by next-intl middleware on locale-prefixed routes (see next-intl `HEADER_LOCALE_NAME`). */
const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

function getMetadataBase() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  metadataBase: getMetadataBase(),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/logo-pin.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logo-pin.png", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * Do not call `getLocale()` here: it runs before `app/[locale]/layout.tsx` can `setRequestLocale`,
   * so `next-intl` caches `de` for the whole request and `/tr/...` stays German.
   * Use the middleware-injected header for `<html lang>` only.
   */
  const headerLocale = (await headers()).get(NEXT_INTL_LOCALE_HEADER);
  const locale =
    headerLocale && isAppLocale(headerLocale) ? headerLocale : routing.defaultLocale;
  const hostedBasemapAvailable = isStadiaConfigured();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <MapBasemapProvider initialHostedBasemapEnabled={hostedBasemapAvailable}>
          {children}
        </MapBasemapProvider>
      </body>
    </html>
  );
}
