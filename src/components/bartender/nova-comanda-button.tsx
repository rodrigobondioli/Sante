"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { criarComanda } from "@/lib/bartender/actions";

export function NovaComandaButton() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px",
          background: "#260078", border: "none", borderRadius: 12,
          color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Plus style={{ width: 18, height: 18 }} />
        Nova comanda
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div style={{
            position: "fixed", zIndex: 101,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(440px, calc(100vw - 32px))",
            background: "#16162a",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: "24px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.60)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>Nova comanda</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", display: "flex", padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form action={async (fd) => { setOpen(false); await criarComanda(fd); }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>
                Identificador
              </label>
              <input
                ref={inputRef}
                name="identificador"
                placeholder="Ex: Mesa 3, Balcão, João"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10, padding: "12px 14px",
                  fontSize: 15, color: "white", outline: "none",
                  colorScheme: "dark", marginBottom: 20,
                } as React.CSSProperties}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1, padding: "12px",
                    background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10,
                    color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: "12px",
                    background: "#260078", border: "none", borderRadius: 10,
                    color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Abrir comanda
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
