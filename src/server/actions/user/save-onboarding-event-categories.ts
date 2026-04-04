"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ZodIssue } from "zod";

import { prisma } from "@/lib/prisma";
import {
  parsePreferredPlaceCategoryIds,
  stringifyPreferredEventCategories,
} from "@/lib/user-onboarding-categories";
import { stringifyUserInterests } from "@/lib/user-preferences";
import { onboardingEventCategoriesSchema } from "@/lib/validators/user";

import { idleUserFormState, type UserFormState } from "./state";
import { requireAuthenticatedUser } from "./shared";

function mapEventCategoriesZodMessage(issues: ZodIssue[]): string {
  const issue = issues[0];
  if (!issue) {
    return "validation_error";
  }

  const key = issue.path[0];

  if (key === "eventCategories") {
    if (issue.message === "event_categories_required") {
      return "event_categories_required";
    }
    if (issue.message === "event_categories_too_many") {
      return "event_categories_too_many";
    }
    return "event_categories_invalid";
  }

  if (key === "locale") {
    return "locale_invalid";
  }

  return "validation_error";
}

export async function saveOnboardingEventCategories(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const parsed = onboardingEventCategoriesSchema.safeParse({
    locale: formData.get("locale"),
    eventCategories: formData.getAll("eventCategories"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: mapEventCategoriesZodMessage(parsed.error.issues),
    };
  }

  const user = await requireAuthenticatedUser(parsed.data.locale);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      onboardingCityId: true,
      preferredPlaceCategoryIdsJson: true,
    },
  });

  if (!dbUser?.username || !dbUser.onboardingCityId) {
    return { status: "error", message: "basics_incomplete" };
  }

  const placeIds = parsePreferredPlaceCategoryIds(dbUser.preferredPlaceCategoryIdsJson);
  if (placeIds.length === 0) {
    return { status: "error", message: "places_step_incomplete" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredEventCategoriesJson: stringifyPreferredEventCategories(
          parsed.data.eventCategories,
        ),
        interestsJson: stringifyUserInterests([]),
        onboardingCompletedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { status: "error", message: "save_failed" };
    }

    return { status: "error", message: "save_failed" };
  }

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}`);
  revalidatePath(`/${loc}/profile`);
  revalidatePath(`/${loc}/home`);
  revalidatePath(`/${loc}/feed`);
  revalidatePath(`/${loc}/user/${dbUser.username}`);

  return {
    status: "success",
    message: "onboarding_completed",
    redirectTo: `/user/${dbUser.username}`,
  };
}
