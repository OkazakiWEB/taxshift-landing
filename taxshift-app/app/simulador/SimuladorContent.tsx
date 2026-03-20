'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import {
  calculateTax,
  formatCurrency,
  formatPercent,
  type TaxInput,
  type SimulationResult,
} from '@/lib/tax-calculator'
import { getClients, type Client } from '@/lib/db'
import { saveSimulation } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimuladorContentProps {
  user: any
}

type Step = 1 | 2 | 3

// ─── Constants ────────────────────────────────────────────────────────────────

const STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

const SECTORS = [
  'Serviços',
  'Tecnologia',
  'Saúde',
  'Educação',
  'Construção',
  'Comércio',
  'Indústria',
  'Agronegócio',
  'Alimentação',
]

const REGIME_INFO = {
  SN: { label: 'Simples Nacional', color: '#3b82f6', short: 'SN', desc: 'Até R$4,8M/ano' },
  LP: { label: 'Lucro Presumido', color: '#8b5cf6', short: 'LP', desc: 'Até R$78M/ano' },
  LR: { label: 'Lucro Real', color: '#f59e0b', short: 'LR', desc: 'Obrigatório acima de R$78M' },
  MEI: { label: 'MEI', color: '#10b981', short: 'MEI', desc: 'Até R$81K/ano' },
}

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  duration = 1200,
  className = '',
  prefix = '',
  suffix = '',
}: {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const prevValue = useRef<number>(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{displayed.toFixed(1)}{suffix}
    </span>
  )
}

// ─── Format CNPJ ──────────────────────────────────────────────────────────────

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// ─── Timeline Bar Chart ───────────────────────────────────────────────────────

