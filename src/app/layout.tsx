import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";

import "@/app/globals.css";
import { MapBasemapProvider } from "@/components/maps/map-basemap-context";
import { appConfig } from "@/lib/app-config";
import { isStadiaConfigured } from "@/lib/stadia-server";

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
  /** Sprach-Attribut: Cookie/Middleware; Client-Übersetzungen kommen aus `app/[locale]/layout.tsx`. */
  const locale = await getLocale();
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
