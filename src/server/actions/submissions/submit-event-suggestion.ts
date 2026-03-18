"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { EventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getContentSubmissionGuard } from "@/lib/rate-limit/submission-guard";
import {
  buildSlugBase,
  buildUniqueSlug,
  getSafeHttpUrl,
  parseBerlinLocalDateTime,
  sanitizeSubmissionReturnPath,
} from "@/lib/submissions";
import { eventSuggestionSchema } from "@/lib/validators/submissions";

import {
  idleSubmissionActionState,
  type SubmissionActionState,
} from "./state";

export async function submitEventSuggestion(
  _previousState: SubmissionActionState = idleSubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  void _previousState;

  const parsed = eventSuggestionSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    title: formData.get("title"),
    cityId: formData.get("cityId"),
    category: formData.get("category"),
    date: formData.get("date"),
    time: formData.get("time"),
    venueName: formData.get("venueName"),
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
    `/${parsed.data.locale}/submit/event`,
  );

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const sourceUrl = getSafeHttpUrl(parsed.data.sourceUrl);
  const guard = await getContentSubmissionGuard({
    userId: session.user.id,
    submissionType: "EVENT_SUGGESTION",
    sourceUrl,
  });

  if (guard) {
    return {
      status: "error",
      message: guard,
    };
  }

  const city = await prisma.city.findFirst({
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
  });

  if (!city) {
    return {
      status: "error",
      message: "city_not_allowed",
      fieldErrors: {
        cityId: ["city_not_allowed"],
      },
    };
  }

  const startsAt = parseBerlinLocalDateTime(parsed.data.date, parsed.data.time);
  if (!startsAt) {
    return {
      status: "error",
      message: "date_invalid",
      fieldErrors: {
        date: ["date_invalid"],
      },
    };
  }

  const existingEvent = await prisma.event.findFirst({
    where: {
      title: parsed.data.title,
      cityId: city.id,
      startsAt,
    },
    select: {
      id: true,
    },
  });

  if (existingEvent) {
    return {
      status: "error",
      message: "duplicate_submission",
    };
  }

  const slugBase = buildSlugBase(`${parsed.data.title}-${city.slug}`);
  const slug = await buildUniqueSlug(slugBase, async (candidate) => {
    const count = await prisma.event.count({
      where: {
        slug: candidate,
      },
    });

    return count > 0;
  });

  await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        slug,
        title: parsed.data.title,
        descriptionDe: parsed.data.description,
        descriptionTr: parsed.data.description,
        category: parsed.data.category as EventCategory,
        cityId: city.id,
        venueName: parsed.data.venueName,
        addressLine1: parsed.data.addressLine1,
        startsAt,
        externalUrl: sourceUrl,
        moderationStatus: "PENDING",
        isPublished: false,
      },
      select: {
        id: true,
      },
    });

    await tx.submission.create({
      data: {
        id: crypto.randomUUID(),
        submissionType: "EVENT_SUGGESTION",
        targetEntityType: "EVENT",
        targetEntityId: event.id,
        submittedByUserId: session.user.id,
        payloadJson: JSON.stringify({
          kind: "event",
          title: parsed.data.title,
          cityId: city.id,
          category: parsed.data.category,
          date: parsed.data.date,
          time: parsed.data.time,
          venueName: parsed.data.venueName,
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

  return {
    status: "success",
    submitted: {
      label: parsed.data.title,
      citySlug: city.slug,
    },
  };
}
