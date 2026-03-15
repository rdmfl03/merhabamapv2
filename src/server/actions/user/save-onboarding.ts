"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { stringifyUserInterests } from "@/lib/user-preferences";
import { onboardingSchema } from "@/lib/validators/user";

import { idleUserFormState, type UserFormState } from "./state";
import {
  requireAuthenticatedUser,
} from "./shared";

export async function saveOnboarding(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const parsed = onboardingSchema.safeParse({
    locale: formData.get("locale"),
    preferredLocale: formData.get("preferredLocale"),
    cityId: formData.get("cityId"),
    interests: formData.getAll("interests"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const user = await requireAuthenticatedUser(parsed.data.locale);
  const city = await prisma.city.findUnique({
    where: { id: parsed.data.cityId },
    select: { slug: true },
  });

  if (!city) {
    return { status: "error", message: "validation_error" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      preferredLocale: parsed.data.preferredLocale,
      onboardingCityId: parsed.data.cityId,
      interestsJson: stringifyUserInterests(parsed.data.interests),
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath(`/${parsed.data.locale}`);
  revalidatePath(`/${parsed.data.locale}/profile`);

  redirect(`/${parsed.data.preferredLocale}/places?city=${city.slug}`);
}
