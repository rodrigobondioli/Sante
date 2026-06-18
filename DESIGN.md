# DESIGN.md — Superbar

> Este arquivo é o contrato visual do produto. Toda UI gerada deve seguir estas regras.
> Fonte de verdade para Claude Code e qualquer agente de codificação.

---

## 1. Identidade

**Produto**: Superbar — OS unificado para bares premium  
**Posicionamento visual**: Dark. Minimal. Operacional. Sem ruído.  
**Referência estética**: Human Academy (humanacademy.com.br) — pill nav, gradient hero, cards arredondados, tipografia bold  
**Princípio**: Cada elemento que não serve à operação é removido.

---

## 2. Paleta de Cores

### 2.1 Cores Base (todas as surfaces)

```css
--color-black:       #000000   /* fundo principal */
--color-black-soft:  #0A000F   /* fundo com toque de índigo */
--color-black-card:  #0D0015   /* fundo de cards */
--color-black-hover: #160025   /* hover state de cards */
--color-border:      #26007840 /* #260078 a 25% — bordas */
--color-border-strong: #260078 /* borda de foco/ativo */

--color-white:       #FFFFFF
--color-white-80:    #FFFFFFCC /* texto secundário */
--color-white-50:    #FFFFFF80 /* texto terciário / placeholder */
--color-white-20:    #FFFFFF33 /* separadores, disabled */
--color-white-10:    #FFFFFF1A /* surface sutil */

--color-indigo:      #260078   /* accent principal */
--color-indigo-light:#3A00B8   /* hover de botão primário */
--color-indigo-glow: #26007866 /* glow / shadow */
```

### 2.2 Gradientes

```css
/* Hero sections — estilo aurora */
--gradient-hero:    linear-gradient(135deg, #000000 0%, #260078 60%, #000000 100%)
--gradient-card:    linear-gradient(135deg, #0D0015 0%, #1A0050 100%)
--gradient-subtle:  linear-gradient(180deg, #000000 0%, #0A000F 100%)

/* Text gradient — para headlines com destaque */
--gradient-text:    linear-gradient(90deg, #FFFFFF 0%, #A78BFA 100%)
```

### 2.3 Cores Semânticas — APENAS surfaces operacionais

> Usar **somente** em: PDV — Caixa, Interface Bartender, CS Admin  
> **Proibido** em: Site de Vendas, Onboarding, Dashboard (exceto status badges pequenos)

```css
--color-success:     #22C55E   /* comanda aberta, pagamento ok */
--color-success-bg:  #052E16   /* fundo de badge success */
--color-error:       #EF4444   /* cancelado, erro, alerta crítico */
--color-error-bg:    #330A0A   /* fundo de badge error */
--color-warning:     #F59E0B   /* aguardando, pendente */
--color-warning-bg:  #291500   /* fundo de badge warning */
--color-info:        #3B82F6   /* informativo neutro */
--color-info-bg:     #0A1525   /* fundo de badge info */
```

---

## 3. Tipografia

### 3.1 Fontes

```javascript
// next/font — configuração no layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
```

```css
--font-sans: var(--font-geist), system-ui, sans-serif
--font-mono: var(--font-geist-mono), 'Courier New', monospace
```

### 3.2 Escala Tipográfica

```css
/* Display — hero headlines, landing page */
--text-display-2xl: 4.5rem / 1.1   /* 72px — hero principal */
--text-display-xl:  3.5rem / 1.15  /* 56px — section hero */
--text-display-lg:  2.75rem / 1.2  /* 44px — page title */

/* Heading — estrutura de página */
--text-h1:  2rem / 1.25    /* 32px */
--text-h2:  1.5rem / 1.3   /* 24px */
--text-h3:  1.25rem / 1.4  /* 20px */
--text-h4:  1.125rem / 1.4 /* 18px */

/* Body */
--text-body-lg: 1.125rem / 1.6  /* 18px — lead text */
--text-body:    1rem / 1.6      /* 16px — padrão */
--text-body-sm: 0.875rem / 1.5  /* 14px — secundário */
--text-caption: 0.75rem / 1.4   /* 12px — labels, overlines */

/* Mono — números, preços, dados */
--text-data-xl: 3rem / 1      /* 48px — KPI principal */
--text-data-lg: 2rem / 1      /* 32px — KPI secundário */
--text-data:    1.5rem / 1    /* 24px — métricas */
--text-data-sm: 1rem / 1      /* 16px — tabela */
```

### 3.3 Padrões de Texto

