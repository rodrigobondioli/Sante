import { Settings, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendText } from "@/components/ui/trend-text";
import { BarChart } from "@/components/ui/bar-chart";
import { CategoriaBadge } from "@/components/dashboard/categoria-badge";
import { AlertasBell } from "@/components/dashboard/alertas-bell";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { cn } from "@/lib/utils";
import {
  getCurrentBar,
  getTurnoAtual,
  getKpisTurno,
  getAlertasEstoque,
  getKpisComparacao,
  getProdutosVendidosTurno,
  getMetaMes,
} from "@/lib/dashboard/queries";
import { categorizarProdutos, calcularCmv } from "@/lib/dashboard/menu-engineering";
import { getFaturamentoPorDia, getComparacaoPeriodo, getProdutosVendidosPeriodo } from "@/lib/dashboard/relatorios";
import { resolvePeriodo, periodoMesAtual, periodoAnterior } from "@/lib/dashboard/periodo";
import { percentChange } from "@/lib/dashboard/percent-change";
import { gerarInsight } from "@/lib/dashboard/insights";

const TOP_DRINKS_LIMIT = 5;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dataExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function saudacao(horaDoDia: number) {
  if (horaDoDia < 12) return "Bom dia";
  if (horaDoDia < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function DashboardPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-body text-white-80">Nenhum turno aberto neste momento.</p>
      </Card>
    );
  }

  const [kpis, alertas, produtosVendidos, metaMes] = await Promise.all([
    getKpisTurno(turno),
    getAlertasEstoque(current.bar.id),
    getProdutosVendidosTurno(current.bar.id, turno.id),
    getMetaMes(current.bar.id),
  ]);

  const comparacao = await getKpisComparacao(
    current.bar.id,
    turno,
    kpis,
    alertas.length,
    produtosVendidos
  );
  const produtosCategorizados = categorizarProdutos(produtosVendidos);
  const produtosTop5 = [...produtosCategorizados]
    .sort((a, b) => (b.margemPercentual ?? -Infinity) - (a.margemPercentual ?? -Infinity))
    .slice(0, TOP_DRINKS_LIMIT);
  const cmvAtual = calcularCmv(produtosVendidos);

  const periodoSemana = resolvePeriodo({ preset: "7d" });
  const periodoMes = periodoMesAtual();
  const [pontosReceita, receitaSemana, produtosVendidosMes, produtosVendidosMesAnterior] = await Promise.all([
    getFaturamentoPorDia(current.bar.id, periodoSemana, "diaSemana"),
    getComparacaoPeriodo(current.bar.id, periodoSemana),
    getProdutosVendidosPeriodo(current.bar.id, periodoMes),
    getProdutosVendidosPeriodo(current.bar.id, periodoAnterior(periodoMes)),
  ]);
  const cmvMes = calcularCmv(produtosVendidosMes);
  const cmvMesAnterior = calcularCmv(produtosVendidosMesAnterior);
  const cmvMesTrend =
    cmvMes !== null && cmvMesAnterior !== null ? percentChange(cmvMes, cmvMesAnterior) : null;

  const insight = gerarInsight({
    produtosVendidos,
    faturamentoTurno: kpis.faturamento,
    cmvTrend: comparacao.cmv,
    alertasCount: alertas.length,
  });

  const agora = new Date();
  const primeiroNome = current.userNome.split(" ")[0];
  const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));

  const kpiCards = [
    {
      value: currency.format(kpis.faturamento),
      label: "Faturamento do turno",
      percent: comparacao.faturamento,
      invert: false,
    },
    {
      value: cmvAtual !== null ? `${percent.format(cmvAtual)}%` : "—",
      label: "CMV",
      percent: comparacao.cmv,
      invert: true,
    },
    {
      value: String(kpis.comandasAbertas),
      label: "Tickets abertos",
      percent: comparacao.comandas,
      invert: false,
    },
    {
      value: currency.format(kpis.ticketMedio),
      label: "Ticket médio",
      percent: comparacao.ticketMedio,
      invert: false,
    },
  ];

  const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "none",
    borderRadius: "12px",
    padding: "24px",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 500,
    color: "rgba(255,255,255,0.38)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "16px",
  };

  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {/* Unified hero — no overflow:hidden here so dropdown isn't clipped */}
      <div style={{
        position: "relative",
        background: "#0d0018",
        minHeight: "340px",
      }}>
        {/* Orb layer — clips the orbs without affecting other children */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", filter: "blur(140px)", opacity: 0.45, background: "#7c3aed", top: "-150px", left: "-100px" }} />
          <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", filter: "blur(120px)", opacity: 0.3, background: "#f43f5e", bottom: "-100px", right: "5%" }} />
          <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", filter: "blur(110px)", opacity: 0.2, background: "#10b981", top: "10%", right: "20%" }} />
        </div>

        {/* Controls — inside hero, top-right, NOT clipped */}
        <div style={{ position: "absolute", top: "16px", right: "24px", display: "flex", alignItems: "center", gap: "10px", zIndex: 50 }}>
          <AlertasBell alertas={alertas} />
          <button
            type="button"
            title="Configurações"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.06)",
              transition: "all 150ms",
            }}
            className="hover:border-white/20 hover:text-white/70 active:scale-[0.97]"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #f43f5e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: "white",
            cursor: "pointer", flexShrink: 0,
          }}>
            {primeiroNome.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "80px 48px 56px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontSize: "42px", fontWeight: 700, color: "white", marginBottom: "8px", lineHeight: 1.1 }}>
            {saudacao(agora.getHours())}, {primeiroNome}!
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>
            {dataFormatada}
            {turno ? " · turno aberto" : " · nenhum turno aberto"}
          </p>
          <AiHeroInput barId={current.bar.id} />
        </div>
      </div>

      {/* KPI Cards — edge-to-edge, butted against hero */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1px",
          background: "rgba(255,255,255,0.06)",
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        {kpiCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in-up"
            style={{
              background: "#0a0a10",
              padding: "24px 32px",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <p style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>{card.label}</p>
            <p style={{ fontSize: "30px", fontWeight: 600, color: "#ffffff", marginTop: "10px" }}>{card.value}</p>
            <TrendText percent={card.percent} invert={card.invert} />
          </div>
        ))}
      </div>

      {/* Padded content area */}
      <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h2 style={{ fontSize:'16px', fontWeight:500, color:'rgba(255,255,255,0.90)', marginBottom:'4px' }}>Visão do turno</h2>
        </div>
        <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', paddingBottom:'2px' }}>
          Dados em tempo real · {dataFormatada}
        </p>
      </div>

      {/* Chart + Top Drinks */}
      <div className="grid lg:grid-cols-5" style={{ gap: "16px" }}>
        <div
          className="animate-fade-in-up lg:col-span-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "none", borderRadius: "12px", padding: "24px", animationDelay: "300ms" }}
        >
          <p style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Receita — últimos 7 dias</p>
          <div className="flex items-baseline gap-3">
            <p style={{ fontSize: "28px", fontWeight: 600, color: "#ffffff" }}>
              {currency.format(receitaSemana.atual)}
            </p>
            <TrendText percent={receitaSemana.percentual} comparativoLabel="vs semana passada" />
          </div>
          <div className="mt-3" style={{ maxHeight: "160px", overflow: "hidden" }}>
            <BarChart data={pontosReceita} height={160} />
          </div>
        </div>

        <div
          className="animate-fade-in-up lg:col-span-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "none", borderRadius: "12px", padding: 0, animationDelay: "360ms" }}
        >
          <div style={{ padding: "24px 24px 0" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", marginBottom: "4px" }}>Top drinks</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.40)", marginBottom: "16px" }}>por margem · turno atual</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <th className="font-medium" style={{ padding: "6px 24px" }}>#</th>
                <th className="font-medium" style={{ padding: "6px 8px" }}>Drink</th>
                <th className="font-medium" style={{ padding: "6px 8px" }}>Tag</th>
                <th className="text-right font-medium" style={{ padding: "6px 8px" }}>Qtde</th>
                <th className="text-right font-medium" style={{ padding: "6px 8px" }}>Margem</th>
                <th className="text-right font-medium" style={{ padding: "6px 24px" }}>Receita</th>
              </tr>
            </thead>
            <tbody>
              {produtosTop5.map((produto, i) => (
                <tr key={produto.produtoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)", padding: "10px 24px" }}>{i + 1}</td>
                  <td style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", padding: "10px 8px" }}>{produto.produtoNome}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <CategoriaBadge categoria={produto.categoria} />
                  </td>
                  <td className="text-right" style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)", padding: "10px 8px" }}>
                    {produto.quantidadeVendida} un.
                  </td>
                  <td
                    className={cn(
                      "text-right",
                      produto.categoria === "problema" ? "text-error" : ""
                    )}
                    style={{ fontSize: "14px", padding: "10px 8px", color: produto.categoria === "problema" ? undefined : "rgba(255,255,255,0.50)" }}
                  >
                    {produto.margemPercentual !== null
                      ? `${percent.format(produto.margemPercentual)}%`
                      : "—"}
                  </td>
                  <td className="text-right" style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", padding: "10px 24px" }}>
                    {currency.format(produto.faturamento)}
                  </td>
                </tr>
              ))}
              {produtosTop5.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", padding: "10px 24px" }}>
                    Nenhuma venda neste turno ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="h-3" />
        </div>
      </div>

      {/* Bottom widgets */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>

        {/* CMV card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: 'none',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)', marginBottom:'12px' }}>CMV DO MÊS</p>
          <p style={{ fontSize:'32px', fontWeight:600, color:'#ffffff', marginBottom:'6px' }}>
            {cmvMes !== null ? `${cmvMes}%` : '—'}
          </p>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.45)' }}>custo sobre receita</p>
        </div>

        {/* Meta do Mês card */}
        {(() => {
          const fakeAtual = 3480;
          const fakeMeta = 5000;
          const fakeProgresso = Math.min(Math.round((fakeAtual / fakeMeta) * 100), 100);
          const fakeFalta = fakeMeta - fakeAtual;
          const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: 'none',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)', margin:0 }}>
                Meta do mês
              </p>

              <p style={{ fontSize:'28px', fontWeight:600, color:'#ffffff', margin:'12px 0 2px' }}>
                {fmt.format(fakeAtual)}
              </p>

              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.40)', margin:'0 0 20px' }}>
                de {fmt.format(fakeMeta)} · {fakeProgresso}%
              </p>

              {/* Progress bar */}
              <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'99px', height:'6px', marginBottom:'12px', overflow:'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #5b21b6 0%, #7c3aed 100%)',
                  borderRadius:'99px',
                  height:'6px',
                  width:`${fakeProgresso}%`,
                  transition:'width 0.6s ease',
                  boxShadow: '0 0 8px rgba(124,58,237,0.6)',
                }} />
              </div>

              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.40)', margin:0 }}>
                falta {fmt.format(fakeFalta)} para bater a meta
              </p>
            </div>
          );
        })()}

        {/* AI Insight card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: 'none',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)', marginBottom:'12px' }}>✦ SANTÉ AI</p>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.80)', lineHeight:1.6 }}>
            {insight ?? 'Nenhum insight disponível no momento.'}
          </p>
        </div>

      </div>

      </div>{/* end padded content area */}
    </div>
  );
}
