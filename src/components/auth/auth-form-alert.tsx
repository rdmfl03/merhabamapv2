import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthFormAlertProps = {
  variant: "error" | "success";
  children: ReactNode;
  className?: string;
};

export function AuthFormAlert({ variant, children, className }: AuthFormAlertProps) {
  const isError = variant === "error";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-normal leading-relaxed shadow-soft",
        isError
          ? "border-brand/25 bg-brand-soft text-brand"
          : "border-emerald-300/50 bg-emerald-50/90 text-emerald-950",
        className,
      )}
    >
      {children}
    </div>
  );
}
