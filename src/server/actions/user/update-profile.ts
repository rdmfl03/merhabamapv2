"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { LOCALE_COOKIE_NAME } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";
import { stringifyUserInterests } from "@/lib/user-preferences";
import { ensureCityFollowForOnboardingCity } from "@/server/cities/ensure-onboarding-city-follow";
import { profileUpdateSchema } from "@/lib/validators/user";

import { idleUserFormState, type UserFormState } from "./state";
import {
  requireAuthenticatedUser,
} from "./shared";

export async function updateProfile(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const parsed = profileUpdateSchema.safeParse({
    locale: formData.get("locale"),
    name: formData.get("name"),
    username: formData.get("username"),
    preferredLocale: formData.get("preferredLocale"),
    cityId: formData.get("cityId"),
    interests: formData.getAll("interests"),
    profileVisibility: formData.get("profileVisibility"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const user = await requireAuthenticatedUser(parsed.data.locale);

  if (parsed.data.username) {
    const existing = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        NOT: {
          id: user.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return { status: "error", message: "username_taken" };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      preferredLocale: parsed.data.preferredLocale,
      onboardingCityId: parsed.data.cityId,
      interestsJson: stringifyUserInterests(parsed.data.interests),
      profileVisibility: parsed.data.profileVisibility,
      profileBio: parsed.data.bio ?? null,
    },
  });

  await ensureCityFollowForOnboardingCity(user.id);

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, parsed.data.preferredLocale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/profile`);

  const handleRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });
  const handle = handleRow?.username?.trim();
  if (handle) {
    const userPath = encodeURIComponent(handle);
    revalidatePath(`/${loc}/user/${userPath}`);
    revalidatePath(`/${loc}/user/${userPath}/followers`);
    revalidatePath(`/${loc}/user/${userPath}/following`);
  }

  return { status: "success", message: "profile_updated" };
}
