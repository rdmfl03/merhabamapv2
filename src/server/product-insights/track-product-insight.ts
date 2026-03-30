import { Prisma } from "@prisma/client";

import {
  PRODUCT_INSIGHT_EVENT_NAMES,
  type ProductInsightEventName,
} from "@/lib/product-insights/event-names";
import { sanitizeProductInsightPayload } from "@/lib/product-insights/sanitize-payload";
import { prisma } from "@/lib/prisma";

const allowedNames = new Set<string>(PRODUCT_INSIGHT_EVENT_NAMES);

function insightsWritesEnabled(): boolean {
  if (process.env.PRODUCT_INSIGHTS_DISABLED === "true") {
    return false;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return true;
}

export type TrackProductInsightInput = {
  name: ProductInsightEventName;
  payload?: Record<string, unknown>;
};

/**
 * Persists a single first-party product insight. Swallows errors; never throws to callers.
 */
export async function trackProductInsight(input: TrackProductInsightInput): Promise<void> {
  if (!insightsWritesEnabled()) {
    return;
  }

  if (!allowedNames.has(input.name)) {
    return;
  }

  const sanitized = sanitizeProductInsightPayload(input.payload ?? {});

  try {
    await prisma.productInsightEvent.create({
      data: {
        name: input.name,
        payload: sanitized as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[product-insights] persist failed", err);
  }
}
