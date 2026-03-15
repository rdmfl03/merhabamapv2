import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
