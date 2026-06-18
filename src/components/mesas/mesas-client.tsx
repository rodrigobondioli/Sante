"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { criarMesa, editarMesa, removerMesa } from "@/lib/mesas/actions";
import type { Mesa } from "@/types/database";

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "white",
  outline: "none", colorScheme: "dark", boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "#260078", color: "white", border: "none", borderRadius: 8,
  padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
};

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", padding: 6, borderRadius: 6,
  color: "rgba(255,255,255,0.35)",
};

function MesaRow({ mesa }: { mesa: Mesa }) {
  const [editing, setEditing] = useState(false);
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;

  if (editing) {
    return (
      <form
        action={async (fd) => { await editarMesa(mesa.id, fd); setEditing(false); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", width: 32, flexShrink: 0 }}>
          #{mesa.numero}
        </span>
        <input name="nome" defaultValue={mesa.nome ?? ""} placeholder="Apelido (opcional)" style={{ ...inp, flex: 1 }} />
        <input name="capacidade" defaultValue={mesa.capacidade ?? ""} placeholder="Lugares" style={{ ...inp, width: 90 }} type="number" min={1} />
        <button type="submit" style={{ ...iconBtn, color: "rgba(74,222,128,0.9)" }}><Check style={{ width: 14, height: 14 }} /></button>
        <button type="button" onClick={() => setEditing(false)} style={iconBtn}><X style={{ width: 14, height: 14 }} /></button>
      </form>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", width: 32, flexShrink: 0 }}>#{mesa.numero}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "white", flex: 1 }}>{label}</span>
      {mesa.capacidade && (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{mesa.capacidade} lugares</span>
      )}
      <div style={{ display: "flex", gap: 2 }}>
        <button onClick={() => setEditing(true)} style={iconBtn} title="Editar"><Pencil style={{ width: 13, height: 13 }} /></button>
        <form action={removerMesa.bind(null, mesa.id)}>
          <button type="submit" style={{ ...iconBtn, color: "rgba(239,68,68,0.60)" }} title="Remover">
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function MesasClient({ mesas, barId }: { mesas: Mesa[]; barId: string }) {
  const [adding, setAdding] = useState(false);
  void barId;

  return (
    <div>
      {/* List */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
        {mesas.length === 0 && !adding && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", padding: "24px 16px", margin: 0 }}>
            Nenhuma mesa cadastrada ainda.
          </p>
        )}
        {mesas.map(m => <MesaRow key={m.id} mesa={m} />)}

        {adding ? (
          <form
            action={async (fd) => { await criarMesa(fd); setAdding(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderTop: mesas.length > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
          >
            <input autoFocus name="numero" placeholder="Nº" type="number" min={1} style={{ ...inp, width: 70 }} required />
            <input name="nome" placeholder="Apelido (ex: Varanda, Balcão VIP)" style={{ ...inp, flex: 1 }} />
            <input name="capacidade" placeholder="Lugares" type="number" min={1} style={{ ...inp, width: 90 }} />
            <button type="submit" style={{ ...btnPrimary, padding: "8px 14px" }}>Adicionar</button>
            <button type="button" onClick={() => setAdding(false)} style={{ ...btnPrimary, background: "rgba(255,255,255,0.07)" }}>×</button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "12px 16px",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.30)", fontSize: 13, cursor: "pointer",
              borderTop: mesas.length > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Adicionar mesa
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
        O campo &ldquo;Apelido&rdquo; é opcional — se vazio, aparece como &ldquo;Mesa {"{número}"}&rdquo; para o bartender.
        O &ldquo;Balcão&rdquo; existe por padrão e não precisa ser cadastrado.
      </p>
    </div>
  );
}
