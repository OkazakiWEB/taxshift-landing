'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import KPICard from '@/components/ui/KPICard'
import TaxImpactChart from '@/components/dashboard/TaxImpactChart'
import QuickActions from '@/components/dashboard/QuickActions'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { getClients, getAlerts, getDocuments, Client, Alert } from '@/lib/db'

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
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [clientsData, alertsData] = await Promise.all([
      getClients(),
      getAlerts(),
      getDocuments(),
    ])
    setClients(clientsData)
    setAlerts(alertsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // KPIs computed from real data
  const totalClients = clients.length
  const urgentClients = clients.filter((c) => c.status === 'urgent').length
  const totalRevenue = clients.reduce((sum, c) => sum + (c.revenue || 0), 0)
  const avgCompliance =
    clients.length > 0
      ? Math.round(
          clients.reduce((sum, c) => sum + Math.max(0, 100 - Math.abs(c.tax_impact) * 2), 0) /
            clients.length
        )
      : 0

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentAlerts = [...alerts]
    .filter((a) => !a.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  return (
    <AppShell user={user}>
      {/* Greeting */}
      <div className="mb-6 fade-in">
        <h2 className="text-2xl font-serif text-[#0d0e11] mb-0.5">
          {getGreeting()}, {firstName}!
        </h2>
        <p className="text-sm text-[#9ca3af] capitalize">{formatDate()}</p>
      </div>

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
            <KPICard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              label="Faturamento Total"
              value={formatCurrency(totalRevenue)}
              subtitle="soma da carteira"
              accentColor="#16a34a"
            />
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
              subtitle="requerem atenção"
              accentColor="#dc2626"
            />
            <KPICard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
              label="Compliance Médio"
              value={`${avgCompliance}%`}
              subtitle="média da carteira"
              accentColor="#c49a2a"
            />
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
