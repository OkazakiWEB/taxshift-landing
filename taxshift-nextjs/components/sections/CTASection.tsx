'use client'
import { useApp } from '@/context/AppContext'

export default function CTASection() {
  const { openModal } = useApp()

  return (
    <section
      className="py-20 px-5"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
          A janela está fechando
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-5">
          A Reforma já começou.
          <br />
          Você sabe o quanto vai custar?
        </h2>
        <p className="text-base text-white/60 leading-relaxed mb-10 max-w-xl mx-auto">
          Cada mês sem análise é um mês que seu cliente toma decisões erradas de estrutura.
          Comece agora — são 7 dias grátis, sem cartão.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <button
            onClick={() => openModal('cadastro', 'pro')}
            className="inline-flex items-center px-7 py-3.5 rounded-xl text-base font-semibold text-ink transition-all duration-150 hover:opacity-90 shadow-lg"
            style={{ backgroundColor: 'var(--gold)' }}
          >
            Calcular grátis →
          </button>
          <button
            onClick={() => openModal('demo')}
            className="inline-flex items-center px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-150"
            style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <svg className="w-4 h-4 mr-2 text-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Ver demonstração
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="text-green">✓</span>
            7 dias grátis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green">✓</span>
            Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green">✓</span>
            Cancele quando quiser
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green">✓</span>
            EC 132/2023 atualizado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green">✓</span>
            LGPD compliant
          </span>
        </div>
      </div>
    </section>
  )
}
