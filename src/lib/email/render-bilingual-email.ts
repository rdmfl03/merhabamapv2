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
            <td align="center" bgcolor="#cf2129" style="border-radius:999px;background:#cf2129;">
              <a href="${escapeHtml(section.ctaUrl)}" style="display:inline-block;padding:14px 24px;border-radius:999px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.01em;">
                ${escapeHtml(section.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `
    <section style="padding:24px;border:1px solid #eceef4;border-radius:24px;background:#ffffff;">
      <p style="margin:0 0 12px;color:#cf2129;font-size:12px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(label)}</p>
      <h2 style="margin:0 0 16px;color:#111827;font-size:28px;line-height:1.2;font-weight:800;">${escapeHtml(section.title)}</h2>
      ${paragraphs}
      ${cta}
      ${secondary ? `<div style="margin-top:18px;padding-top:18px;border-top:1px solid #f0f2f7;">${secondary}</div>` : ""}
    </section>
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
  const logoUrl = new URL("/logo-email.svg", env.APP_URL).toString();
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
        <div style="margin:0 auto;max-width:680px;padding:28px 14px 40px;">
          <div style="overflow:hidden;border:1px solid #e8ebf2;border-radius:32px;background:#ffffff;box-shadow:0 20px 60px rgba(15,23,42,0.08);">
            <header style="padding:24px 28px 22px;background:linear-gradient(180deg,#fff7f7 0%,#ffffff 100%);border-bottom:1px solid #eef1f6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:64px;">
                    <img
                      src="${escapeHtml(logoUrl)}"
                      alt="MerhabaMap"
                      width="48"
                      height="48"
                      style="display:block;width:48px;height:48px;border-radius:16px;"
                    />
                  </td>
                  <td valign="top">
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:800;">MerhabaMap</p>
                    <p style="margin:6px 0 0;color:#667085;font-size:14px;line-height:1.6;">${escapeHtml(brandSubtitle)}</p>
                  </td>
                  <td valign="top" align="right">
                    <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:${isTurkish ? "#cf2129" : "#ffffff"};border:1px solid ${isTurkish ? "#cf2129" : "#d9dee8"};color:${isTurkish ? "#ffffff" : "#111827"};text-decoration:none;font-size:12px;font-weight:700;">
                      ${isTurkish ? "TR" : "DE"}
                    </div>
                  </td>
                </tr>
              </table>
            </header>
            <main style="padding:24px;">
              <div style="margin:0 0 16px;padding:18px 20px;border:1px solid #edf0f5;border-radius:20px;background:#fafbfc;">
                <p style="margin:0;color:#475467;font-size:14px;line-height:1.7;">${escapeHtml(previewText)}</p>
              </div>
              <div style="display:block;">
                ${renderSectionHtml(sectionLabel, section)}
              </div>
            </main>
            <section style="padding:0 24px 24px;">
              <div style="padding:18px 20px;border:1px dashed #d7dce7;border-radius:20px;background:#fbfcfe;">
                <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">${escapeHtml(whyTitle)}</p>
                <p style="margin:0;color:#667085;font-size:13px;line-height:1.7;">${escapeHtml(footerNotice)}</p>
              </div>
            </section>
            <footer style="padding:0 28px 28px;color:#667085;font-size:12px;line-height:1.7;border-top:1px solid #eef1f6;background:#fcfcfd;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-top:18px;">
                    <p style="margin:0 0 6px;color:#111827;font-size:12px;font-weight:700;">MerhabaMap</p>
                    <p style="margin:0;">${escapeHtml(replyToLabel)}: info@merhabamap.com</p>
                  </td>
                  <td align="right" style="padding-top:18px;">
                    <p style="margin:0;color:#98a2b3;">auth@merhabamap.com</p>
                  </td>
                </tr>
              </table>
            </footer>
          </div>
        </div>
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
