import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderState } from "@/components/ui/placeholder-state";
import { isAppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getPasswordResetTokenStatus } from "@/lib/auth/password-reset";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const token =
    typeof rawSearchParams.token === "string" ? rawSearchParams.token : undefined;
  const t = await getTranslations({ locale, namespace: "auth" });

  if (!token) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <PlaceholderState
          eyebrow={t("eyebrow")}
          title={t("resetPasswordInvalidTitle")}
          description={t("resetPasswordInvalidDescription")}
        />
      </div>
    );
  }

  const tokenStatus = await getPasswordResetTokenStatus(token);

  if (tokenStatus !== "valid") {
    const titleKey =
      tokenStatus === "expired"
        ? "resetPasswordExpiredTitle"
        : "resetPasswordInvalidTitle";
    const descriptionKey =
      tokenStatus === "expired"
        ? "resetPasswordExpiredDescription"
        : "resetPasswordInvalidDescription";

    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <PlaceholderState
          eyebrow={t("eyebrow")}
          title={t(titleKey)}
          description={t(descriptionKey)}
        >
          <Link href="/auth/forgot-password" className="text-sm text-brand">
            {t("forgotPasswordButton")}
          </Link>
        </PlaceholderState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card className="bg-white/90">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-4xl text-foreground">{t("resetPasswordTitle")}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("resetPasswordDescription")}
            </p>
          </div>

          <ResetPasswordForm
            locale={locale}
            token={token}
            labels={{
              password: t("passwordLabel"),
              confirmPassword: t("confirmPasswordLabel"),
              submit: t("resetPasswordButton"),
              success: t("resetPasswordSuccess"),
              error: t("resetPasswordError"),
              mismatch: t("passwordMismatch"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
