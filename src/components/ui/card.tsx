import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "hero" | "glass";

export interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "rounded-xl border border-white/20 bg-surface-card p-6 transition-[border-color,box-shadow] duration-150 hover:border-indigo/80 hover:shadow-indigo-sm",
  hero: "bg-gradient-card rounded-2xl border border-white/20 px-12 py-10",
  glass: "rounded-xl border border-white/20 bg-surface-card/70 backdrop-blur-md",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div ref={ref} className={cn(variantClasses[variant], className)} {...props} />
  )
);
Card.displayName = "Card";
