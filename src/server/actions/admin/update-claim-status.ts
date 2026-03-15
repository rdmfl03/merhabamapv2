"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { sendClaimReviewedEmail } from "@/lib/email/notifications";
import { prisma } from "@/lib/prisma";
import { updateClaimStatusSchema } from "@/lib/validators/admin";

import { idleAdminActionState, type AdminActionState } from "./state";
import {
  requireAdminAccess,
} from "./shared";

export async function updateClaimStatus(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  const parsed = updateClaimStatusSchema.safeParse({
    locale: formData.get("locale"),
    claimId: formData.get("claimId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);

  const claim = await prisma.businessClaim.findUnique({
    where: { id: parsed.data.claimId },
    select: {
      id: true,
      status: true,
      placeId: true,
      userId: true,
      claimantEmail: true,
      place: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!claim) {
    return { status: "error", message: "claim_not_found" };
  }

  const existingPlace = await prisma.place.findUnique({
    where: { id: claim.placeId },
    select: {
      ownerUserId: true,
      verificationStatus: true,
    },
  });

  if (!existingPlace) {
    return { status: "error", message: "claim_not_found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessClaim.update({
      where: { id: claim.id },
      data: {
        status: parsed.data.nextStatus,
        reviewedAt: new Date(),
        reviewedByUserId: actor.id,
      },
    });

    if (parsed.data.nextStatus === "APPROVED") {
      await tx.businessClaim.updateMany({
        where: {
          placeId: claim.placeId,
          id: { not: claim.id },
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedByUserId: actor.id,
        },
      });

      await tx.place.update({
        where: { id: claim.placeId },
        data: {
          ownerUserId: claim.userId,
          verificationStatus: "CLAIMED",
          verifiedAt: null,
          verifiedByUserId: null,
        },
      });

      await tx.user.update({
        where: { id: claim.userId },
        data: {
          role: "BUSINESS_OWNER",
        },
      });
    } else if (claim.status === "APPROVED" && existingPlace.ownerUserId === claim.userId) {
      await tx.place.update({
        where: { id: claim.placeId },
        data: {
          ownerUserId: null,
          verificationStatus:
            existingPlace.verificationStatus === "CLAIMED"
              ? "UNVERIFIED"
              : existingPlace.verificationStatus,
        },
      });
    }
  });

  await logAdminAction({
    actorUserId: actor.id,
    actionType: `CLAIM_${parsed.data.nextStatus}`,
    targetType: "BUSINESS_CLAIM",
    targetId: claim.id,
    summary: `Business claim status changed to ${parsed.data.nextStatus}`,
    metadata: {
      previousStatus: claim.status,
      nextStatus: parsed.data.nextStatus,
      placeId: claim.placeId,
      previousOwnerUserId: existingPlace.ownerUserId,
      nextOwnerUserId: parsed.data.nextStatus === "APPROVED" ? claim.userId : undefined,
      placeVerificationStatus:
        parsed.data.nextStatus === "APPROVED" ? "CLAIMED" : undefined,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/admin/claims`);
  revalidatePath(`/${parsed.data.locale}/admin/claims/${claim.id}`);
  revalidatePath(`/${parsed.data.locale}/business`);
  revalidatePath(`/${parsed.data.locale}/places`);

  await sendClaimReviewedEmail({
    to: claim.claimantEmail,
    placeName: claim.place.name,
    approved: parsed.data.nextStatus === "APPROVED",
  });

  return { status: "success", message: "claim_updated" };
}
