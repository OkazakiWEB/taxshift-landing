'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    priceM: 0,
    priceA: 0,
    desc: 'Para conhecer a ferramenta',
    cta: 'Começar grátis',
    ctaVariant: 'ghost',
    featured: false,
    features: [
      '3 clientes',
      'Simulação básica (LP vs. SN)',
      'Dashboard resumido',
      'Suporte por e-mail',
    ],
    extras: [
      'Sem relatórios em PDF',
      'Sem alertas automáticos',
      'Sem comparativo EC 132',
    ],
  },
  {
    id: 'basico',
    name: 'Básico',
    priceM: 97,
    priceA: 78,
    desc: 'Para contadores autônomos',
    cta: 'Assinar Básico',
    ctaVariant: 'outline',
    featured: false,
    features: [
      'Até 25 clientes',
      'Simulação completa (LP, LR, SN)',
      'Relatórios em PDF por cliente',
      'Comparativo EC 132/2023',
      'Suporte por e-mail + chat',
      '7 dias de teste grátis',
    ],
    extras: [],
  },
  {
    id: 'pro',
    name: 'Profissional',
    priceM: 197,
    priceA: 158,
    desc: 'Para escritórios em crescimento',
    cta: 'Assinar Profissional',
    ctaVariant: 'primary',
    featured: true,
    badge: 'Mais popular',
    features: [
      'Clientes ilimitados',
      'Simulação completa + projeção 2033',
      'Alertas automáticos de risco',
      'White-label em relatórios',
      'API para integração contábil',
      'Suporte prioritário',
      'Atualizações regulatórias em tempo real',
      '7 dias de teste grátis',
    ],
    extras: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceM: 397,
    priceA: 318,
    desc: 'Para redes e grupos contábeis',
    cta: 'Falar com comercial',
    ctaVariant: 'gold',
    featured: false,
    features: [
      'Múltiplas filiais / escritórios',
      'Usuários ilimitados',
      'Onboarding dedicado',
      'SLA de 4h em dias úteis',
      'Integração ERP personalizada',
      'Treinamento para equipe',
      'Gestor de conta exclusivo',
    ],
    extras: [],
  },
]

export default function Pricing() {
  const { billing, setBilling, openModal } = useApp()
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  const handleCTA = (plan: typeof plans[0]) => {
    if (plan.id === 'enterprise') {
      openModal('enterprise')
    } else if (plan.id === 'free') {
      openModal('cadastro', 'free')
    } else {
      openModal('cadastro', plan.id as 'basico' | 'pro')
    }
  }

  return (
    <section id="planos" className="py-20 px-5 bg-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">Planos</p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-4">
            Investimento que se paga
            <br />
            na primeira reunião com cliente
          </h2>
          <p className="text-sm text-ink3 max-w-md mx-auto">
            Quanto vale apresentar um diagnóstico que seus concorrentes não conseguem entregar?
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling('mensal')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              billing === 'mensal'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-white text-ink3 border border-line hover:border-ink3'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('anual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              billing === 'anual'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-white text-ink3 border border-line hover:border-ink3'
            }`}
          >
            Anual
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'var(--gold-bg)', color: 'var(--gold)' }}>
              -20%
            </span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const price = billing === 'anual' ? plan.priceA : plan.priceM
            const isExpanded = expandedPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
                  plan.featured
                    ? 'border-ink shadow-xl scale-[1.02]'
                    : 'border-line bg-white hover:shadow-md'
                }`}
                style={plan.featured ? { backgroundColor: 'var(--ink)' } : {}}
              >
                {/* Featured badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--gold)', color: 'white' }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="mb-5">
                    <h3
                      className={`font-semibold text-sm mb-1 ${plan.featured ? 'text-white' : 'text-ink'}`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs ${plan.featured ? 'text-white/50' : 'text-ink4'}`}
                    >
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {price === 0 ? (
                      <p className={`text-3xl font-bold font-mono ${plan.featured ? 'text-white' : 'text-ink'}`}>
                        Grátis
                      </p>
                    ) : (
                      <div>
                        <p className={`text-xs mb-1 ${plan.featured ? 'text-white/50' : 'text-ink4'}`}>
                          a partir de
                        </p>
                        <div className="flex items-end gap-1">
                          <span className={`text-xs font-medium ${plan.featured ? 'text-white/70' : 'text-ink3'}`}>R$</span>
                          <span className={`text-3xl font-bold font-mono leading-none ${plan.featured ? 'text-white' : 'text-ink'}`}>
                            {price}
                          </span>
                          <span className={`text-xs mb-1 ${plan.featured ? 'text-white/50' : 'text-ink4'}`}>/mês</span>
                        </div>
                        {billing === 'anual' && (
                          <p className={`text-xs mt-1 ${plan.featured ? 'text-white/50' : 'text-ink4'}`}>
                            cobrado anualmente
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.slice(0, isExpanded ? undefined : 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 shrink-0 ${plan.featured ? 'text-gold' : 'text-green'}`}>✓</span>
                        <span className={plan.featured ? 'text-white/80' : 'text-ink3'}>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && !isExpanded && (
                      <li>
                        <button
                          onClick={() => setExpandedPlan(plan.id)}
                          className={`text-xs underline bg-transparent border-none cursor-pointer ${
                            plan.featured ? 'text-white/50 hover:text-white/80' : 'text-ink4 hover:text-ink3'
                          }`}
                        >
                          +{plan.features.length - 4} recursos
                        </button>
                      </li>
                    )}
                    {isExpanded && plan.features.length > 4 && (
                      <li>
                        <button
                          onClick={() => setExpandedPlan(null)}
                          className={`text-xs underline bg-transparent border-none cursor-pointer ${
                            plan.featured ? 'text-white/50 hover:text-white/80' : 'text-ink4 hover:text-ink3'
                          }`}
                        >
                          ver menos
                        </button>
                      </li>
                    )}
                    {plan.extras.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-xs opacity-40">
                        <span className="mt-0.5 shrink-0">✗</span>
                        <span className={plan.featured ? 'text-white' : 'text-ink3'}>{e}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCTA(plan)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      plan.ctaVariant === 'primary'
                        ? 'text-ink hover:opacity-90'
                        : plan.ctaVariant === 'gold'
                        ? 'text-ink hover:opacity-90'
                        : plan.ctaVariant === 'ghost'
                        ? 'text-ink3 border border-line hover:border-ink3 bg-transparent'
                        : 'text-ink border border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                    style={
                      plan.ctaVariant === 'primary'
                        ? { backgroundColor: 'var(--gold)' }
                        : plan.ctaVariant === 'gold'
                        ? { backgroundColor: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }
                        : {}
                    }
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-ink4 mt-8">
          Todos os planos incluem 7 dias grátis. Cancele quando quiser. Sem multa.
        </p>
      </div>
    </section>
  )
}
