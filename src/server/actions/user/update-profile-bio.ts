"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { idleUserFormState, type UserFormState } from "./state";
import { requireAuthenticatedUser } from "./shared";

const bioSchema = z.preprocess(
  (val) => (val === undefined || val === null ? "" : String(val)),
  z
    .string()
    .max(280)
    .transform((s) => {
      const t = s.trim();
      return t.length === 0 ? null : t;
    }),
);

export async function updateProfileBio(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const localeRaw = formData.get("locale");
  if (localeRaw !== "de" && localeRaw !== "tr") {
    return { status: "error", message: "validation_error" };
  }
  const locale = localeRaw;

  const parsed = bioSchema.safeParse(formData.get("bio"));
  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const user = await requireAuthenticatedUser(locale);

  await prisma.user.update({
    where: { id: user.id },
    data: { profileBio: parsed.data },
  });

  revalidatePath(`/${locale}/profile`);
  const handleRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });
  const handle = handleRow?.username?.trim();
  if (handle) {
    revalidatePath(`/${locale}/user/${encodeURIComponent(handle)}`);
  }

  return { status: "success", message: "bio_updated" };
}
