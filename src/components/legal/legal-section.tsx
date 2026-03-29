import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { LegalSection as LegalSectionType } from "@/content/legal/content";

function linkifyEmails(text: string, keyPrefix: string): ReactNode[] {
  const emailPattern =
    /[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let occurrence = 0;

  for (const match of text.matchAll(emailPattern)) {
    const email = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    occurrence += 1;
    nodes.push(
      <a
        key={`${keyPrefix}-mailto-${start}-${occurrence}`}
        href={`mailto:${email}`}
        className="font-medium text-brand underline decoration-brand/40 underline-offset-[3px] transition-colors hover:text-brand/90 hover:decoration-brand"
      >
        {email}
      </a>,
    );

    lastIndex = start + email.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function LegalSection({ section }: { section: LegalSectionType }) {
  return (
    <Card className="border-border/80 bg-white/95">
      <CardContent className="space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-foreground">{section.title}</h2>
        {section.paragraphs?.map((paragraph, index) => (
          <p
            key={`p-${section.title}-${index}`}
            className="text-sm leading-7 text-muted-foreground sm:text-[15px]"
          >
            {linkifyEmails(paragraph, `p-${section.title}-${index}`)}
          </p>
        ))}
        {section.bullets?.length ? (
          <ul className="space-y-3 pl-5 text-sm leading-7 text-muted-foreground sm:text-[15px]">
            {section.bullets.map((bullet, index) => (
              <li key={`b-${section.title}-${index}`} className="list-disc">
                {linkifyEmails(bullet, `b-${section.title}-${index}`)}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
