import "server-only";

import { renderBilingualEmail } from "@/lib/email/render-bilingual-email";

export function buildClaimSubmittedTemplate(args: { placeName: string }) {
  const subject =
    `MerhabaMap: Talebiniz alındı / Dein Claim wurde erhalten`;

  const content = renderBilingualEmail({
    previewText: `${args.placeName} için gönderdiğiniz claim kaydedildi.`,
    tr: {
      title: "Business claim alındı",
      paragraphs: [
        `${args.placeName} için gönderdiğiniz claim kaydedildi.`,
        "Moderasyon ekibi talebi inceleyebilir. Bu e-posta belirli bir sonuç veya süre garantisi vermez.",
      ],
    },
    de: {
      title: "Business-Claim eingegangen",
      paragraphs: [
        `Dein Claim für ${args.placeName} wurde gespeichert.`,
        "Das Moderationsteam kann die Anfrage prüfen. Diese E-Mail verspricht kein bestimmtes Ergebnis und keine feste Bearbeitungszeit.",
      ],
    },
  });

  return {
    subject,
    ...content,
  };
}
