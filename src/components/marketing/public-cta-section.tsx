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
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Card className="relative overflow-hidden border-brand/20 bg-brand text-brand-foreground shadow-[0_28px_70px_-30px_rgba(227,10,23,0.55)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_42%)]" />
          <div className="absolute -right-16 top-6 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-24 w-64 rounded-full bg-black/5 blur-3xl" />
        </div>
        <CardContent className="relative space-y-6 p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-foreground/80">
              {eyebrow}
            </p>
            <h2 className="font-display text-[2rem] leading-tight sm:text-[2.4rem]">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-brand-foreground/88 sm:text-[0.95rem]">
              {description}
            </p>
            {communityNote ? (
              <p className="max-w-2xl text-sm font-medium leading-6 text-brand-foreground/94">
                {communityNote}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5 border-t border-white/15 pt-5 sm:flex-row sm:flex-wrap">
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
