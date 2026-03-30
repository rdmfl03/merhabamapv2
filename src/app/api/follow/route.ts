import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { NotificationType } from "@prisma/client";

import { auth } from "@/auth";
import { getUserFollowCreateGuard } from "@/lib/rate-limit/social-action-guard";
import { prisma } from "@/lib/prisma";
import { revalidateNotificationSurfaces } from "@/server/queries/notifications/revalidate-notification-paths";

export const dynamic = "force-dynamic";

async function revalidateProfileAndFollowPathsForUser(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const un = u?.username?.trim();
  if (!un) {
    return;
  }
  for (const locale of ["de", "tr"] as const) {
    revalidatePath(`/${locale}/user/${un}`);
    revalidatePath(`/${locale}/user/${un}/followers`);
    revalidatePath(`/${locale}/user/${un}/following`);
  }
}

const bodySchema = z.object({
  followingUserId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const { followingUserId } = parsed.data;
  if (followingUserId === session.user.id) {
    return NextResponse.json({ error: "cannot_follow_self" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: followingUserId },
    select: { id: true, username: true },
  });

  if (!target?.username) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const alreadyFollowing = await prisma.follow.findUnique({
    where: {
      followerId_followingUserId: {
        followerId: session.user.id,
        followingUserId,
      },
    },
    select: { id: true },
  });

  if (!alreadyFollowing) {
    const followGuard = await getUserFollowCreateGuard(session.user.id);
    if (followGuard) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingUserId: {
        followerId: session.user.id,
        followingUserId,
      },
    },
    create: {
      followerId: session.user.id,
      followingUserId,
    },
    update: {},
  });

  if (!alreadyFollowing) {
    await prisma.notification.create({
      data: {
        userId: followingUserId,
        type: NotificationType.NEW_FOLLOWER,
        actorUserId: session.user.id,
      },
    });
    revalidateNotificationSurfaces();
  }

  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");
  await revalidateProfileAndFollowPathsForUser(session.user.id);
  await revalidateProfileAndFollowPathsForUser(followingUserId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("followingUserId");
  let followingUserId = fromQuery ?? "";

  if (!followingUserId) {
    try {
      const json = await request.json();
      const parsed = bodySchema.safeParse(json);
      if (parsed.success) {
        followingUserId = parsed.data.followingUserId;
      }
    } catch {
      /* empty body ok if query set */
    }
  }

  if (!followingUserId) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingUserId,
    },
  });

  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");
  await revalidateProfileAndFollowPathsForUser(session.user.id);
  await revalidateProfileAndFollowPathsForUser(followingUserId);

  return NextResponse.json({ ok: true });
}
