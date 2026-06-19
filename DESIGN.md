# DESIGN.md — Superbar

> Contrato visual do produto. Toda UI gerada (site, dashboard, telas operacionais) segue estas regras.
> Fonte de verdade visual para o Claude Code e qualquer agente de codificação.

---

## 0. O que mudou (zeramos o sistema antigo)

O sistema visual anterior (dark com degradês, glow índigo, pills, raios grandes, índigo como tema) foi **descartado**. Nova direção, válida para tudo:

**Limpo. Plano. Mono. Muito espaço. Um respiro de cor só.** Estética de instrumento de precisão — silencioso, estruturado, sem decoração. Sem degradê, sem glow, sem sombra colorida.

---

## 1. Princípios visuais

- **Plano e silencioso.** Nada de degradê, glow ou sombra decorativa. Hierarquia se faz com espaço, peso tipográfico e cor com parcimônia.
- **Cada cor tem função.** A base é preto/branco/cinza. O #260078 é o respiro — aparece só onde há ação. Cores semânticas só onde há estado operacional.
- **Mono na frente.** Títulos e dados em monoespaçada dão o tom "instrumento". Corpo em sans pra leitura.
- **Espaço é design.** Generoso. O vazio organiza.
- **Premium na execução (este doc). Descolado na personalidade.** A personalidade jovem (mascote, voz, copy) vive na camada de marca do site — dentro desta mesma paleta, sem quebrar o sistema.

---

## 2. Temas (dark + light)

Dois temas, **dark é o padrão**, com botão de troca pro usuário (ícone de sol/lua no topo).

Arquitetura: **tokens semânticos via CSS variables.** A UI nunca usa hex cru — usa o token (`--bg`, `--fg`, `--accent`...). Trocar de tema é trocar os valores dos tokens. Por isso os dois temas custam quase nada: o sistema nasce assim na fundação.

**Regra:** nenhum componente referencia cor fixa. Sempre o token.

---

## 3. Paleta

### 3.1 Regra de cor (a régua)

- **Base:** branco, preto e tons de cinza.
- **Ação:** `#260078` — **só em CTAs e detalhes de ação** (botão primário, foco, link, item de nav ativo). É o respiro; aparece pouco e por isso tem força.
- **Semânticas (verde/âmbar/vermelho):** **só nas telas operacionais** (Bartender e Caixa), pra sinalizar estado. Proibidas no site, onboarding e dashboard — exceto um badge de status mínimo.

### 3.2 Tokens — tema DARK (padrão)

```css
:root, [data-theme="dark"] {
  --bg:            #0B0B0C;   /* fundo principal */
  --bg-elevated:   #141416;   /* cards, superfícies elevadas */
  --bg-inset:      #08080A;   /* campos, áreas recuadas */
  --fg:            #FAFAFA;   /* texto principal */
  --fg-muted:      #9A9AA0;   /* texto secundário */
  --fg-subtle:     #65656B;   /* texto terciário, labels, placeholder */
  --border:        rgba(255,255,255,0.08);  /* hairline padrão */
  --border-strong: rgba(255,255,255,0.16);  /* divisória/ativo */

  --accent:        #260078;   /* ação — fill de CTA */
  --accent-fg:     #FFFFFF;   /* texto sobre o accent */
  --accent-bright: #6B4FE8;   /* tint do accent p/ texto/ring sobre fundo escuro (legibilidade) */
  --ring:          #6B4FE8;   /* foco no dark */
}
```

### 3.3 Tokens — tema LIGHT

```css
[data-theme="light"] {
  --bg:            #FFFFFF;
  --bg-elevated:   #FAFAFA;
  --bg-inset:      #F4F4F5;
  --fg:            #0B0B0C;
  --fg-muted:      #6B6B70;
  --fg-subtle:     #9A9AA0;
  --border:        rgba(0,0,0,0.10);
  --border-strong: rgba(0,0,0,0.18);

  --accent:        #260078;
  --accent-fg:     #FFFFFF;
  --accent-bright: #260078;   /* no claro o #260078 já é legível como texto/ring */
  --ring:          #260078;
}
```

> **Nota de contraste do #260078:** como fill de CTA com texto branco, funciona nos dois temas. Como *texto* ou *anel de foco* sobre fundo escuro ele fica baixo — por isso no dark usamos `--accent-bright` (#6B4FE8) nesses casos. CTA sólido = sempre `--accent`.

### 3.4 Cores semânticas — APENAS Bartender e Caixa

```css
/* valem só nas surfaces operacionais; discretas, nunca berrantes */
:root, [data-theme="dark"] {
  --ok:        #22C55E;  --ok-bg:     rgba(34,197,94,0.12);   /* comanda ok / pago */
  --warn:      #F59E0B;  --warn-bg:   rgba(245,158,11,0.12);  /* quer pagar / pendente */
  --danger:    #EF4444;  --danger-bg: rgba(239,68,68,0.12);   /* cancelado / erro */
}
[data-theme="light"] {
  --ok:        #16A34A;  --ok-bg:     rgba(22,163,74,0.10);
  --warn:      #D97706;  --warn-bg:   rgba(217,119,6,0.10);
  --danger:    #DC2626;  --danger-bg: rgba(220,38,38,0.10);
}
```

