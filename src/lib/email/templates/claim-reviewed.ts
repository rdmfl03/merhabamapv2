import "server-only";

import { renderLocalizedEmail } from "@/lib/email/render-bilingual-email";

export function buildClaimReviewedTemplate(args: {
  locale: "de" | "tr";
  placeName: string;
  approved: boolean;
}) {
  const subject =
    args.locale === "tr"
      ? args.approved
        ? "MerhabaMap: Claim onaylandı"
        : "MerhabaMap: Claim güncellendi"
      : args.approved
        ? "MerhabaMap: Dein Claim wurde genehmigt"
        : "MerhabaMap: Dein Claim wurde aktualisiert";

  const content =
    args.locale === "tr"
      ? renderLocalizedEmail({
          locale: "tr",
          previewText: `${args.placeName} için claim durumunuz güncellendi.`,
          section: {
            title: args.approved ? "Claim onaylandı" : "Claim sonuçlandı",
            paragraphs: args.approved
              ? [
                  `${args.placeName} için gönderdiğiniz claim onaylandı.`,
                  "Yer artık onaylanan işletme sahibi hesabınızla ilişkilendirildi.",
                ]
              : [
                  `${args.placeName} için gönderdiğiniz claim şu anda onaylanmadı.`,
                  "Gerektiğinde daha net ve doğrulanabilir bilgilerle tekrar başvurabilirsiniz.",
                ],
          },
        })
      : renderLocalizedEmail({
          locale: "de",
          previewText: `Dein Claim-Status für ${args.placeName} wurde aktualisiert.`,
          section: {
            title: args.approved ? "Claim genehmigt" : "Claim abgeschlossen",
            paragraphs: args.approved
              ? [
                  `Dein Claim für ${args.placeName} wurde genehmigt.`,
                  "Der Ort ist jetzt mit deinem genehmigten Business-Konto verknüpft.",
                ]
              : [
                  `Dein Claim für ${args.placeName} wurde derzeit nicht genehmigt.`,
                  "Falls nötig, kannst du später mit klareren und besser prüfbaren Angaben erneut anfragen.",
                ],
          },
        });

  return {
    subject,
    ...content,
  };
}
