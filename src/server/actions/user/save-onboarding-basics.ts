"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ZodIssue } from "zod";

import { LOCALE_COOKIE_NAME } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";
import { ensureCityFollowForOnboardingCity } from "@/server/cities/ensure-onboarding-city-follow";
import { onboardingBasicsSchema } from "@/lib/validators/user";

import { idleUserFormState, type UserFormState } from "./state";
import { requireAuthenticatedUser } from "./shared";

function mapBasicsZodMessage(issues: ZodIssue[]): string {
  const issue = issues[0];
  if (!issue) {
    return "validation_error";
  }

  const key = issue.path[0];

  if (key === "username" && issue.message === "username_invalid") {
    return "username_invalid";
  }

  if (key === "username") {
    return "username_invalid";
  }

  if (key === "cityId") {
    return "city_invalid";
  }

  if (key === "locale" || key === "preferredLocale") {
    return "locale_invalid";
  }

  return "validation_error";
}

export async function saveOnboardingBasics(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const parsed = onboardingBasicsSchema.safeParse({
    locale: formData.get("locale"),
    preferredLocale: formData.get("preferredLocale"),
    username: formData.get("username"),
    cityId: formData.get("cityId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: mapBasicsZodMessage(parsed.error.issues),
    };
  }

  const user = await requireAuthenticatedUser(parsed.data.locale);

  const taken = await prisma.user.findFirst({
    where: {
      username: { equals: parsed.data.username, mode: "insensitive" },
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (taken) {
    return { status: "error", message: "username_taken" };
  }

  const city = await prisma.city.findUnique({
    where: { id: parsed.data.cityId },
    select: { id: true },
  });

  if (!city) {
    return { status: "error", message: "city_not_found" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: parsed.data.username,
        preferredLocale: parsed.data.preferredLocale,
        onboardingCityId: parsed.data.cityId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "error", message: "username_taken" };
    }

    return { status: "error", message: "save_failed" };
  }

  await ensureCityFollowForOnboardingCity(user.id);

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, parsed.data.preferredLocale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  const loc = parsed.data.preferredLocale;
  revalidatePath(`/${loc}`);
  revalidatePath(`/${loc}/onboarding`);
  revalidatePath(`/${loc}/onboarding/places`);
  revalidatePath(`/${loc}/onboarding/events`);
  revalidatePath(`/${loc}/onboarding/interests`);

  return {
    status: "success",
    message: "onboarding_basics_saved",
    redirectTo: "/onboarding/places",
  };
}
