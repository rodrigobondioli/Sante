'use client'

import { useState } from 'react'

const SUGGESTIONS = [
  'Como está meu CMV?',
  'Top drinks hoje',
  'Resumo do turno',
]

export function AiHeroInput({ barId }: { barId: string }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      {/* Single card — input + pills */}
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '20px', opacity: 0.6, flexShrink: 0 }}>✦</span>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(question)}
            placeholder="Pergunte ao Santé..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '15px',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading}
            style={{
              background: '#260078',
              border: 'none',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span style={{ color: 'white', fontSize: '16px' }}>·</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 20px' }} />

        {/* Pills row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '12px 20px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginRight: '4px' }}>
            Populares:
          </span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => ask(s)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '99px',
                padding: '3px 12px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '14px 20px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
          textAlign: 'left',
        }}>
          {loading ? (
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Consultando dados do bar...</span>
          ) : answer}
        </div>
      )}

      <p style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        ✦ Powered by Santé AI
      </p>
    </div>
  )
}
