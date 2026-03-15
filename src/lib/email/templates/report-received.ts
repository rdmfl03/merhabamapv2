import "server-only";

import { renderBilingualEmail } from "@/lib/email/render-bilingual-email";

export function buildReportReceivedTemplate(args: { targetLabel: string }) {
  const subject =
    "MerhabaMap: Bildiriminiz alındı / Deine Meldung wurde erhalten";

  const content = renderBilingualEmail({
    previewText: "Gönderdiğiniz bildirim kaydedildi.",
    tr: {
      title: "Bildirim alındı",
      paragraphs: [
        `${args.targetLabel} için gönderdiğiniz bildirim kaydedildi.`,
        "Bu e-posta, belirli bir moderasyon sonucu veya zaman çizelgesi garanti etmez.",
      ],
    },
    de: {
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
