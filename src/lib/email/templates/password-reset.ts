import "server-only";

import { renderBilingualEmail } from "@/lib/email/render-bilingual-email";

export function buildPasswordResetTemplate(args: {
  resetUrl: string;
}) {
  const subject =
    "MerhabaMap: Şifrenizi sıfırlayın / Setze dein Passwort zurück";

  const content = renderBilingualEmail({
    previewText: "Şifrenizi sıfırlamak için güvenli bağlantıyı açın.",
    tr: {
      title: "Şifrenizi sıfırlayın",
      paragraphs: [
        "MerhabaMap hesabınız için bir şifre sıfırlama isteği aldık.",
        "Aşağıdaki bağlantıyı açarak yeni bir şifre belirleyebilirsiniz.",
      ],
      ctaLabel: "Şifreyi sıfırla",
      ctaUrl: args.resetUrl,
      secondaryLines: [
        "Bu isteği siz yapmadıysanız herhangi bir işlem yapmanız gerekmez.",
      ],
    },
    de: {
      title: "Setze dein Passwort zurück",
      paragraphs: [
        "Für dein MerhabaMap-Konto wurde eine Passwort-Zurücksetzung angefordert.",
        "Über den folgenden Link kannst du ein neues Passwort festlegen.",
      ],
      ctaLabel: "Passwort zurücksetzen",
      ctaUrl: args.resetUrl,
      secondaryLines: [
        "Wenn du diese Anfrage nicht gestellt hast, musst du nichts weiter tun.",
      ],
    },
  });

  return {
    subject,
    ...content,
  };
}
