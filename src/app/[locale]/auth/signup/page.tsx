import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl text-foreground">{t("signUpTitle")}</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("signUpDescription")}
              </p>
            </div>

            <SignUpForm
              locale={locale as "de" | "tr"}
              labels={{
                name: t("nameLabel"),
                email: t("emailLabel"),
                password: t("passwordLabel"),
                confirmPassword: t("confirmPasswordLabel"),
                submit: t("signUpButton"),
                success: t("signUpSuccess"),
                validationError: t("signUpError"),
                emailInUse: t("signUpEmailInUse"),
                passwordMismatch: t("passwordMismatch"),
              }}
            />

            <div className="flex justify-start">
              <Link href="/auth/signin" className="text-sm text-brand">
                {t("goToSignin")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {t("verifyEmailTitle")}
            </p>
            <h2 className="font-display text-3xl text-foreground">{t("signUpInfoTitle")}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{t("signUpInfoDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
