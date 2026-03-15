import { setRequestLocale } from "next-intl/server";

import { requireAdminAccess } from "@/server/actions/admin/shared";

type LocaleAdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: "de" | "tr" }>;
};

export default async function LocaleAdminLayout({
  children,
  params,
}: LocaleAdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminAccess(locale);

  return <div className="pb-12">{children}</div>;
}
