import { NextResponse } from "next/server";

import { env, getAppEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "merhabamap",
      env: getAppEnv(),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      demoAuthEnabled: env.AUTH_DEMO_CREDENTIALS_ENABLED,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
