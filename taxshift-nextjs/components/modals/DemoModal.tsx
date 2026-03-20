'use client'
import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'

const navItems = [
  { icon: '⊞', label: 'Painel' },
  { icon: '📊', label: 'Métricas' },
  { icon: '🏢', label: 'Empresa/PJ' },
  { icon: '✓', label: 'Checklist' },
  { icon: '🔔', label: 'Alertas' },
  { icon: '🧮', label: 'Cálculos' },
  { icon: '📄', label: 'Relatório' },
]

const clients = [
  { name: 'Tech Solutions Ltda', regime: 'LP', impact: '+22.4%', risk: 'Alto', color: 'text-red' },
  { name: 'Construmax Engenharia', regime: 'LP', impact: '+19.8%', risk: 'Alto', color: 'text-red' },
  { name: 'Bella Moda Ltda', regime: 'SN', impact: '+11.2%', risk: 'Médio', color: 'text-gold' },
  { name: 'Farma Norte Ltda', regime: 'LR', impact: '+7.6%', risk: 'Baixo', color: 'text-green' },
  { name: 'Clínica Vida Saudável', regime: 'LP', impact: '+18.1%', risk: 'Alto', color: 'text-red' },
]

export default function DemoModal() {
  const { modal, closeModal, openModal } = useApp()
  const [activeScreen, setActiveScreen] = useState(0)
  const [activeNav, setActiveNav] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isOpen = modal === 'demo'

  useEffect(() => {
    if (!isOpen) return
    intervalRef.current = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % 4)
    }, 3200)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setActiveScreen(0)
      setActiveNav(0)
    }
  }, [isOpen])

  const goToScreen = (i: number) => {
    setActiveScreen(i)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % 4)
    }, 3200)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

      {/* Modal */}
      <div
        className="relative z-10 bg-white rounded-none sm:rounded-2xl overflow-hidden shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh]"
        style={{ maxWidth: '900px' }}
      >
        <div className="flex h-full sm:h-[600px]">
          {/* Sidebar (hidden on mobile) */}
          <aside
            className="hidden md:flex flex-col w-48 shrink-0 border-r border-line bg-bg"
          >
            {/* Logo */}
            <div className="px-5 py-4 border-b border-line">
              <div className="font-serif text-base text-ink">
                Tax<span className="text-gold">Shift</span>
                <span className="text-xs text-ink4 font-sans ml-1">PRO</span>
              </div>
            </div>
            {/* Nav */}
            <nav className="flex-1 py-3 overflow-y-auto">
              {navItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => { setActiveNav(i); goToScreen(Math.min(i, 3)) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all duration-150 text-left ${
                    activeNav === i
                      ? 'bg-white text-ink font-semibold shadow-sm rounded-lg mx-2 w-auto'
                      : 'text-ink3 hover:text-ink'
                  }`}
                  style={activeNav === i ? { margin: '0 8px', width: 'calc(100% - 16px)' } : {}}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            {/* User */}
            <div className="px-4 py-3 border-t border-line">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-white">
                  S
                </div>
                <div>
                  <p className="text-xs font-medium text-ink">Santos & Ass.</p>
                  <p className="text-xs text-ink4">Demo</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Topbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red opacity-70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gold opacity-70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green opacity-70" />
                </div>
                <span className="text-xs font-medium text-ink3 ml-2">
                  {['Painel — Visão Geral', 'Simulador Tributário', 'Checklist EC 132', 'Pitch Mode'][activeScreen]}
                </span>
              </div>
              <button onClick={closeModal} className="text-ink4 hover:text-ink transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Screen Area */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              {/* Screen 0: Dashboard */}
              {activeScreen === 0 && (
                <div className="p-5 animate-[fadeIn_0.3s_ease]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Clientes', val: '47', sub: 'carteira ativa' },
                      { label: 'Faturamento', val: 'R$94M', sub: 'total anual' },
                      { label: 'Urgentes', val: '12', sub: 'alto risco', red: true },
                      { label: 'Compliance', val: '68%', sub: 'em dia', green: true },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-bg rounded-xl p-3 border border-line">
                        <p className="text-xs text-ink4 mb-1">{kpi.label}</p>
                        <p className={`text-xl font-bold font-mono ${kpi.red ? 'text-red' : kpi.green ? 'text-green' : 'text-ink'}`}>
                          {kpi.val}
                        </p>
                        <p className="text-xs text-ink4 mt-0.5">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-bg rounded-xl border border-line overflow-hidden">
                    <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">Clientes em risco tributário</p>
                      <span className="text-xs text-ink4">Ordenados por impacto</span>
                    </div>
                    <div className="divide-y divide-line">
                      {clients.map((c) => (
                        <div key={c.name} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-line-2 flex items-center justify-center text-xs font-bold text-ink3">
                              {c.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-ink">{c.name}</p>
                              <p className="text-xs text-ink4">{c.regime}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-bold font-mono ${c.color}`}>{c.impact}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                c.risk === 'Alto'
                                  ? 'bg-red/10 text-red'
                                  : c.risk === 'Médio'
                                  ? 'text-gold'
                                  : 'text-green'
                              }`}
                              style={c.risk === 'Médio' ? { backgroundColor: 'var(--gold-bg)' } : c.risk === 'Baixo' ? { backgroundColor: 'var(--green-bg)' } : {}}
                            >
                              {c.risk}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Screen 1: Simulator */}
              {activeScreen === 1 && (
                <div className="p-5 animate-[fadeIn_0.3s_ease]">
                  <div className="mb-4">
                    <p className="text-xs text-ink4 mb-1">Empresa simulada</p>
                    <h3 className="text-base font-semibold text-ink">Tech Solutions Ltda</h3>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-bg rounded-xl p-4 border border-line">
                      <p className="text-xs text-ink4 mb-1">Regime atual</p>
                      <p className="text-sm font-semibold text-ink">Lucro Presumido</p>
                      <p className="text-xs text-ink4 mt-0.5">Serviços de TI</p>
                    </div>
                    <div className="bg-bg rounded-xl p-4 border border-line">
                      <p className="text-xs text-ink4 mb-1">Faturamento anual</p>
                      <p className="text-sm font-semibold text-ink">R$ 4.800.000</p>
                    </div>
                    <div className="bg-red/5 rounded-xl p-4 border border-red/20">
                      <p className="text-xs text-ink4 mb-1">Impacto estimado 2027</p>
                      <p className="text-2xl font-bold text-red font-mono">+18.4%</p>
                      <p className="text-xs text-ink4 mt-0.5">+R$88.320/ano</p>
                    </div>
                  </div>
                  <div className="bg-bg rounded-xl border border-line p-4">
                    <p className="text-xs font-semibold text-ink mb-3">Comparativo de regimes pós-reforma</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Lucro Presumido (atual)', pct: 100, impact: '+18.4%', color: 'bg-red', best: false },
                        { label: 'Lucro Real', pct: 68, impact: '+7.2%', color: 'bg-gold', best: false },
                        { label: 'Holding + LP', pct: 40, impact: '+2.1%', color: 'bg-green', best: true },
                      ].map((r) => (
                        <div key={r.label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-ink">{r.label}</span>
                              {r.best && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                  style={{ backgroundColor: 'var(--green-bg)', color: 'var(--green)' }}>
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-bold font-mono ${r.best ? 'text-green' : 'text-ink3'}`}>{r.impact}</span>
                          </div>
                          <div className="w-full bg-line-2 rounded-full h-2">
                            <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Screen 2: Checklist */}
              {activeScreen === 2 && (
                <div className="p-5 animate-[fadeIn_0.3s_ease]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-base font-semibold text-ink">Checklist EC 132/2023</h3>
                      <p className="text-xs text-ink4">Progresso do seu escritório</p>
                    </div>
                    {/* Progress ring */}
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                        <circle
                          cx="28" cy="28" r="22"
                          fill="none"
                          stroke="#c49a2a"
                          strokeWidth="5"
                          strokeDasharray={`${2 * Math.PI * 22 * 0.4} ${2 * Math.PI * 22 * 0.6}`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink">40%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { done: true, text: 'Mapeamento de regimes tributários da carteira' },
                      { done: true, text: 'Identificação de clientes Lucro Presumido em risco' },
                      { done: false, text: 'Simulação CBS/IBS para todos os clientes LP' },
                      { done: false, text: 'Análise de clientes Simples Nacional faixa 4-5' },
                      { done: false, text: 'Relatório de oportunidade enviado aos clientes' },
                      { done: false, text: 'Revisão de estruturas societárias — Holdings' },
                      { done: false, text: 'Checklist de documentação para transição 2026' },
                      { done: false, text: 'Treinamento equipe sobre novos regimes' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${item.done ? 'bg-green-bg' : 'bg-bg border border-line'}`}>
                        <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${item.done ? 'bg-green' : 'border-2 border-line'}`}>
                          {item.done && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs ${item.done ? 'text-green line-through' : 'text-ink'}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screen 3: Pitch Mode */}
              {activeScreen === 3 && (
                <div
                  className="flex flex-col items-center justify-center min-h-full p-8 text-center animate-[fadeIn_0.3s_ease]"
                  style={{ backgroundColor: 'var(--ink)', minHeight: '400px' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Lucro Presumido — Serviços
                  </p>
                  <p
                    className="font-mono font-bold mb-2 animate-[pitchNum_0.6s_ease_forwards]"
                    style={{ fontSize: 'clamp(60px, 15vw, 100px)', color: 'var(--red)', lineHeight: 1 }}
                  >
                    +18.4%
                  </p>
                  <p className="text-base text-white/60 mb-2">de aumento na carga tributária</p>
                  <p className="text-sm text-white/40 font-mono">2024 → 2027 · EC 132/2023</p>
                  <div className="mt-8 px-6 py-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-xs text-white/60 mb-1">Impacto financeiro estimado</p>
                    <p className="text-2xl font-bold font-mono text-white">+ R$ 88.320 / ano</p>
                    <p className="text-xs text-white/40 mt-1">Tech Solutions Ltda · Faturamento R$4,8M</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-line bg-bg shrink-0 flex items-center justify-between gap-4">
              {/* Screen dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => goToScreen(i)}
                    className={`rounded-full transition-all duration-200 ${
                      activeScreen === i ? 'w-4 h-2 bg-ink' : 'w-2 h-2 bg-line hover:bg-ink3'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-ink4 hidden sm:block">
                Demo automática · Clique nos pontos para navegar
              </p>
              <button
                onClick={() => { closeModal(); setTimeout(() => openModal('cadastro', 'pro'), 200) }}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-ink hover:bg-ink-2 transition-all duration-150 shrink-0"
              >
                Começar 7 dias grátis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
