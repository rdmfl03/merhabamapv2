import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/legal/imprint",
        destination: "/de/impressum",
        permanent: true,
      },
      {
        source: "/legal/privacy",
        destination: "/de/privacy",
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/icon.svg",
        permanent: false,
      },
      {
        source: "/apple-touch-icon.png",
        destination: "/icon.svg",
        permanent: false,
      },
      {
        source: "/apple-touch-icon-precomposed.png",
        destination: "/icon.svg",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // HSTS is applied by Netlify/CDN; a second header from Next caused duplicate warnings.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
