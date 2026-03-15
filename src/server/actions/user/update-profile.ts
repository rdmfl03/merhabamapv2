"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { stringifyUserInterests } from "@/lib/user-preferences";
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
    },
  });

  revalidatePath(`/${parsed.data.locale}/profile`);

  return { status: "success", message: "profile_updated" };
}
