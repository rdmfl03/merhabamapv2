import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

type CitySlugRedirectProps = {
  params: Promise<{ locale: "de" | "tr"; slug: string }>;
};

export default async function CitySlugRedirect({ params }: CitySlugRedirectProps) {
  const { locale, slug } = await params;

  if (slug === "map") {
    redirect(`/${locale}/map`);
  }

  const city = await prisma.city.findUnique({
    where: { slug },
    select: { slug: true },
  });

  if (!city) {
    notFound();
  }

  redirect(`/${locale}/map?city=${city.slug}`);
}
