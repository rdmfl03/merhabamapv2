import "server-only";

import { emailConfig, getEmailTransport } from "@/lib/email/config";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";

import { sendWithLogTransport } from "./transports/log-transport";
import { sendWithResendTransport } from "./transports/resend-transport";
import type { EmailPayload, EmailSendResult } from "./types";

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const transport = getEmailTransport();
  const withDefaults = {
    ...payload,
    from: payload.from ?? emailConfig.from,
    replyTo: payload.replyTo ?? emailConfig.replyTo,
  };

  if (transport === "disabled") {
    logger.warn("email_send_skipped", {
      template: payload.template,
      reason: "email_transport_disabled",
    });

    return {
      ok: false,
      skipped: true,
      provider: "disabled",
    };
  }

  if (transport === "log") {
    return sendWithLogTransport(withDefaults);
  }

  return sendWithResendTransport(withDefaults);
}

export async function sendEmailSafely(payload: EmailPayload) {
  const transport = getEmailTransport();

  try {
    return await sendEmail(payload);
  } catch (error) {
    logger.error("email_send_error", {
      template: payload.template,
      error:
        error instanceof AppError
          ? { code: error.code, statusCode: error.statusCode }
          : "unknown",
    });

    return {
      ok: false,
      provider:
        transport === "resend" ? "resend" : transport === "log" ? "log" : "disabled",
    } satisfies EmailSendResult;
  }
}
