import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

declare global {
  var __prisma__: PrismaClient | undefined;
}

/**
 * When `DATABASE_URL` has no `connection_limit`, Prisma uses a large default pool.
 * That can exhaust small managed Postgres tiers (e.g. DigitalOcean) when several
 * local `next dev` / build workers run against the same DB — surfacing as HTTP 500.
 * Hosts can still set `connection_limit` (or a pooler URL) explicitly in `DATABASE_URL`.
 */
const DEFAULT_CONNECTION_LIMIT = 5;

function prismaDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("connection_limit")) {
      return url;
    }
    parsed.searchParams.set("connection_limit", String(DEFAULT_CONNECTION_LIMIT));
    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    datasources: {
      db: {
        url: prismaDatabaseUrl(env.DATABASE_URL),
      },
    },
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

/** Reuse one client per Node process (dev/build/runtime) to avoid extra DB clients. */
globalThis.__prisma__ = prisma;