function TimelineChart({ projection }: { projection: SimulationResult['yearlyProjection'] }) {
  const maxBurden = Math.max(...projection.map((p) => p.newBurden))
  const [hoveredYear, setHoveredYear] = useState<number | null>(null)

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 h-40 px-1">
        {projection.map((p, i) => {
          const height = maxBurden > 0 ? (p.newBurden / maxBurden) * 100 : 0
          const isHovered = hoveredYear === p.year
          // Color gradient: gray -> amber -> red
          const progress = i / (projection.length - 1)
          const isLast = i === projection.length - 1

          return (
            <div
              key={p.year}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
              onMouseEnter={() => setHoveredYear(p.year)}
              onMouseLeave={() => setHoveredYear(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute z-20 -mt-16 bg-[#1a1d24] border border-white/20 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="text-white font-semibold">{formatCurrency(p.newBurden)}</p>
                  <p className={p.delta >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {p.delta >= 0 ? '+' : ''}{formatCurrency(p.delta)}
                  </p>
                </div>
              )}
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                <div
                  className="w-full rounded-t-sm transition-all duration-200"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    background: isLast
                      ? 'linear-gradient(to top, #dc2626, #ef4444)'
                      : progress < 0.3
                      ? `rgba(255,255,255,${0.15 + progress * 0.3})`
                      : progress < 0.6
                      ? `rgba(251,191,36,${0.4 + progress * 0.3})`
                      : `rgba(239,68,68,${0.5 + progress * 0.4})`,
                    opacity: isHovered ? 1 : 0.85,
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
              {/* Year label */}
              <span className="text-[10px] text-white/40 font-medium">{p.year}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SimuladorContent({ user }: SimuladorContentProps) {
  const [step, setStep] = useState<Step>(1)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [revenue, setRevenue] = useState('')
  const [regime, setRegime] = useState<TaxInput['regime']>('SN')
  const [sector, setSector] = useState('Serviços')
  const [state, setState] = useState('SP')

  // Result
  const [result, setResult] = useState<SimulationResult | null>(null)

  // Load clients
  useEffect(() => {
    getClients().then(setClients).catch(() => {})
  }, [])

  // Pre-fill from selected client
  useEffect(() => {
    if (!selectedClientId) return
    const client = clients.find((c) => c.id === selectedClientId)
    if (!client) return
    setCompanyName(client.name)
    setCnpj(client.cnpj ?? '')
    setRevenue(client.revenue?.toString() ?? '')
    setRegime(client.regime as TaxInput['regime'])
    setSector(client.sector ?? 'Serviços')
  }, [selectedClientId, clients])

  // Live preview calculation
  const previewResult = useCallback((): SimulationResult | null => {
    const rev = parseFloat(revenue.replace(/\D/g, ''))
    if (!rev || rev <= 0) return null
    try {
      return calculateTax({ regime, sector, revenue: rev, state })
    } catch {
      return null
    }
  }, [regime, sector, revenue, state])

  const livePreview = previewResult()

  const handleCalculate = () => {
    const rev = parseFloat(revenue.replace(/\D/g, ''))
    if (!companyName.trim()) { alert('Informe o nome da empresa'); return }
    if (!rev || rev <= 0) { alert('Informe o faturamento anual'); return }

    const res = calculateTax({ regime, sector, revenue: rev, state })
    setResult(res)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await saveSimulation({
        client_id: selectedClientId || null,
        company_name: companyName,
        regime: result.input.regime,
        sector: result.input.sector,
        revenue: result.input.revenue,
        state: result.input.state ?? null,
        impact_percent: result.totalImpactPercent,
        impact_annual: result.totalImpact,
        current_burden: result.currentAnnualBurden,
        new_burden_2033: result.newAnnualBurden2033,
        recommendation: result.recommendation,
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleReset = () => {
    setStep(1)
    setResult(null)
    setSelectedClientId('')
    setCompanyName('')
    setCnpj('')
    setRevenue('')
    setRegime('SN')
    setSector('Serviços')
    setState('SP')
    setSavedOk(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const impactIsPositive = (result?.totalImpactPercent ?? 0) >= 0

  // ─── STEP 3: Pitch Mode ──────────────────────────────────────────────────────
  if (step === 3 && result) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#06080f' }}
      >
        {/* Gold glow at top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(196,154,42,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Company name */}
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase mb-8 z-10">
          {companyName}
        </p>

        {/* Big impact number */}
        <div className="z-10 text-center mb-4">
          <AnimatedNumber
            value={result.totalImpactPercent}
            prefix={result.totalImpactPercent >= 0 ? '+' : ''}
            suffix="%"
            duration={1500}
            className={`text-[96px] md:text-[128px] font-bold leading-none tracking-tighter ${
              impactIsPositive ? 'text-red-400' : 'text-emerald-400'
            }`}
          />
        </div>

        <p className="text-white/60 text-lg md:text-xl font-light tracking-wide z-10 mb-2">
          de {impactIsPositive ? 'aumento' : 'redução'} estimado na carga tributária
        </p>
        <p className="text-[#c49a2a] text-sm font-medium tracking-widest uppercase mb-12 z-10">
          Fase 2033 · EC 132/2023
        </p>

        {/* 3 stat boxes */}
        <div className="z-10 flex gap-4 mb-10 flex-wrap justify-center px-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center min-w-[140px]">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Carga Atual</p>
            <p className="text-white text-xl font-bold">{formatCurrency(result.currentAnnualBurden)}</p>
            <p className="text-white/30 text-xs mt-1">{formatPercent(result.currentEffectiveRate)} efetivo</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center min-w-[140px]">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Carga 2033</p>
            <p className={`text-xl font-bold ${impactIsPositive ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(result.newAnnualBurden2033)}
            </p>
            <p className="text-white/30 text-xs mt-1">{formatPercent(result.newEffectiveRate2033)} efetivo</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center min-w-[140px]">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Diferença Anual</p>
            <p className={`text-xl font-bold ${impactIsPositive ? 'text-red-400' : 'text-emerald-400'}`}>
              {result.totalImpact >= 0 ? '+' : ''}{formatCurrency(result.totalImpact)}
            </p>
            <p className="text-white/30 text-xs mt-1">por ano</p>
          </div>
        </div>

        {/* Best scenario */}
        {result.savings.bestSavings > 0 && (
          <div className="z-10 flex items-center gap-3 bg-[#c49a2a]/10 border border-[#c49a2a]/30 rounded-xl px-6 py-3 mb-10">
            <span className="text-[#c49a2a] text-lg">★</span>
            <p className="text-white/80 text-sm">
              <span className="text-[#c49a2a] font-semibold">Melhor cenário: </span>
              {result.savings.bestOption}
              {' → '}
              <span className="text-emerald-400 font-semibold">
                economia de {formatCurrency(result.savings.bestSavings)}/ano
              </span>
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="z-10 flex items-center gap-4 mt-auto mb-8">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Salvar como PDF
          </button>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c49a2a] hover:bg-[#d4aa3a] text-white text-sm font-semibold transition-all"
          >
            Voltar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP 2: Results ──────────────────────────────────────────────────────────
  if (step === 2 && result) {
    const { yearlyProjection, scenarios } = result

    return (
      <div className="flex h-screen bg-[#0a0b0e] overflow-hidden">
        <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main className="flex-1 lg:ml-56 overflow-y-auto">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0d0e11] sticky top-0 z-30">
            <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="text-white font-semibold text-sm">Simulador Tributário</span>
          </div>

          <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              {[1,2,3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s === step ? 'bg-[#c49a2a] text-white' :
                    s < step ? 'bg-[#c49a2a]/30 text-[#c49a2a]' :
                    'bg-white/10 text-white/30'
                  }`}>{s}</div>
                  {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-[#c49a2a]/50' : 'bg-white/10'}`} />}
                </div>
              ))}
              <span className="text-white/40 text-sm ml-2">Resultado</span>
            </div>

            {/* TOP RESULT CARD */}
            <div className={`rounded-2xl border p-6 mb-6 relative overflow-hidden ${
              impactIsPositive
                ? 'bg-red-950/20 border-red-500/30'
                : 'bg-emerald-950/20 border-emerald-500/30'
            }`}>
              {/* Background glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: impactIsPositive
                    ? 'radial-gradient(ellipse at top right, rgba(220,38,38,0.08) 0%, transparent 60%)'
                    : 'radial-gradient(ellipse at top right, rgba(16,185,129,0.08) 0%, transparent 60%)',
                }}
              />

              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-white font-bold text-xl">{companyName}</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: REGIME_INFO[regime].color + '22',
                        color: REGIME_INFO[regime].color,
                        border: `1px solid ${REGIME_INFO[regime].color}44`,
                      }}
                    >
                      {REGIME_INFO[regime].label}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mb-1">Setor: {sector} · Estado: {state}</p>
                  <p className="text-white/50 text-sm">
                    Faturamento: {formatCurrency(result.input.revenue)}/ano
                  </p>
                </div>

                <div className="text-right">
                  <AnimatedNumber
                    value={result.totalImpactPercent}
                    prefix={result.totalImpactPercent >= 0 ? '+' : ''}
                    suffix="%"
                    duration={1200}
                    className={`text-5xl md:text-6xl font-bold leading-none ${
                      impactIsPositive ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  />
                  <p className="text-white/50 text-sm mt-1 mb-2">na carga tributária em 2033</p>
                  <p className={`text-lg font-semibold ${impactIsPositive ? 'text-red-300' : 'text-emerald-300'}`}>
                    {impactIsPositive ? 'Aumento' : 'Economia'} de{' '}
                    {formatCurrency(Math.abs(result.totalImpact))}/ano
                  </p>
                </div>
              </div>
            </div>

            {/* SCENARIOS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { key: 'current', data: scenarios.current },
                { key: 'lucroReal', data: scenarios.lucroReal },
                { key: 'holding', data: scenarios.holding },
              ].map(({ key, data }) => (
                <div
                  key={key}
                  className={`rounded-xl border p-5 relative transition-all ${
                    data.recommended
                      ? 'border-[#c49a2a]/60 bg-[#c49a2a]/5'
                      : 'border-white/10 bg-[#0d0e11]'
                  }`}
                >
                  {data.recommended && (
                    <div className="absolute -top-3 left-4">
                      <span className="bg-[#c49a2a] text-black text-xs font-bold px-3 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    </div>
                  )}

                  <h3 className="text-white font-semibold text-sm mb-3">{data.name}</h3>

                  <div className="mb-3">
                    <span className="text-white/40 text-xs">Taxa efetiva 2033</span>
                    <p className="text-white text-xl font-bold">{formatPercent(data.effectiveRate2033)}</p>
                  </div>

                  <div className="mb-3">
                    <span className="text-white/40 text-xs">Carga anual 2033</span>
                    <p className="text-white font-semibold">{formatCurrency(data.annualBurden2033)}</p>
                  </div>

                  {key !== 'current' && (
                    <div className="mb-4">
                      <span className="text-white/40 text-xs">vs. Regime Atual</span>
                      {(() => {
                        const savings = result.currentAnnualBurden > 0
                          ? scenarios.current.annualBurden2033 - data.annualBurden2033
                          : 0
                        return (
                          <p className={`font-semibold text-sm ${savings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {savings >= 0 ? 'Economia de ' : 'Acréscimo de '}
                            {formatCurrency(Math.abs(savings))}/ano
                          </p>
                        )
                      })()}
                    </div>
                  )}

                  <div>
                    <p className="text-white/40 text-xs mb-1.5">Vantagens</p>
                    <ul className="space-y-1">
                      {data.pros.slice(0, 3).map((pro, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* TIMELINE CHART */}
            <div className="bg-[#0d0e11] border border-white/10 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-sm">Evolução 2025–2033</h3>
                  <p className="text-white/40 text-xs mt-0.5">Carga tributária estimada durante a transição</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-white/40">
                    <span className="w-3 h-3 rounded-sm bg-white/20 inline-block" />
                    Atual
                  </span>
                  <span className="flex items-center gap-1.5 text-white/40">
                    <span className="w-3 h-3 rounded-sm bg-red-500/70 inline-block" />
                    2033
                  </span>
                </div>
              </div>
              <div className="relative">
                <TimelineChart projection={yearlyProjection} />
              </div>
            </div>

            {/* BREAKDOWN TABLE */}
            <div className="bg-[#0d0e11] border border-white/10 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Detalhamento Anual</h3>
                <p className="text-white/40 text-xs mt-0.5">Composição da carga tributária por ano</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Ano</th>
                      <th className="text-right text-xs text-white/40 font-medium px-4 py-3">CBS</th>
                      <th className="text-right text-xs text-white/40 font-medium px-4 py-3">IBS</th>
                      <th className="text-right text-xs text-white/40 font-medium px-4 py-3">Total Estimado</th>
                      <th className="text-right text-xs text-white/40 font-medium px-5 py-3">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyProjection.map((row, i) => (
                      <tr
                        key={row.year}
                        className={`border-b border-white/5 transition-colors hover:bg-white/3 ${
                          row.year === 2033 ? 'bg-white/3' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{row.year}</span>
                            {row.year === 2033 && (
                              <span className="text-[10px] bg-[#c49a2a]/20 text-[#c49a2a] px-1.5 py-0.5 rounded font-medium">FULL</span>
                            )}
                            {row.year === 2027 && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">CBS</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-blue-300/80">
                          {row.cbs > 0 ? formatCurrency(row.cbs) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-purple-300/80">
                          {row.ibs > 0 ? formatCurrency(row.ibs) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-white font-medium">
                          {formatCurrency(row.newBurden)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {row.delta === 0 ? (
                            <span className="text-white/30 text-sm">—</span>
                          ) : (
                            <span className={`text-sm font-medium ${row.delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {row.delta > 0 ? '+' : ''}{formatPercent(row.deltaPercent)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c49a2a] hover:bg-[#d4aa3a] disabled:opacity-50 text-white text-sm font-semibold transition-all"
              >
                {saving ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                )}
                {savedOk ? 'Salvo!' : 'Salvar simulação'}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Gerar relatório
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4"/>
                </svg>
                Nova simulação
              </button>

              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#c49a2a]/50 bg-[#c49a2a]/10 hover:bg-[#c49a2a]/20 text-[#c49a2a] text-sm font-semibold transition-all ml-auto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                Modo Pitch
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── STEP 1: Form ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0a0b0e] overflow-hidden">
      <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="flex-1 lg:ml-56 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0d0e11] sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">Simulador Tributário</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-5">
              {[1,2,3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s === step ? 'bg-[#c49a2a] text-white' :
                    s < step ? 'bg-[#c49a2a]/30 text-[#c49a2a]' :
                    'bg-white/10 text-white/30'
                  }`}>{s}</div>
                  {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-[#c49a2a]/50' : 'bg-white/10'}`} />}
                </div>
              ))}
              <span className="text-white/40 text-sm ml-2">Dados da empresa</span>
            </div>

            <h1 className="text-white text-2xl font-bold mb-1">Simulador Tributário</h1>
            <p className="text-white/40 text-sm">
              Calcule o impacto da Reforma Tributária EC 132/2023 para seus clientes · IVA Dual (CBS + IBS)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* FORM — left side (3/5) */}
            <div className="lg:col-span-3 space-y-5">
              {/* Client selector */}
              <div className="bg-[#0d0e11] border border-white/10 rounded-xl p-5">
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
                  Selecionar cliente da carteira
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#c49a2a]/50 transition-colors"
                >
                  <option value="">Nova simulação</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.regime}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company info */}
              <div className="bg-[#0d0e11] border border-white/10 rounded-xl p-5 space-y-4">
                <h2 className="text-white/80 text-sm font-semibold">Dados da empresa</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Nome da empresa *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Empresa ABC Ltda"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#c49a2a]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">CNPJ</label>
                    <input
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#c49a2a]/50 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5">Faturamento Anual (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">R$</span>
                    <input
                      type="text"
                      value={revenue}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setRevenue(raw ? parseInt(raw).toLocaleString('pt-BR') : '')
                      }}
                      placeholder="1.200.000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white text-lg font-bold placeholder:text-white/15 focus:outline-none focus:border-[#c49a2a]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Estado</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#c49a2a]/50 transition-colors"
                    >
                      {STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Setor de Atividade</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#c49a2a]/50 transition-colors"
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Regime selector — radio cards */}
              <div className="bg-[#0d0e11] border border-white/10 rounded-xl p-5">
                <h2 className="text-white/80 text-sm font-semibold mb-4">Regime Tributário *</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.entries(REGIME_INFO) as [TaxInput['regime'], typeof REGIME_INFO[keyof typeof REGIME_INFO]][]).map(
                    ([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setRegime(key)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${
                          regime === key
                            ? 'border-[#c49a2a]/60 bg-[#c49a2a]/8'
                            : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {regime === key && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#c49a2a] flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                        <span
                          className="block text-xs font-bold mb-1"
                          style={{ color: info.color }}
                        >
                          {info.short}
                        </span>
                        <span className="block text-white text-xs font-medium leading-tight">{info.label}</span>
                        <span className="block text-white/30 text-[10px] mt-1">{info.desc}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Calculate button */}
              <button
                onClick={handleCalculate}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#c49a2a] hover:bg-[#d4aa3a] active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-[#c49a2a]/20"
              >
                Calcular Impacto
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* PREVIEW — right side (2/5) */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-4">
                {/* Main preview card */}
                <div className={`rounded-xl border p-5 transition-all ${
                  livePreview
                    ? livePreview.totalImpactPercent >= 0
                      ? 'border-red-500/30 bg-red-950/15'
                      : 'border-emerald-500/30 bg-emerald-950/15'
                    : 'border-white/10 bg-[#0d0e11]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                      Impacto estimado
                    </p>
                    {livePreview && (
                      <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">
                        ao vivo
                      </span>
                    )}
                  </div>

                  {livePreview ? (
                    <>
                      <div className="text-center py-4">
                        <p className={`text-5xl font-bold leading-none mb-1 ${
                          livePreview.totalImpactPercent >= 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {livePreview.totalImpactPercent >= 0 ? '+' : ''}
                          {livePreview.totalImpactPercent.toFixed(1)}%
                        </p>
                        <p className="text-white/40 text-xs mt-2">na carga em 2033</p>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 text-xs">Carga atual</span>
                          <span className="text-white text-sm font-medium">
                            {formatCurrency(livePreview.currentAnnualBurden)}/ano
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 text-xs">Carga 2033</span>
                          <span className={`text-sm font-medium ${
                            livePreview.totalImpactPercent >= 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {formatCurrency(livePreview.newAnnualBurden2033)}/ano
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-2">
                          <span className="text-white/40 text-xs">
                            {livePreview.totalImpact >= 0 ? 'Custo adicional' : 'Economia estimada'}
                          </span>
                          <span className={`text-sm font-bold ${
                            livePreview.totalImpact >= 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {livePreview.totalImpact >= 0 ? '+' : ''}
                            {formatCurrency(livePreview.totalImpact)}/ano
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                          <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
                          <path d="M15 9v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2z"/>
                          <path d="M9 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
                        </svg>
                      </div>
                      <p className="text-white/25 text-sm">Preencha os dados para</p>
                      <p className="text-white/25 text-sm">ver a prévia do impacto</p>
                    </div>
                  )}
                </div>

                {/* Reform info card */}
                <div className="bg-[#0d0e11] border border-white/10 rounded-xl p-4">
                  <p className="text-[#c49a2a] text-xs font-semibold mb-3 uppercase tracking-wider">
                    EC 132/2023
                  </p>
                  <div className="space-y-2">
                    {[
                      { year: '2026', event: 'CBS 0,9% + IBS 0,1% (teste)' },
                      { year: '2027', event: 'PIS/COFINS extintos → CBS 8,8%' },
                      { year: '2029', event: 'IBS 3,0% (ICMS/ISS -10%)' },
                      { year: '2033', event: 'IVA Dual completo ~26,5%' },
                    ].map((item) => (
                      <div key={item.year} className="flex gap-3 items-start">
                        <span className="text-[#c49a2a]/70 text-xs font-bold w-10 flex-shrink-0 mt-0.5">
                          {item.year}
                        </span>
                        <span className="text-white/40 text-xs leading-relaxed">{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
