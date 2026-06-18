export type PeriodoPreset = "hoje" | "ontem" | "7d" | "30d";

export interface PeriodoRange {
  inicio: Date;
  fim: Date;
}

export interface PeriodoSearchParams {
  preset?: string;
  inicio?: string;
  fim?: string;
}

function inicioDoDia(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finalDoDia(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function diasNoPeriodo(periodo: PeriodoRange) {
  const umDiaMs = 24 * 60 * 60 * 1000;
  return Math.round((inicioDoDia(periodo.fim).getTime() - inicioDoDia(periodo.inicio).getTime()) / umDiaMs) + 1;
}

// Datas de input type="date" vêm como "AAAA-MM-DD" sem horário — parsear com
// "T00:00:00" evita que o new Date() interprete como UTC e role pro dia
// anterior no fuso do Brasil.
function parseDataLocal(valor: string): Date {
  return new Date(`${valor}T00:00:00`);
}

export function resolvePeriodo(params: PeriodoSearchParams): PeriodoRange {
  const hoje = inicioDoDia(new Date());

  if (params.inicio && params.fim) {
    const inicio = inicioDoDia(parseDataLocal(params.inicio));
    const fim = finalDoDia(parseDataLocal(params.fim));
    if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && inicio <= fim) {
      return { inicio, fim };
    }
  }

  switch (params.preset) {
    case "hoje":
      return { inicio: hoje, fim: finalDoDia(hoje) };
    case "ontem": {
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      return { inicio: ontem, fim: finalDoDia(ontem) };
    }
    case "30d": {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - 29);
      return { inicio, fim: finalDoDia(hoje) };
    }
    case "7d":
    default: {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - 6);
      return { inicio, fim: finalDoDia(hoje) };
    }
  }
}

// Período imediatamente anterior, com a mesma quantidade de dias do período
// atual — usado pra calcular a variação percentual.
export function periodoAnterior(periodo: PeriodoRange): PeriodoRange {
  const dias = diasNoPeriodo(periodo);
  const fimAnterior = finalDoDia(new Date(inicioDoDia(periodo.inicio).getTime() - 1));
  const inicioAnterior = new Date(fimAnterior);
  inicioAnterior.setDate(inicioAnterior.getDate() - (dias - 1));
  return { inicio: inicioDoDia(inicioAnterior), fim: fimAnterior };
}

export function gerarDiasDoPeriodo(periodo: PeriodoRange): Date[] {
  const dias = diasNoPeriodo(periodo);
  const lista: Date[] = [];
  for (let i = 0; i < dias; i++) {
    const dia = new Date(periodo.inicio);
    dia.setDate(dia.getDate() + i);
    lista.push(dia);
  }
  return lista;
}

export function periodoMesAtual(): PeriodoRange {
  const hoje = inicioDoDia(new Date());
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { inicio, fim: finalDoDia(hoje) };
}

export { inicioDoDia, finalDoDia };
