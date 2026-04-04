import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";
import { isAppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: ForgotPasswordPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const email =
    typeof rawSearchParams.email === "string" ? rawSearchParams.email : undefined;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card className="bg-white/90">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-4xl text-foreground">{t("forgotPasswordTitle")}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("forgotPasswordDescription")}
            </p>
          </div>

          <ForgotPasswordForm
            locale={locale}
            email={email}
            labels={{
              email: t("emailLabel"),
              submit: t("forgotPasswordButton"),
              success: t("forgotPasswordSuccess"),
              error: t("forgotPasswordError"),
            }}
          />

          <div className="flex justify-start">
            <Link href="/auth/signin" className="text-sm text-brand">
              {t("backToSignin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
