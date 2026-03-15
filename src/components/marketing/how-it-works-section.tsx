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
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="mb-6 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.step} className="bg-white/90">
            <CardContent className="space-y-3 p-6">
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
