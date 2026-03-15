import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { handleServerError } from "@/lib/errors/handle-server-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (env.READINESS_ENABLE_DB_CHECK) {
      await prisma.$queryRaw`SELECT 1`;
    }

    return NextResponse.json(
      {
        status: "ready",
        checks: {
          database: env.READINESS_ENABLE_DB_CHECK ? "ok" : "skipped",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    handleServerError(error, "readiness_check_failed");

    return NextResponse.json(
      {
        status: "not_ready",
        checks: {
          database: "failed",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
