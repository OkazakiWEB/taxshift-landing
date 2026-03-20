'use client'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'

export default function Hero() {
  const { openModal } = useApp()
  const heroRef = useRef<HTMLDivElement>(null)
  const [clientCount, setClientCount] = useState(0)
  const [urgentCount, setUrgentCount] = useState(0)

  useEffect(() => {
    // Number animation
    const animateNum = (setter: (n: number) => void, target: number, duration: number) => {
      const step = target / (duration / 16)
      let current = 0
      const timer = setInterval(() => {
        current = Math.min(current + step, target)
        setter(Math.floor(current))
        if (current >= target) clearInterval(timer)
      }, 16)
    }

    const timeout = setTimeout(() => {
      animateNum(setClientCount, 47, 1200)
      animateNum(setUrgentCount, 12, 900)
    }, 400)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    // Scroll fade-up
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    const els = heroRef.current?.querySelectorAll('.fade-up')
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={heroRef}
      className="pt-28 pb-16 md:pt-36 md:pb-24 px-5"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div>
            {/* Badge */}
            <div className="fade-up animate inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
              style={{ backgroundColor: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}>
              <span className="w-2 h-2 rounded-full bg-gold badge-pulse inline-block" />
              +2.400 escritórios mapearam a Reforma com TaxShift
            </div>

            {/* Headline */}
            <h1
              className="fade-up animate font-serif text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.12] text-ink mb-6"
              style={{ transitionDelay: '0.1s' }}
            >
              Sua empresa vai pagar mais imposto
              <br />
              em 2027. Quanto mais —{' '}
              <em className="italic text-gold">depende de você</em>.
            </h1>

            {/* Subtitle */}
            <p
              className="fade-up animate text-base md:text-lg text-ink3 leading-relaxed mb-8 max-w-lg"
              style={{ transitionDelay: '0.2s' }}
            >
              A Reforma Tributária (EC 132/2023) entra em vigor gradualmente até 2033.
              TaxShift simula o impacto real no seu escritório e nos seus clientes,
              com dados atualizados e cenários comparativos automatizados.
            </p>

            {/* CTAs */}
            <div
              className="fade-up animate flex flex-wrap gap-3 mb-6"
              style={{ transitionDelay: '0.3s' }}
            >
              <button
                onClick={() => openModal('cadastro', 'pro')}
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-ink rounded-xl hover:bg-ink-2 transition-all duration-150 shadow-sm hover:shadow-md"
              >
                Calcular meu impacto grátis →
              </button>
              <button
                onClick={() => openModal('demo')}
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-ink bg-white rounded-xl border border-line hover:border-ink3 transition-all duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ver demonstração ao vivo
              </button>
            </div>

            {/* Trust note */}
            <p
              className="fade-up animate text-xs text-ink4"
              style={{ transitionDelay: '0.4s' }}
            >
              ✓ Sem cartão de crédito · EC 132/2023 atualizado · 7 dias grátis
            </p>
          </div>

          {/* Right Column — Mock Dashboard */}
          <div
            className="fade-up animate"
            style={{ transitionDelay: '0.2s' }}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-line bg-white">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-line-2 border-b border-line">
                <span className="w-3 h-3 rounded-full bg-red opacity-70" />
                <span className="w-3 h-3 rounded-full bg-gold opacity-70" />
                <span className="w-3 h-3 rounded-full bg-green opacity-70" />
                <div className="ml-3 flex-1 bg-white rounded text-xs text-ink4 px-3 py-1 font-mono">
                  app.taxshift.com.br/dashboard
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="p-5 bg-bg">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-ink4 font-medium">Escritório Santos & Associados</p>
                    <p className="text-sm font-semibold text-ink">Painel Tributário</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>
                    Reforma 2027
                  </span>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white rounded-xl p-3 border border-line">
                    <p className="text-xs text-ink4 mb-1">Clientes</p>
                    <p className="text-2xl font-bold text-ink font-mono">{clientCount}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-line">
                    <p className="text-xs text-ink4 mb-1">Faturamento</p>
                    <p className="text-xl font-bold text-ink font-mono">R$94M</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-line">
                    <p className="text-xs text-ink4 mb-1">Urgentes</p>
                    <p className="text-2xl font-bold text-red font-mono">{urgentCount}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-line">
                    <p className="text-xs text-ink4 mb-1">Compliance</p>
                    <p className="text-xl font-bold text-green font-mono">68%</p>
                  </div>
                </div>

                {/* Mini chart bar */}
                <div className="bg-white rounded-xl p-3 border border-line mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ink">Impacto por Regime Tributário</p>
                    <span className="text-xs text-ink4">2024 → 2027</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Lucro Presumido', pct: 78, color: 'bg-red' },
                      { label: 'Simples Nacional', pct: 45, color: 'bg-gold' },
                      { label: 'Lucro Real', pct: 30, color: 'bg-green' },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink3">{row.label}</span>
                          <span className="text-ink font-semibold">+{row.pct}%</span>
                        </div>
                        <div className="w-full bg-line-2 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client list mini */}
                <div className="bg-white rounded-xl p-3 border border-line">
                  <p className="text-xs font-semibold text-ink mb-2">Clientes em risco</p>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Tech Solutions Ltda', regime: 'LP', risk: 'Alto', color: 'text-red' },
                      { name: 'Construmax Engenharia', regime: 'LP', risk: 'Alto', color: 'text-red' },
                      { name: 'Bella Moda Ltda', regime: 'SN', risk: 'Médio', color: 'text-gold' },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-line-2 flex items-center justify-center text-xs font-bold text-ink3">
                            {c.name[0]}
                          </div>
                          <span className="text-xs text-ink truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink4">{c.regime}</span>
                          <span className={`text-xs font-semibold ${c.color}`}>{c.risk}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
