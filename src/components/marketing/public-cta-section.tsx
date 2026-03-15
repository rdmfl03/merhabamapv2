import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type PublicCtaSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
};

export function PublicCtaSection({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  tertiaryCta,
}: PublicCtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <Card className="overflow-hidden border-brand/20 bg-brand text-brand-foreground shadow-soft">
        <CardContent className="space-y-6 p-8 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-foreground/80">
              {eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-brand-foreground/85">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/places">{primaryCta}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/events">{secondaryCta}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signup">{tertiaryCta}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
