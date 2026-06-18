"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Check } from "lucide-react";
import {
  criarCategoria,
  editarCategoria,
  desativarCategoria,
  criarProduto,
  editarProduto,
  toggleProduto,
  deletarProduto,
} from "@/lib/cardapio/actions";
import { getImagemAutomatica } from "@/lib/cardapio/drink-images";
import { ImageUpload } from "./image-upload";
import type { CategoriaComProdutosAdmin } from "@/lib/cardapio/queries";
import type { Produto } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Styles ───────────────────────────────────────────────────────────────────
const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "white",
  outline: "none",
  colorScheme: "dark",
  width: "100%",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.38)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 5,
  display: "block",
};

const btnPrimary: React.CSSProperties = {
  background: "#c8ff00",
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.70)",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 6,
  color: "rgba(255,255,255,0.35)",
};

// ─── Produto Form (create or edit) ────────────────────────────────────────────
function ProdutoForm({
  categoriaId,
  produto,
  onDone,
}: {
  categoriaId: string;
  produto?: Produto;
  onDone: () => void;
}) {
  const isEdit = !!produto;
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [imagemUrl, setImagemUrl] = useState<string | null>(produto?.imagem_url ?? null);
  const autoImg = getImagemAutomatica(nome);

  async function handleSubmit(fd: FormData) {
    fd.set("imagem_url", imagemUrl ?? autoImg ?? "");
    if (isEdit) {
      await editarProduto(produto!.id, fd);
    } else {
      await criarProduto(fd);
    }
    onDone();
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    }}>
      <form action={handleSubmit}>
        <input type="hidden" name="categoria_id" value={categoriaId} />

        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          {/* Image upload */}
          <div style={{ flexShrink: 0 }}>
            <label style={lbl}>Foto</label>
            <ImageUpload
              currentUrl={produto?.imagem_url}
              autoUrl={autoImg}
              onUpload={setImagemUrl}
            />
          </div>

          {/* Fields */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <label style={lbl}>Nome</label>
              <input
                autoFocus={!isEdit}
                name="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Caipirinha"
                style={input}
                required
              />
            </div>
            <div>
              <label style={lbl}>Preço (R$)</label>
              <input
                name="preco"
                defaultValue={produto ? String(produto.preco) : ""}
                placeholder="0,00"
                style={input}
                required
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Descrição (opcional)</label>
          <input
            name="descricao"
            defaultValue={produto?.descricao ?? ""}
            placeholder="Ex: Com limão taiti e cachaça artesanal"
            style={input}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={btnPrimary}>
            {isEdit ? "Salvar" : "Adicionar"}
          </button>
          <button type="button" onClick={onDone} style={btnSecondary}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// ─── Produto row ──────────────────────────────────────────────────────────────
function ProdutoRow({
  produto,
  categoriaId,
}: {
  produto: Produto;
  categoriaId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (editing) {
    return (
      <ProdutoForm
        categoriaId={categoriaId}
        produto={produto}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 8,
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        opacity: produto.ativo ? 1 : 0.45,
        transition: "background 0.1s",
      }}
    >
      {/* Thumb */}
      <div style={{
        width: 40, height: 40, borderRadius: 6, flexShrink: 0,
        background: produto.imagem_url
          ? `url(${produto.imagem_url}) center/cover`
          : "rgba(255,255,255,0.06)",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {produto.nome}
        </p>
        {produto.descricao && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {produto.descricao}
          </p>
        )}
      </div>

      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {currency.format(produto.preco)}
      </span>

      {/* Actions — shown on hover */}
      <div style={{ display: "flex", gap: 2, flexShrink: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.1s" }}>
        <button
          onClick={() => setEditing(true)}
          style={{ ...iconBtn }}
          title="Editar"
        >
          <Pencil style={{ width: 13, height: 13 }} />
        </button>
        <form action={toggleProduto.bind(null, produto.id, produto.ativo)}>
          <button
            type="submit"
            style={{ ...iconBtn, color: produto.ativo ? "rgba(255,255,255,0.35)" : "rgba(74,222,128,0.7)" }}
            title={produto.ativo ? "Desativar" : "Ativar"}
          >
            {produto.ativo
              ? <EyeOff style={{ width: 13, height: 13 }} />
              : <Eye style={{ width: 13, height: 13 }} />}
          </button>
        </form>
        <form action={deletarProduto.bind(null, produto.id)}>
          <button
            type="submit"
            onClick={e => { if (!window.confirm(`Deletar "${produto.nome}"?`)) e.preventDefault(); }}
            style={{ ...iconBtn, color: "rgba(239,68,68,0.6)" }}
            title="Deletar produto"
          >
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Categoria sidebar item ───────────────────────────────────────────────────
function CategoriaItem({
  grupo,
  selected,
  onSelect,
}: {
  grupo: CategoriaComProdutosAdmin;
  selected: boolean;
  onSelect: () => void;
}) {
  const [editingNome, setEditingNome] = useState(false);

  if (editingNome) {
    return (
      <form
        action={async (fd) => { await editarCategoria(grupo.categoria.id, fd); setEditingNome(false); }}
        style={{ padding: "4px 8px" }}
      >
        <input
          name="nome"
          defaultValue={grupo.categoria.nome}
          autoFocus
          style={{ ...input, fontSize: 13, padding: "6px 10px" }}
          onKeyDown={e => { if (e.key === "Escape") setEditingNome(false); }}
        />
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <button type="submit" style={{ ...iconBtn, color: "rgba(74,222,128,0.9)" }}>
            <Check style={{ width: 13, height: 13 }} />
          </button>
          <button type="button" onClick={() => setEditingNome(false)} style={iconBtn}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        background: selected ? "rgba(200,255,0,0.08)" : "transparent",
        transition: "background 0.1s",
      }}
      className="group"
    >
      <span style={{
        flex: 1,
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
        color: selected ? "white" : "rgba(255,255,255,0.60)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {grupo.categoria.nome}
      </span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", flexShrink: 0 }}>
        {grupo.produtos.length}
      </span>

      {/* Hover actions */}
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setEditingNome(true)}
          style={{ ...iconBtn, width: 22, height: 22, padding: 0, opacity: selected ? 0.7 : 0 }}
          title="Renomear"
        >
          <Pencil style={{ width: 11, height: 11 }} />
        </button>
        <form action={desativarCategoria.bind(null, grupo.categoria.id)}>
          <button
            type="submit"
            style={{ ...iconBtn, width: 22, height: 22, padding: 0, opacity: selected ? 0.7 : 0, color: "rgba(239,68,68,0.7)" }}
            title="Excluir categoria"
          >
            <Trash2 style={{ width: 11, height: 11 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function CardapioClient({ cardapio }: { cardapio: CategoriaComProdutosAdmin[] }) {
  const [selectedId, setSelectedId] = useState(cardapio[0]?.categoria.id ?? "");
  const [addingProduto, setAddingProduto] = useState(false);
  const [addingCategoria, setAddingCategoria] = useState(false);

  const selectedGrupo = cardapio.find(g => g.categoria.id === selectedId);

  return (
    <div style={{ display: "flex", gap: 0, height: "100%", overflow: "hidden" }}>

      {/* ── Left: category list ── */}
      <div style={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        paddingRight: 16,
        overflowY: "auto",
        paddingBottom: 16,
      }}>
        <p style={{ ...lbl, marginBottom: 12 }}>Categorias</p>

        {cardapio.map(grupo => (
          <CategoriaItem
            key={grupo.categoria.id}
            grupo={grupo}
            selected={selectedId === grupo.categoria.id}
            onSelect={() => { setSelectedId(grupo.categoria.id); setAddingProduto(false); }}
          />
        ))}

        {/* Nova categoria */}
        {addingCategoria ? (
          <form
            action={async (fd) => { await criarCategoria(fd); setAddingCategoria(false); }}
            style={{ padding: "4px 8px", marginTop: 4 }}
          >
            <input
              autoFocus
              name="nome"
              placeholder="Nome da categoria"
              style={{ ...input, fontSize: 13, padding: "6px 10px", marginBottom: 6 }}
              onKeyDown={e => { if (e.key === "Escape") setAddingCategoria(false); }}
              required
            />
            <div style={{ display: "flex", gap: 4 }}>
              <button type="submit" style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>Criar</button>
              <button type="button" onClick={() => setAddingCategoria(false)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 12 }}>×</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingCategoria(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              width: "100%", padding: "8px 12px", marginTop: 4,
              background: "none", border: "none",
              color: "rgba(255,255,255,0.30)", fontSize: 13, cursor: "pointer",
              borderRadius: 8,
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            Nova categoria
          </button>
        )}
      </div>

      {/* ── Right: product list ── */}
      <div style={{ flex: 1, paddingLeft: 28, overflowY: "auto" }}>
        {!selectedGrupo ? (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", paddingTop: 20 }}>
            Selecione uma categoria.
          </p>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>
                {selectedGrupo.categoria.nome}
              </h2>
              <button
                onClick={() => setAddingProduto(p => !p)}
                style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px" }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Novo produto
              </button>
            </div>

            {/* New product form */}
            {addingProduto && (
              <ProdutoForm
                categoriaId={selectedGrupo.categoria.id}
                onDone={() => setAddingProduto(false)}
              />
            )}

            {/* Product list */}
            {selectedGrupo.produtos.length === 0 && !addingProduto ? (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.30)", paddingTop: 8 }}>
                Nenhum produto nesta categoria ainda.
              </p>
            ) : (
              selectedGrupo.produtos.map(p => (
                <ProdutoRow key={p.id} produto={p} categoriaId={selectedGrupo.categoria.id} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
