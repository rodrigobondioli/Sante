import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-white/5 px-4 py-3 font-sans text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white-50",
        "focus:border-indigo focus:ring-[3px] focus:ring-indigo/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
