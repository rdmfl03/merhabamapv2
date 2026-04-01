"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendClaimSubmittedEmail } from "@/lib/email/notifications";
import { prisma } from "@/lib/prisma";
import { getClaimSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import { placeClaimSchema } from "@/lib/validators/places";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

import {
  idlePlaceActionState,
  sanitizeReturnPath,
  type PlaceActionState,
} from "./shared";

export async function submitPlaceClaim(
  _previousState: PlaceActionState = idlePlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  void _previousState;

  const parsed = placeClaimSchema.safeParse({
    locale: formData.get("locale"),
    placeId: formData.get("placeId"),
    returnPath: formData.get("returnPath"),
    claimantName: formData.get("claimantName"),
    claimantEmail: formData.get("claimantEmail"),
    claimantPhone: formData.get("claimantPhone"),
    message: formData.get("message"),
    evidenceNotes: formData.get("evidenceNotes"),
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
      slug: true,
      name: true,
    },
  });

  if (!place) {
    return {
      status: "error",
      message: "place_not_found",
    };
  }

  const existingPendingClaim = await prisma.businessClaim.findFirst({
    where: {
      userId: session.user.id,
      placeId: place.id,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (existingPendingClaim) {
    return {
      status: "error",
      message: "claim_exists",
    };
  }

  const claimGuard = await getClaimSubmissionGuard({
    userId: session.user.id,
    placeId: place.id,
  });

  if (claimGuard) {
    return {
      status: "error",
      message: claimGuard,
    };
  }

  await prisma.businessClaim.create({
    data: {
      userId: session.user.id,
      placeId: place.id,
      claimantName: parsed.data.claimantName,
      claimantEmail: parsed.data.claimantEmail,
      claimantPhone: parsed.data.claimantPhone,
      message: parsed.data.message,
      evidenceNotes: parsed.data.evidenceNotes,
    },
  });

  await sendClaimSubmittedEmail({
    to: parsed.data.claimantEmail,
    locale: parsed.data.locale,
    placeName: place.name,
  });

  revalidatePath(returnPath);
  revalidatePath(`/${parsed.data.locale}/places/${place.slug}`);

  return {
    status: "success",
    message: "claim_submitted",
  };
}
