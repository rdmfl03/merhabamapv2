import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import "@/app/globals.css";
import { MapBasemapProvider } from "@/components/maps/map-basemap-context";
import { appConfig } from "@/lib/app-config";
import { isMapTilerConfigured } from "@/lib/maptiler-server";

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
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const mapTilerPastelAvailable = isMapTilerConfigured();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <MapBasemapProvider initialPastelEnabled={mapTilerPastelAvailable}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </MapBasemapProvider>
      </body>
    </html>
  );
}