---

## 4. Tipografia

### 4.1 Fontes

- **Display / títulos / dados:** monoespaçada (Geist Mono). É a assinatura do sistema.
- **Corpo / parágrafos / UI:** sans (Geist).

```javascript
import { Geist, Geist_Mono } from 'next/font/google'
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

### 4.2 Escala

```css
/* Display — mono, títulos de hero/seção */
--text-display: 3rem / 1.1;     /* 48px */
--text-h1:      2rem / 1.15;    /* 32px — mono */
--text-h2:      1.5rem / 1.2;   /* 24px — mono */
--text-h3:      1.125rem / 1.3; /* 18px — mono */

/* Corpo — sans */
--text-body-lg: 1.125rem / 1.6; /* 18px */
--text-body:    1rem / 1.6;     /* 16px */
--text-body-sm: 0.875rem / 1.5; /* 14px */

/* Overline — label de seção (sans, caixa alta) */
--text-overline: 0.75rem / 1.4; /* 12px, uppercase, letter-spacing 0.12em, --fg-subtle */

/* Dados — mono, tabular */
--text-data-xl: 2.5rem / 1;     /* 40px — KPI principal */
--text-data-lg: 1.75rem / 1;    /* 28px */
--text-data:    1rem / 1;       /* 16px — tabela */
```

```css
.overline { font: var(--text-overline); text-transform: uppercase; letter-spacing: 0.12em; color: var(--fg-subtle); }
.data-value { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
h1,h2,h3,.display { font-family: var(--font-mono); letter-spacing: -0.01em; }
```

---

## 5. Espaçamento (base 4px)

```css
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px;
--space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px; --space-24:96px; --space-32:128px;
```
Use espaço com generosidade. Seções respiram com `--space-16` a `--space-32`.

---

## 6. Raio (pequeno, plano)

```css
--radius-sm: 2px;   /* badges, chips */
--radius-md: 4px;   /* botões, inputs, cards */
--radius-lg: 8px;   /* containers maiores */
```
**Sem pills.** O raio é discreto — a sensação é técnica, não "appzinho".

---

## 7. Superfícies e bordas

- Cards e painéis = `--bg-elevated` + borda `1px solid var(--border)`. **Sem sombra, sem glow.**
- Divisórias e grids = `1px solid var(--border)`.
- Estado ativo/foco = borda `--border-strong` ou anel `--ring`.
- Profundidade se faz por **cor de superfície e borda**, nunca por sombra.

```css
.surface { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); }
```

---

## 8. Componentes

### 8.1 Navegação
Topo fixo simples (não pill flutuante): logo à esquerda, busca/ações ao centro/direita, toggle de tema (sol/lua), menu de usuário. Sidebar (dashboard/admin) com seções em overline (ex: GERAL, OPERAÇÃO, CONFIG) e itens em texto + ícone stroke. Item ativo: texto `--fg` + barra/realce sutil, ícone em `--accent-bright`.

### 8.2 Botões

```css
/* Primário — ação. Único lugar do #260078 sólido. */
.btn-primary { background: var(--accent); color: var(--accent-fg); border-radius: var(--radius-md);
  padding: 10px 18px; font-weight: 500; border: none; }
.btn-primary:hover { filter: brightness(1.12); }

/* Secundário — outline neutro */
.btn-secondary { background: transparent; color: var(--fg); border: 1px solid var(--border-strong);
  border-radius: var(--radius-md); padding: 10px 18px; }
.btn-secondary:hover { border-color: var(--fg-muted); }

/* Ghost — texto */
.btn-ghost { background: transparent; color: var(--fg-muted); padding: 10px 14px; }
.btn-ghost:hover { color: var(--fg); }

/* Operacional — bartender/caixa: alvo de toque generoso */
.btn-op { min-height: 48px; border-radius: var(--radius-md); font-size: 1rem; font-weight: 600; }
/* no Caixa: min-height 56px (ambiente com movimento) */
```

### 8.3 Cards e grid numerado (padrão da referência)

```css
.card { background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: var(--space-6); }

/* Grid de primitivos: células com número (01, 02...) em mono, overline-like, divididas por hairline */
.grid-cell .num { font-family: var(--font-mono); color: var(--fg-subtle); font-size: 0.75rem; }
.grid-cell .title { font-family: var(--font-mono); font-size: 1.125rem; color: var(--fg); }
.grid-cell .desc { color: var(--fg-muted); font-size: 0.875rem; }
```

### 8.4 Inputs

```css
.input { background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius-md);
  color: var(--fg); padding: 10px 12px; font-family: var(--font-sans); }
.input::placeholder { color: var(--fg-subtle); }
.input:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 25%, transparent); }
```

### 8.5 Badges / status

```css
.badge { display:inline-flex; align-items:center; gap:6px; padding:3px 10px;
  border-radius: var(--radius-sm); font-size:0.75rem; font-weight:500; }
.badge-neutral { background: color-mix(in srgb, var(--fg) 8%, transparent); color: var(--fg-muted); }
.badge-accent  { background: color-mix(in srgb, var(--accent-bright) 16%, transparent); color: var(--accent-bright); }

