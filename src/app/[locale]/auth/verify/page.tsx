import { getTranslations, setRequestLocale } from "next-intl/server";

import { RequestVerificationForm } from "@/components/auth/request-verification-form";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderState } from "@/components/ui/placeholder-state";
import { Link } from "@/i18n/navigation";
import { verifyEmailToken } from "@/lib/auth/email-verification";

type VerifyPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyPage({
  params,
  searchParams,
}: VerifyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = await searchParams;
  const token =
    typeof rawSearchParams.token === "string" ? rawSearchParams.token : undefined;
  const email =
    typeof rawSearchParams.email === "string" ? rawSearchParams.email : undefined;
  const t = await getTranslations("auth");

  if (!token) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="bg-white/90">
          <CardContent className="space-y-5 p-6">
            <PlaceholderState
              eyebrow={t("eyebrow")}
              title={t("verifyEmailTitle")}
              description={t("verifyEmailDescription")}
            />
            <RequestVerificationForm
              locale={locale as "de" | "tr"}
              email={email}
              labels={{
                email: t("emailLabel"),
                submit: t("resendVerificationButton"),
                success: t("resendVerificationSuccess"),
                error: t("resendVerificationError"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await verifyEmailToken(token);
  const isSuccess = result.status === "success";
  const titleKey = isSuccess
    ? "verifySuccessTitle"
    : result.status === "expired"
      ? "verifyExpiredTitle"
      : "verifyInvalidTitle";
  const descriptionKey = isSuccess
    ? "verifySuccessDescription"
    : result.status === "expired"
      ? "verifyExpiredDescription"
      : "verifyInvalidDescription";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Card className="bg-white/90">
        <CardContent className="space-y-5 p-6">
          <PlaceholderState
            eyebrow={t("eyebrow")}
            title={t(titleKey)}
            description={t(descriptionKey)}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signin" className="text-sm text-brand">
                {t("backToSignin")}
              </Link>
              {!isSuccess ? (
                <Link href="/auth/verify-email" className="text-sm text-brand">
                  {t("resendVerificationButton")}
                </Link>
              ) : null}
            </div>
          </PlaceholderState>
        </CardContent>
      </Card>
    </div>
  );
}
