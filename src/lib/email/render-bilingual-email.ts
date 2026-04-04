import "server-only";

import { env } from "@/lib/env";

/** Matches site header / brand (same English line as common.taglineShort in messages). */
const BRAND_TAGLINE = "The Home for Turkish Communities";

const EMAIL = {
  brandRed: "#E30A17",
  pageBg: "#eef1f6",
  shellBg: "#ffffff",
  headerBg: "#fff8f6",
  headerBorder: "#f0e8e6",
  textTitle: "#0f172a",
  textBody: "#475569",
  textMuted: "#64748b",
  border: "#e2e8f0",
  borderLight: "#edf0f5",
  previewBg: "#f8fafc",
  infoBg: "#f9fafb",
  footerBg: "#fafbfc",
  linkBlue: "#1d4ed8",
  shadowCard: "0 12px 40px -18px rgba(24, 24, 27, 0.14)",
} as const;

export type EmailSection = {
  title: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLines?: string[];
};

type RenderLocalizedEmailOptions = {
  previewText: string;
  locale: "de" | "tr";
  section: EmailSection;
};

type RenderBilingualEmailOptions = {
  previewText: string;
  tr: EmailSection;
  de: EmailSection;
};

function getEmailLogoUrl() {
  return new URL("/logo-pin.svg", env.APP_URL).toString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailBodyFont() {
  return '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';
}

function renderSectionHtml(label: string, section: EmailSection): string {
  const pBody = (color: string, inner: string) =>
    '<p style="margin:0 0 14px;color:' +
    color +
    ';font-size:15px;line-height:165%;">' +
    inner +
    "</p>";

  const paragraphs = section.paragraphs
    .map((paragraph) => pBody(EMAIL.textBody, escapeHtml(paragraph)))
    .join("");

  const secondary = (section.secondaryLines ?? [])
    .map((line) => pBody(EMAIL.textMuted, escapeHtml(line)))
    .join("");

  let cta = "";
  if (section.ctaLabel && section.ctaUrl) {
    const url = escapeHtml(section.ctaUrl);
    const lbl = escapeHtml(section.ctaLabel);
    cta =
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">' +
      "<tr><td align=\"center\">" +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">' +
      "<tr>" +
      '<td align="center" bgcolor="' +
      EMAIL.brandRed +
      '" style="background:' +
      EMAIL.brandRed +
      ';border-radius:999px;">' +
      '<a href="' +
      url +
      '" style="display:inline-block;padding:14px 28px;border-radius:999px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.02em;">' +
      lbl +
      "</a>" +
      "</td></tr></table></td></tr></table>";
  }

  const secondaryBlock =
    secondary.length > 0
      ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;"><tr><td style="padding-top:20px;border-top:1px solid ' +
        EMAIL.borderLight +
        ';">' +
        secondary +
        "</td></tr></table>"
      : "";

  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ' +
    EMAIL.border +
    ";border-radius:20px;background:" +
    EMAIL.shellBg +
    ';">' +
    "<tr><td style=\"padding:26px 24px 24px;\">" +
    '<p style="margin:0 0 10px;color:' +
    EMAIL.brandRed +
    ';font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">' +
    escapeHtml(label) +
    "</p>" +
    '<h2 style="margin:0 0 18px;color:' +
    EMAIL.textTitle +
    ';font-size:24px;line-height:125%;font-weight:700;letter-spacing:-0.02em;">' +
    escapeHtml(section.title) +
    "</h2>" +
    paragraphs +
    cta +
    secondaryBlock +
    "</td></tr></table>"
  );
}

function renderSectionText(label: string, section: EmailSection) {
  const base = [label, section.title, "", ...section.paragraphs, ""];

  if (section.ctaLabel && section.ctaUrl) {
    base.push(section.ctaLabel + ": " + section.ctaUrl, "");
  }

  if (section.secondaryLines?.length) {
    base.push(...section.secondaryLines, "");
  }

  return base.join("\n");
}

function renderPreviewBanner(previewText: string): string {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;border:1px solid ' +
    EMAIL.borderLight +
    ";border-radius:16px;background:" +
    EMAIL.previewBg +
    ';">' +
    "<tr><td style=\"padding:16px 18px;\">" +
    '<p style="margin:0;color:' +
    EMAIL.textBody +
    ';font-size:14px;line-height:165%;">' +
    escapeHtml(previewText) +
    "</p></td></tr></table>"
  );
}

