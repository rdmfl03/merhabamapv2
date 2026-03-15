import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type PlaceholderStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderState({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderStateProps) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-4 p-8 sm:p-10">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
