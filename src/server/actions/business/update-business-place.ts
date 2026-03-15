"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { prisma } from "@/lib/prisma";
import { businessPlaceUpdateSchema } from "@/lib/validators/business";

import {
  idleBusinessActionState,
  type BusinessActionState,
} from "./state";
import {
  requireOwnedPlaceAccess,
} from "./shared";

export async function updateBusinessPlace(
  _previousState: BusinessActionState = idleBusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  void _previousState;

  try {
    const parsed = businessPlaceUpdateSchema.safeParse({
      locale: formData.get("locale"),
      placeId: formData.get("placeId"),
      phone: formData.get("phone"),
      websiteUrl: formData.get("websiteUrl"),
      descriptionDe: formData.get("descriptionDe"),
      descriptionTr: formData.get("descriptionTr"),
      openingHoursJson: formData.get("openingHoursJson"),
    });

    if (!parsed.success) {
      return { status: "error", message: "validation_error" };
    }

    const user = await requireOwnedPlaceAccess({
      locale: parsed.data.locale,
      placeId: parsed.data.placeId,
    });

    await prisma.place.update({
      where: { id: parsed.data.placeId },
      data: {
        phone: parsed.data.phone,
        websiteUrl: parsed.data.websiteUrl,
        descriptionDe: parsed.data.descriptionDe,
        descriptionTr: parsed.data.descriptionTr,
        openingHoursJson: parsed.data.openingHoursJson
          ? JSON.stringify(parsed.data.openingHoursJson)
          : null,
        lastBusinessUpdateAt: new Date(),
      },
    });

    await logAdminAction({
      actorUserId: user.id,
      actionType: "BUSINESS_PLACE_UPDATED",
      targetType: "PLACE",
      targetId: parsed.data.placeId,
      summary: "Business owner updated place profile fields",
      metadata: {
        updatedByRole: user.role,
        fields: [
          "phone",
          "websiteUrl",
          "descriptionDe",
          "descriptionTr",
          "openingHoursJson",
        ],
      },
    });

    revalidatePath(`/${parsed.data.locale}/business`);
    revalidatePath(`/${parsed.data.locale}/business/places/${parsed.data.placeId}`);
    revalidatePath(`/${parsed.data.locale}/places`);

    return { status: "success", message: "updated" };
  } catch {
    return { status: "error", message: "validation_error" };
  }
}
