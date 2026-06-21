"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "ok" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ─── Module-level emitter (survives renders, safe in SSR) ─────────────────────

let _listeners: Array<(items: ToastItem[]) => void> = [];
let _toasts: ToastItem[] = [];
let _nextId = 1;

/** Call from anywhere — client components, action callbacks, etc. */
export function toast(message: string, type: ToastType = "info", durationMs = 3500) {
  const id = _nextId++;
  _toasts = [..._toasts, { id, message, type }];
  _listeners.forEach(l => l(_toasts));
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    _listeners.forEach(l => l(_toasts));
  }, durationMs);
}

// ─── Renderer (add once to root layout) ──────────────────────────────────────

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    _listeners.push(setItems);
    return () => {
      _listeners = _listeners.filter(l => l !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes sb-toast-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", flexDirection: "column", gap: 8,
          maxWidth: 380, width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {items.map(item => (
          <div
            key={item.id}
            role="status"
            style={{
              padding: "12px 16px", borderRadius: 8,
              background:
                item.type === "ok"    ? "var(--ok-bg)"      :
                item.type === "error" ? "var(--danger-bg)"  :
                "color-mix(in srgb, var(--fg) 8%, var(--bg-elevated))",
              border: `1px solid ${
                item.type === "ok"    ? "color-mix(in srgb, var(--ok) 30%, transparent)"     :
                item.type === "error" ? "color-mix(in srgb, var(--danger) 30%, transparent)" :
                "var(--border)"
              }`,
              color:
                item.type === "ok"    ? "var(--ok)"     :
                item.type === "error" ? "var(--danger)"  :
                "var(--fg)",
              fontSize: 13, fontWeight: 500,
              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
              animation: "sb-toast-in 0.18s ease",
            }}
          >
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}
