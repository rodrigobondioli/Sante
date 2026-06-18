"use client";

import { useState, useEffect } from "react";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

type CategoriaComProdutos = Categoria & { produtos: Produto[] };

type Screen =
  | "splash"
  | "welcome-new"
  | "welcome-back"
  | "categories"
  | "products"
  | "product-detail"
  | "cart";

interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface ClienteLocal {
  nome: string;
  visitas: number;
  ultimaVisita: string;
  ultimoProdutoId?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = "#c8ff00";
const BG = "#0c0c0c";
const CARD = "#161616";
const CARD2 = "#1e1e1e";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function storageKey(barSlug: string) {
  return `sante_menu_${barSlug}`;
}

function readCliente(barSlug: string): ClienteLocal | null {
  try {
    const raw = localStorage.getItem(storageKey(barSlug));
    return raw ? (JSON.parse(raw) as ClienteLocal) : null;
  } catch {
    return null;
  }
}

function writeCliente(barSlug: string, data: ClienteLocal) {
  try {
    localStorage.setItem(storageKey(barSlug), JSON.stringify(data));
  } catch {}
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ordinal(n: number) {
  return `${n}ª`;
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function SplashScreen({
  bar,
  produtos,
  onNext,
}: {
  bar: Bar;
  produtos: Produto[];
  onNext: () => void;
}) {
  const images = produtos
    .filter((p) => p.imagem_url)
    .slice(0, 9)
    .map((p) => p.imagem_url!);

  const tiles = [...images, ...Array(Math.max(0, 9 - images.length)).fill(null)];

  const gradients = [
    "#1a0a2e", "#0d1f2d", "#1a1400", "#0d2d1a",
    "#2d0d0d", "#1a1a0d", "#0d0d2d", "#2d1a0d", "#0d2d2d",
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: BG, position: "relative", overflow: "hidden" }}>
      {/* Mosaic */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        gap: 2,
      }}>
        {tiles.map((url, i) => (
          <div
            key={i}
            style={{
              background: url
                ? `url(${url}) center/cover no-repeat`
                : gradients[i % gradients.length],
              transition: "opacity 600ms",
            }}
          />
        ))}
      </div>

      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "60%",
        background: "linear-gradient(to top, #0c0c0c 45%, rgba(12,12,12,0.6) 70%, transparent)",
        pointerEvents: "none",
      }} />

      {/* Bottom content */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        padding: "0 28px 48px",
      }}>
        <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>
          Bem-vindo
        </p>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: "white", margin: "0 0 8px", lineHeight: 1.05, letterSpacing: "-0.5px" }}>
          {bar.nome}
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.5 }}>
          Entre, faça seu pedido<br />e sinta-se em casa.
        </p>

        <button
          onClick={onNext}
          style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: ACCENT,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${ACCENT}55`,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 11h12M13 7l4 4-4 4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── WELCOME NEW ──────────────────────────────────────────────────────────────
function WelcomeNewScreen({ bar, onConfirm }: { bar: Bar; onConfirm: (nome: string) => void }) {
  const [nome, setNome] = useState("");
  const valid = nome.trim().length > 0;

  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      padding: "64px 28px 48px",
      justifyContent: "space-between",
    }}>
      <div>
        <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 20px" }}>
          {bar.nome}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "white", margin: "0 0 12px", lineHeight: 1.15 }}>
          Antes de começar,<br />como posso te chamar?
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.6 }}>
          Vou lembrar de você nas próximas visitas.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valid && onConfirm(nome.trim())}
          placeholder="Seu nome"
          style={{
            background: CARD2,
            border: `1px solid ${valid ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 16,
            padding: "20px 22px",
            fontSize: 20,
            fontWeight: 500,
            color: "white",
            outline: "none",
            colorScheme: "dark",
            width: "100%",
            boxSizing: "border-box",
            transition: "border-color 200ms",
          }}
        />
        <button
          onClick={() => valid && onConfirm(nome.trim())}
          style={{
            background: valid ? ACCENT : "rgba(255,255,255,0.06)",
            color: valid ? "#000" : "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: 16,
            padding: "20px",
            fontSize: 16,
            fontWeight: 800,
            cursor: valid ? "pointer" : "default",
            transition: "all 250ms",
            letterSpacing: "-0.2px",
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ─── WELCOME BACK ─────────────────────────────────────────────────────────────
function WelcomeBackScreen({
  cliente,
  ultimoProduto,
  onContinue,
  onRepeat,
}: {
  cliente: ClienteLocal;
  ultimoProduto: Produto | null;
  onContinue: () => void;
  onRepeat: (produto: Produto) => void;
}) {
  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      padding: "64px 28px 48px",
      justifyContent: "space-between",
    }}>
      <div>
        <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 20px" }}>
          De volta!
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "white", margin: "0 0 12px", lineHeight: 1.1 }}>
          Boa noite,<br />{cliente.nome} 🥃
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.6 }}>
          {cliente.visitas <= 1
            ? "Primeira vez aqui. Que bom ter você!"
            : `Essa é sua ${ordinal(cliente.visitas)} visita.\nVocê faz parte da família.`}
        </p>
      </div>

      {ultimoProduto && (
        <div style={{
          background: CARD,
          borderRadius: 18,
          padding: "20px",
          border: "1px solid rgba(200,255,0,0.10)",
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>
            Da última vez você pediu
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {ultimoProduto.imagem_url && (
              <img
                src={ultimoProduto.imagem_url}
                style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                alt={ultimoProduto.nome}
              />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0 }}>{ultimoProduto.nome}</p>
              <p style={{ fontSize: 13, color: ACCENT, margin: "3px 0 0", fontWeight: 600 }}>{fmt(ultimoProduto.preco)}</p>
            </div>
            <button
              onClick={() => onRepeat(ultimoProduto)}
              style={{
                background: ACCENT, color: "#000",
                border: "none", borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13, fontWeight: 800,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              De novo
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        style={{
          background: ACCENT, color: "#000",
          border: "none", borderRadius: 16,
          padding: "20px",
          fontSize: 16, fontWeight: 800,
          cursor: "pointer",
          letterSpacing: "-0.2px",
        }}
      >
        Ver cardápio →
      </button>
    </div>
  );
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
function CategoriesScreen({
  cardapio,
  onSelect,
  cartCount,
  onCart,
}: {
  cardapio: CategoriaComProdutos[];
  onSelect: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
}) {
  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "56px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.15 }}>
          Qual vai ser a<br />boa de hoje?
        </h1>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              background: ACCENT, color: "#000",
              border: "none", borderRadius: 99,
              padding: "10px 18px",
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              flexShrink: 0, marginTop: 4,
            }}
          >
            🛒 {cartCount} {cartCount === 1 ? "item" : "itens"}
          </button>
        )}
      </div>

      {/* Category list */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 28px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        {cardapio.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 22px",
              borderRadius: 16,
              background: i === 0 ? ACCENT : CARD,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "opacity 100ms",
            }}
          >
            <div>
              <span style={{ fontSize: 17, fontWeight: 700, color: i === 0 ? "#000" : "white", display: "block" }}>
                {cat.nome}
              </span>
              <span style={{ fontSize: 12, color: i === 0 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.35)", marginTop: 2, display: "block" }}>
                {cat.produtos.length} {cat.produtos.length === 1 ? "item" : "itens"}
              </span>
            </div>
            <span style={{ fontSize: 20, color: i === 0 ? "#000" : "rgba(255,255,255,0.25)", fontWeight: 300 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
function ProductsScreen({
  categoria,
  onSelect,
  onBack,
  cartCount,
  onCart,
}: {
  categoria: CategoriaComProdutos;
  onSelect: (p: Produto) => void;
  onBack: () => void;
  cartCount: number;
  onCart: () => void;
}) {
  const ativos = categoria.produtos.filter((p) => p.ativo);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 10, display: "block" }}
          >
            ← Voltar
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0 }}>
            {categoria.nome}
          </h1>
        </div>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              background: ACCENT, color: "#000",
              border: "none", borderRadius: 99,
              padding: "10px 18px",
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
              flexShrink: 0, marginTop: 32,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
      </div>

      {/* Product list */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 28px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        {ativos.map((produto) => (
          <button
            key={produto.id}
            onClick={() => onSelect(produto)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: CARD,
              border: "none",
              borderRadius: 16,
              padding: 14,
              cursor: "pointer",
              textAlign: "left",
              transition: "opacity 100ms",
            }}
          >
            {produto.imagem_url ? (
              <img
                src={produto.imagem_url}
                style={{ width: 76, height: 76, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                alt={produto.nome}
              />
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: 12, background: CARD2, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 4px", lineHeight: 1.3 }}>{produto.nome}</p>
              {produto.descricao && (
                <p style={{
                  fontSize: 12, color: "rgba(255,255,255,0.38)", margin: "0 0 8px",
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5,
                }}>
                  {produto.descricao}
                </p>
              )}
              <p style={{ fontSize: 15, fontWeight: 800, color: ACCENT, margin: 0 }}>{fmt(produto.preco)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetailScreen({
  produto,
  onBack,
  onAdd,
  cartCount,
  onCart,
}: {
  produto: Produto;
  onBack: () => void;
  onAdd: (produto: Produto, qty: number) => void;
  cartCount: number;
  onCart: () => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 320, flexShrink: 0 }}>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            alt={produto.nome}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: CARD2 }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.3) 60%, transparent)",
        }} />

        <button
          onClick={onBack}
          style={{
            position: "absolute", top: 52, left: 20,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            border: "none", borderRadius: 99,
            padding: "9px 16px",
            color: "white", fontSize: 13, cursor: "pointer",
          }}
        >
          ← Voltar
        </button>

        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              position: "absolute", top: 52, right: 20,
              background: ACCENT,
              border: "none", borderRadius: 99,
              padding: "9px 16px",
              color: "#000", fontSize: 13, fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🛒 {cartCount}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "22px 28px 140px" }}>
        {/* Badge */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, padding: "4px 12px", borderRadius: 99,
            background: "rgba(200,255,0,0.10)",
            color: ACCENT,
            fontWeight: 600, letterSpacing: 0.5,
          }}>
            Especialidade da casa
          </span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "white", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-0.5px" }}>
          {produto.nome}
        </h1>

        {produto.descricao && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 24px", lineHeight: 1.7 }}>
            {produto.descricao}
          </p>
        )}

        <p style={{ fontSize: 28, fontWeight: 800, color: "white", margin: "0 0 32px", letterSpacing: "-0.5px" }}>
          {fmt(produto.preco)}
        </p>

        {/* Quantity picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Quantidade</span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: CARD2, border: "none",
                color: "white", fontSize: 20,
                cursor: qty > 1 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: qty > 1 ? 1 : 0.3,
              }}
            >−</button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "white", minWidth: 24, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: ACCENT, border: "none",
                color: "#000", fontSize: 20,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >+</button>
          </div>
        </div>
      </div>

      {/* Fixed bottom */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 28px 36px",
        background: `linear-gradient(to top, ${BG} 70%, transparent)`,
        display: "flex", gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: "17px",
            borderRadius: 16, background: CARD,
            border: "none", color: "rgba(255,255,255,0.6)",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          Voltar
        </button>
        <button
          onClick={() => onAdd(produto, qty)}
          style={{
            flex: 2.5, padding: "17px",
            borderRadius: 16, background: ACCENT,
            border: "none", color: "#000",
            fontSize: 15, fontWeight: 800,
            cursor: "pointer", letterSpacing: "-0.2px",
          }}
        >
          Pedir agora · {fmt(produto.preco * qty)}
        </button>
      </div>
    </div>
  );
}

