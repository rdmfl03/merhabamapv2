import type { Route } from "next";
import { redirect } from "next/navigation";

type RedirectProps = {
  params: Promise<{ locale: "de" | "tr" }>;
  searchParams: Promise<{ city?: string | string[] }>;
};

function firstCityParam(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return firstCityParam(raw[0]);
  }
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !/^[a-z0-9-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export default async function LegacyCitiesMapRedirect({ params, searchParams }: RedirectProps) {
  const { locale } = await params;
  const city = firstCityParam((await searchParams).city);
  const suffix = city ? `?city=${encodeURIComponent(city)}` : "";
  redirect(`/${locale}/map${suffix}` as Route);
}
