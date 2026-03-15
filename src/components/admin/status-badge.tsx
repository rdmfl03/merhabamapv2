import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  tone: "pending" | "success" | "warning" | "danger" | "default";
  label: string;
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  const className =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : tone === "danger"
          ? "bg-rose-100 text-rose-800"
          : tone === "pending"
            ? "bg-brand-soft text-brand"
            : "bg-white text-foreground";

  return <Badge className={className}>{label}</Badge>;
}
