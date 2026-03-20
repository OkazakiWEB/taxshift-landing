'use client'

import React from 'react'
import Link from 'next/link'
import { mockAlerts } from '@/lib/mock-data'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date('2025-03-20')
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`
  return `${Math.floor(diffDays / 30)} meses atrás`
}

const typeConfig = {
  deadline: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', icon: '🔴' },
  warning: { color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', icon: '⚠️' },
  info: { color: '#2563eb', bg: '#eff6ff', border: '#2563eb', icon: 'ℹ️' },
}

export default function RecentAlerts() {
  const recentAlerts = mockAlerts.slice(0, 4)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0d0e11]">Alertas Recentes</h3>
        <Link
          href="/alertas"
          className="text-xs text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors"
        >
          Ver todos →
        </Link>
      </div>

      <div className="space-y-2">
        {recentAlerts.map((alert) => {
          const config = typeConfig[alert.type]
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
                <p className="text-sm font-medium text-[#0d0e11] leading-tight truncate pr-4">
                  {alert.title}
                </p>
                <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">
                  {alert.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#9ca3af]">{alert.clientName}</span>
                  <span className="text-xs text-[#e5e7eb]">·</span>
                  <span className="text-xs text-[#9ca3af]">{timeAgo(alert.date)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
