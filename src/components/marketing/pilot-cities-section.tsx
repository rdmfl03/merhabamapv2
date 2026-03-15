import { MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type PilotCity = {
  slug: string;
  name: string;
  placesCount: number;
  eventsCount: number;
};

type PilotCitiesSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  placesLabel: string;
  eventsLabel: string;
  cities: PilotCity[];
};

export function PilotCitiesSection({
  eyebrow,
  title,
  description,
  ctaLabel,
  placesLabel,
  eventsLabel,
  cities,
}: PilotCitiesSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="mb-6 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cities.map((city) => (
          <Card key={city.slug} className="bg-white/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {city.placesCount} {placesLabel} • {city.eventsCount} {eventsLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/cities/${city.slug}`}>{ctaLabel}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/places?city=${city.slug}`}>{placesLabel}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/events?city=${city.slug}`}>{eventsLabel}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
