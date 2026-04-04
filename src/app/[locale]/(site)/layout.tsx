import { setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { isAppLocale } from "@/i18n/routing";

type SiteChromeLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function SiteChromeLayout({ children, params }: SiteChromeLayoutProps) {
  const { locale } = await params;
  if (isAppLocale(locale)) {
    setRequestLocale(locale);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">{children}</main>
      <Footer />
    </div>
  );
}
