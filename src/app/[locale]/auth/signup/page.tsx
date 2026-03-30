import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { EssentialServicesNotice } from "@/components/legal/essential-services-notice";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { isUserRegistrationEnabled } from "@/lib/auth/config";
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

            {registrationEnabled ? (
              <SignUpForm
                locale={locale}
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
