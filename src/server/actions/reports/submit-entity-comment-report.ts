"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendReportReceivedEmail } from "@/lib/email/notifications";
import { entityCommentReportSchema } from "@/lib/validators/social-content-report";
import { prisma } from "@/lib/prisma";
import { getReportSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import { getReportableEntityComment } from "@/server/queries/comments/get-reportable-entity-comment";

import {
  idleSocialReportActionState,
  type SocialReportActionState,
} from "./social-report-state";

function sanitizeCommentReportReturnPath(locale: "de" | "tr", value: string) {
  return value.startsWith(`/${locale}/`) ? value : `/${locale}/places`;
}

export async function submitEntityCommentReport(
  _previousState: SocialReportActionState = idleSocialReportActionState,
  formData: FormData,
): Promise<SocialReportActionState> {
  void _previousState;

  const parsed = entityCommentReportSchema.safeParse({
    locale: formData.get("locale"),
    commentId: formData.get("commentId"),
    returnPath: formData.get("returnPath"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeCommentReportReturnPath(locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const comment = await getReportableEntityComment(parsed.data.commentId);
  if (!comment) {
    return { status: "error", message: "comment_not_found" };
  }

  const reportGuard = await getReportSubmissionGuard({
    userId: session.user.id,
    targetType: "ENTITY_COMMENT",
    entityCommentId: comment.id,
  });

  if (reportGuard) {
    return { status: "error", message: reportGuard };
  }

  await prisma.report.create({
    data: {
      userId: session.user.id,
      targetType: "ENTITY_COMMENT",
      entityCommentId: comment.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  const preview =
    comment.content.length > 90 ? `${comment.content.slice(0, 90)}…` : comment.content;

  if (session.user.email) {
    await sendReportReceivedEmail({
      to: session.user.email,
      locale,
      targetLabel: `Kommentar: ${preview}`,
    });
  }

  revalidatePath(returnPath);
  revalidatePath(`/${locale}/admin/reports`);

  return { status: "success", message: "report_submitted" };
}
