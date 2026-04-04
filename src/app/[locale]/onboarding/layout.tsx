import { LanguageSwitcher } from "@/components/layout/language-switcher";

type OnboardingLayoutProps = {
  children: React.ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute right-0 top-0 z-10 flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="pointer-events-auto">
          <LanguageSwitcher />
        </div>
      </div>
      {children}
    </div>
  );
}
