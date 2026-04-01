import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { EssentialServicesNotice } from "@/components/legal/essential-services-notice";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  isInviteOnlyRegistrationEnabled,
  isUserRegistrationEnabled,
} from "@/lib/auth/config";
import { getEmailTransport } from "@/lib/email/config";
import { isDevelopmentLike } from "@/lib/env";
import { isAppLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const nextParam =
    typeof rawSearchParams.next === "string" ? rawSearchParams.next : undefined;
  const safeNext =
    nextParam && nextParam.startsWith(`/${locale}/`) ? nextParam : undefined;
  const signInHref =
    safeNext != null
      ? `/auth/signin?next=${encodeURIComponent(safeNext)}`
      : "/auth/signin";

  const [t, legal] = await Promise.all([
    getTranslations({ locale, namespace: "auth" }),
    getTranslations({ locale, namespace: "legal" }),
  ]);
  const registrationEnabled = isUserRegistrationEnabled();
  const inviteOnlyEnabled = isInviteOnlyRegistrationEnabled();
  const canRegister = registrationEnabled || inviteOnlyEnabled;
  const showLocalMailHint = isDevelopmentLike() && getEmailTransport() !== "resend";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-border/70 bg-white/92 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-brand/15 bg-brand/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {t("signUpStepLabel")}
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl text-foreground">{t("signUpTitle")}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {t("signUpDescription")}
              </p>
            </div>

            {showLocalMailHint ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
                {t("devEmailDeliveryHint")}
              </div>
            ) : null}

            {canRegister ? (
              <SignUpForm
                locale={locale}
                requireInviteCode={inviteOnlyEnabled}
                labels={{
                  name: t("nameLabel"),
                  email: t("emailLabel"),
                  language: t("languageLabel"),
                  password: t("passwordLabel"),
                  confirmPassword: t("confirmPasswordLabel"),
                  inviteCode: t("inviteCodeLabel"),
                  inviteCodeHint: t("inviteCodeHint"),
                  submit: t("signUpButton"),
                  success: t("signUpSuccess"),
                  validationError: t("signUpError"),
                  emailInUse: t("signUpEmailInUse"),
                  passwordMismatch: t("passwordMismatch"),
                  inviteCodeInvalid: t("inviteCodeInvalid"),
                  registrationDisabled: t("signUpDisabledMessage"),
                  legalAcknowledgementPrefix: t("legalAcknowledgementPrefix"),
                  legalAcknowledgementTerms: legal("navigation.terms"),
                  legalAcknowledgementConnector: t("legalAcknowledgementConnector"),
                  legalAcknowledgementPrivacy: legal("navigation.privacy"),
                  legalAcknowledgementSuffix: t("legalAcknowledgementSuffix"),
                }}
              />
            ) : (
              <div className="rounded-3xl border border-border bg-muted/30 p-6">
                <h2 className="font-display text-2xl text-foreground">{t("signUpDisabledTitle")}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t("signUpDisabledDescription")}
                </p>
              </div>
            )}

            <EssentialServicesNotice
              title={legal("essentialServices.title")}
              description={legal("essentialServices.description")}
              privacyLabel={legal("navigation.privacy")}
            />

            <div className="flex justify-start">
              <Link href={signInHref} className="text-sm text-brand">
                {t("goToSignin")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/88 shadow-[0_22px_55px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {t("verifyEmailTitle")}
            </p>
            <h2 className="font-display text-3xl text-foreground">{t("signUpInfoTitle")}</h2>
            <p className="text-base leading-7 text-muted-foreground">{t("signUpInfoDescription")}</p>

            <div className="rounded-[1.75rem] border border-border/70 bg-[#f7f8fa] p-5">
              <h3 className="font-display text-2xl text-foreground">{t("signUpNextStepTitle")}</h3>
              <div className="mt-4 space-y-3">
                {[t("signUpNextStepOne"), t("signUpNextStepTwo"), t("signUpNextStepThree")].map(
                  (step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
