'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import KPICard from '@/components/ui/KPICard'
import TaxImpactChart from '@/components/dashboard/TaxImpactChart'
import QuickActions from '@/components/dashboard/QuickActions'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { getClientsPaginated, getAlerts, getChecklistItems, getProfile, Client, Alert, ChecklistItem } from '@/lib/db'
import { getPlan, canAddClient } from '@/lib/plans'
import UpgradeModal from '@/components/ui/UpgradeModal'
import PastDueBanner from '@/components/ui/PastDueBanner'

interface User {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

interface DashboardContentProps {
  user: User | null
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`
  return `R$${value.toLocaleString('pt-BR')}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`
  return `${Math.floor(diffDays / 30)} meses atrás`
}

const statusMap = {
  active: { variant: 'success' as const, label: 'Ativo' },
  warning: { variant: 'warning' as const, label: 'Atenção' },
  urgent: { variant: 'error' as const, label: 'Urgente' },
}

const typeConfig = {
  deadline: { color: '#dc2626', border: '#dc2626', icon: '🔴' },
  warning: { color: '#f59e0b', border: '#f59e0b', icon: '⚠️' },
  info: { color: '#2563eb', border: '#2563eb', icon: 'ℹ️' },
}

function KPISkeleton() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-24" />
        <div className="h-7 bg-[#f3f4f6] rounded animate-pulse w-16" />
        <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-20" />
      </div>
    </div>
  )
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Contador'
  const firstName = displayName.split(' ')[0]

  const [clients, setClients] = useState<Client[]>([])
  const [clientsTotal, setClientsTotal] = useState(0) // total real para o KPI
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [userPlan, setUserPlan] = useState<string>('free')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [clientsResult, alertsData, checklistData, profileData] = await Promise.all([
      getClientsPaginated({ pageSize: 200 }),
      getAlerts(),
      getChecklistItems(),
      getProfile(),
    ])
    setClients(clientsResult.data)
    setClientsTotal(clientsResult.totalReal)
    setAlerts(alertsData)
    setChecklistItems(checklistData)
    if (profileData?.plan) setUserPlan(profileData.plan)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // KPIs: totalClients usa o count real do banco; demais métricas usam os dados carregados
  const totalClients = clientsTotal
  const urgentClients = clients.filter((c) => c.status === 'urgent').length
  const riskClients = clients.filter((c) => c.tax_impact > 10).length
  // Heuristic: tax_impact === 0 means "not yet simulated" — clients with a genuine 0% impact are counted as well.
  // A schema-level `simulated_at` timestamp would be the clean fix.
  const notSimulated = clients.filter((c) => c.tax_impact === 0).length

  // Checklist stats
  const totalChecklistItems = checklistItems.length
  const doneChecklistItems = checklistItems.filter((i) => i.status === 'done').length
  const checklistPct = totalChecklistItems > 0 ? Math.round((doneChecklistItems / totalChecklistItems) * 100) : 0
  const criticalPending = checklistItems.filter((i) => i.priority === 'critical' && i.status !== 'done').length

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentAlerts = [...alerts]
    .filter((a) => !a.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  const plan = getPlan(userPlan)
  const limitReached = !canAddClient(userPlan, clientsTotal)
  const usagePct = plan.clientLimit === -1
    ? 100
    : Math.min(100, Math.round((clients.length / plan.clientLimit) * 100))

  return (
    <AppShell user={user}>
      {upgradeOpen && (
        <UpgradeModal
          currentPlan={userPlan}
          clientCount={clients.length}
          onClose={() => setUpgradeOpen(false)}
        />
      )}
      <PastDueBanner />

      {/* Greeting */}
      <div className="mb-6 fade-in">
        <h2 className="text-2xl font-serif text-[#0d0e11] mb-0.5">
          {getGreeting()}, {firstName}!
        </h2>
        <p className="text-sm text-[#9ca3af] capitalize">{formatDate()}</p>
      </div>

      {/* Onboarding card — only for new users with no clients */}
      {!loading && clientsTotal === 0 && (
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-[#1d4ed8] mb-3">Comece em 3 passos simples</p>
          <div className="space-y-2">
            {[
              { step: 1, label: 'Adicione seu primeiro cliente', href: '/clientes' },
              { step: 2, label: 'Simule o impacto da Reforma Tributária', href: '/simulador' },
              { step: 3, label: 'Inicialize o checklist de obrigações', href: '/checklist' },
            ].map(({ step, label, href }) => (
              <Link key={step} href={href}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#bfdbfe] hover:border-[#2563eb] transition-colors group"
              >
                <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </span>
                <span className="text-sm text-[#1d4ed8] font-medium group-hover:text-[#1e40af]">{label} →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : (
          <>
            <KPICard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              label="Clientes Ativos"
              value={totalClients}
              subtitle="total na carteira"
              accentColor="#2563eb"
            />
            <Link href="/clientes" className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dc2626]/40">
              <KPICard
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                }
                label="Clientes em Risco"
                value={riskClients}
                subtitle="impacto tributário acima de +10%"
                accentColor="#dc2626"
                className={riskClients > 0 ? 'border-[#fecaca] bg-[#fff8f8]' : ''}
              />
            </Link>
            <Link href="/clientes" className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dc2626]/40">
              <KPICard
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                }
                label="Urgências"
                value={urgentClients}
                subtitle="requerem atenção imediata"
                accentColor="#dc2626"
              />
            </Link>
            <Link href="/simulador" className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40">
              <KPICard
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <path d="M7 8h4M7 12h2"/><path d="M15 8l2 2-2 2"/>
                  </svg>
                }
                label="Não Simulados"
                value={notSimulated}
                subtitle="clientes sem simulação da reforma"
                accentColor="#f59e0b"
                className={notSimulated > 0 ? 'border-[#fde68a] bg-[#fffdf0]' : ''}
              />
            </Link>
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT COLUMN — 3/5 */}
        <div className="xl:col-span-3 space-y-6">
          {/* Tax Impact Chart */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <TaxImpactChart />
          </div>

          {/* Recent Clients Table */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-[#0d0e11]">Clientes Recentes</h3>
              <Link href="/clientes" className="text-xs text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors">
                Ver carteira →
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-[#f3f4f6] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentClients.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#9ca3af] mb-3">Nenhum cliente cadastrado ainda.</p>
                <Link href="/clientes" className="text-sm font-medium text-[#c49a2a] hover:text-[#b8881f]">
                  Adicionar primeiro cliente →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#fafaf8]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide hidden sm:table-cell">Regime</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Impacto</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {recentClients.map((client) => {
                      const statusInfo = statusMap[client.status] || { variant: 'success' as const, label: client.status }
                      const impactColor = client.tax_impact > 10 ? '#dc2626' : client.tax_impact > 0 ? '#f59e0b' : '#16a34a'
                      return (
                        <tr key={client.id} className="hover:bg-[#fafaf8] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#0d0e11] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-semibold">
                                  {client.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#0d0e11] truncate max-w-[180px]">{client.name}</p>
                                <p className="text-xs text-[#9ca3af]">{client.sector}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="default">{client.regime}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold font-mono" style={{ color: impactColor }}>
                              {client.tax_impact > 0 ? '+' : ''}{client.tax_impact.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — 2/5 */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Alerts */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0d0e11]">Alertas Recentes</h3>
              <Link href="/alertas" className="text-xs text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors">
                Ver todos →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-[#f3f4f6] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#9ca3af]">Nenhum alerta não lido.</p>
                <Link href="/alertas" className="text-xs font-medium text-[#c49a2a] hover:text-[#b8881f] mt-1 inline-block">
                  Ver todos os alertas →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((alert) => {
                  const config = typeConfig[alert.type] || typeConfig.info
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[#f3f4f6] hover:border-[#e5e7eb] transition-colors relative"
                      style={{ borderLeftWidth: '3px', borderLeftColor: config.border }}
                    >
                      {!alert.read && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#dc2626]" />
                      )}
                      <span className="text-sm flex-shrink-0">{config.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0d0e11] leading-tight truncate pr-4">{alert.title}</p>
                        <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#9ca3af]">{alert.client_name}</span>
                          <span className="text-xs text-[#e5e7eb]">·</span>
                          <span className="text-xs text-[#9ca3af]">{timeAgo(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <QuickActions />
          </div>

          {/* Checklist progress widget */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0d0e11]">Checklist da Reforma</h3>
              <Link href="/checklist" className="text-xs text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors">
                Ver detalhes →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-2/3" />
              </div>
            ) : totalChecklistItems === 0 ? (
              <div className="text-center py-3">
                <p className="text-xs text-[#9ca3af] mb-3">
                  Nenhuma tarefa ainda. Inicialize o checklist para começar.
                </p>
                <Link
                  href="/checklist"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c49a2a] text-white text-xs font-semibold hover:bg-[#b8881f] transition-colors"
                >
                  ✅ Inicializar checklist
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6b7280] font-medium">Progresso geral</span>
                  <span className="font-bold text-[#0d0e11]">{checklistPct}%</span>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${checklistPct}%`,
                      backgroundColor: checklistPct >= 80 ? '#16a34a' : checklistPct >= 40 ? '#c49a2a' : '#dc2626',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                  <span>{doneChecklistItems} de {totalChecklistItems} tarefas concluídas</span>
                </div>
                {criticalPending > 0 && (
                  <div className="flex items-center gap-2 bg-[#fef2f2] border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-[#dc2626] text-sm">🔴</span>
                    <p className="text-xs font-semibold text-[#dc2626]">
                      {criticalPending} tarefa{criticalPending !== 1 ? 's' : ''} crítica{criticalPending !== 1 ? 's' : ''} pendente{criticalPending !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                <Link
                  href="/checklist"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#c49a2a] hover:text-[#b8881f] transition-colors"
                >
                  Ver todas as tarefas →
                </Link>
              </div>
            )}
          </div>

          {/* Plan usage widget */}
          <div
            className={`rounded-xl p-5 border cursor-pointer transition-all ${
              limitReached
                ? 'bg-[#fef2f2] border-[#fecaca] hover:border-[#dc2626]/40'
                : 'bg-white border-[#e5e7eb] shadow-sm hover:border-[#9ca3af]'
            }`}
            onClick={() => setUpgradeOpen(true)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: plan.badgeColor }}
                >
                  {plan.badge}
                </span>
                <span className="text-sm font-semibold text-[#0d0e11]">Seu plano</span>
              </div>
              {!loading && (
                <span className={`text-xs font-semibold ${limitReached ? 'text-[#dc2626]' : 'text-[#c49a2a]'}`}>
                  {limitReached ? 'Carteira lotada' : 'Ampliar minha carteira →'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-full" />
                <div className="h-2 bg-[#f3f4f6] rounded animate-pulse w-2/3" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#6b7280]">Clientes cadastrados</span>
                  <span className="font-bold text-[#0d0e11]">
                    {plan.clientLimit === -1
                      ? `${clients.length} (ilimitado)`
                      : `${clients.length} / ${plan.clientLimit}`}
                  </span>
                </div>
                {plan.clientLimit !== -1 && (
                  <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor: limitReached ? '#dc2626' : usagePct >= 80 ? '#f59e0b' : '#16a34a',
                      }}
                    />
                  </div>
                )}
                {limitReached && (
                  <p className="text-xs text-[#dc2626] font-medium mt-2">
                    Você tem clientes esperando. Amplie agora.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Locked features teaser — free plan only */}
          {!loading && userPlan === 'free' && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Você está perdendo estes recursos:</p>
              <div className="space-y-2">
                {[
                  { icon: '🔔', label: 'Nunca perca um prazo fiscal', href: '/alertas' },
                  { icon: '📄', label: 'Documentos centralizados, zero retrabalho', href: '/documentos' },
                  { icon: '✅', label: 'Guia completo da EC 132/2023', href: '/checklist' },
                ].map((f) => (
                  <Link key={f.label} href={f.href}
                    className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-[#0d0e11] transition-colors group"
                  >
                    <span>{f.icon}</span>
                    <span className="group-hover:underline">{f.label}</span>
                    <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                ))}
              </div>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="w-full mt-3 py-2 text-xs font-semibold text-[#c49a2a] border border-[#c49a2a]/40 rounded-lg hover:bg-[#fefce8] transition-colors"
              >
                Ver o que estou perdendo →
              </button>
            </div>
          )}

          {/* Reform info banner */}
          <div className="bg-[#fefce8] border border-[#c49a2a]/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-xl flex-shrink-0">⚡</div>
              <div>
                <p className="text-sm font-semibold text-[#0d0e11] mb-1">Reforma Tributária em andamento</p>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  IBS e CBS entram em vigência progressiva a partir de 2026. Simule o impacto para cada cliente agora.
                </p>
                <Link href="/clientes" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[#c49a2a] hover:text-[#b8881f] transition-colors">
                  Simular agora →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