function renderWhyBlock(whyTitle: string, footerNotice: string): string {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ' +
    EMAIL.borderLight +
    ";border-radius:18px;background:" +
    EMAIL.infoBg +
    ';">' +
    "<tr><td style=\"padding:18px 20px;\">" +
    '<p style="margin:0 0 8px;color:' +
    EMAIL.textTitle +
    ';font-size:13px;font-weight:700;">' +
    escapeHtml(whyTitle) +
    "</p>" +
    '<p style="margin:0;color:' +
    EMAIL.textMuted +
    ';font-size:13px;line-height:165%;">' +
    escapeHtml(footerNotice) +
    "</p></td></tr></table>"
  );
}

function renderFooterBlock(brandName: string, replyLineHtml: string): string {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
    "<tr>" +
    '<td valign="top" style="padding-right:16px;">' +
    '<p style="margin:0 0 6px;color:' +
    EMAIL.textTitle +
    ';font-size:13px;font-weight:700;">' +
    brandName +
    "</p>" +
    '<p style="margin:0;color:' +
    EMAIL.textMuted +
    ';font-size:12px;line-height:165%;">' +
    replyLineHtml +
    "</p>" +
    "</td>" +
    '<td valign="top" align="right" style="white-space:nowrap;">' +
    '<a href="mailto:auth@merhabamap.com" style="color:' +
    EMAIL.linkBlue +
    ';font-size:12px;line-height:165%;text-decoration:underline;">auth@merhabamap.com</a>' +
    "</td></tr></table>"
  );
}

type HeaderBadgeMode = "de" | "tr" | "bilingual";

function renderBrandHeader(badge: HeaderBadgeMode): string {
  const brandName = "MerhabaMap";
  const logoUrl = escapeHtml(getEmailLogoUrl());

  let badgeCell: string;
  if (badge === "bilingual") {
    badgeCell =
      '<td valign="middle" align="right">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">' +
      "<tr>" +
      '<td align="center" valign="middle" style="padding:8px 14px;border-radius:999px;background:#ffffff;border:1px solid ' +
      EMAIL.border +
      ';">' +
      '<span style="color:' +
      EMAIL.textTitle +
      ';font-size:11px;font-weight:700;letter-spacing:0.06em;">DE · TR</span>' +
      "</td></tr></table></td>";
  } else {
    const isTr = badge === "tr";
    const bg = isTr ? EMAIL.brandRed : "#ffffff";
    const bdr = isTr ? EMAIL.brandRed : EMAIL.border;
    const fg = isTr ? "#ffffff" : EMAIL.textTitle;
    const lab = isTr ? "TR" : "DE";
    badgeCell =
      '<td valign="middle" align="right">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">' +
      "<tr>" +
      '<td align="center" valign="middle" style="padding:8px 14px;border-radius:999px;background:' +
      bg +
      ";border:1px solid " +
      bdr +
      ';">' +
      '<span style="color:' +
      fg +
      ';font-size:11px;font-weight:800;letter-spacing:0.08em;">' +
      lab +
      "</span>" +
      "</td></tr></table></td>";
  }

  return (
    "<tr>" +
    '<td style="padding:22px 24px 20px;background:' +
    EMAIL.headerBg +
    ";border-bottom:1px solid " +
    EMAIL.headerBorder +
    ';">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
    "<tr>" +
    '<td valign="middle" style="width:64px;padding-right:14px;">' +
    '<img src="' +
    logoUrl +
    '" alt="' +
    escapeHtml(brandName) +
    '" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:18px;" />' +
    "</td>" +
    '<td valign="middle">' +
    '<p style="margin:0;color:' +
    EMAIL.textTitle +
    ';font-size:17px;font-weight:700;letter-spacing:-0.02em;">' +
    brandName +
    "</p>" +
    '<p style="margin:5px 0 0;color:' +
    EMAIL.textMuted +
    ';font-size:13px;line-height:145%;max-width:340px;">' +
    escapeHtml(BRAND_TAGLINE) +
    "</p>" +
    "</td>" +
    badgeCell +
    "</tr></table></td></tr>"
  );
}

function renderDocumentShell(args: {
  lang: string;
  previewText: string;
  innerRows: string;
}): string {
  const font = emailBodyFont();
  return (
    "<!DOCTYPE html>" +
    '<html lang="' +
    escapeHtml(args.lang) +
    '">' +
    "<head>" +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    "<title>MerhabaMap</title>" +
    "</head>" +
    '<body style="margin:0;padding:0;background:' +
    EMAIL.pageBg +
    ";font-family:" +
    font +
    ';">' +
    '<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">' +
    escapeHtml(args.previewText) +
    "</div>" +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:' +
    EMAIL.pageBg +
    ';margin:0;padding:0;">' +
    "<tr><td align=\"center\" style=\"padding:32px 16px 48px;\">" +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border:1px solid ' +
    EMAIL.border +
    ";border-radius:24px;background:" +
    EMAIL.shellBg +
    ";box-shadow:" +
    EMAIL.shadowCard +
    ';overflow:hidden;">' +
    args.innerRows +
    "</table></td></tr></table></body></html>"
  );
}

