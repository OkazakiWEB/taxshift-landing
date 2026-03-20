'use client'

import React, { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { mockDocuments, MockDocument } from '@/lib/mock-data'

interface User {
  id?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

const statusConfig = {
  emitted: { variant: 'success' as const, label: 'Emitido' },
  pending: { variant: 'warning' as const, label: 'Pendente' },
  error: { variant: 'error' as const, label: 'Erro' },
}

function formatCurrency(value: number): string {
  if (value === 0) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function DocumentosContent({ user }: { user: User | null }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchSearch =
        !search ||
        doc.client.toLowerCase().includes(search.toLowerCase()) ||
        doc.type.toLowerCase().includes(search.toLowerCase()) ||
        doc.period.toLowerCase().includes(search.toLowerCase())

      const matchType = !typeFilter || doc.type === typeFilter
      const matchStatus = !statusFilter || doc.status === statusFilter

      return matchSearch && matchType && matchStatus
    })
  }, [search, typeFilter, statusFilter])

  // Stats
  const stats = {
    total: mockDocuments.length,
    emitted: mockDocuments.filter((d) => d.status === 'emitted').length,
    pending: mockDocuments.filter((d) => d.status === 'pending').length,
    error: mockDocuments.filter((d) => d.status === 'error').length,
  }

  const handleExport = () => {
    alert('Funcionalidade de exportação em desenvolvimento.')
  }

  return (
    <AppShell user={user}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif text-[#0d0e11]">Documentos Fiscais</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">Gerencie NF-e, SPED, DCTF e ECF</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary self-start sm:self-auto"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#6b7280', bg: '#f3f4f6' },
          { label: 'Emitidos', value: stats.emitted, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Pendentes', value: stats.pending, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Com erro', value: stats.error, color: '#dc2626', bg: '#fef2f2' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold font-mono flex-shrink-0"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              {stat.value}
            </div>
            <p className="text-sm text-[#6b7280]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por cliente, tipo ou período..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="">Todos os tipos</option>
          <option value="NF-e">NF-e</option>
          <option value="SPED">SPED</option>
          <option value="DCTF">DCTF</option>
          <option value="ECF">ECF</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="">Todos os status</option>
          <option value="emitted">Emitido</option>
          <option value="pending">Pendente</option>
          <option value="error">Erro</option>
        </select>
      </div>

      {/* Results */}
      {(search || typeFilter || statusFilter) && (
        <p className="text-sm text-[#6b7280] mb-4">
          {filtered.length} documento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          {' '}<button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }} className="text-[#c49a2a] hover:text-[#b8881f] font-medium">Limpar</button>
        </p>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <EmptyState
            icon="📄"
            title="Nenhum documento encontrado"
            subtitle="Tente ajustar os filtros de busca."
            action={{ label: 'Limpar filtros', onClick: () => { setSearch(''); setTypeFilter(''); setStatusFilter('') } }}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#e5e7eb]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Período</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Valor</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((doc) => {
                  const status = statusConfig[doc.status]
                  const typeColors: Record<string, string> = {
                    'NF-e': '#2563eb',
                    'SPED': '#7c3aed',
                    'DCTF': '#c49a2a',
                    'ECF': '#16a34a',
                  }
                  return (
                    <tr key={doc.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border"
                          style={{
                            color: typeColors[doc.type] || '#6b7280',
                            backgroundColor: `${typeColors[doc.type]}10` || '#f3f4f6',
                            borderColor: `${typeColors[doc.type]}30` || '#e5e7eb',
                          }}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-[#23252c] font-medium">{doc.client}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280]">{doc.period}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280] font-mono">{formatDate(doc.date)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-[#23252c] font-mono">{formatCurrency(doc.value)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={status.variant} dot>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors" title="Ver documento">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#16a34a] hover:bg-[#f0fdf4] transition-colors" title="Baixar PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((doc) => {
              const status = statusConfig[doc.status]
              const typeColors: Record<string, string> = {
                'NF-e': '#2563eb', 'SPED': '#7c3aed', 'DCTF': '#c49a2a', 'ECF': '#16a34a',
              }
              return (
                <div key={doc.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border"
                      style={{
                        color: typeColors[doc.type] || '#6b7280',
                        backgroundColor: `${typeColors[doc.type]}10`,
                        borderColor: `${typeColors[doc.type]}30`,
                      }}
                    >
                      {doc.type}
                    </span>
                    <Badge variant={status.variant} dot>{status.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-[#0d0e11] mb-1">{doc.client}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                    <span>{doc.period}</span>
                    <span>·</span>
                    <span className="font-mono">{formatDate(doc.date)}</span>
                    {doc.value > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[#23252c]">{formatCurrency(doc.value)}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </AppShell>
  )
}
