'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import EmptyState from '@/components/ui/EmptyState'
import { getAlerts, markAlertRead, markAllAlertsRead, Alert } from '@/lib/db'

interface User {
  id?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

type FilterType = 'all' | 'deadline' | 'warning' | 'info'

const typeConfig = {
  deadline: {
    icon: '🔴',
    label: 'Prazo',
    borderColor: '#dc2626',
    bg: '#fef2f2',
    badgeColor: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
  },
  warning: {
    icon: '⚠️',
    label: 'Aviso',
    borderColor: '#f59e0b',
    bg: '#fffbeb',
    badgeColor: 'text-[#f59e0b] bg-[#fffbeb] border-[#fde68a]',
  },
  info: {
    icon: 'ℹ️',
    label: 'Informação',
    borderColor: '#2563eb',
    bg: '#eff6ff',
    badgeColor: 'text-[#2563eb] bg-[#eff6ff] border-[#bfdbfe]',
  },
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
  return `há ${Math.floor(diffDays / 30)} mês(es)`
}

function AlertSkeleton() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-7 h-7 rounded-full bg-[#f3f4f6] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#f3f4f6] rounded w-3/4" />
          <div className="h-3 bg-[#f3f4f6] rounded w-full" />
          <div className="h-3 bg-[#f3f4f6] rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export default function AlertasContent({ user }: { user: User | null }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    const data = await getAlerts()
    setAlerts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const unreadCount = alerts.filter((a) => !a.read).length

  const filtered = alerts.filter((alert) => {
    if (filter === 'all') return true
    return alert.type === filter
  })

  const handleMarkRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
    await markAlertRead(id)
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    await markAllAlertsRead()
    setMarkingAll(false)
  }

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: alerts.length },
    { id: 'deadline', label: 'Prazos', count: alerts.filter((a) => a.type === 'deadline').length },
    { id: 'warning', label: 'Avisos', count: alerts.filter((a) => a.type === 'warning').length },
    { id: 'info', label: 'Informações', count: alerts.filter((a) => a.type === 'info').length },
  ]

  return (
    <AppShell user={user}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif text-[#0d0e11]">Alertas</h2>
            {unreadCount > 0 && (
              <span className="bg-[#dc2626] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {loading ? 'Carregando...' : `${unreadCount} não lido${unreadCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary self-start sm:self-auto text-sm disabled:opacity-60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {markingAll ? 'Marcando...' : 'Marcar tudo como lido'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-[#f3f4f6] rounded-xl p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.id ? 'bg-white text-[#0d0e11] shadow-sm' : 'text-[#6b7280] hover:text-[#23252c]'
            }`}
          >
            {f.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${filter === f.id ? 'bg-[#0d0e11] text-white' : 'bg-[#e5e7eb] text-[#6b7280]'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <AlertSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={alerts.length === 0 ? 'Nenhum alerta ainda' : 'Nenhum alerta nesta categoria'}
          subtitle={alerts.length === 0 ? 'Os alertas de prazos e avisos dos seus clientes aparecerão aqui.' : 'Não há alertas nesta categoria no momento.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const config = typeConfig[alert.type] || typeConfig.info
            return (
              <div
                key={alert.id}
                className={`bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer ${
                  !alert.read ? 'ring-1 ring-[#e5e7eb]' : 'opacity-80'
                }`}
                style={{ borderLeftWidth: '4px', borderLeftColor: config.borderColor }}
                onClick={() => { if (!alert.read) handleMarkRead(alert.id) }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-xl flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-semibold ${!alert.read ? 'text-[#0d0e11]' : 'text-[#6b7280]'}`}>
                          {alert.title}
                        </h3>
                        {!alert.read && <span className="w-2 h-2 rounded-full bg-[#dc2626] flex-shrink-0" />}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${config.badgeColor}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-3">{alert.description}</p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span className="font-medium text-[#6b7280]">{alert.client_name}</span>
                        <span className="text-[#e5e7eb]">·</span>
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                      {!alert.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(alert.id) }}
                          className="text-xs text-[#9ca3af] hover:text-[#0d0e11] transition-colors underline underline-offset-2"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
