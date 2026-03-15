import { getTranslations, setRequestLocale } from "next-intl/server";

import { DemoAccountsCard } from "@/components/dev/demo-accounts-card";
import { SignInForm } from "@/app/[locale]/auth/signin/sign-in-form";
import { Card, CardContent } from "@/components/ui/card";
import { isDevDemoUiEnabled } from "@/lib/dev/runtime";
import { Link } from "@/i18n/navigation";

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({
  params,
  searchParams,
}: SignInPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });
  const error =
    typeof rawSearchParams.error === "string" ? rawSearchParams.error : undefined;
  const next =
    typeof rawSearchParams.next === "string" ? rawSearchParams.next : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl text-foreground">{t("signInTitle")}</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("signInDescription")}
              </p>
            </div>

            {error ? <p className="text-sm text-brand">{t("signInError")}</p> : null}

            <SignInForm
              locale={locale}
              next={next}
              labels={{
                email: t("emailLabel"),
                password: t("passwordLabel"),
                submit: t("signInButton"),
              }}
            />

            <div className="flex justify-start">
              <div className="flex flex-col gap-2 text-sm text-brand">
                <Link href="/auth/signup">{t("goToSignup")}</Link>
                <Link href="/auth/forgot-password">{t("forgotPasswordLink")}</Link>
                <Link href="/auth/verify-email">{t("verifyEmailLink")}</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {isDevDemoUiEnabled() ? (
          <DemoAccountsCard
            labels={{
              title: t("demoAccountsTitle"),
              description: t("demoAccountsDescription"),
              role: t("demoAccountsRole"),
              hidden: t("demoAccountsPasswordHint"),
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
