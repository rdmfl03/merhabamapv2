import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { listFollowingForUser } from "@/server/queries/social/list-following-for-user";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const rows = await listFollowingForUser(userId);
  const users = rows.map((u) => ({ id: u.id, username: u.username as string }));

  return NextResponse.json({ users });
}
