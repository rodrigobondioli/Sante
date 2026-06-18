import * as React from "react";
import { cn } from "@/lib/utils";

export type NavPillProps = React.ComponentPropsWithoutRef<"nav">;

export const NavPill = React.forwardRef<HTMLElement, NavPillProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        "fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-pill border border-border bg-surface-card/85 px-6 py-2 backdrop-blur-lg",
        className
      )}
      {...props}
    />
  )
);
NavPill.displayName = "NavPill";
