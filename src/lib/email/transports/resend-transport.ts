import "server-only";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";

import type { EmailPayload, EmailSendResult } from "../types";

export async function sendWithResendTransport(
  payload: EmailPayload,
): Promise<EmailSendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      reply_to: payload.replyTo,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    throw new AppError({
      message: "Failed to send email via Resend.",
      code: "email_send_failed",
      statusCode: 502,
    });
  }

  const body = (await response.json()) as { id?: string };

  return {
    ok: true,
    provider: "resend",
    providerMessageId: body.id,
  };
}