```css
/* Overline — label de seção, acima do headline */
.overline {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-white-50);
}

/* Headline com destaque em índigo */
.headline-accent span {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Números/preços — sempre Geist Mono */
.data-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

---

## 4. Espaçamento

```css
/* Base: 4px */
--space-1:  0.25rem  /* 4px */
--space-2:  0.5rem   /* 8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.25rem  /* 20px */
--space-6:  1.5rem   /* 24px */
--space-8:  2rem     /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
--space-32: 8rem     /* 128px */
```

---

## 5. Border Radius

```css
--radius-sm:   0.375rem  /* 6px  — badges, chips */
--radius-md:   0.75rem   /* 12px — inputs, botões pequenos */
--radius-lg:   1rem      /* 16px — cards */
--radius-xl:   1.5rem    /* 24px — cards hero, modais */
--radius-2xl:  2rem      /* 32px — seções grandes */
--radius-full: 9999px    /* pill — nav, botões pill, tags */
```

---

## 6. Sombras e Efeitos

```css
/* Glow índigo — para elementos ativos/hover */
--shadow-indigo-sm: 0 0 12px #26007840
--shadow-indigo-md: 0 0 24px #26007860
--shadow-indigo-lg: 0 0 48px #26007880

/* Sombra de card */
--shadow-card: 0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px #26007840