export function renderLocalizedEmail({
  previewText,
  locale,
  section,
}: RenderLocalizedEmailOptions) {
  const isTurkish = locale === "tr";
  const footerNotice = isTurkish
    ? "Bu MerhabaMap işlem e-postası, hesap veya platform etkinliği nedeniyle gönderildi."
    : "Diese MerhabaMap-Transaktions-E-Mail wurde wegen einer Konto- oder Plattformaktivität gesendet.";
  const whyTitle = isTurkish ? "Bu e-postayı neden aldınız?" : "Warum du diese E-Mail bekommst";
  const replyToLabel = isTurkish ? "Yanıt adresi" : "Reply-To";
  const sectionLabel = isTurkish ? "Türkçe" : "Deutsch";
  const brandName = "MerhabaMap";
  const replyLineHtml =
    escapeHtml(replyToLabel) +
    ': <a href="mailto:info@merhabamap.com" style="color:' +
    EMAIL.linkBlue +
    ';text-decoration:underline;">info@merhabamap.com</a>';

  const innerRows =
    renderBrandHeader(isTurkish ? "tr" : "de") +
    "<tr>" +
    '<td style="padding:26px 24px 8px;">' +
    renderPreviewBanner(previewText) +
    renderSectionHtml(sectionLabel, section) +
    "</td></tr>" +
    "<tr>" +
    '<td style="padding:8px 24px 26px;">' +
    renderWhyBlock(whyTitle, footerNotice) +
    "</td></tr>" +
    "<tr>" +
    '<td style="padding:20px 24px 26px;border-top:1px solid ' +
    EMAIL.borderLight +
    ";background:" +
    EMAIL.footerBg +
    ';">' +
    renderFooterBlock(brandName, replyLineHtml) +
    "</td></tr>";

  const html = renderDocumentShell({ lang: locale, previewText, innerRows });

  const text = [
    brandName,
    BRAND_TAGLINE,
    "",
    renderSectionText(sectionLabel, section),
    footerNotice,
    replyToLabel + ": info@merhabamap.com",
    "auth@merhabamap.com",
  ].join("\n");

  return { html, text };
}

export function renderBilingualEmail({
  previewText,
  tr,
  de,
}: RenderBilingualEmailOptions) {
  const brandName = "MerhabaMap";
  const footerNotice =
    "MerhabaMap Transaktions-E-Mail. Diese Nachricht wurde wegen einer Konto- oder Plattformaktivität gesendet. / MerhabaMap işlem e-postası. Bu mesaj hesap veya platform etkinliği nedeniyle gönderildi.";
  const whyTitle = "Warum du diese E-Mail bekommst / Bu e-postayı neden aldınız?";
  const replyLineHtml =
    'Reply-To: <a href="mailto:info@merhabamap.com" style="color:' +
    EMAIL.linkBlue +
    ';text-decoration:underline;">info@merhabamap.com</a>';

  const innerRows =
    renderBrandHeader("bilingual") +
    "<tr>" +
    '<td style="padding:26px 24px 8px;">' +
    renderPreviewBanner(previewText) +
    renderSectionHtml("Türkçe", tr) +
    '<div style="height:16px;line-height:16px;">&nbsp;</div>' +
    renderSectionHtml("Deutsch", de) +
    "</td></tr>" +
    "<tr>" +
    '<td style="padding:8px 24px 26px;">' +
    renderWhyBlock(whyTitle, footerNotice) +
    "</td></tr>" +
    "<tr>" +
    '<td style="padding:20px 24px 26px;border-top:1px solid ' +
    EMAIL.borderLight +
    ";background:" +
    EMAIL.footerBg +
    ';">' +
    renderFooterBlock(brandName, replyLineHtml) +
    "</td></tr>";

  const html = renderDocumentShell({ lang: "de", previewText, innerRows });

  const text = [
    brandName,
    BRAND_TAGLINE,
    "",
    renderSectionText("Türkçe", tr),
    renderSectionText("Deutsch", de),
    footerNotice,
    "Reply-To: info@merhabamap.com",
    "auth@merhabamap.com",
  ].join("\n");

  return { html, text };
}
