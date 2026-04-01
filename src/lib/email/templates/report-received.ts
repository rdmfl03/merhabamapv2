import "server-only";

import { renderLocalizedEmail } from "@/lib/email/render-bilingual-email";

export function buildReportReceivedTemplate(args: {
  locale: "de" | "tr";
  targetLabel: string;
}) {
  const subject =
    args.locale === "tr"
      ? "MerhabaMap: Bildiriminiz alındı"
      : "MerhabaMap: Deine Meldung wurde erhalten";

  const content =
    args.locale === "tr"
      ? renderLocalizedEmail({
          locale: "tr",
          previewText: "Gönderdiğiniz bildirim kaydedildi.",
          section: {
            title: "Bildirim alındı",
            paragraphs: [
              `${args.targetLabel} için gönderdiğiniz bildirim kaydedildi.`,
              "Bu e-posta, belirli bir moderasyon sonucu veya zaman çizelgesi garanti etmez.",
            ],
          },
        })
      : renderLocalizedEmail({
          locale: "de",
          previewText: "Deine Meldung wurde gespeichert.",
          section: {
            title: "Meldung eingegangen",
            paragraphs: [
              `Deine Meldung für ${args.targetLabel} wurde gespeichert.`,
              "Diese E-Mail verspricht keinen bestimmten Moderationsausgang und keinen festen Zeitplan.",
            ],
          },
        });

  return {
    subject,
    ...content,
  };
}
