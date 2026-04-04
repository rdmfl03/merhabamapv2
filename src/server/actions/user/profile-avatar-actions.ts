"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { revalidatePath } from "next/cache";

import { isPublicObjectStorageConfigured, uploadPublicAvatarObject } from "@/lib/object-storage";
import {
  MAX_AVATAR_BYTES,
  avatarContentType,
  validateAvatarBuffer,
} from "@/lib/user-profile-avatar";
import { prisma } from "@/lib/prisma";

import { idleUserFormState, type UserFormState } from "./state";
import { requireAuthenticatedUser } from "./shared";

export async function uploadProfileAvatar(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const localeRaw = formData.get("locale");
  if (localeRaw !== "de" && localeRaw !== "tr") {
    return { status: "error", message: "validation_error" };
  }
  const locale = localeRaw;

  const user = await requireAuthenticatedUser(locale);
  const file = formData.get("avatar");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return { status: "error", message: "avatar_missing" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_AVATAR_BYTES) {
    return { status: "error", message: "avatar_too_large" };
  }

  const ext = validateAvatarBuffer(buf);
  if (!ext) {
    return { status: "error", message: "avatar_invalid" };
  }

  const safeId = user.id.replace(/[^a-z0-9]/gi, "");
  const fileName = `${safeId}-${Date.now()}.${ext}`;
  const objectKey = `avatars/${fileName}`;

  let publicPath: string;

  if (isPublicObjectStorageConfigured()) {
    try {
      publicPath = await uploadPublicAvatarObject(buf, objectKey, avatarContentType(ext));
    } catch {
      return { status: "error", message: "save_failed" };
    }
  } else {
    const dir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });

    const diskPath = join(dir, fileName);
    publicPath = `/uploads/avatars/${fileName}`;

    try {
      await writeFile(diskPath, buf);
    } catch {
      return { status: "error", message: "save_failed" };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { image: publicPath },
  });

  revalidatePath(`/${locale}/profile`);
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });
  if (u?.username?.trim()) {
    revalidatePath(`/${locale}/user/${encodeURIComponent(u.username.trim())}`);
  }

  return { status: "success", message: "avatar_updated" };
}

export async function clearProfileAvatar(
  _previousState: UserFormState = idleUserFormState,
  formData: FormData,
): Promise<UserFormState> {
  void _previousState;

  const localeRaw = formData.get("locale");
  if (localeRaw !== "de" && localeRaw !== "tr") {
    return { status: "error", message: "validation_error" };
  }
  const locale = localeRaw;

  const user = await requireAuthenticatedUser(locale);

  await prisma.user.update({
    where: { id: user.id },
    data: { image: null },
  });

  revalidatePath(`/${locale}/profile`);
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });
  if (u?.username?.trim()) {
    revalidatePath(`/${locale}/user/${encodeURIComponent(u.username.trim())}`);
  }

  return { status: "success", message: "avatar_cleared" };
}
