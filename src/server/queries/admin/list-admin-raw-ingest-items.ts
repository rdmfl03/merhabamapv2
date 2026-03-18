import {
  buildAllowlistBlockedHandling,
  evaluateRawIngestAllowlist,
} from "@/config/ingest-allowlist";
import { prisma } from "@/lib/prisma";

export async function listAdminRawIngestItems() {
  const items = await prisma.rawIngestItem.findMany({
    where: {
      status: {
        in: ["FAILED", "PENDING"],
      },
    },
    orderBy: [
      { status: "asc" },
      { ingestedAt: "desc" },
    ],
    take: 100,
    select: {
      id: true,
      sourceId: true,
      entityGuess: true,
      sourceUrl: true,
      externalId: true,
      rawTitle: true,
      rawDatetimeText: true,
      rawLocationText: true,
      languageHint: true,
      cityGuess: true,
      processedAt: true,
      ingestedAt: true,
      errorMessage: true,
      status: true,
      source: {
        select: {
          name: true,
          url: true,
          sourceKind: true,
        },
      },
    },
  });

  return items.map((item) => {
    const allowlistDecision = evaluateRawIngestAllowlist({
      entityGuess: item.entityGuess,
      cityGuess: item.cityGuess,
      rawTitle: item.rawTitle,
      sourceType: item.source?.sourceKind,
      sourceUrl: item.sourceUrl ?? item.source?.url,
    });
    const blockedHandling = buildAllowlistBlockedHandling(allowlistDecision);

    return {
      ...item,
      allowlistBlocked: !allowlistDecision.allowed,
      allowlistReasonCode: allowlistDecision.allowed ? null : allowlistDecision.reasonCode,
      effectiveStatus: blockedHandling ? "BLOCKED_BY_ALLOWLIST" : item.status,
      effectiveErrorMessage: blockedHandling ? blockedHandling.errorMessage : item.errorMessage,
    };
  });
}
