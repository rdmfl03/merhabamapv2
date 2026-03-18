import {
  buildAllowlistBlockedHandling,
  evaluateRawIngestAllowlist,
  getAllowlistFailureGroup,
} from "@/config/ingest-allowlist";
import { prisma } from "@/lib/prisma";

export async function getAdminSourceById(id: string) {
  const source = await prisma.source.findUnique({
    where: { id },
    select: {
      id: true,
      sourceKind: true,
      name: true,
      url: true,
      accountHandle: true,
      externalId: true,
      isPublic: true,
      isActive: true,
      trustScore: true,
      discoveryMethod: true,
      lastCheckedAt: true,
      createdAt: true,
      updatedAt: true,
      ingestRuns: {
        orderBy: [{ startedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          pipelineName: true,
          triggerType: true,
          status: true,
          itemsFound: true,
          itemsCreated: true,
          itemsUpdated: true,
          itemsFailed: true,
          startedAt: true,
          finishedAt: true,
        },
      },
      rawIngestItems: {
        where: {
          status: {
            in: ["FAILED", "PENDING"],
          },
        },
        orderBy: [{ ingestedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          status: true,
          entityGuess: true,
          rawTitle: true,
          rawDatetimeText: true,
          rawLocationText: true,
          languageHint: true,
          cityGuess: true,
          sourceUrl: true,
          externalId: true,
          errorMessage: true,
          ingestedAt: true,
          processedAt: true,
        },
      },
    },
  });

  if (!source) {
    return null;
  }

  return {
    ...source,
    rawIngestItems: source.rawIngestItems.map((item) => {
      const allowlistDecision = evaluateRawIngestAllowlist({
        entityGuess: item.entityGuess,
        cityGuess: item.cityGuess,
        rawTitle: item.rawTitle,
        sourceType: source.sourceKind,
        sourceUrl: item.sourceUrl ?? source.url,
        sourceAccountHandle: source.accountHandle,
        sourceExternalId: item.externalId ?? source.externalId,
      });
      const blockedHandling = buildAllowlistBlockedHandling(allowlistDecision);

      return {
        ...item,
        allowlistBlocked: !allowlistDecision.allowed,
        allowlistReasonCode: allowlistDecision.allowed ? null : allowlistDecision.reasonCode,
        allowlistEvaluation: {
          allowed: allowlistDecision.allowed,
          reasonCode: allowlistDecision.reasonCode,
          failureGroup:
            allowlistDecision.allowed || !allowlistDecision.reasonCode
              ? null
              : getAllowlistFailureGroup(allowlistDecision.reasonCode),
          normalizedEntityType: allowlistDecision.normalizedEntityType,
          normalizedCity: allowlistDecision.normalizedCity,
          normalizedCategory: allowlistDecision.normalizedCategory,
          normalizedSourceType: allowlistDecision.normalizedSourceType,
          normalizedSourceHost: allowlistDecision.normalizedSourceHost,
          matchedSourceKey: allowlistDecision.matchedSourceKey,
          matchedSourceLabel: allowlistDecision.matchedSourceLabel,
        },
        effectiveStatus: blockedHandling ? "BLOCKED_BY_ALLOWLIST" : item.status,
        effectiveErrorMessage: blockedHandling ? blockedHandling.errorMessage : item.errorMessage,
      };
    }),
  };
}
