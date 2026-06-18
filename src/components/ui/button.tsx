import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "op";
type ButtonSize = "default" | "lg";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "rounded-pill bg-indigo px-7 py-3 font-medium text-white hover:bg-indigo-light",
  secondary:
    "rounded-pill border border-white-20 bg-transparent px-7 py-3 text-white hover:border-indigo",
  ghost: "px-5 py-3 text-white-80 hover:text-white",
  // Apenas surfaces operacionais (PDV, Bartender) — touch target mínimo 48px, DESIGN.md §7.2
  op: "min-h-12 rounded-lg bg-indigo font-semibold text-white hover:bg-indigo-light",
};

const opSizeClasses: Record<ButtonSize, string> = {
  default: "text-base",
  lg: "min-h-14 px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        variant === "op" && opSizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
