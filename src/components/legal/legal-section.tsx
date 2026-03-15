import { Card, CardContent } from "@/components/ui/card";
import type { LegalSection as LegalSectionType } from "@/content/legal/content";

export function LegalSection({ section }: { section: LegalSectionType }) {
  return (
    <Card className="border-border/80 bg-white/95">
      <CardContent className="space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-foreground">{section.title}</h2>
        {section.paragraphs?.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
            {paragraph}
          </p>
        ))}
        {section.bullets?.length ? (
          <ul className="space-y-3 pl-5 text-sm leading-7 text-muted-foreground sm:text-[15px]">
            {section.bullets.map((bullet) => (
              <li key={bullet} className="list-disc">
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
