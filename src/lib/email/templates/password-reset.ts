import "server-only";

import { renderLocalizedEmail } from "@/lib/email/render-bilingual-email";

export function buildPasswordResetTemplate(args: {
  locale: "de" | "tr";
  resetUrl: string;
}) {
  const subject =
    args.locale === "tr"
      ? "MerhabaMap: Şifrenizi sıfırlayın"
      : "MerhabaMap: Setze dein Passwort zurück";

  const content =
    args.locale === "tr"
      ? renderLocalizedEmail({
          locale: "tr",
          previewText: "Şifrenizi sıfırlamak için güvenli bağlantıyı açın.",
          section: {
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
        })
      : renderLocalizedEmail({
          locale: "de",
          previewText: "Öffne den sicheren Link, um dein Passwort zurückzusetzen.",
          section: {
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
