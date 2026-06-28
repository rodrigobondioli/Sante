"use client";
import { useEffect, useRef } from "react";

const STEPS = [
  {
    num: "/1",
    title: "Comece hoje",
    body: "Em um dia, você cadastra o cardápio completo, configura a equipe e organiza as mesas. Nada de técnico agendado, nada de semanas esperando implantação. O onboarding guia cada etapa — e quando termina, o bar já está operando.",
  },
  {
    num: "/2",
    title: "A operação vira inteligente",
    body: "A partir daí, cada pedido, comanda e pagamento é capturado em tempo real. Sem papel, sem planilha, sem depender de ninguém lembrar de anotar. A equipe trabalha normalmente — e o SUPERBAR registra tudo e transforma cada turno em dado confiável.",
  },
  {
    num: "/3",
    title: "Saiba o que merece atenção",
    body: "De manhã, você abre o painel e o SUPERBAR já fez o trabalho pesado: CMV, margem por produto, ticket médio, oportunidades que você ainda não enxergou. Em segundos você sabe onde agir — sem precisar procurar, interpretar ou adivinhar.",
  },
];

const N    = STEPS.length;
const BG   = "#1133FF";
const DARK = "#1133FF";
const CARD_COLORS = ["#FF6600", "#1133FF", "#FFD601"];

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 400,
  fontSize: "clamp(1.25rem, 3.5vw, 2.25rem)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#ffffff",
};

const PEEK_PX = 20;
const SHRINK  = 0.025;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function getCardT(i: number, progress: number): number {
  if (i === 0) return 1;
  const ENTRY_START = 0.1;
  const ENTRY_END   = 0.90;
  const slot  = (ENTRY_END - ENTRY_START) / (N - 1);
  const width = slot * 0.55;
  const start = ENTRY_START + (i - 1) * slot;
  return easeOutCubic(Math.max(0, Math.min(1, (progress - start) / width)));
}

export function ProcessoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let rafId: number;

    const tick = () => {
      const rect   = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const ts = STEPS.map((_, i) => getCardT(i, progress));

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const t     = ts[i];
        const depth = ts.slice(i + 1).reduce((s, p) => s + p, 0);
        const pushY = depth * PEEK_PX;
        const entryY = (1 - t) * 60;
        const scale  = Math.max(0.88, 1 - depth * SHRINK - (1 - t) * 0.08);
        card.style.transform = `translateY(${pushY + entryY}px) scale(${scale})`;
        card.style.opacity   = String(Math.min(1, t * 2.5));
        card.style.zIndex    = String(i + 1);
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* ── Mobile: cards estáticos empilhados, sem sticky ── */}
      <section className="md:hidden px-4 py-10" style={{ background: BG }}>
        <h2 style={{ ...TITLE_STYLE, margin: "0 0 24px" }}>
          Nosso Processo
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                background: "#FF6600",
                borderRadius: 20,
                padding: "28px 24px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              <p
                className="text-balance"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 400,
                  color: DARK,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 16px",
                  lineHeight: 1.1,
                }}
              >
                {step.num} {step.title}
              </p>
              <div style={{ height: 1, background: "rgba(26,1,84,0.2)", marginBottom: 16 }} />
              <p
                className="text-pretty"
                style={{
                  fontFamily: "var(--font-roboto-mono)",
                  fontSize: "0.8125rem",
                  color: DARK,
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Desktop: sticky scroll animation ── */}
      <section
        ref={sectionRef}
        className="hidden md:block"
        style={{ minHeight: `${N * 100}vh`, background: BG }}
      >
        <style>{`
          .processo-stack { height: 280px; }
          .processo-card  { padding: 32px 36px; }
          @media (min-width: 1024px) {
            .processo-stack { height: 260px; }
            .processo-card  { padding: 40px 48px; }
          }
        `}</style>

        <div
          className="sticky top-0 z-10 flex h-screen flex-col items-center justify-center"
          style={{ background: BG }}
        >
          <h2 className="text-center" style={{ ...TITLE_STYLE, margin: "0 0 28px", padding: "0 16px" }}>
            Nosso Processo
          </h2>

          <div className="w-full px-8 lg:px-14">
            <div className="relative processo-stack mx-auto" style={{ maxWidth: 980 }}>
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="processo-card"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: CARD_COLORS[i],
                    borderRadius: "24px",
                    opacity: 0,
                    willChange: "transform, opacity",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    transformOrigin: "top center",
                  }}
                >
                  <p
                    className="text-balance"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.125rem, 3vw, 1.625rem)",
                      fontWeight: 400,
                      color: DARK,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      margin: "0 0 12px",
                      lineHeight: 1.1,
                    }}
                  >
                    {step.num} {step.title}
                  </p>
                  <div style={{ height: 1, background: "rgba(26,1,84,0.2)", marginBottom: "12px" }} />
                  <p
                    className="text-pretty"
                    style={{
                      fontFamily: "var(--font-roboto-mono)",
                      fontSize: "clamp(0.75rem, 2vw, 0.9375rem)",
                      color: DARK,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
