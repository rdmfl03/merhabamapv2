"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { EntityContributionEntityType } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getContentSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import {
  buildSlugBase,
  buildUniqueSlug,
  getSafeHttpUrl,
  sanitizeSubmissionReturnPath,
} from "@/lib/submissions";
import { placeSuggestionSchema } from "@/lib/validators/submissions";

import { upsertCreatorEntityContribution } from "@/server/social/upsert-creator-entity-contribution";

import {
  idleSubmissionActionState,
  type SubmissionActionState,
} from "./state";

async function revalidatePublicProfilePaths(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const un = u?.username?.trim();
  if (!un) {
    return;
  }
  for (const loc of ["de", "tr"] as const) {
    revalidatePath(`/${loc}/user/${un}`);
  }
}

export async function submitPlaceSuggestion(
  _previousState: SubmissionActionState = idleSubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  void _previousState;

  const parsed = placeSuggestionSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    name: formData.get("name"),
    cityId: formData.get("cityId"),
    categoryId: formData.get("categoryId"),
    addressLine1: formData.get("addressLine1"),
    sourceUrl: formData.get("sourceUrl"),
    description: formData.get("description"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const session = await auth();
  const returnPath = sanitizeSubmissionReturnPath(
    parsed.data.locale,
    parsed.data.returnPath,
    `/${parsed.data.locale}/submit/place`,
  );

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const sourceUrl = getSafeHttpUrl(parsed.data.sourceUrl);
  const guard = await getContentSubmissionGuard({
    userId: session.user.id,
    submissionType: "PLACE_SUGGESTION",
    sourceUrl,
  });

  if (guard) {
    return {
      status: "error",
      message: guard,
    };
  }

  const [city, category] = await Promise.all([
    prisma.city.findFirst({
      where: {
        id: parsed.data.cityId,
        countryCode: "DE",
        slug: {
          in: ["berlin", "koeln"],
        },
      },
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.placeCategory.findUnique({
      where: {
        id: parsed.data.categoryId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!city) {
    return {
      status: "error",
      message: "city_not_allowed",
      fieldErrors: {
        cityId: ["city_not_allowed"],
      },
    };
  }

  if (!category) {
    return {
      status: "error",
      message: "category_not_allowed",
      fieldErrors: {
        categoryId: ["category_not_allowed"],
      },
    };
  }

  const slugBase = buildSlugBase(`${parsed.data.name}-${city.slug}`);
  const slug = await buildUniqueSlug(slugBase, async (candidate) => {
    const count = await prisma.place.count({
      where: {
        slug: candidate,
      },
    });

    return count > 0;
  });

  await prisma.$transaction(async (tx) => {
    const place = await tx.place.create({
      data: {
        slug,
        name: parsed.data.name,
        descriptionDe: parsed.data.description,
        descriptionTr: parsed.data.description,
        categoryId: category.id,
        cityId: city.id,
        addressLine1: parsed.data.addressLine1,
        websiteUrl: sourceUrl,
        moderationStatus: "PENDING",
        isPublished: false,
      },
      select: {
        id: true,
      },
    });

    await upsertCreatorEntityContribution(tx, {
      userId: session.user.id,
      entityType: EntityContributionEntityType.PLACE,
      entityId: place.id,
    });

    await tx.submission.create({
      data: {
        id: crypto.randomUUID(),
        submissionType: "PLACE_SUGGESTION",
        targetEntityType: "PLACE",
        targetEntityId: place.id,
        submittedByUserId: session.user.id,
        payloadJson: JSON.stringify({
          kind: "place",
          name: parsed.data.name,
          cityId: city.id,
          categoryId: category.id,
          addressLine1: parsed.data.addressLine1,
          sourceUrl,
          description: parsed.data.description,
          note: parsed.data.note,
        }),
        sourceUrl,
        notes: parsed.data.note,
        status: "PENDING",
      },
    });
  });

  revalidatePath(`/${parsed.data.locale}/admin/ingest/submissions`);
  await revalidatePublicProfilePaths(session.user.id);

  return {
    status: "success",
    submitted: {
      label: parsed.data.name,
      citySlug: city.slug,
    },
  };
}
