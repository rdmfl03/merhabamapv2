import { prisma } from "@/lib/prisma";

type SubmissionPayload = {
  description?: string;
  note?: string;
  addressLine1?: string;
  venueName?: string;
};

function parsePayload(payloadJson: string): SubmissionPayload {
  try {
    const parsed = JSON.parse(payloadJson);
    return parsed && typeof parsed === "object" ? (parsed as SubmissionPayload) : {};
  } catch {
    return {};
  }
}

export async function getLinkedSubmissionContext(
  targetEntityType: "PLACE" | "EVENT",
  targetEntityId: string,
) {
  const submission = await prisma.submission.findFirst({
    where: {
      targetEntityType,
      targetEntityId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      submissionType: true,
      status: true,
      submittedByUserId: true,
      sourceUrl: true,
      notes: true,
      payloadJson: true,
      createdAt: true,
    },
  });

  if (!submission) {
    return null;
  }

  const payload = parsePayload(submission.payloadJson);
  const compactPayloadSummary = [
    payload.venueName,
    payload.addressLine1,
    payload.description?.trim() ? payload.description.trim().slice(0, 140) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: submission.id,
    submissionType: submission.submissionType,
    status: submission.status,
    origin: submission.submittedByUserId ? "user_submission" : "system_submission",
    sourceUrl: submission.sourceUrl,
    notes: submission.notes ?? payload.note ?? null,
    compactPayloadSummary: compactPayloadSummary || null,
    createdAt: submission.createdAt,
    submissionsListPath: "/admin/ingest/submissions",
  };
}
