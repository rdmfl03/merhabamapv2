import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { EssentialServicesNotice } from "@/components/legal/essential-services-notice";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  isInviteOnlyRegistrationEnabled,
  isUserRegistrationEnabled,
} from "@/lib/auth/config";
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

  return (
    <div className="flex justify-center px-4 py-12">
      <div className="w-full max-w-xl">
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

            {canRegister ? (
              <SignUpForm
                locale={locale}
                requireInviteCode={inviteOnlyEnabled}
                labels={{
                  name: t("nameLabel"),
                  email: t("emailLabel"),
                  inviteCode: t("inviteCodeLabel"),
                  inviteCodeHint: t("inviteCodeHint"),
                  password: t("passwordLabel"),
                  confirmPassword: t("confirmPasswordLabel"),
                  submit: t("signUpButton"),
                  success: t("signUpSuccess"),
                  validationError: t("signUpError"),
                  passwordTooShort: t("signUpPasswordTooShort"),
                  passwordTooLong: t("signUpPasswordTooLong"),
                  passwordNeedsUppercase: t("signUpPasswordNeedsUppercase"),
                  passwordNeedsLowercase: t("signUpPasswordNeedsLowercase"),
                  passwordNeedsNumber: t("signUpPasswordNeedsNumber"),
                  emailInvalid: t("signUpEmailInvalid"),
                  emailTooLong: t("signUpEmailTooLong"),
                  nameTooLong: t("signUpNameTooLong"),
                  confirmPasswordTooShort: t("signUpConfirmPasswordTooShort"),
                  confirmPasswordTooLong: t("signUpConfirmPasswordTooLong"),
                  inviteCodeTooLong: t("signUpInviteCodeTooLong"),
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
      </div>
    </div>
  );
}
