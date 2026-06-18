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
  onNext,
}: {
  bar: Bar;
  onNext: () => void;
}) {
  const DURATION = 2800;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min((Date.now() - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onNext();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onNext]);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      background: BG,
    }}>
      {/* Animated gradient background */}
      <style>{`
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0a0a1e 0%, #0b1f10 25%, #1a0b0e 50%, #0a1525 75%, #100a1a 100%)",
        backgroundSize: "400% 400%",
        animation: "gradShift 5s ease infinite",
      }} />
      {/* Noise texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.6,
        pointerEvents: "none",
      }} />

      {/* Center content */}
      <div style={{ position: "relative", textAlign: "center", animation: "fadeIn 600ms ease both" }}>
        <p style={{
          fontSize: 11, color: ACCENT, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: 3,
          margin: "0 0 16px",
        }}>
          Bem-vindo
        </p>
        <h1 style={{
          fontSize: 42, fontWeight: 900, color: "white",
          margin: 0, lineHeight: 1.0, letterSpacing: "-1px",
          textShadow: "0 2px 32px rgba(0,0,0,0.5)",
        }}>
          {bar.nome}
        </h1>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.38)",
          margin: "14px 0 0", letterSpacing: "0.3px",
        }}>
          Mesa pronta. Cardápio a caminho.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 48, left: 40, right: 40,
        height: 2, background: "rgba(255,255,255,0.1)",
        borderRadius: 99,
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: ACCENT,
          width: `${progress * 100}%`,
          transition: "width 50ms linear",
          boxShadow: `0 0 8px ${ACCENT}88`,
        }} />
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
  allProdutos,
  onContinue,
  onRepeat,
}: {
  cliente: ClienteLocal;
  ultimoProduto: Produto | null;
  allProdutos: Produto[];
  onContinue: () => void;
  onRepeat: (produto: Produto) => void;
}) {
  // Sugestões: produtos com imagem excluindo o último pedido, pega 3
  const sugestoes = allProdutos
    .filter((p) => p.ativo && p.imagem_url && p.id !== ultimoProduto?.id)
    .slice(0, 3);

  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      overflow: "auto",
    }}>
      {/* Top section */}
      <div style={{ padding: "64px 28px 28px" }}>
        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2.5, margin: "0 0 16px" }}>
          De volta!
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-0.5px" }}>
          Boa noite,<br />{cliente.nome} 🥃
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.6 }}>
          {cliente.visitas <= 1
            ? "Primeira vez aqui. Que bom ter você!"
            : `${ordinal(cliente.visitas)} visita. Você faz parte da família.`}
        </p>
      </div>

      {/* Last order */}
      {ultimoProduto && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 10px 4px", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>
            Da última vez
          </p>
          <div style={{
            background: CARD,
            borderRadius: 18,
            overflow: "hidden",
            display: "flex",
            alignItems: "stretch",
            border: `1px solid rgba(200,255,0,0.12)`,
          }}>
            <div style={{ flex: 1, padding: "18px 16px 18px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 4px" }}>{ultimoProduto.nome}</p>
              <p style={{ fontSize: 14, color: ACCENT, margin: "0 0 14px", fontWeight: 700 }}>{fmt(ultimoProduto.preco)}</p>
              <button
                onClick={() => onRepeat(ultimoProduto)}
                style={{
                  background: ACCENT, color: "#000",
                  border: "none", borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 13, fontWeight: 800,
                  cursor: "pointer", alignSelf: "flex-start",
                }}
              >
                De novo →
              </button>
            </div>
            {ultimoProduto.imagem_url && (
              <div style={{ width: 110, flexShrink: 0 }}>
                <img
                  src={ultimoProduto.imagem_url}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  alt={ultimoProduto.nome}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 10px 4px", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>
            Você pode gostar
          </p>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {sugestoes.map((p) => (
              <button
                key={p.id}
                onClick={() => onRepeat(p)}
                style={{
                  flexShrink: 0,
                  width: 120,
                  background: CARD,
                  border: "none",
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                {p.imagem_url && (
                  <img
                    src={p.imagem_url}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
                    alt={p.nome}
                  />
                )}
                <div style={{ padding: "10px 12px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "white", margin: "0 0 3px", lineHeight: 1.3 }}>{p.nome}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, margin: 0 }}>{fmt(p.preco)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "8px 20px 48px", marginTop: "auto" }}>
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            background: ACCENT, color: "#000",
            border: "none", borderRadius: 16,
            padding: "20px",
            fontSize: 16, fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "-0.2px",
          }}
        >
          Ver cardápio completo →
        </button>
      </div>
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
      <div style={{ padding: "56px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
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

      {/* Category cards — fill remaining height */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {cardapio.map((cat) => {
          const coverImg = cat.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              style={{
                flex: 1,
                position: "relative",
                borderRadius: 20,
                overflow: "hidden",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
                background: CARD,
              }}
            >
              {/* Background image — full opacity */}
              {coverImg && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${coverImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }} />
              )}
              {/* Gradient only at bottom for text legibility */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)",
              }} />
              {/* Content */}
              <div style={{
                position: "relative",
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                padding: "18px 20px",
              }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "white", display: "block", letterSpacing: "-0.3px" }}>
                    {cat.nome}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, display: "block" }}>
                    {cat.produtos.length} {cat.produtos.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: ACCENT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
function ProductsScreen({
  categoria,
  allCategorias,
  onSelect,
  onBack,
  onSwitchCategoria,
  cartCount,
  onCart,
}: {
  categoria: CategoriaComProdutos;
  allCategorias: CategoriaComProdutos[];
  onSelect: (p: Produto) => void;
  onBack: () => void;
  onSwitchCategoria: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
}) {
  const ativos = categoria.produtos.filter((p) => p.ativo);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <button
              onClick={onBack}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8, display: "block" }}
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
                flexShrink: 0, marginTop: 28,
              }}
            >
              🛒 {cartCount}
            </button>
          )}
        </div>
        {/* Category filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }}>
          {allCategorias.map((cat) => {
            const active = cat.id === categoria.id;
            return (
              <button
                key={cat.id}
                onClick={() => !active && onSwitchCategoria(cat)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: active ? "none" : "1px solid rgba(255,255,255,0.12)",
                  background: active ? ACCENT : "transparent",
                  color: active ? "#000" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: active ? 800 : 500,
                  cursor: active ? "default" : "pointer",
                  transition: "all 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.nome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product list */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 20px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        {ativos.map((produto) => (
          <button
            key={produto.id}
            onClick={() => onSelect(produto)}
            style={{
              display: "flex",
              alignItems: "stretch",
              background: CARD,
              border: "none",
              borderRadius: 18,
              overflow: "hidden",
              cursor: "pointer",
              textAlign: "left",
              minHeight: 96,
              padding: 0,
            }}
          >
            {/* Text side */}
            <div style={{ flex: 1, padding: "16px 16px 16px 18px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 5px", lineHeight: 1.3 }}>{produto.nome}</p>
              {produto.descricao && (
                <p style={{
                  fontSize: 12, color: "rgba(255,255,255,0.38)", margin: "0 0 8px",
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5,
                }}>
                  {produto.descricao}
                </p>
              )}
              <p style={{ fontSize: 16, fontWeight: 800, color: ACCENT, margin: 0 }}>{fmt(produto.preco)}</p>
            </div>
            {/* Image side */}
            <div style={{ width: 100, flexShrink: 0, position: "relative" }}>
              {produto.imagem_url ? (
                <img
                  src={produto.imagem_url}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  alt={produto.nome}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: CARD2 }} />
              )}
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
        <SplashScreen bar={bar} onNext={handleSplashNext} />
      )}
      {screen === "welcome-new" && (
        <WelcomeNewScreen bar={bar} onConfirm={handleNomeConfirm} />
      )}
      {screen === "welcome-back" && cliente && (
        <WelcomeBackScreen
          cliente={cliente}
          ultimoProduto={ultimoProduto}
          allProdutos={allProdutos}
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
          allCategorias={cardapio}
          onSelect={(p) => { setSelectedProduto(p); setScreen("product-detail"); }}
          onBack={() => setScreen("categories")}
          onSwitchCategoria={(cat) => setSelectedCategoria(cat)}
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
