"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  CLIENT_PRODUCT_INSIGHT_EVENT_NAMES,
  type ClientProductInsightEventName,
} from "@/lib/product-insights/event-names";
import { coerceProductInsightPayload } from "@/lib/product-insights/sanitize-payload";
import type { AppLocale } from "@/i18n/routing";
import { trackProductInsight } from "@/server/product-insights/track-product-insight";

const localeSchema = z.enum(["de", "tr"]);
const surfaceSchema = z
  .string()
  .max(40)
  .regex(/^[a-z0-9_]+$/);

const guestCtaSchema = z.object({
  name: z.enum(["guest_signin_cta_click", "guest_signup_cta_click"]),
  locale: localeSchema,
  surface: surfaceSchema,
});

const shareClickSchema = z.object({
  name: z.literal("share_click"),
  locale: localeSchema,
  surface: surfaceSchema.optional(),
  shareMethod: z.enum(["native", "copy"]),
});

const inputSchema = z.discriminatedUnion("name", [guestCtaSchema, shareClickSchema]);

export async function recordClientProductInsight(raw: unknown): Promise<void> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }

  const session = await auth();
  const authenticated = Boolean(session?.user?.id);
  const data = parsed.data;

  const name = data.name as ClientProductInsightEventName;
  if (!CLIENT_PRODUCT_INSIGHT_EVENT_NAMES.includes(name)) {
    return;
  }

  if (
    (name === "guest_signin_cta_click" || name === "guest_signup_cta_click") &&
    authenticated
  ) {
    return;
  }

  const locale = data.locale as AppLocale;
  const extra: Record<string, unknown> = {};
  if (data.name === "share_click") {
    extra.shareMethod = data.shareMethod;
    if (data.surface) {
      extra.surface = data.surface;
    }
  } else {
    extra.surface = data.surface;
  }

  const payload = coerceProductInsightPayload(extra, { locale, authenticated });

  await trackProductInsight({ name, payload });
}
