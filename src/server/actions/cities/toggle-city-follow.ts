"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { getCityFollowToggleGuard } from "@/lib/rate-limit/social-action-guard";
import { prisma } from "@/lib/prisma";
import { sanitizeReturnPath } from "@/server/actions/places/shared";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";
import {
  recordCityFollowedActivity,
  removeCityFollowedActivity,
} from "@/server/social/city-follow-activity";

import type { CityFollowActionState } from "./city-follow-action-state";

const schema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  cityId: z.string().min(1),
});

function revalidateCityFollowSurfaces(locale: "de" | "tr", citySlug: string | null) {
  revalidatePath(`/${locale}/feed`);
  if (citySlug) {
    revalidatePath(`/${locale}/map?city=${citySlug}`);
    revalidatePath(`/${locale}/cities/${citySlug}`);
  }
  revalidatePath(`/${locale}/map`);
  revalidatePath(`/${locale}/profile`);
}

export async function toggleCityFollow(
  _prev: CityFollowActionState,
  formData: FormData,
): Promise<CityFollowActionState> {
  const parsed = schema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    cityId: formData.get("cityId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeReturnPath(locale, parsed.data.returnPath);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const city = await prisma.city.findUnique({
    where: { id: parsed.data.cityId },
    select: { id: true, slug: true },
  });
  if (!city) {
    return { status: "error", message: "city_not_found" };
  }

  const userId = session.user.id;
  const existing = await prisma.cityFollow.findUnique({
    where: {
      userId_cityId: {
        userId,
        cityId: city.id,
      },
    },
    select: { id: true },
  });

  let cityFollowed = false;
  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.cityFollow.delete({ where: { id: existing.id } });
      await removeCityFollowedActivity(userId, city.id, tx);
    });
    cityFollowed = false;
  } else {
    const cityGuard = await getCityFollowToggleGuard(userId);
    if (cityGuard) {
      return { status: "error", message: cityGuard };
    }
    await prisma.$transaction(async (tx) => {
      await tx.cityFollow.create({
        data: { userId, cityId: city.id },
      });
      await recordCityFollowedActivity(userId, city.id, tx);
    });
    cityFollowed = true;
  }

  await trackProductInsight({
    name: "city_follow_click",
    payload: {
      locale,
      authenticated: true,
      entityType: "city",
      citySlug: city.slug,
      cityFollowed,
    },
  });

  revalidateCityFollowSurfaces(locale, city.slug);

  const profileUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const un = profileUser?.username?.trim();
  if (un) {
    revalidatePath(`/${locale}/user/${un}`);
  }

  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");

  return { status: "success" };
}
