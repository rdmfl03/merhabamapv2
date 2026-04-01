import "server-only";

import { renderLocalizedEmail } from "@/lib/email/render-bilingual-email";

export function buildVerifyEmailTemplate(args: {
  locale: "de" | "tr";
  verificationUrl: string;
}) {
  const subject =
    args.locale === "tr"
      ? "MerhabaMap: E-posta adresinizi doğrulayın"
      : "MerhabaMap: Bestätige deine E-Mail-Adresse";

  const content =
    args.locale === "tr"
      ? renderLocalizedEmail({
          locale: "tr",
          previewText: "E-posta adresinizi doğrulamak için bağlantıyı açın.",
          section: {
            title: "E-posta adresinizi doğrulayın",
            paragraphs: [
              "MerhabaMap hesabınızı tamamlamak için aşağıdaki bağlantıyı açın.",
              "Bağlantı sınırlı süre için geçerlidir ve yalnızca bir kez kullanılabilir.",
            ],
            ctaLabel: "E-postayı doğrula",
            ctaUrl: args.verificationUrl,
            secondaryLines: [
              "Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.",
            ],
          },
        })
      : renderLocalizedEmail({
          locale: "de",
          previewText: "Öffne den Link, um deine E-Mail-Adresse zu bestätigen.",
          section: {
            title: "Bestätige deine E-Mail-Adresse",
            paragraphs: [
              "Öffne den folgenden Link, um dein MerhabaMap-Konto zu vervollständigen.",
              "Der Link ist nur begrenzte Zeit gültig und kann nur einmal verwendet werden.",
            ],
            ctaLabel: "E-Mail bestätigen",
            ctaUrl: args.verificationUrl,
            secondaryLines: [
              "Wenn du diese Anfrage nicht gestartet hast, kannst du diese E-Mail ignorieren.",
            ],
          },
        });

  return {
    subject,
    ...content,
  };
}
