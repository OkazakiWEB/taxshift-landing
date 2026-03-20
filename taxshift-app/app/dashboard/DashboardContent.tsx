'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import KPICard from '@/components/ui/KPICard'
import TaxImpactChart from '@/components/dashboard/TaxImpactChart'
import RecentAlerts from '@/components/dashboard/RecentAlerts'
import QuickActions from '@/components/dashboard/QuickActions'
import Badge from '@/components/ui/Badge'
import { mockClients, mockKPIs } from '@/lib/mock-data'
import Link from 'next/link'

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
  if (value >= 1_000_000) {
    return `R$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `R$${(value / 1_000).toFixed(0)}k`
  }
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

export default function DashboardContent({ user }: DashboardContentProps) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Contador'

  const firstName = displayName.split(' ')[0]
  const recentClients = mockClients.slice(0, 5)

  const statusMap = {
    active: { variant: 'success' as const, label: 'Ativo' },
    warning: { variant: 'warning' as const, label: 'Atenção' },
    urgent: { variant: 'error' as const, label: 'Urgente' },
  }

  return (
    <AppShell user={user}>
      {/* Greeting */}
      <div className="mb-6 fade-in">
        <h2 className="text-2xl font-serif text-[#0d0e11] mb-0.5">
          {getGreeting()}, {firstName}! 👋
        </h2>
        <p className="text-sm text-[#9ca3af] capitalize">{formatDate()}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          label="Clientes Ativos"
          value={mockKPIs.totalClients}
          trend={mockKPIs.monthlyGrowth}
          subtitle="vs. mês anterior"
          accentColor="#2563eb"
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          label="Faturamento Total"
          value={formatCurrency(mockKPIs.totalRevenue)}
          subtitle="soma da carteira"
          accentColor="#16a34a"
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          label="Urgências"
          value={mockKPIs.urgentClients}
          subtitle="requerem atenção"
          accentColor="#dc2626"
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          }
          label="Compliance Médio"
          value={`${mockKPIs.avgCompliance}%`}
          subtitle="média da carteira"
          accentColor="#c49a2a"
        />
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
              <Link
                href="/clientes"
                className="text-xs text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors"
              >
                Ver carteira →
              </Link>
            </div>
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
                    const statusInfo = statusMap[client.status]
                    const impactColor =
                      client.taxImpact > 10
                        ? '#dc2626'
                        : client.taxImpact > 0
                        ? '#f59e0b'
                        : '#16a34a'
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
                          <span
                            className="text-sm font-semibold font-mono"
                            style={{ color: impactColor }}
                          >
                            {client.taxImpact > 0 ? '+' : ''}{client.taxImpact.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Badge variant={statusInfo.variant} dot>
                            {statusInfo.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — 2/5 */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Alerts */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <RecentAlerts />
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
                <Link
                  href="/clientes"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[#c49a2a] hover:text-[#b8881f] transition-colors"
                >
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
