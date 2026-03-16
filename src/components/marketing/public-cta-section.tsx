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
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Card className="overflow-hidden border-brand/20 bg-brand text-brand-foreground shadow-soft">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="space-y-2.5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-foreground/80">
              {eyebrow}
            </p>
            <h2 className="font-display text-[2rem] leading-tight sm:text-[2.4rem]">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-brand-foreground/85">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/places">{primaryCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/events">{secondaryCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">{tertiaryCta}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
