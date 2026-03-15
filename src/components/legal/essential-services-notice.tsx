import { Link } from "@/i18n/navigation";

export function EssentialServicesNotice({
  title,
  description,
  privacyLabel,
}: {
  title: string;
  description: string;
  privacyLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4 text-sm leading-6 text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2">
        {description}{" "}
        <Link href="/privacy" className="font-medium text-brand">
          {privacyLabel}
        </Link>
      </p>
    </div>
  );
}
