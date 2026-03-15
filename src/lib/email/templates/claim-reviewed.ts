import "server-only";

import { renderBilingualEmail } from "@/lib/email/render-bilingual-email";

export function buildClaimReviewedTemplate(args: {
  placeName: string;
  approved: boolean;
}) {
  const subject = args.approved
    ? "MerhabaMap: Claim onaylandı / Dein Claim wurde genehmigt"
    : "MerhabaMap: Claim güncellendi / Dein Claim wurde aktualisiert";

  const content = renderBilingualEmail({
    previewText: `${args.placeName} için claim durumunuz güncellendi.`,
    tr: {
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
    de: {
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
