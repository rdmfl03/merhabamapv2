import "server-only";

import { env } from "@/lib/env";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSectionHtml(label: string, section: EmailSection) {
  const paragraphs = section.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;color:#475467;font-size:16px;line-height:1.75;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const secondary = (section.secondaryLines ?? [])
    .map(
      (line) =>
        `<p style="margin:0 0 10px;color:#667085;font-size:13px;line-height:1.7;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const cta =
    section.ctaLabel && section.ctaUrl
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
          <tr>
            <td align="center" bgcolor="#cf2129" style="background:#cf2129;border-radius:999px;">
              <a href="${escapeHtml(section.ctaUrl)}" style="display:inline-block;padding:14px 24px;border-radius:999px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.01em;">
                ${escapeHtml(section.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e7ebf3;border-radius:20px;background:#ffffff;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;color:#cf2129;font-size:12px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(label)}</p>
          <h2 style="margin:0 0 16px;color:#111827;font-size:28px;line-height:1.2;font-weight:800;">${escapeHtml(section.title)}</h2>
          ${paragraphs}
          ${cta}
          ${secondary ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;"><tr><td style="padding-top:18px;border-top:1px solid #f0f2f7;">${secondary}</td></tr></table>` : ""}
        </td>
      </tr>
    </table>
  `;
}

function renderSectionText(label: string, section: EmailSection) {
  const base = [
    label,
    section.title,
    "",
    ...section.paragraphs,
    "",
  ];

  if (section.ctaLabel && section.ctaUrl) {
    base.push(`${section.ctaLabel}: ${section.ctaUrl}`, "");
  }

  if (section.secondaryLines?.length) {
    base.push(...section.secondaryLines, "");
  }

  return base.join("\n");
}

export function renderLocalizedEmail({
  previewText,
  locale,
  section,
}: RenderLocalizedEmailOptions) {
  const isTurkish = locale === "tr";
  const brandSubtitle = isTurkish
    ? "Almanya'daki turk mekanlari ve etkinlikleri."
    : "Turkische Orte und Events in Deutschland.";
  const footerNotice =
    isTurkish
      ? "Bu MerhabaMap islem e-postasi, hesap veya platform etkinligi nedeniyle gonderildi."
      : "Diese MerhabaMap Transaktions-E-Mail wurde wegen einer Konto- oder Plattformaktivitat gesendet.";
  const whyTitle = isTurkish
    ? "Bu e-postayi neden aldiniz"
    : "Warum du diese E-Mail bekommst";
  const replyToLabel = isTurkish ? "Yanit adresi" : "Reply-To";
  const sectionLabel = isTurkish ? "Turkce" : "Deutsch";
  const brandName = "MerhabaMap";
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MerhabaMap</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
          ${escapeHtml(previewText)}
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f4f4f6;margin:0;padding:0;">
          <tr>
            <td align="center" style="padding:28px 14px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;border:1px solid #e8ebf2;border-radius:24px;background:#ffffff;">
                <tr>
                  <td style="padding:24px 24px 20px;background:#fff9f8;border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="middle" style="width:60px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" valign="middle" width="44" height="44" style="width:44px;height:44px;background:#e30a17;border-radius:14px;color:#ffffff;font-size:24px;font-weight:800;line-height:44px;text-align:center;">
                                <span style="display:inline-block;color:#ffffff;font-size:24px;font-weight:800;line-height:44px;">M</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p style="margin:0;color:#111827;font-size:15px;font-weight:800;">${brandName}</p>
                          <p style="margin:6px 0 0;color:#667085;font-size:14px;line-height:1.6;">${escapeHtml(brandSubtitle)}</p>
                        </td>
                        <td valign="middle" align="right">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" valign="middle" style="padding:8px 14px;border-radius:999px;background:${isTurkish ? "#cf2129" : "#ffffff"};border:1px solid ${isTurkish ? "#cf2129" : "#d9dee8"};">
                                <span style="color:${isTurkish ? "#ffffff" : "#111827"};font-size:12px;font-weight:700;">${isTurkish ? "TR" : "DE"}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;border:1px solid #edf0f5;border-radius:16px;background:#fafbfc;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0;color:#475467;font-size:14px;line-height:1.7;">${escapeHtml(previewText)}</p>
                        </td>
                      </tr>
                    </table>
                    ${renderSectionHtml(sectionLabel, section)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e8edf5;border-radius:18px;background:#fbfcfe;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">${escapeHtml(whyTitle)}</p>
                          <p style="margin:0;color:#667085;font-size:13px;line-height:1.7;">${escapeHtml(footerNotice)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px 24px;border-top:1px solid #eef1f6;background:#fcfcfd;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top">
                          <p style="margin:0 0 6px;color:#111827;font-size:12px;font-weight:700;">${brandName}</p>
                          <p style="margin:0;color:#667085;font-size:12px;line-height:1.7;">${escapeHtml(replyToLabel)}: info@merhabamap.com</p>
                        </td>
                        <td valign="top" align="right">
                          <p style="margin:0;color:#98a2b3;font-size:12px;line-height:1.7;">auth@merhabamap.com</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    "MerhabaMap",
    brandSubtitle,
    "",
    renderSectionText(sectionLabel, section),
    footerNotice,
    `${replyToLabel}: info@merhabamap.com`,
  ].join("\n");

  return { html, text };
}
