import "server-only";

import { renderLocalizedEmail } from "@/lib/email/render-bilingual-email";

export function buildClaimSubmittedTemplate(args: {
  locale: "de" | "tr";
  placeName: string;
}) {
  const subject =
    args.locale === "tr"
      ? "MerhabaMap: Talebiniz alındı"
      : "MerhabaMap: Dein Claim wurde erhalten";

  const content =
    args.locale === "tr"
      ? renderLocalizedEmail({
          locale: "tr",
          previewText: `${args.placeName} için gönderdiğiniz claim kaydedildi.`,
          section: {
            title: "Business claim alındı",
            paragraphs: [
              `${args.placeName} için gönderdiğiniz claim kaydedildi.`,
              "Moderasyon ekibi talebi inceleyebilir. Bu e-posta belirli bir sonuç veya süre garantisi vermez.",
            ],
          },
        })
      : renderLocalizedEmail({
          locale: "de",
          previewText: `Dein Claim für ${args.placeName} wurde gespeichert.`,
          section: {
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
