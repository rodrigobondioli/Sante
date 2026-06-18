"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth/actions";

export type MembroSimples = { id: string; nome: string; role: string };

const STORAGE_KEY = "sb_operador";

// ─── Tela "Quem é você?" ──────────────────────────────────────────────────────
function QuemEVoce({ membros, onSelect }: { membros: MembroSimples[]; onSelect: (m: MembroSimples) => void }) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
        Quem está operando agora?
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: "white", margin: "0 0 40px", textAlign: "center" }}>
        Selecione seu nome
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12, width: "100%", maxWidth: 560,
      }}>
        {membros.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 14, padding: "20px 16px",
              cursor: "pointer", textAlign: "left",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(38,0,120,0.30)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.40)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(38,0,120,0.40)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "rgba(160,130,255,0.9)",
              marginBottom: 12,
            }}>
              {m.nome[0]?.toUpperCase()}
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white", margin: "0 0 4px" }}>
              {m.nome}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, textTransform: "capitalize" }}>
              {m.role === "bar_manager" ? "Bar Manager" : m.role.charAt(0).toUpperCase() + m.role.slice(1)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export function OperadorShell({
  membros, barNome, children,
}: {
  membros: MembroSimples[];
  barNome: string;
  children: React.ReactNode;
}) {
  const [operador, setOperador] = useState<MembroSimples | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) setOperador(JSON.parse(salvo));
    } catch {}
    setCarregado(true);
  }, []);

  function selecionar(m: MembroSimples) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    setOperador(m);
  }

  function trocar() {
    localStorage.removeItem(STORAGE_KEY);
    setOperador(null);
  }

  if (!carregado) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a10" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,10,16,0.95)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{barNome}</span>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99,
            background: "rgba(38,0,120,0.30)", color: "rgba(160,130,255,0.9)",
          }}>
            Bartender
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {operador ? (
            <>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Operando: </span>
                <span style={{ color: "white", fontWeight: 600 }}>{operador.nome}</span>
              </span>
              <button
                onClick={trocar}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", background: "none", border: "none", cursor: "pointer" }}
              >
                Trocar
              </button>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.30)" }}>Nenhum operador</span>
          )}
          <form action={signOut}>
            <button type="submit" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        {operador
          ? children
          : <QuemEVoce membros={membros} onSelect={selecionar} />
        }
      </main>
    </div>
  );
}
