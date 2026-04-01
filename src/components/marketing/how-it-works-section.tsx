import { Card, CardContent } from "@/components/ui/card";

type Step = {
  step: string;
  title: string;
  description: string;
};

type HowItWorksSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  steps: Step[];
};

export function HowItWorksSection({
  eyebrow,
  title,
  description,
  steps,
}: HowItWorksSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-7 sm:py-8">
      <div className="mb-5 space-y-2.5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl text-foreground sm:text-[2.25rem]">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.step} className="border-border/70 bg-white/88 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.14)]">
            <CardContent className="space-y-3 p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                {step.step}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
