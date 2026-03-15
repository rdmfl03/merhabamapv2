import "server-only";

type EmailSection = {
  title: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLines?: string[];
};

type RenderBilingualEmailOptions = {
  previewText: string;
  tr: EmailSection;
  de: EmailSection;
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
    .map((paragraph) => `<p style="margin:0 0 14px;color:#3f3f46;line-height:1.7;">${escapeHtml(paragraph)}</p>`)
    .join("");

  const secondary = (section.secondaryLines ?? [])
    .map((line) => `<p style="margin:0 0 10px;color:#71717a;font-size:13px;line-height:1.6;">${escapeHtml(line)}</p>`)
    .join("");

  const cta =
    section.ctaLabel && section.ctaUrl
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(section.ctaUrl)}" style="display:inline-block;border-radius:999px;background:#cf2129;color:#ffffff;text-decoration:none;padding:12px 22px;font-weight:600;">${escapeHtml(section.ctaLabel)}</a></p>`
      : "";

  return `
    <section style="padding:28px 0;">
      <p style="margin:0 0 12px;color:#cf2129;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(label)}</p>
      <h2 style="margin:0 0 16px;color:#18181b;font-size:24px;line-height:1.25;">${escapeHtml(section.title)}</h2>
      ${paragraphs}
      ${cta}
      ${secondary}
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

export function renderBilingualEmail({
  previewText,
  tr,
  de,
}: RenderBilingualEmailOptions) {
  const brandSubtitle =
    "Türkiye ile Almanya arasında mekanlar, etkinlikler ve yerel güven sinyalleri. / Orte, Events und lokale Vertrauenssignale zwischen der Türkei und Deutschland.";
  const footerNotice =
    "MerhabaMap işlem e-postası. Bu mesaj hesap veya platform etkinliği nedeniyle gönderildi. / MerhabaMap Transaktions-E-Mail. Diese Nachricht wurde wegen einer Konto- oder Plattformaktivität gesendet.";
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MerhabaMap</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
          ${escapeHtml(previewText)}
        </div>
        <div style="margin:0 auto;max-width:640px;padding:32px 16px;">
          <div style="overflow:hidden;border:1px solid #e4e4e7;border-radius:28px;background:#ffffff;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
            <header style="padding:28px 28px 24px;background:linear-gradient(180deg,#fff6f6 0%,#ffffff 100%);border-bottom:1px solid #f1f1f3;">
              <p style="margin:0;color:#cf2129;font-size:13px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">MerhabaMap</p>
              <p style="margin:10px 0 0;color:#52525b;font-size:14px;line-height:1.7;">${escapeHtml(brandSubtitle)}</p>
            </header>
            <main style="padding:0 28px;">
              ${renderSectionHtml("Türkçe", tr)}
              <div style="height:1px;background:#e4e4e7;"></div>
              ${renderSectionHtml("Deutsch", de)}
            </main>
            <footer style="padding:22px 28px 28px;color:#71717a;font-size:12px;line-height:1.7;border-top:1px solid #f1f1f3;background:#fafafa;">
              <p style="margin:0 0 10px;">${escapeHtml(footerNotice)}</p>
              <p style="margin:0;">Reply-To: info@merhabamap.com</p>
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
    renderSectionText("Türkçe", tr),
    "---",
    renderSectionText("Deutsch", de),
    footerNotice,
    "Reply-To: info@merhabamap.com",
  ].join("\n");

  return { html, text };
}
