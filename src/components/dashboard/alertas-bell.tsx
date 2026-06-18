"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { AlertaEstoque } from "@/lib/dashboard/queries";

interface AlertasBellProps {
  alertas: AlertaEstoque[];
}

export function AlertasBell({ alertas }: AlertasBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 100 }}>
      <button
        type="button"
        title="Alertas de estoque"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center transition duration-150 active:scale-[0.97]"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {alertas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold text-white">
            {alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: '0',
          width: '360px',
          background: 'rgba(10,10,16,0.97)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 100,
          backdropFilter: 'blur(40px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize:'14px', fontWeight:500, color:'#ffffff' }}>Notificações</span>
            <button style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              ✓ Marcar todas
            </button>
          </div>

          {/* Items */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>

            {/* Stock alerts from real data */}
            {alertas.map((alerta, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', alignItems:'flex-start' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'16px', color:'rgba(255,255,255,0.70)' }}>⚠</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.85)', marginBottom:'3px' }}>Estoque baixo</p>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.4 }}>
                    {alerta.produtoNome} está abaixo do mínimo ({alerta.quantidadeAtual} / mín. {alerta.quantidadeMinima})
                  </p>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'4px' }}>Agora</p>
                </div>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f87171', flexShrink:0, marginTop:'4px' }} />
              </div>
            ))}

            {alertas.length === 0 && (
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)', padding:'20px', textAlign:'center' }}>Nenhum alerta no momento.</p>
            )}

            {/* Static example notifications */}
            {[
              { icon: '📊', title: 'Turno fechado com sucesso', desc: 'O turno de ontem foi encerrado. Faturamento: R$ 1.240,00', time: '2h atrás' },
              { icon: '🍹', title: 'Novo produto vendido', desc: 'Caipirinha de Maracujá vendida pela 1ª vez hoje', time: '4h atrás' },
              { icon: '💡', title: 'Insight da IA', desc: 'Gin Tônica está com margem 12% acima da média — considere destacá-lo', time: 'Ontem' },
            ].map((n, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', alignItems:'flex-start' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'16px' }}>
                  {n.icon}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.85)', marginBottom:'3px' }}>{n.title}</p>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.4 }}>{n.desc}</p>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'4px' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
