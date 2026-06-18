import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { question, barId } = await req.json()

    const supabase = await createClient()

    // Fetch bar context
    const [kpisResult, alertasResult, turnoResult] = await Promise.all([
      // KPIs do turno atual
      supabase
        .from('turnos')
        .select('id, aberto_em, total_vendas')
        .eq('bar_id', barId)
        .eq('status', 'aberto')
        .maybeSingle(),

      // Alertas de estoque
      supabase
        .from('estoque')
        .select('quantidade_atual, quantidade_minima, produtos(nome)')
        .eq('bar_id', barId),

      // Últimos 5 turnos
      supabase
        .from('turnos')
        .select('aberto_em, fechado_em, total_vendas, status')
        .eq('bar_id', barId)
        .order('aberto_em', { ascending: false })
        .limit(5),
    ])

    // Build context string
    const turnoAtual = kpisResult.data as { id: string; aberto_em: string; total_vendas: number } | null
    const estoqueItems = (alertasResult.data ?? []) as Array<{
      quantidade_atual: number
      quantidade_minima: number
      produtos: { nome: string } | null
    }>
    const alertas = estoqueItems.filter(
      (row) => row.quantidade_atual < row.quantidade_minima
    )
    const ultimosTurnos = (turnoResult.data ?? []) as Array<{
      total_vendas: number
    }>

    const faturamentoTurno = turnoAtual?.total_vendas || 0
    const faturamento7dias = ultimosTurnos.reduce(
      (sum: number, t) => sum + (t.total_vendas || 0),
      0
    )

    const context = `
Você é o assistente de inteligência do Superbar, um sistema para bares premium. Responda de forma direta, útil e focada no negócio. Use português. Seja conciso (máximo 2-3 frases).

DADOS ATUAIS DO BAR:

Turno atual: ${turnoAtual ? `aberto, faturamento R$ ${faturamentoTurno.toFixed(2)}` : 'nenhum turno aberto'}

Últimos 7 dias - faturamento total: R$ ${faturamento7dias.toFixed(2)}
Número de turnos: ${ultimosTurnos.length}

Alertas de estoque: ${alertas.length === 0 ? 'nenhum' : alertas.map((a) => a.produtos?.nome).join(', ')}

Pergunta do dono do bar: ${question}
`

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: context }],
    })

    const response =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Não consegui processar.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { response: 'Erro ao consultar a IA. Verifique a configuração.' },
      { status: 500 }
    )
  }
}
