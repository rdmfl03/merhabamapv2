import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";

type HeaderSearchProps = {
  locale: AppLocale;
};

export async function HeaderSearch({ locale }: HeaderSearchProps) {
  const t = await getTranslations("search");

  return (
    <form
      method="get"
      action={`/${locale}/search`}
      className="flex w-full items-center gap-2"
      role="search"
    >
      <label htmlFor="header-search-q" className="sr-only">
        {t("headerLabel")}
      </label>
      <input
        id="header-search-q"
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={t("headerPlaceholder")}
        className="h-9 min-w-0 flex-1 rounded-full border border-border/80 bg-background px-3 text-sm text-foreground shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:max-w-[min(100%,18rem)] lg:max-w-[min(100%,22rem)]"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="h-9 w-9 shrink-0 p-0"
        aria-label={t("headerSubmit")}
      >
        <Search className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}
