'use client'

import React, { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { mockClients, MockClient } from '@/lib/mock-data'

interface User {
  id?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

const ITEMS_PER_PAGE = 6

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function formatCNPJ(cnpj: string) {
  return cnpj
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

const statusMap: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  active: { variant: 'success', label: 'Ativo' },
  warning: { variant: 'warning', label: 'Atenção' },
  urgent: { variant: 'error', label: 'Urgente' },
}

const regimeColors: Record<string, string> = {
  SN: '#16a34a',
  MEI: '#2563eb',
  LP: '#c49a2a',
  LR: '#6b7280',
}

export default function ClientesContent({ user }: { user: User | null }) {
  const [search, setSearch] = useState('')
  const [regimeFilter, setRegimeFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return mockClients.filter((client) => {
      const matchSearch =
        !search ||
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.cnpj.includes(search) ||
        client.sector.toLowerCase().includes(search.toLowerCase())

      const matchRegime = !regimeFilter || client.regime === regimeFilter

      const matchRisk =
        !riskFilter ||
        (riskFilter === 'urgent' && client.status === 'urgent') ||
        (riskFilter === 'warning' && client.status === 'warning') ||
        (riskFilter === 'active' && client.status === 'active') ||
        (riskFilter === 'positive' && client.taxImpact < 0) ||
        (riskFilter === 'negative' && client.taxImpact > 10)

      return matchSearch && matchRegime && matchRisk
    })
  }, [search, regimeFilter, riskFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  return (
    <AppShell user={user}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif text-[#0d0e11]">Carteira de Clientes</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {mockClients.length} clientes cadastrados
          </p>
        </div>
        <button className="btn-primary self-start sm:self-auto">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
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
            placeholder="Buscar por nome, CNPJ ou setor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
            className="input-field pl-9"
          />
        </div>

        {/* Regime filter */}
        <select
          value={regimeFilter}
          onChange={(e) => { setRegimeFilter(e.target.value); handleFilterChange() }}
          className="input-field w-full sm:w-44"
        >
          <option value="">Todos os regimes</option>
          <option value="SN">Simples Nacional</option>
          <option value="LP">Lucro Presumido</option>
          <option value="LR">Lucro Real</option>
          <option value="MEI">MEI</option>
        </select>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); handleFilterChange() }}
          className="input-field w-full sm:w-44"
        >
          <option value="">Todos os status</option>
          <option value="urgent">Urgente</option>
          <option value="warning">Atenção</option>
          <option value="active">Ativo</option>
          <option value="negative">Alto impacto (+10%)</option>
          <option value="positive">Redução de carga</option>
        </select>
      </div>

      {/* Results count */}
      {(search || regimeFilter || riskFilter) && (
        <p className="text-sm text-[#6b7280] mb-4">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          {' '}<button onClick={() => { setSearch(''); setRegimeFilter(''); setRiskFilter('') }} className="text-[#c49a2a] hover:text-[#b8881f] font-medium">Limpar filtros</button>
        </p>
      )}

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <EmptyState
            icon="👥"
            title="Nenhum cliente encontrado"
            subtitle="Tente ajustar os filtros ou adicione um novo cliente à carteira."
            action={{
              label: 'Limpar filtros',
              onClick: () => { setSearch(''); setRegimeFilter(''); setRiskFilter('') },
            }}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#e5e7eb]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">CNPJ</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Regime</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Faturamento</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Impacto</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {paginated.map((client) => {
                  const statusInfo = statusMap[client.status]
                  const impactColor =
                    client.taxImpact > 10
                      ? '#dc2626'
                      : client.taxImpact > 0
                      ? '#f59e0b'
                      : '#16a34a'
                  return (
                    <tr key={client.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
                            style={{ backgroundColor: regimeColors[client.regime] || '#6b7280' }}
                          >
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0d0e11]">{client.name}</p>
                            <p className="text-xs text-[#9ca3af]">{client.sector}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280] font-mono text-xs">{formatCNPJ(client.cnpj)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="default">{client.regime}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#23252c] font-mono">{formatRevenue(client.revenue)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold font-mono" style={{ color: impactColor }}>
                          {client.taxImpact > 0 ? '+' : ''}{client.taxImpact.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors" title="Ver detalhes">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#c49a2a] hover:bg-[#fefce8] transition-colors" title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
          <div className="md:hidden space-y-3 mb-4">
            {paginated.map((client) => {
              const statusInfo = statusMap[client.status]
              const impactColor =
                client.taxImpact > 10 ? '#dc2626' : client.taxImpact > 0 ? '#f59e0b' : '#16a34a'
              return (
                <div key={client.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: regimeColors[client.regime] || '#6b7280' }}
                      >
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0d0e11]">{client.name}</p>
                        <p className="text-xs text-[#9ca3af]">{client.sector}</p>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#9ca3af] mb-0.5">Regime</p>
                      <Badge variant="default">{client.regime}</Badge>
                    </div>
                    <div>
                      <p className="text-[#9ca3af] mb-0.5">Faturamento</p>
                      <p className="font-mono font-medium text-[#23252c]">{formatRevenue(client.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[#9ca3af] mb-0.5">Impacto</p>
                      <p className="font-mono font-bold" style={{ color: impactColor }}>
                        {client.taxImpact > 0 ? '+' : ''}{client.taxImpact.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9ca3af]">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-[#0d0e11] text-white'
                        : 'text-[#6b7280] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
