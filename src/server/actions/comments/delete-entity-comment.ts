"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { deleteEntityCommentSchema } from "@/lib/validators/comments";
import { prisma } from "@/lib/prisma";

import { sanitizeReturnPath } from "../places/shared";

import {
  idleEntityCommentActionState,
  type EntityCommentActionState,
} from "./entity-comment-state";

export async function deleteEntityComment(
  _previousState: EntityCommentActionState = idleEntityCommentActionState,
  formData: FormData,
): Promise<EntityCommentActionState> {
  void _previousState;

  const parsed = deleteEntityCommentSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    commentId: formData.get("commentId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const returnPath = sanitizeReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const comment = await prisma.entityComment.findFirst({
    where: {
      id: parsed.data.commentId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!comment) {
    return { status: "error", message: "not_found" };
  }

  await prisma.entityComment.update({
    where: { id: comment.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(returnPath);
  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  const un = viewer?.username?.trim();
  if (un) {
    revalidatePath(`/${parsed.data.locale}/user/${un}`);
  }

  return { status: "success" };
}
