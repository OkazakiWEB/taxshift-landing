'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import UpgradeModal from '@/components/ui/UpgradeModal'
import {
  calculateTax,
  formatCurrency,
  formatPercent,
  type TaxInput,
  type SimulationResult,
} from '@/lib/tax-calculator'
import { getClientsPaginated, saveSimulation, getProfile, type Client } from '@/lib/db'
import { hasFeature } from '@/lib/plans'

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
  'Serviços','Tecnologia','Saúde','Educação','Construção',
  'Comércio','Indústria','Agronegócio','Alimentação',
]

const REGIME_INFO = {
  SN:  { label: 'Simples Nacional', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', short: 'SN',  desc: 'Até R$ 4,8M/ano' },
  LP:  { label: 'Lucro Presumido',  color: '#c49a2a', bg: '#fefce8', border: '#fde68a', short: 'LP',  desc: 'Até R$ 78M/ano'  },
  LR:  { label: 'Lucro Real',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', short: 'LR',  desc: 'Acima de R$ 78M' },
  MEI: { label: 'MEI',             color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', short: 'MEI', desc: 'Até R$ 81K/ano'  },
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({
  value, duration = 1200, className = '', prefix = '', suffix = '', decimals = 1,
}: {
  value: number; duration?: number; className?: string; prefix?: string; suffix?: string; decimals?: number
}) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number>(0)
  const prevRef = useRef<number>(0)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else prevRef.current = end
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{displayed.toFixed(decimals)}{suffix}
    </span>
  )
}

// ─── formatCNPJ ───────────────────────────────────────────────────────────────

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d.replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
}

// ─── formatBRL input ─────────────────────────────────────────────────────────

function formatBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits).toLocaleString('pt-BR')
}

// ─── ImpactBar ────────────────────────────────────────────────────────────────

