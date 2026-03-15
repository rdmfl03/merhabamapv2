import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessBusiness, canManageBusinessPlace } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function requireBusinessUser(locale: "de" | "tr") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/business`)}`);
  }

  if (!canAccessBusiness(session.user.role)) {
    redirect(`/${locale}`);
  }

  return session.user;
}

export async function requireOwnedPlaceAccess(args: {
  locale: "de" | "tr";
  placeId: string;
}) {
  const user = await requireBusinessUser(args.locale);
  const place = await prisma.place.findUnique({
    where: { id: args.placeId },
    select: {
      id: true,
      ownerUserId: true,
    },
  });

  if (!place) {
    redirect(`/${args.locale}/business`);
  }

  if (
    !canManageBusinessPlace({
      role: user.role,
      isOwner: place.ownerUserId === user.id,
    })
  ) {
    redirect(`/${args.locale}/business`);
  }

  return user;
}
