import { redirect } from "next/navigation";

type LegacyInterestsRedirectProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

/** Old URL: send users to the place-interests step. */
export default async function LegacyOnboardingInterestsRedirect({
  params,
}: LegacyInterestsRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale}/onboarding/places`);
}
