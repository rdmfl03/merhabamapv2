import "server-only";

import { renderBilingualEmail } from "@/lib/email/render-bilingual-email";

export function buildVerifyEmailTemplate(args: {
  verificationUrl: string;
}) {
  const subject =
    "MerhabaMap: E-posta adresinizi doğrulayın / Bestätige deine E-Mail-Adresse";

  const content = renderBilingualEmail({
    previewText: "E-posta adresinizi doğrulamak için bağlantıyı açın.",
    tr: {
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
    de: {
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
