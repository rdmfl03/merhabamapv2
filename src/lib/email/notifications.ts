import "server-only";

import { env } from "@/lib/env";

import { sendEmailSafely } from "./send-email";
import { buildClaimReviewedTemplate } from "./templates/claim-reviewed";
import { buildClaimSubmittedTemplate } from "./templates/claim-submitted";
import { buildPasswordResetTemplate } from "./templates/password-reset";
import { buildReportReceivedTemplate } from "./templates/report-received";
import { buildVerifyEmailTemplate } from "./templates/verify-email";

function buildAbsoluteUrl(path: string) {
  return new URL(path, env.APP_URL).toString();
}

export async function sendVerificationEmail(args: {
  to: string;
  locale: "de" | "tr";
  token: string;
}) {
  const verificationUrl = buildAbsoluteUrl(
    `/${args.locale}/auth/verify?token=${encodeURIComponent(args.token)}`,
  );
  const template = buildVerifyEmailTemplate({
    locale: args.locale,
    verificationUrl,
  });

  return sendEmailSafely({
    template: "verify-email",
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(args: {
  to: string;
  locale: "de" | "tr";
  token: string;
}) {
  const resetUrl = buildAbsoluteUrl(
    `/${args.locale}/auth/reset-password?token=${encodeURIComponent(args.token)}`,
  );
  const template = buildPasswordResetTemplate({
    locale: args.locale,
    resetUrl,
  });

  return sendEmailSafely({
    template: "password-reset",
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendClaimSubmittedEmail(args: {
  to: string;
  locale: "de" | "tr";
  placeName: string;
}) {
  const template = buildClaimSubmittedTemplate({
    locale: args.locale,
    placeName: args.placeName,
  });

  return sendEmailSafely({
    template: "claim-submitted",
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendClaimReviewedEmail(args: {
  to: string;
  locale: "de" | "tr";
  placeName: string;
  approved: boolean;
}) {
  const template = buildClaimReviewedTemplate({
    locale: args.locale,
    placeName: args.placeName,
    approved: args.approved,
  });

  return sendEmailSafely({
    template: "claim-reviewed",
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendReportReceivedEmail(args: {
  to: string;
  locale: "de" | "tr";
  targetLabel: string;
}) {
  const template = buildReportReceivedTemplate({
    locale: args.locale,
    targetLabel: args.targetLabel,
  });

  return sendEmailSafely({
    template: "report-received",
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
