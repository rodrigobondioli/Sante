'use client'

import { useState } from 'react'

const SUGGESTIONS = [
  'Como está meu CMV?',
  'O que precisa da minha atenção?',
  'Qual produto mais vendeu hoje?',
  'Resumo do turno',
]

function getSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function AiHeroInput({ barId, alertCount }: { barId: string; alertCount?: number }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const greeting = alertCount !== undefined && alertCount > 0
    ? `${getSaudacao()}. Identificamos ${alertCount} ${alertCount === 1 ? 'ponto que merece' : 'pontos que merecem'} atenção hoje.`
    : 'O que você quer entender sobre seu bar hoje?'

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setLoading(true)
    setAnswer('')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, barId }),
      })
      const data = await res.json()
      setAnswer(data.response)
    } catch {
      setAnswer('Erro ao consultar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Card */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Saudação + chips */}
        <div style={{ padding: '16px 16px 12px' }}>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 10px' }}>
            {greeting}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => ask(s)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  color: 'var(--fg-subtle)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms, border-color 150ms',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px' }} />

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(question)}
            placeholder="Ou digite sua pergunta…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontSize: '13px',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '4px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span style={{ color: 'var(--accent-fg)', fontSize: '16px' }}>·</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-fg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--fg)',
          lineHeight: 1.6,
        }}>
          {loading ? (
            <span style={{ color: 'var(--fg-subtle)' }}>Consultando dados do bar...</span>
          ) : answer}
        </div>
      )}
    </div>
  )
}
