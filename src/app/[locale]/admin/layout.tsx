import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isAppLocale } from "@/i18n/routing";
import { requireAdminAccess } from "@/server/actions/admin/shared";

type LocaleAdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleAdminLayout({
  children,
  params,
}: LocaleAdminLayoutProps) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  await requireAdminAccess(locale);

  return <div className="pb-12">{children}</div>;
}