/* Glassmorphism — cards sobre gradient */
--glass-bg:     rgba(13, 0, 21, 0.7)
--glass-border: rgba(255, 255, 255, 0.08)
--glass-blur:   backdrop-filter: blur(12px)
```

---

## 7. Componentes

### 7.1 Navegação — Pill Flutuante

```css
.nav-pill {
  position: fixed;
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 0, 21, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.5rem 1.5rem;
  z-index: 50;
}
```

### 7.2 Botões

```css
/* Primário — índigo sólido */
.btn-primary {
  background: #260078;
  color: #FFFFFF;
  border-radius: var(--radius-full);
  padding: 0.75rem 1.75rem;
  font-weight: 500;
  transition: background 150ms;
}
.btn-primary:hover { background: #3A00B8; }

/* Secundário — outline */
.btn-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-full);
  padding: 0.75rem 1.75rem;
}
.btn-secondary:hover { border-color: #260078; }

/* Ghost — texto apenas */
.btn-ghost {
  background: transparent;
  color: rgba(255,255,255,0.7);
  padding: 0.75rem 1.25rem;
}

/* Operacional — grande, touch target mínimo 48px, APENAS surfaces operacionais */
.btn-op {
  min-height: 3rem;        /* 48px */
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
}
```

### 7.3 Cards

```css
/* Card padrão */
.card {
  background: var(--color-black-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: border-color 150ms, box-shadow 150ms;
}
.card:hover {
  border-color: #26007880;
  box-shadow: var(--shadow-indigo-sm);
}

/* Card hero — gradient */
.card-hero {
  background: var(--gradient-card);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius-2xl);
  padding: var(--space-10) var(--space-12);
}

/* Card glass — sobre seção com gradient */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}
```

### 7.4 Inputs

```css
.input {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: #FFFFFF;
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  transition: border-color 150ms, box-shadow 150ms;
}
.input:focus {
  outline: none;
  border-color: #260078;
  box-shadow: 0 0 0 3px #26007830;
}
.input::placeholder { color: var(--color-white-30); }
```

### 7.5 Badges / Status

```css
/* Base */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Variantes — APENAS surfaces operacionais */
.badge-success { background: var(--color-success-bg); color: var(--color-success); }
.badge-error   { background: var(--color-error-bg);   color: var(--color-error); }
.badge-warning { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-info    { background: var(--color-info-bg);    color: var(--color-info); }

/* Variante neutra — todas as surfaces */
.badge-neutral { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.badge-indigo  { background: #26007840; color: #A78BFA; }
```

### 7.6 Overline + Headline (padrão de seção)

```html
<!-- Padrão Human Academy — overline acima do headline -->
<section>
  <p class="overline">PLATAFORMA COMPLETA</p>
  <h2>Os melhores dados <span class="accent">para o seu bar.</span></h2>
</section>
```

### 7.7 Stats / KPI Block

```css
.stat-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-data-xl);
  font-weight: 700;
  color: #FFFFFF;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: var(--text-caption);
  color: var(--color-white-50);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## 8. Seções Hero — Padrão Gradient

```css
/* Seção com aurora gradient */
.section-hero {
  background: var(--gradient-hero);
  border-radius: var(--radius-2xl);
  padding: var(--space-24) var(--space-16);
  margin: var(--space-4) var(--space-4);
  position: relative;
  overflow: hidden;
}

/* Glow radial de fundo */
.section-hero::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #26007860 0%, transparent 70%);
  top: -200px;
  left: -100px;
  pointer-events: none;
}
```

---

## 9. Regras por Surface

### Site de Vendas (SV01–SV05)
- Paleta: preto + branco + #260078 APENAS
- Cores semânticas: proibidas
- Nav: pill flutuante centralizado
- Botão CTA: `btn-primary` pill
- Seções alternadas: seção gradient hero intercalada com seção preta pura
- Overlines em todas as seções
- Stats grandes (Geist Mono) para social proof

### Onboarding (OB01–OB07 Mobile + Desktop)
- Paleta: preto + branco + #260078 APENAS
- Progress indicator: linha branca com step ativo em #260078
- Botão avançar: `btn-primary` full-width
- Cards de seleção: `card` com borda ativa em #260078

### Dashboard Dono (S05, S06, S20)
- Paleta: preto + branco + #260078 + cores semânticas em badges APENAS
- KPI cards: `card-hero` com `stat-value` em Geist Mono
- Gráficos: linhas em #260078, área em #26007820
- Tabelas: fundo alternado rgba(255,255,255,0.02)
- Comparações (↑↓): success/error colors permitidas

### Interface Bartender — Mobile (S32–S36)
- Paleta: preto + branco + #260078 + cores semânticas (operacional)
- Touch targets mínimos: 48px
- Botões: `btn-op` — grandes, área de toque generosa
- Status de comanda: badges com cores semânticas obrigatórias
- Sem gradientes decorativos — foco em velocidade de leitura

### PDV — Caixa (PDV01–PDV04)
- Paleta: preto + branco + #260078 + cores semânticas (operacional)
- Touch targets: 56px+ (ambiente com movimento)
- Valores monetários: Geist Mono obrigatório
- Status de mesa/comanda: cores semânticas obrigatórias
- Teclado numérico: botões grandes, `btn-op`
- Zero gradientes decorativos

### CS Admin (SA01–SA04)
- Paleta: preto + branco + #260078 + cores semânticas em status
- Tabelas densas permitidas
- Sidebar: fundo `--color-black-card`, itens pill com hover em #26007820
- Formulários: `input` padrão

---

## 10. Tailwind Config

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: '#260078',
          light:   '#3A00B8',
          glow:    '#26007866',
          subtle:  '#26007820',
        },
        surface: {
          DEFAULT: '#000000',
          soft:    '#0A000F',
          card:    '#0D0015',
          hover:   '#160025',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        'pill': '9999px',
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
      },
      boxShadow: {
        'indigo-sm': '0 0 12px #26007840',
        'indigo-md': '0 0 24px #26007860',
        'indigo-lg': '0 0 48px #26007880',
      },
    },
  },
  plugins: [],
} satisfies Config
```

---

## 11. globals.css — Setup inicial

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-geist: 'Geist';
    --font-geist-mono: 'Geist Mono';
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #000000;
    color: #FFFFFF;
    font-family: var(--font-geist), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbar — dark, minimal */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #000000; }
  ::-webkit-scrollbar-thumb { background: #260078; border-radius: 9999px; }

  /* Focus ring acessível */
  :focus-visible {
    outline: 2px solid #260078;
    outline-offset: 2px;
  }
}
```

---

## 12. Padrões Proibidos

- **Nunca** usar cor de fundo branca pura em páginas internas do app
- **Nunca** usar sombras coloridas fora do índigo (#260078)
- **Nunca** usar cores semânticas (verde/vermelho/âmbar) em Site de Vendas ou Onboarding
- **Nunca** usar fonte sem ser Geist / Geist Mono
- **Nunca** usar border-radius < 6px (flat looks quebram o sistema)
- **Nunca** usar gradientes multicoloridos — apenas preto ↔ #260078
- **Nunca** usar texto com cor diferente de branco em variantes de opacidade (ex: texto azul no dashboard)
- **Nunca** usar ícones coloridos decorativos — apenas stroke branco ou índigo

---

## 13. Referências

- **Estética**: Human Academy (humanacademy.com.br)
- **Wireframes**: Figma `gcE5bakUMH5f5Mb02gvNTc` — 9 páginas, 39 telas
- **Spec completo**: `Bar_Intelligence_Platform_Specs.docx`
- **Stack**: Next.js 14 (App Router) + Tailwind CSS + Supabase + Vercel
