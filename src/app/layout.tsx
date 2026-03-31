import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";

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
  /** Sprach-Attribut: Cookie/Middleware; Client-Übersetzungen kommen aus `app/[locale]/layout.tsx`. */
  const locale = await getLocale();
  const mapTilerPastelAvailable = isMapTilerConfigured();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <MapBasemapProvider initialPastelEnabled={mapTilerPastelAvailable}>
          {children}
        </MapBasemapProvider>
      </body>
    </html>
  );
}
