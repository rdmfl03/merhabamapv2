import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type PublicCtaSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  communityNote?: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
};

export function PublicCtaSection({
  eyebrow,
  title,
  description,
  communityNote,
  primaryCta,
  secondaryCta,
  tertiaryCta,
}: PublicCtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:py-7">
      <Card className="relative overflow-hidden border-brand/25 bg-brand text-brand-foreground shadow-[0_26px_64px_-30px_rgba(227,10,23,0.5)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_34%,rgba(255,255,255,0.05)_100%)]" />
          <div className="absolute right-0 top-0 h-full w-[32%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_68%)]" />
          <div className="absolute -right-20 top-8 h-44 w-44 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-24 w-64 rounded-full bg-black/5 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/22" />
        <CardContent className="relative space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-2.5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-foreground/80">
                {eyebrow}
              </p>
              <h2 className="font-display text-[2rem] leading-[1.08] sm:text-[2.4rem]">{title}</h2>
            </div>
            <div className="space-y-2.5 lg:justify-self-end">
              <p className="max-w-3xl text-sm leading-6 text-brand-foreground/88 sm:text-[0.95rem]">
                {description}
              </p>
              {communityNote ? (
                <p className="max-w-2xl text-sm font-medium leading-6 text-brand-foreground/92">
                  {communityNote}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 border-t border-white/12 pt-4 sm:flex-row sm:flex-wrap">
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
