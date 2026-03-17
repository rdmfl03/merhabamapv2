"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendReportReceivedEmail } from "@/lib/email/notifications";
import { prisma } from "@/lib/prisma";
import { getReportSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import { placeReportSchema } from "@/lib/validators/places";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

import {
  idlePlaceActionState,
  sanitizeReturnPath,
  type PlaceActionState,
} from "./shared";

export async function submitPlaceReport(
  _previousState: PlaceActionState = idlePlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  void _previousState;

  const parsed = placeReportSchema.safeParse({
    locale: formData.get("locale"),
    placeId: formData.get("placeId"),
    returnPath: formData.get("returnPath"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "validation_error",
    };
  }

  const session = await auth();
  const returnPath = sanitizeReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(
      `/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`,
    );
  }

  const place = await prisma.place.findFirst({
    where: buildPublicPlaceWhere({
      id: parsed.data.placeId,
    }),
    select: {
      id: true,
      name: true,
    },
  });

  if (!place) {
    return {
      status: "error",
      message: "place_not_found",
    };
  }

  const reportGuard = await getReportSubmissionGuard({
    userId: session.user.id,
    targetType: "PLACE",
    placeId: place.id,
  });

  if (reportGuard) {
    return {
      status: "error",
      message: reportGuard,
    };
  }

  await prisma.report.create({
    data: {
      userId: session.user.id,
      targetType: "PLACE",
      placeId: place.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  if (session.user.email) {
    await sendReportReceivedEmail({
      to: session.user.email,
      targetLabel: place.name,
    });
  }

  revalidatePath(returnPath);

  return {
    status: "success",
    message: "report_submitted",
  };
}
