"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ZodIssue } from "zod";

import { getOrderedPlaceCategoryVisualGroups } from "@/lib/place-category-onboarding-groups";
import { prisma } from "@/lib/prisma";
import { stringifyPreferredPlaceCategoryIds } from "@/lib/user-onboarding-categories";
import { onboardingPlaceCategoriesSchema } from "@/lib/validators/user";

import { idleUserFormState, type UserFormState } from "./state";
import { requireAuthenticatedUser } from "./shared";

function mapPlaceCategoriesZodMessage(issues: ZodIssue[]): string {
  const issue = issues[0];
  if (!issue) {
    return "validation_error";
  }

  const key = issue.path[0];

  if (key === "placeCategoryGroups") {
    if (issue.message === "place_categories_required") {
      return "place_categories_required";
    }
    if (issue.message === "place_categories_too_many") {
      return "place_categories_too_many";
    }
    return "place_categories_invalid";
  }

  if (key === "locale") {
    return "locale_invalid";
  }

  return "validation_error";
}

export async function saveOnboardingPlaceCategories(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const parsed = onboardingPlaceCategoriesSchema.safeParse({
    locale: formData.get("locale"),
    placeCategoryGroups: formData.getAll("placeCategoryGroups"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: mapPlaceCategoriesZodMessage(parsed.error.issues),
    };
  }

  const user = await requireAuthenticatedUser(parsed.data.locale);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      onboardingCityId: true,
    },
  });

  if (!dbUser?.username || !dbUser.onboardingCityId) {
    return { status: "error", message: "basics_incomplete" };
  }

  const groupSlugMap = new Map(
    getOrderedPlaceCategoryVisualGroups().map((g) => [g.key, g.slugs as string[]]),
  );
  const slugSet = new Set<string>();
  for (const groupKey of parsed.data.placeCategoryGroups) {
    const slugs = groupSlugMap.get(groupKey);
    if (!slugs?.length) {
      return { status: "error", message: "place_categories_invalid" };
    }
    for (const s of slugs) {
      slugSet.add(s);
    }
  }

  const uniqueSlugs = [...slugSet];
  const placeCategories = await prisma.placeCategory.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: { id: true, slug: true },
  });

  if (placeCategories.length !== uniqueSlugs.length) {
    return { status: "error", message: "place_categories_invalid" };
  }

  const placeCategoryIds = placeCategories.map((row) => row.id);

  if (placeCategoryIds.length > 32) {
    return { status: "error", message: "place_categories_too_many" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredPlaceCategoryIdsJson: stringifyPreferredPlaceCategoryIds(placeCategoryIds),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { status: "error", message: "save_failed" };
    }

    return { status: "error", message: "save_failed" };
  }

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/onboarding/places`);
  revalidatePath(`/${loc}/onboarding/events`);

  return {
    status: "success",
    message: "onboarding_places_saved",
    redirectTo: "/onboarding/events",
  };
}
