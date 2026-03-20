'use client'
import { useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'

const problems = [
  {
    icon: '⏱',
    title: 'Planilha não resolve mais',
    desc: 'Calculadoras manuais não conseguem simular regimes simultâneos, transições graduais e impactos por CNAE na nova tributação.',
  },
  {
    icon: '😰',
    title: 'Horas perdidas por cliente',
    desc: 'Cada análise de impacto consome 4 a 8 horas de trabalho manual, tornando inviável analisar toda a carteira.',
  },
  {
    icon: '📋',
    title: 'Reforma sem resposta clara',
    desc: 'A EC 132 tem mais de 400 artigos. Sem ferramenta especializada, fica impossível saber qual regime vai ser melhor pós-2027.',
  },
  {
    icon: '📅',
    title: 'Zero visibilidade futura',
    desc: 'Sem projeção de 2025 a 2033, seus clientes tomam decisões de estrutura societária às cegas, com alto risco fiscal.',
  },
]

const solutions = [
  'Simulação automática para toda carteira de clientes em minutos',
  'Comparativo entre Lucro Presumido, Real e Simples com nova alíquota CBS/IBS',
  'Alertas automáticos quando um cliente muda de faixa de risco',
  'Relatórios em PDF prontos para apresentar ao cliente em 1 clique',
  'Atualização automática quando sair nova regulamentação da Reforma',
]

export default function Problems() {
  const { openModal } = useApp()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
    const els = sectionRef.current?.querySelectorAll('.fade-up')
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 px-5 bg-bg" id="problemas">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">O problema</p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
            Por que a maioria dos escritórios
            <br />
            vai ser pega de surpresa
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Problem Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <div
                key={p.title}
                className="fade-up animate bg-white rounded-2xl p-5 border border-line hover:shadow-md transition-all duration-200"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className="text-2xl mb-3 block">{p.icon}</span>
                <h3 className="font-semibold text-sm text-ink mb-2">{p.title}</h3>
                <p className="text-xs text-ink3 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Solution Box */}
          <div
            className="fade-up animate rounded-2xl p-7 text-white"
            style={{ backgroundColor: 'var(--ink)', transitionDelay: '0.2s' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="text-gold font-serif text-lg">TaxShift</span>
              <span className="text-xs text-white/40 font-medium px-2 py-0.5 rounded-full border border-white/10">solução</span>
            </div>
            <h3 className="font-serif text-2xl text-white mb-5 leading-snug">
              Tudo que seu escritório precisa para a Reforma em um só lugar
            </h3>
            <ul className="space-y-3 mb-7">
              {solutions.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="text-gold mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
            <button
              onClick={() => openModal('cadastro', 'pro')}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-ink hover:opacity-90 transition-opacity duration-150"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              Ver tudo em ação grátis →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