function ImpactBar({ percent, positive }: { percent: number; positive: boolean }) {
  const abs = Math.min(Math.abs(percent), 100)
  return (
    <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${abs}%`,
          backgroundColor: positive ? '#dc2626' : '#16a34a',
        }}
      />
    </div>
  )
}

// ─── TimelineChart (light) ────────────────────────────────────────────────────

function TimelineChart({ projection }: { projection: SimulationResult['yearlyProjection'] }) {
  const maxBurden = Math.max(...projection.map((p) => p.newBurden))
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="flex items-end gap-1.5 h-36 px-1">
      {projection.map((p, i) => {
        const height = maxBurden > 0 ? (p.newBurden / maxBurden) * 100 : 0
        const isLast = i === projection.length - 1
        const progress = i / (projection.length - 1)
        const isHovered = hovered === p.year
        const color = isLast
          ? '#dc2626'
          : progress < 0.3 ? '#d1d5db'
          : progress < 0.6 ? '#f59e0b'
          : '#ef4444'

        return (
          <div
            key={p.year}
            className="flex-1 flex flex-col items-center gap-1 cursor-pointer relative"
            onMouseEnter={() => setHovered(p.year)}
            onMouseLeave={() => setHovered(null)}
          >
            {isHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-[#0d0e11] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-semibold">{formatCurrency(p.newBurden)}</p>
                {p.delta !== 0 && (
                  <p className={p.delta > 0 ? 'text-red-400' : 'text-green-400'}>
                    {p.delta > 0 ? '+' : ''}{formatCurrency(p.delta)}
                  </p>
                )}
              </div>
            )}
            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
              <div
                className="w-full rounded-t transition-all duration-200"
                style={{
                  height: `${Math.max(height, 3)}%`,
                  backgroundColor: color,
                  opacity: isHovered ? 1 : 0.75,
                  transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }}
              />
            </div>
            <span className="text-[9px] text-[#9ca3af] font-medium">{p.year}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent, large,
}: {
  label: string; value: React.ReactNode; sub?: string; accent?: 'red' | 'green' | 'gold'; large?: boolean
}) {
  const accentColor = accent === 'red' ? '#dc2626' : accent === 'green' ? '#16a34a' : accent === 'gold' ? '#c49a2a' : '#0d0e11'
  const accentBg = accent === 'red' ? '#fef2f2' : accent === 'green' ? '#f0fdf4' : accent === 'gold' ? '#fefce8' : '#fafaf8'

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col gap-1.5 shadow-sm"
      style={{ borderTopColor: accentColor, borderTopWidth: 3 }}
    >
      <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">{label}</p>
      <div className={large ? 'text-3xl font-bold' : 'text-2xl font-bold'} style={{ color: accentColor }}>
        {value}
      </div>
      {sub && <p className="text-xs text-[#9ca3af]">{sub}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SimuladorContent({ user }: SimuladorContentProps) {
  const [step, setStep] = useState<Step>(1)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Form
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [revenue, setRevenue] = useState('')
  const [costs, setCosts] = useState('')
  const [regime, setRegime] = useState<TaxInput['regime']>('SN')
  const [sector, setSector] = useState('Serviços')
  const [state, setState] = useState('SP')

  const [result, setResult] = useState<SimulationResult | null>(null)
  const [formError, setFormError] = useState('')

  const [userPlan, setUserPlan] = useState<string>('free')
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    getClientsPaginated({ pageSize: 200 }).then((r) => setClients(r.data)).catch(() => {})
    getProfile().then((p) => { if (p?.plan) setUserPlan(p.plan) }).catch(() => {})
  }, [])

  // Calcula todos os regimes com os mesmos inputs do resultado atual
  const allRegimes = useMemo(() => {
    if (!result) return []
    const rev = result.input.revenue
    const sec = result.input.sector
    const st = result.input.state ?? 'SP'
    if (!rev) return []
    const REGIME_KEYS = ['SN', 'LP', 'LR', 'MEI'] as const
    return REGIME_KEYS.map((r) => {
      if (r === 'MEI' && rev > 81000) {
        return { regime: r, label: REGIME_INFO[r].label, na: true, current: 0, future: 0, change: 0 }
      }
      try {
        const sim = calculateTax({ regime: r, sector: sec, revenue: rev, state: st })
        return {
          regime: r,
          label: REGIME_INFO[r].label,
          na: false,
          current: sim.currentAnnualBurden,
          future: sim.newAnnualBurden2033,
          change: sim.totalImpactPercent,
        }
      } catch {
        return { regime: r, label: REGIME_INFO[r].label, na: true, current: 0, future: 0, change: 0 }
      }
    })
  }, [result])

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

  const livePreview = useCallback((): SimulationResult | null => {
    const rev = parseFloat(revenue.replace(/\D/g, ''))
    if (!rev || rev <= 0) return null
    try { return calculateTax({ regime, sector, revenue: rev, state }) } catch { return null }
  }, [regime, sector, revenue, state])

  const preview = livePreview()

  const handleCalculate = () => {
    setFormError('')
    const rev = parseFloat(revenue.replace(/\D/g, ''))
    if (!companyName.trim()) { setFormError('Informe o nome da empresa.'); return }
    if (!rev || rev <= 0) { setFormError('Informe o faturamento anual.'); return }
    const res = calculateTax({ regime, sector, revenue: rev, state })
    setResult(res)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
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
    }).catch(console.error)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
    setSaving(false)
  }

  const handleReset = () => {
    setStep(1); setResult(null); setSelectedClientId('')
    setCompanyName(''); setCnpj(''); setRevenue(''); setCosts('')
    setRegime('SN'); setSector('Serviços'); setState('SP')
    setSavedOk(false); setFormError('')
  }

  const impactPositive = (result?.totalImpactPercent ?? 0) >= 0

  // ─── STEP 3: Pitch Mode ──────────────────────────────────────────────────────
  if (step === 3 && result) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#06080f' }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(196,154,42,0.18) 0%, transparent 70%)' }}
        />
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase mb-8 z-10">{companyName}</p>
        <div className="z-10 text-center mb-4">
          <AnimatedNumber
            value={result.totalImpactPercent}
            prefix={result.totalImpactPercent >= 0 ? '+' : ''}
            suffix="%"
            duration={1500}
            className={`text-[96px] md:text-[128px] font-bold leading-none tracking-tighter ${impactPositive ? 'text-red-400' : 'text-emerald-400'}`}
          />
        </div>
        <p className="text-white/60 text-lg md:text-xl font-light tracking-wide z-10 mb-2">
          de {impactPositive ? 'aumento' : 'redução'} estimado na carga tributária
        </p>
        <p className="text-[#c49a2a] text-sm font-medium tracking-widest uppercase mb-12 z-10">
          Fase 2033 · EC 132/2023
        </p>
        <div className="z-10 flex gap-4 mb-10 flex-wrap justify-center px-4">
          {[
            { label: 'Carga Atual', value: formatCurrency(result.currentAnnualBurden), sub: `${formatPercent(result.currentEffectiveRate)} efetivo` },
            { label: 'Carga 2033',  value: formatCurrency(result.newAnnualBurden2033),  sub: `${formatPercent(result.newEffectiveRate2033)} efetivo`, highlight: true },
            { label: 'Diferença Anual', value: `${result.totalImpact >= 0 ? '+' : ''}${formatCurrency(result.totalImpact)}`, sub: 'por ano', highlight: true },
          ].map((box) => (
            <div key={box.label} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center min-w-[140px]">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{box.label}</p>
              <p className={`text-xl font-bold ${box.highlight ? (impactPositive ? 'text-red-400' : 'text-emerald-400') : 'text-white'}`}>{box.value}</p>
              <p className="text-white/30 text-xs mt-1">{box.sub}</p>
            </div>
          ))}
        </div>
        {result.savings.bestSavings > 0 && (
          <div className="z-10 flex items-center gap-3 bg-[#c49a2a]/10 border border-[#c49a2a]/30 rounded-xl px-6 py-3 mb-10">
            <span className="text-[#c49a2a] text-lg">★</span>
            <p className="text-white/80 text-sm">
              <span className="text-[#c49a2a] font-semibold">Melhor cenário: </span>
              {result.savings.bestOption}{' → '}
              <span className="text-emerald-400 font-semibold">economia de {formatCurrency(result.savings.bestSavings)}/ano</span>
            </p>
          </div>
        )}
        <div className="z-10 flex items-center gap-4 mt-auto mb-8">
          {hasFeature(userPlan, 'pdfReports') ? (
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Salvar como PDF
            </button>
          ) : (
            <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/50 hover:text-white/80 text-sm font-medium transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Salvar como PDF
            </button>
          )}
          <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c49a2a] hover:bg-[#d4aa3a] text-white text-sm font-semibold transition-all">
            Voltar aos resultados
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP 2: Results ──────────────────────────────────────────────────────────
  if (step === 2 && result) {
    const { yearlyProjection, scenarios } = result
    const diffAbs = Math.abs(result.totalImpact)
    const diffSign = result.totalImpact >= 0

    return (
      <AppShell user={user}>
        {upgradeOpen && (
          <UpgradeModal currentPlan={userPlan} clientCount={0} onClose={() => setUpgradeOpen(false)} />
        )}
        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 no-print">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#0d0e11] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Nova simulação
              </button>
            </div>
            <h2 className="text-2xl font-serif text-[#0d0e11]">Resultado da Simulação</h2>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {companyName} · {REGIME_INFO[regime].label} · {sector} · {state}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto no-print">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c49a2a] hover:bg-[#b8881f] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
              )}
              {savedOk ? 'Salvo!' : 'Salvar'}
            </button>

            {/* PDF Export — Pro+ only */}
            {hasFeature(userPlan, 'pdfReports') ? (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] text-sm font-medium hover:bg-[#f3f4f6] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Exportar PDF
              </button>
            ) : (
              <button
                onClick={() => setUpgradeOpen(true)}
                title="Disponível no plano Pro"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#9ca3af] text-sm font-medium hover:bg-[#fefce8] hover:text-[#c49a2a] hover:border-[#c49a2a]/40 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Exportar PDF
              </button>
            )}

            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c49a2a]/50 bg-[#fefce8] text-[#c49a2a] text-sm font-semibold hover:bg-[#fef9c3] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              Modo Pitch
            </button>
          </div>
        </div>

        {/* ── Print header — visible only in PDF ── */}
        <div className="print-only mb-8 pb-6 border-b-2 border-[#0d0e11]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10pt] font-bold text-[#c49a2a] uppercase tracking-widest mb-1">TaxShift</p>
              <h1 className="text-[18pt] font-bold text-[#0d0e11] leading-tight">{companyName}</h1>
              <p className="text-[10pt] text-[#6b7280] mt-1">
                {REGIME_INFO[regime].label} · {sector} · {state}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9pt] text-[#9ca3af]">Simulação da Reforma Tributária</p>
              <p className="text-[9pt] text-[#9ca3af]">EC 132/2023 — Vigência plena 2033</p>
              <p className="text-[9pt] text-[#9ca3af] mt-1">
                Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: 'Regime atual', value: REGIME_INFO[regime].label },
              { label: 'Carga atual', value: formatCurrency(result.currentAnnualBurden) + '/ano' },
              { label: 'Impacto estimado 2033', value: `${result.totalImpactPercent >= 0 ? '+' : ''}${result.totalImpactPercent.toFixed(1)}%` },
            ].map((item) => (
              <div key={item.label} className="bg-[#f3f4f6] rounded-lg p-3">
                <p className="text-[8pt] text-[#9ca3af] uppercase tracking-wide mb-0.5">{item.label}</p>
                <p className="text-[11pt] font-bold text-[#0d0e11]">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[8pt] text-[#9ca3af] mt-4">
            Este relatório é uma estimativa baseada na EC 132/2023 e nos dados informados. Não constitui assessoria jurídica ou tributária.
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MetricCard
            label="Carga tributária atual"
            value={
              <AnimatedNumber
                value={result.currentAnnualBurden / 1000}
                prefix="R$ "
                suffix="k"
                decimals={1}
              />
            }
            sub={`${formatPercent(result.currentEffectiveRate)} do faturamento`}
          />
          <MetricCard
            label="Nova carga em 2033"
            value={
              <AnimatedNumber
                value={result.newAnnualBurden2033 / 1000}
                prefix="R$ "
                suffix="k"
                decimals={1}
              />
            }
            sub={`${formatPercent(result.newEffectiveRate2033)} do faturamento`}
            accent={impactPositive ? 'red' : 'green'}
          />
          <MetricCard
            label={diffSign ? 'Custo adicional/ano' : 'Economia estimada/ano'}
            value={
              <AnimatedNumber
                value={diffAbs / 1000}
                prefix={diffSign ? '+R$ ' : '-R$ '}
                suffix="k"
                decimals={1}
              />
            }
            sub={`${result.totalImpactPercent >= 0 ? '+' : ''}${result.totalImpactPercent.toFixed(1)}% de variação`}
            accent={diffSign ? 'red' : 'green'}
            large
          />
        </div>

        {/* ── Impact visual bar ── */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0d0e11]">Variação da carga tributária</h3>
              <p className="text-xs text-[#9ca3af] mt-0.5">Impacto estimado com a vigência plena do IVA Dual em 2033</p>
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: impactPositive ? '#dc2626' : '#16a34a' }}
            >
              {result.totalImpactPercent >= 0 ? '+' : ''}{result.totalImpactPercent.toFixed(1)}%
            </span>
          </div>
          <ImpactBar percent={result.totalImpactPercent} positive={impactPositive} />
          <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
            <span>Hoje: {formatCurrency(result.currentAnnualBurden)}/ano</span>
            <span>2033: {formatCurrency(result.newAnnualBurden2033)}/ano</span>
          </div>
        </div>

        {/* ── Scenarios + Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          {/* Scenarios */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0d0e11] mb-1">Comparativo de cenários</h3>
              <p className="text-xs text-[#9ca3af]">Análise dos regimes tributários disponíveis para 2033</p>
            </div>
            {([
              { key: 'current',   data: scenarios.current },
              { key: 'lucroReal', data: scenarios.lucroReal },
              { key: 'holding',   data: scenarios.holding },
            ] as const).map(({ key, data }) => {
              const savings = key !== 'current'
                ? scenarios.current.annualBurden2033 - data.annualBurden2033
                : 0
              return (
                <div
                  key={key}
                  className={`bg-white border rounded-xl p-5 shadow-sm relative transition-all ${
                    data.recommended
                      ? 'border-[#c49a2a]/50 ring-1 ring-[#c49a2a]/20'
                      : 'border-[#e5e7eb]'
                  }`}
                >
                  {data.recommended && (
                    <div className="absolute -top-3 left-4">
                      <span className="bg-[#c49a2a] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow">
                        Recomendado
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#0d0e11]">{data.name}</h4>
                      <p className="text-xs text-[#9ca3af] mt-0.5">Taxa efetiva 2033: <span className="text-[#23252c] font-medium">{formatPercent(data.effectiveRate2033)}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-[#0d0e11]">{formatCurrency(data.annualBurden2033)}</p>
                      <p className="text-xs text-[#9ca3af]">carga anual 2033</p>
                      {key !== 'current' && (
                        <p className={`text-xs font-semibold mt-0.5 ${savings > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                          {savings >= 0 ? '▼ Economia ' : '▲ Acréscimo '}
                          {formatCurrency(Math.abs(savings))}/ano
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.pros.slice(0, 3).map((pro, i) => (
                      <span key={i} className="flex items-center gap-1 text-[11px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2 py-0.5 rounded-full font-medium">
                        <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {pro}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Timeline Chart */}
          <div className="lg:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-[#0d0e11] mb-1">Evolução 2025–2033</h3>
              <p className="text-xs text-[#9ca3af]">Carga tributária estimada na transição</p>
            </div>
            <div className="mt-4 bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
              <TimelineChart projection={yearlyProjection} />
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f3f4f6]">
                <span className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d1d5db] inline-block"/>Início
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] inline-block"/>Transição
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626] inline-block"/>2033
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Regime Comparison Table ── */}
        {(() => {
          if (!allRegimes.length) return null
          const canSee = hasFeature(userPlan, 'simulatorMultiRegime')
          const bestRegime = allRegimes
            .filter((r) => !r.na)
            .reduce<typeof allRegimes[0] | null>((best, curr) => (!best || curr.future < best.future ? curr : best), null)

          const tableContent = (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafaf8] border-b border-[#f3f4f6]">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Regime</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Carga Atual</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Carga 2033</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Variação</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {allRegimes.map((r) => {
                    const isCurrent = r.regime === regime
                    const isBest = bestRegime?.regime === r.regime
                    const changeColor = r.change > 10 ? '#dc2626' : r.change > 0 ? '#f59e0b' : '#16a34a'
                    return (
                      <tr
                        key={r.regime}
                        className={`transition-colors ${
                          isBest ? 'bg-[#f0fdf4]' : isCurrent ? 'bg-[#fefce8]' : 'hover:bg-[#fafaf8]'
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: REGIME_INFO[r.regime].color }}
                            />
                            <div>
                              <p className="text-sm font-medium text-[#0d0e11]">{r.label}</p>
                              <p className="text-xs text-[#9ca3af]">{REGIME_INFO[r.regime].desc}</p>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#fde68a] text-[#92400e]">
                                Atual
                              </span>
                            )}
                          </div>
                        </td>
                        {r.na ? (
                          <td colSpan={3} className="px-4 py-3.5 text-center text-sm text-[#9ca3af]">
                            Não aplicável para este faturamento
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3.5 text-right text-sm font-mono text-[#6b7280]">
                              {formatCurrency(r.current)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm font-mono font-semibold text-[#0d0e11]">
                              {formatCurrency(r.future)}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className="text-sm font-bold font-mono" style={{ color: changeColor }}>
                                {r.change >= 0 ? '+' : ''}{r.change.toFixed(1)}%
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-5 py-3.5 text-center">
                          {r.na ? null : isBest ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
                              <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              Melhor opção
                            </span>
                          ) : isCurrent ? (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                              Regime atual
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#9ca3af]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )

          return (
            <div className="relative bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm mb-6">
              <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#0d0e11]">Comparativo de Regimes</h3>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    Qual regime tributário é mais vantajoso para este cliente em 2033?
                  </p>
                </div>
                {!canSee && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c49a2a] text-white">
                    PRO
                  </span>
                )}
              </div>

              {/* Blurred for non-Pro */}
              {canSee ? (
                tableContent
              ) : (
                <div className="relative">
                  <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
                    {tableContent}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl border border-[#e5e7eb] px-7 py-6 text-center max-w-xs mx-4">
                      <div className="w-10 h-10 rounded-xl bg-[#fefce8] border border-[#fde68a] flex items-center justify-center mx-auto mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-[#0d0e11] mb-1">
                        Veja qual regime poupa mais.
                      </p>
                      <p className="text-xs text-[#6b7280] mb-4 leading-relaxed">
                        Comparativo completo de SN, LP, LR e MEI com recomendação automática. Disponível no plano Pro.
                      </p>
                      <button
                        onClick={() => setUpgradeOpen(true)}
                        className="w-full py-2 bg-[#c49a2a] hover:bg-[#b8881f] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Quero o comparativo completo →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Best regime recommendation — Pro only */}
              {canSee && bestRegime && !bestRegime.na && bestRegime.regime !== regime && (
                <div className="px-5 py-3 border-t border-[#f3f4f6] bg-[#f0fdf4] flex items-center gap-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-xs text-[#15803d]">
                    <span className="font-semibold">Recomendação:</span> migrar para{' '}
                    <span className="font-semibold">{bestRegime.label}</span> pode economizar{' '}
                    <span className="font-semibold">
                      {formatCurrency(result.newAnnualBurden2033 - bestRegime.future)}/ano
                    </span>{' '}
                    em relação ao regime atual em 2033.
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Breakdown Table ── */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#f3f4f6]">
            <h3 className="text-sm font-semibold text-[#0d0e11]">Detalhamento anual da transição</h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">Composição CBS + IBS por ano durante o período de adaptação</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#f3f4f6]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Ano</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">CBS</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">IBS</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Total estimado</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {yearlyProjection.map((row) => (
                  <tr key={row.year} className={`hover:bg-[#fafaf8] transition-colors ${row.year === 2033 ? 'bg-[#fefce8]' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0d0e11]">{row.year}</span>
                        {row.year === 2033 && <span className="text-[10px] bg-[#fde68a] text-[#92400e] px-1.5 py-0.5 rounded font-semibold">PLENO</span>}
                        {row.year === 2027 && <span className="text-[10px] bg-[#dbeafe] text-[#1d4ed8] px-1.5 py-0.5 rounded font-semibold">CBS</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[#2563eb] font-mono">
                      {row.cbs > 0 ? formatCurrency(row.cbs) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[#7c3aed] font-mono">
                      {row.ibs > 0 ? formatCurrency(row.ibs) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#0d0e11] font-mono">
                      {formatCurrency(row.newBurden)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.delta === 0 ? (
                        <span className="text-xs text-[#9ca3af]">—</span>
                      ) : (
                        <span className={`text-sm font-semibold ${row.delta > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
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
      </AppShell>
    )
  }

  // ─── STEP 1: Form ──────────────────────────────────────────────────────────────
  return (
    <AppShell user={user}>
      {/* Page header */}
      <div className="mb-7">
        <h2 className="text-2xl font-serif text-[#0d0e11]">Simulador Tributário</h2>
        <p className="text-sm text-[#9ca3af] mt-0.5">
          Calcule o impacto real da Reforma Tributária para cada cliente — IVA Dual (CBS + IBS) · EC 132/2023
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="bg-[#fefce8] border border-[#fde68a] rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#c49a2a]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#92400e] mb-1">O que esta simulação calcula</h3>
            <p className="text-xs text-[#a16207] leading-relaxed mb-3">
              A EC 132/2023 institui o IVA Dual brasileiro: a <strong>CBS</strong> (federal, substitui PIS/COFINS) e o <strong>IBS</strong> (estadual/municipal, substitui ICMS/ISS). A transição ocorre entre 2026 e 2033. Este simulador estima como essa mudança afeta a carga tributária anual do seu cliente.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { year: '2026', label: 'CBS 0,9% teste' },
                { year: '2027', label: 'PIS/COFINS extintos' },
                { year: '2029', label: 'IBS 3% (ICMS/ISS -10%)' },
                { year: '2033', label: 'IVA Dual ~26,5%' },
              ].map((item) => (
                <div key={item.year} className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-1.5 border border-[#fde68a]/50">
                  <span className="text-xs font-bold text-[#c49a2a]">{item.year}</span>
                  <span className="text-[11px] text-[#a16207]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Form ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Client selector */}
          {clients.length > 0 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
              <label className="label mb-2">Carregar dados de um cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="input-field"
              >
                <option value="">Preencher manualmente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.regime}
                  </option>
                ))}
              </select>
              {selectedClientId && (
                <p className="text-xs text-[#16a34a] mt-2 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Dados preenchidos automaticamente
                </p>
              )}
            </div>
          )}

          {/* Company data */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#f3f4f6]">
              <div className="w-6 h-6 rounded-md bg-[#0d0e11] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[#0d0e11]">Dados da empresa</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome da empresa <span className="text-[#dc2626]">*</span></label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Empresa ABC Ltda"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0001-00"
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Estado</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="input-field">
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Setor de atividade <span className="text-[#dc2626]">*</span></label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="input-field">
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Financial data */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#f3f4f6]">
              <div className="w-6 h-6 rounded-md bg-[#0d0e11] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[#0d0e11]">Dados financeiros</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Faturamento anual bruto (R$) <span className="text-[#dc2626]">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm font-medium pointer-events-none">R$</span>
                  <input
                    type="text"
                    value={revenue}
                    onChange={(e) => setRevenue(formatBRLInput(e.target.value))}
                    placeholder="1.200.000"
                    className="input-field pl-9 text-base font-semibold"
                  />
                </div>
                <p className="text-xs text-[#9ca3af] mt-1">Receita bruta do exercício anterior</p>
              </div>
              <div>
                <label className="label">Custos operacionais anuais (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm font-medium pointer-events-none">R$</span>
                  <input
                    type="text"
                    value={costs}
                    onChange={(e) => setCosts(formatBRLInput(e.target.value))}
                    placeholder="600.000"
                    className="input-field pl-9 text-base font-semibold"
                  />
                </div>
                <p className="text-xs text-[#9ca3af] mt-1">Folha, fornecedores, despesas</p>
              </div>
            </div>

            {/* Revenue size hint */}
            {revenue && (() => {
              const rev = parseInt(revenue.replace(/\D/g, ''))
              const hint = rev <= 81_000 ? { label: 'Faixa MEI', color: '#7c3aed' }
                : rev <= 4_800_000 ? { label: 'Faixa Simples Nacional', color: '#16a34a' }
                : rev <= 78_000_000 ? { label: 'Faixa Lucro Presumido', color: '#c49a2a' }
                : { label: 'Faixa Lucro Real', color: '#2563eb' }
              return (
                <div className="flex items-center gap-2 text-xs" style={{ color: hint.color }}>
                  <svg width="10" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {hint.label}
                </div>
              )
            })()}
          </div>

          {/* Regime */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f3f4f6] mb-4">
              <div className="w-6 h-6 rounded-md bg-[#0d0e11] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[#0d0e11]">Regime tributário <span className="text-[#dc2626]">*</span></h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(REGIME_INFO) as [TaxInput['regime'], typeof REGIME_INFO[keyof typeof REGIME_INFO]][]).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRegime(key)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    regime === key
                      ? 'shadow-sm'
                      : 'border-[#e5e7eb] bg-[#fafaf8] hover:border-[#d1d5db] hover:bg-white'
                  }`}
                  style={regime === key ? { borderColor: info.color, backgroundColor: info.bg } : {}}
                >
                  {regime === key && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: info.color }}>
                      <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <span className="block text-xs font-bold mb-1" style={{ color: info.color }}>{info.short}</span>
                  <span className="block text-xs font-semibold text-[#0d0e11] leading-tight">{info.label}</span>
                  <span className="block text-[10px] text-[#9ca3af] mt-1">{info.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg px-4 py-3">
              <p className="text-sm text-[#dc2626]">{formError}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCalculate}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#0d0e11] hover:bg-[#23252c] active:scale-[0.99] text-white font-bold text-base transition-all shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Calcular impacto tributário
          </button>
        </div>

        {/* ── Right panel ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">

            {/* Live preview card */}
            <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
              preview
                ? preview.totalImpactPercent >= 0
                  ? 'border-[#fca5a5]'
                  : 'border-[#86efac]'
                : 'border-[#e5e7eb]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Prévia do impacto</p>
                {preview && (
                  <span className="text-[10px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2 py-0.5 rounded-full font-semibold">
                    ao vivo
                  </span>
                )}
              </div>

              {preview ? (
                <>
                  <div className="text-center py-3">
                    <p
                      className="text-5xl font-bold leading-none mb-1"
                      style={{ color: preview.totalImpactPercent >= 0 ? '#dc2626' : '#16a34a' }}
                    >
                      {preview.totalImpactPercent >= 0 ? '+' : ''}
                      {preview.totalImpactPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-2">na carga tributária em 2033</p>
                  </div>

                  <div className="mt-1 mb-4">
                    <ImpactBar percent={preview.totalImpactPercent} positive={preview.totalImpactPercent >= 0} />
                  </div>

                  <div className="space-y-2.5 border-t border-[#f3f4f6] pt-4">
                    {[
                      { label: 'Carga atual', value: `${formatCurrency(preview.currentAnnualBurden)}/ano`, color: '#0d0e11' },
                      { label: 'Carga 2033', value: `${formatCurrency(preview.newAnnualBurden2033)}/ano`, color: preview.totalImpactPercent >= 0 ? '#dc2626' : '#16a34a' },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-xs text-[#9ca3af]">{row.label}</span>
                        <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t border-[#f3f4f6] pt-2.5">
                      <span className="text-xs text-[#9ca3af]">{preview.totalImpact >= 0 ? 'Custo adicional' : 'Economia'}</span>
                      <span className="text-sm font-bold" style={{ color: preview.totalImpact >= 0 ? '#dc2626' : '#16a34a' }}>
                        {preview.totalImpact >= 0 ? '+' : ''}{formatCurrency(preview.totalImpact)}/ano
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#9ca3af]">Preencha o faturamento</p>
                  <p className="text-sm text-[#9ca3af]">para ver a prévia</p>
                </div>
              )}
            </div>

            {/* Benefits card */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-semibold text-[#0d0e11] uppercase tracking-wider mb-3">Por que usar este simulador</h4>
              <div className="space-y-3">
                {[
                  { icon: '📊', text: 'Cálculo preciso por regime e setor' },
                  { icon: '📅', text: 'Projeção ano a ano de 2025 a 2033' },
                  { icon: '💡', text: 'Comparativo de cenários e recomendação' },
                  { icon: '🎯', text: 'Modo Pitch para apresentar ao cliente' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <p className="text-xs text-[#6b7280] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector impact hints */}
            <div className="bg-[#fafaf8] border border-[#e5e7eb] rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2.5">Setores mais impactados</p>
              <div className="space-y-1.5">
                {[
                  { name: 'Serviços', impact: '+20%', color: '#dc2626' },
                  { name: 'Tecnologia', impact: '+15%', color: '#f59e0b' },
                  { name: 'Saúde', impact: '-15%', color: '#16a34a' },
                  { name: 'Alimentação', impact: '-40%', color: '#16a34a' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs text-[#6b7280]">{item.name}</span>
                    <span className="text-xs font-semibold" style={{ color: item.color }}>{item.impact}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#9ca3af] mt-2.5">* Estimativas baseadas na EC 132/2023</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
