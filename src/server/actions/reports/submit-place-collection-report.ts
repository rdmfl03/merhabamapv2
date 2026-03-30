"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendReportReceivedEmail } from "@/lib/email/notifications";
import { placeCollectionReportSchema } from "@/lib/validators/social-content-report";
import { prisma } from "@/lib/prisma";
import { getReportSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import { getReportablePublicPlaceCollection } from "@/server/queries/collections/get-reportable-public-place-collection";

import {
  idleSocialReportActionState,
  type SocialReportActionState,
} from "./social-report-state";

function sanitizeCollectionReportReturnPath(locale: "de" | "tr", value: string) {
  return value.startsWith(`/${locale}/`) ? value : `/${locale}/collections`;
}

export async function submitPlaceCollectionReport(
  _previousState: SocialReportActionState = idleSocialReportActionState,
  formData: FormData,
): Promise<SocialReportActionState> {
  void _previousState;

  const parsed = placeCollectionReportSchema.safeParse({
    locale: formData.get("locale"),
    collectionId: formData.get("collectionId"),
    returnPath: formData.get("returnPath"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const locale = parsed.data.locale;
  const returnPath = sanitizeCollectionReportReturnPath(locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const collection = await getReportablePublicPlaceCollection(parsed.data.collectionId);
  if (!collection) {
    return { status: "error", message: "collection_not_found" };
  }

  const reportGuard = await getReportSubmissionGuard({
    userId: session.user.id,
    targetType: "PLACE_COLLECTION",
    placeCollectionId: collection.id,
  });

  if (reportGuard) {
    return { status: "error", message: reportGuard };
  }

  await prisma.report.create({
    data: {
      userId: session.user.id,
      targetType: "PLACE_COLLECTION",
      placeCollectionId: collection.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  if (session.user.email) {
    await sendReportReceivedEmail({
      to: session.user.email,
      targetLabel: `Liste: ${collection.title}`,
    });
  }

  revalidatePath(returnPath);
  revalidatePath(`/${locale}/admin/reports`);

  return { status: "success", message: "report_submitted" };
}