/* SÓ em Bartender/Caixa */
.badge-ok     { background: var(--ok-bg);     color: var(--ok); }
.badge-warn   { background: var(--warn-bg);   color: var(--warn); }
.badge-danger { background: var(--danger-bg); color: var(--danger); }
```

### 8.6 Stat / KPI

```css
.stat-value { font-family: var(--font-mono); font-size: var(--text-data-xl); font-weight:700;
  color: var(--fg); font-variant-numeric: tabular-nums; }
.stat-label { font: var(--text-overline); text-transform:uppercase; letter-spacing:0.1em; color: var(--fg-subtle); }
```

### 8.7 Tabelas
Densas e limpas. Cabeçalho em overline (`--fg-subtle`). Linhas divididas por hairline `--border`. Hover de linha: `color-mix(in srgb, var(--fg) 3%, transparent)`. Valores monetários sempre em mono.

---

## 9. Regras por surface

### Site de vendas
- Paleta: P&B + cinza + `#260078` só nos CTAs. Sem cores semânticas.
- Títulos em mono, overlines nas seções, muito espaço, hairlines.
- **Camada de marca:** aqui entra a personalidade (mascote, copy descolada, composição com atitude) — mas **dentro desta paleta**, sem quebrar o sistema. O "cool" vem do mascote e da voz, não de cor extra.

### Onboarding
- P&B + cinza + `#260078` nos botões. Sem semânticas. Progress em barra `--border` com trecho ativo `--accent`.

### Dashboard Dono
- P&B + cinza + `#260078` na ação. KPIs em mono. Gráficos: linha `--accent-bright`, área `color-mix(in srgb, var(--accent-bright) 12%, transparent)`. Comparações ↑↓ podem usar `--ok`/`--danger` em texto pequeno (exceção de status).

### Bartender (mobile/iPad)
- P&B + cinza + `#260078` + **semânticas (estado)**. Toque mínimo 48px. Estado de comanda em badges semânticos: aberta/ok = `ok`, quer pagar = `warn`, cancelado = `danger`. Sem decoração — velocidade de leitura.

### Caixa
- Igual ao Bartender, toque 56px+. Valores em mono. Estado de mesa/comanda em semânticas. Teclado numérico em `btn-op`.

### Admin
- P&B + cinza + `#260078`. Tabelas densas. Sidebar com seções em overline.

---

## 10. Tailwind config (token-based, dual theme)

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', 'bg-elevated': 'var(--bg-elevated)', 'bg-inset': 'var(--bg-inset)',
        fg: 'var(--fg)', 'fg-muted': 'var(--fg-muted)', 'fg-subtle': 'var(--fg-subtle)',
        border: 'var(--border)', 'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)', 'accent-fg': 'var(--accent-fg)', 'accent-bright': 'var(--accent-bright)',
        ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: { sm: '2px', md: '4px', lg: '8px' },
    },
  },
  plugins: [],
} satisfies Config
```

> Toggle de tema: usar `next-themes` com `attribute="data-theme"`, `defaultTheme="dark"`. O ícone sol/lua no topo alterna `data-theme` entre `dark` e `light`.

---

## 11. globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* (tokens das seções 3.2 / 3.3 / 3.4 entram aqui em :root e [data-theme="light"]) */

@layer base {
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    transition: background-color 150ms, color 150ms;
  }
  h1, h2, h3 { font-family: var(--font-mono); letter-spacing: -0.01em; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: var(--radius-sm); }

  :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
}
```

---

## 12. Padrões proibidos

- **Nunca** degradê (de qualquer tipo).
- **Nunca** glow, sombra colorida ou sombra decorativa.
- **Nunca** usar `#260078` como cor de fundo/tema — só ação.
- **Nunca** cores semânticas fora de Bartender/Caixa (exceto badge de status mínimo).
- **Nunca** pills como padrão; raio máximo 8px.
- **Nunca** hex cru no componente — sempre o token (senão o tema quebra).
- **Nunca** fonte fora de Geist / Geist Mono.
- **Nunca** ícone colorido decorativo — stroke `--fg`, `--fg-muted` ou `--accent-bright`.

---

## 13. A camada de marca no site

O site pode (e deve) ser mais descolado que o app — mas **a paleta é a mesma**. A personalidade vem de:
- **Mascote** (o copo herói "SB"): renderizar em traço plano, mono/duotone — preto sobre claro, com no máximo um toque de `#260078`. Encaixa no sistema, não destoa.
- **Voz e copy** jovem (ver seção "Marca" do `docs/negocio.md`).
- **Composição e movimento** com atitude.

Cool na personalidade, impecável no craft. O mascote brinca; o sistema não.

---

## 14. Referências

- **Estética:** instrumento de precisão — mono, plano, hairlines, muito espaço (refs de admin/IAM tipo dashboard técnico).
- **Stack:** Next.js (App Router) + Tailwind + Supabase + Vercel.
- **Estratégia/marca:** `docs/negocio.md`.
- **Regras de build:** `CLAUDE.md`.
