'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const actions = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    label: 'Simular Impacto',
    description: 'Calcule o impacto da Reforma para um cliente',
    color: '#c49a2a',
    bg: '#fefce8',
    href: '/clientes',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
    label: 'Adicionar Cliente',
    description: 'Cadastre um novo cliente na carteira',
    color: '#2563eb',
    bg: '#eff6ff',
    href: '/clientes',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    label: 'Gerar Relatório',
    description: 'Exporte relatórios fiscais em PDF',
    color: '#16a34a',
    bg: '#f0fdf4',
    href: '/documentos',
  },
]

export default function QuickActions() {
  const router = useRouter()

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#0d0e11] mb-4">Ações Rápidas</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-sm transition-all text-left group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: action.bg, color: action.color }}
            >
              {action.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0d0e11] flex items-center gap-1">
                {action.label}
                <span className="text-[#9ca3af] group-hover:translate-x-0.5 transition-transform inline-block">→</span>
              </p>
              <p className="text-xs text-[#6b7280] truncate">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
