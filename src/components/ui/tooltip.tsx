"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Hover abre no desktop (CSS, via group-hover) e tap abre/fecha no touch
// (estado React) — as duas formas de interação convivem no mesmo elemento.
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <span
      ref={containerRef}
      onClick={() => setOpen((v) => !v)}
      className={cn("group relative inline-flex cursor-default", className)}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/20 bg-surface-card px-2.5 py-1.5 text-caption text-white opacity-0 shadow-indigo-sm transition-opacity duration-150",
          "group-hover:opacity-100",
          open && "opacity-100"
        )}
      >
        {content}
      </span>
    </span>
  );
}