// ─── CART ─────────────────────────────────────────────────────────────────────
function CartScreen({
  cliente,
  cart,
  mesa,
  onBack,
}: {
  cliente: ClienteLocal | null;
  cart: CartItem[];
  mesa: Mesa;
  onBack: () => void;
}) {
  const total = cart.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);
  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 28px 24px", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20, display: "block" }}
        >
          ← Continuar pedindo
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACCENT}, #80e000)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#000", flexShrink: 0,
          }}>
            {cliente?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Olá, {cliente?.nome ?? "você"}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>
              {cliente && cliente.visitas > 1
                ? `Seja bem-vindo de volta · ${ordinal(cliente.visitas)} visita`
                : mesaLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 28px" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 16px", fontWeight: 600 }}>
          Sua consumação
        </p>
        {cart.map((item) => (
          <div key={item.produto.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {item.produto.imagem_url ? (
              <img
                src={item.produto.imagem_url}
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                alt={item.produto.nome}
              />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: CARD2, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0, lineHeight: 1.3 }}>
                {item.quantidade > 1 && (
                  <span style={{ color: ACCENT, fontWeight: 800, marginRight: 6 }}>{item.quantidade}×</span>
                )}
                {item.produto.nome}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, flexShrink: 0 }}>
              {fmt(item.produto.preco * item.quantidade)}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 28px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.45)" }}>Total a pagar</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>{fmt(total)}</span>
        </div>
        <button
          style={{
            width: "100%", padding: "20px",
            borderRadius: 16, background: ACCENT,
            border: "none", color: "#000",
            fontSize: 16, fontWeight: 800,
            cursor: "pointer", letterSpacing: "-0.2px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          Fechar a conta e pagar →
        </button>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "14px 0 0" }}>
          Pagamento em breve
        </p>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 56, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      background: ACCENT,
      color: "#000", padding: "10px 22px",
      borderRadius: 99, fontSize: 13, fontWeight: 800,
      zIndex: 200, pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      🔥 Pedido recebido!
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function MenuApp({
  bar,
  mesa,
  cardapio,
}: {
  bar: Bar;
  mesa: Mesa;
  cardapio: CategoriaComProdutos[];
}) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [cliente, setCliente] = useState<ClienteLocal | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaComProdutos | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState(false);

  const allProdutos = cardapio.flatMap((c) => c.produtos);

  useEffect(() => {
    const stored = readCliente(bar.slug);
    if (stored) setCliente(stored);
  }, [bar.slug]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleSplashNext = () => {
    if (cliente) {
      const updated = { ...cliente, visitas: cliente.visitas + 1, ultimaVisita: new Date().toISOString() };
      setCliente(updated);
      writeCliente(bar.slug, updated);
      setScreen("welcome-back");
    } else {
      setScreen("welcome-new");
    }
  };

  const handleNomeConfirm = (nome: string) => {
    const novo: ClienteLocal = { nome, visitas: 1, ultimaVisita: new Date().toISOString() };
    setCliente(novo);
    writeCliente(bar.slug, novo);
    setScreen("categories");
  };

  const handleAddToCart = (produto: Produto, qty: number) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.produto.id === produto.id);
      if (exists) return prev.map((i) => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + qty } : i);
      return [...prev, { produto, quantidade: qty }];
    });
    // Save last produto id
    if (cliente) {
      const updated = { ...cliente, ultimoProdutoId: produto.id };
      setCliente(updated);
      writeCliente(bar.slug, updated);
    }
    showToast();
    setScreen("products");
  };

  const cartCount = cart.reduce((acc, i) => acc + i.quantidade, 0);

  const ultimoProduto = cliente?.ultimoProdutoId
    ? (allProdutos.find((p) => p.id === cliente.ultimoProdutoId) ?? null)
    : null;

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", fontFamily: "var(--font-geist, system-ui, sans-serif)" }}>
      <Toast visible={toast} />

      {screen === "splash" && (
        <SplashScreen bar={bar} produtos={allProdutos} onNext={handleSplashNext} />
      )}
      {screen === "welcome-new" && (
        <WelcomeNewScreen bar={bar} onConfirm={handleNomeConfirm} />
      )}
      {screen === "welcome-back" && cliente && (
        <WelcomeBackScreen
          cliente={cliente}
          ultimoProduto={ultimoProduto}
          onContinue={() => setScreen("categories")}
          onRepeat={(p) => {
            setSelectedProduto(p);
            const cat = cardapio.find((c) => c.id === p.categoria_id);
            if (cat) setSelectedCategoria(cat);
            setScreen("product-detail");
          }}
        />
      )}
      {screen === "categories" && (
        <CategoriesScreen
          cardapio={cardapio}
          onSelect={(cat) => { setSelectedCategoria(cat); setScreen("products"); }}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
        />
      )}
      {screen === "products" && selectedCategoria && (
        <ProductsScreen
          categoria={selectedCategoria}
          onSelect={(p) => { setSelectedProduto(p); setScreen("product-detail"); }}
          onBack={() => setScreen("categories")}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
        />
      )}
      {screen === "product-detail" && selectedProduto && (
        <ProductDetailScreen
          produto={selectedProduto}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
          onAdd={handleAddToCart}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
        />
      )}
      {screen === "cart" && (
        <CartScreen
          cliente={cliente}
          cart={cart}
          mesa={mesa}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
        />
      )}
    </div>
  );
}
