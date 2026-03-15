import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RequestVerificationForm } from "@/components/auth/request-verification-form";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderState } from "@/components/ui/placeholder-state";
import { isAppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });
  const email =
    typeof rawSearchParams.email === "string" ? rawSearchParams.email : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl text-foreground">{t("verifyEmailTitle")}</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("verifyEmailDescription")}
              </p>
            </div>

            <RequestVerificationForm
              locale={locale}
              email={email}
              labels={{
                email: t("emailLabel"),
                submit: t("resendVerificationButton"),
                success: t("resendVerificationSuccess"),
                error: t("resendVerificationError"),
              }}
            />

            <Link href="/auth/signin" className="text-sm text-brand">
              {t("backToSignin")}
            </Link>
          </CardContent>
        </Card>

        <PlaceholderState
          eyebrow={t("eyebrow")}
          title={t("verifyEmailInfoTitle")}
          description={t("verifyEmailInfoDescription")}
        />
      </div>
    </div>
  );
}
