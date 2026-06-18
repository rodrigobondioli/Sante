import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral" | "indigo";

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  // success/error/warning/info: apenas em surfaces operacionais (PDV, Bartender, CS Admin) — DESIGN.md §2.3
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  neutral: "bg-white/8 text-white/70",
  indigo: "bg-indigo/25 text-[#A78BFA]",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
