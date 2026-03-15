import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { PlaceholderState } from "@/components/ui/placeholder-state";
import { Link } from "@/i18n/navigation";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PlaceholderState
        eyebrow={t("eyebrow")}
        title={t("signUpTitle")}
        description={t("signUpDescription")}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled>{t("accountCreationSoon")}</Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signin">{t("goToSignin")}</Link>
          </Button>
        </div>
      </PlaceholderState>
    </div>
  );
}
