import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RequestVerificationForm } from "@/components/auth/request-verification-form";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderState } from "@/components/ui/placeholder-state";
import { getEmailTransport } from "@/lib/email/config";
import { isDevelopmentLike } from "@/lib/env";
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
  const created = rawSearchParams.created === "1";
  const showLocalMailHint = isDevelopmentLike() && getEmailTransport() !== "resend";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70 bg-white/92 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl text-foreground">{t("verifyEmailTitle")}</h1>
              <p className="text-base leading-7 text-muted-foreground">
                {t("verifyEmailDescription")}
              </p>
            </div>

            {created ? (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-900">{t("verifyEmailCreatedTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  {email
                    ? t("verifyEmailCreatedDescriptionWithAddress", { email })
                    : t("verifyEmailCreatedDescription")}
                </p>
              </div>
            ) : null}

            {showLocalMailHint ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
                {t("devEmailDeliveryHint")}
              </div>
            ) : null}

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
          title={t("verifyEmailChecklistTitle")}
          description={t("verifyEmailInfoDescription")}
        >
          <div className="space-y-3">
            {[t("verifyEmailChecklistInbox"), t("verifyEmailChecklistResend"), t("verifyEmailChecklistSignin")].map(
              (step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-[#f7f8fa] px-4 py-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </div>
              ),
            )}
          </div>
        </PlaceholderState>
      </div>
    </div>
  );
}
