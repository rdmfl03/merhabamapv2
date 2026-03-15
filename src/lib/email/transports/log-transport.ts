import "server-only";

import { logger } from "@/lib/logger";

import type { EmailPayload, EmailSendResult } from "../types";

export async function sendWithLogTransport(
  payload: EmailPayload,
): Promise<EmailSendResult> {
  logger.info("email_logged", {
    template: payload.template,
    subject: payload.subject,
    recipientCount: Array.isArray(payload.to) ? payload.to.length : 1,
  });

  return {
    ok: true,
    provider: "log",
  };
}
