'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ToastNotification, { ToastType } from '@/components/ui/ToastNotification'
import {
  getClients,
  createClient_db,
  updateClient,
  deleteClient,
  Client,
} from '@/lib/db'

interface User {
  id?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

const ITEMS_PER_PAGE = 6

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
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

type ModalMode = 'add' | 'edit'

interface ClientForm {
  name: string
  cnpj: string
  regime: 'SN' | 'LP' | 'LR' | 'MEI'
  sector: string
  revenue: string
  tax_impact: string
  status: 'active' | 'warning' | 'urgent'
  notes: string
}

const emptyForm: ClientForm = {
  name: '',
  cnpj: '',
  regime: 'SN',
  sector: '',
  revenue: '',
  tax_impact: '',
  status: 'active',
  notes: '',
}

interface Toast {
  message: string
  type: ToastType
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-[#f3f4f6] rounded animate-pulse" style={{ width: i === 0 ? '60%' : '80%' }} />
        </td>
      ))}
    </tr>
  )
}

export default function ClientesContent({ user }: { user: User | null }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regimeFilter, setRegimeFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('add')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
  }

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const data = await getClients()
    setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filtered = useMemo(() => {
    return clients.filter((client) => {
      const matchSearch =
        !search ||
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.cnpj || '').includes(search) ||
        (client.sector || '').toLowerCase().includes(search.toLowerCase())

      const matchRegime = !regimeFilter || client.regime === regimeFilter

      const matchRisk =
        !riskFilter ||
        (riskFilter === 'urgent' && client.status === 'urgent') ||
        (riskFilter === 'warning' && client.status === 'warning') ||
        (riskFilter === 'active' && client.status === 'active') ||
        (riskFilter === 'positive' && client.tax_impact < 0) ||
        (riskFilter === 'negative' && client.tax_impact > 10)

      return matchSearch && matchRegime && matchRisk
    })
  }, [clients, search, regimeFilter, riskFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleFilterChange = () => setCurrentPage(1)

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setModalMode('add')
    setEditingClient(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (client: Client) => {
    setModalMode('edit')
    setEditingClient(client)
    setForm({
      name: client.name,
      cnpj: client.cnpj || '',
      regime: client.regime,
      sector: client.sector || '',
      revenue: String(client.revenue),
      tax_impact: String(client.tax_impact),
      status: client.status,
      notes: client.notes || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.regime) { setFormError('Regime é obrigatório.'); return }
    if (!form.sector.trim()) { setFormError('Setor é obrigatório.'); return }
    if (form.revenue === '' || isNaN(Number(form.revenue))) { setFormError('Faturamento inválido.'); return }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      cnpj: form.cnpj.trim(),
      regime: form.regime,
      sector: form.sector.trim(),
      revenue: Number(form.revenue),
      tax_impact: Number(form.tax_impact) || 0,
      status: form.status,
      notes: form.notes.trim(),
    }

    if (modalMode === 'add') {
      const result = await createClient_db(payload)
      if (!result) {
        setFormError('Erro ao salvar. Tente novamente.')
        setSaving(false)
        return
      }
      showToast('Cliente adicionado com sucesso!', 'success')
    } else {
      if (!editingClient) return
      const result = await updateClient(editingClient.id, payload)
      if (!result) {
        setFormError('Erro ao atualizar. Tente novamente.')
        setSaving(false)
        return
      }
      showToast('Cliente atualizado com sucesso!', 'success')
    }

    setSaving(false)
    setModalOpen(false)
    fetchClients()
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const ok = await deleteClient(id)
    if (ok) {
      setClients((prev) => prev.filter((c) => c.id !== id))
      showToast('Cliente removido.', 'info')
    } else {
      showToast('Erro ao remover cliente.', 'error')
    }
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppShell user={user}>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif text-[#0d0e11]">Carteira de Clientes</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {loading ? 'Carregando...' : `${clients.length} clientes cadastrados`}
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary self-start sm:self-auto">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou setor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
            className="input-field pl-9"
          />
        </div>
        <select value={regimeFilter} onChange={(e) => { setRegimeFilter(e.target.value); handleFilterChange() }} className="input-field w-full sm:w-44">
          <option value="">Todos os regimes</option>
          <option value="SN">Simples Nacional</option>
          <option value="LP">Lucro Presumido</option>
          <option value="LR">Lucro Real</option>
          <option value="MEI">MEI</option>
        </select>
        <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); handleFilterChange() }} className="input-field w-full sm:w-44">
          <option value="">Todos os status</option>
          <option value="urgent">Urgente</option>
          <option value="warning">Atenção</option>
          <option value="active">Ativo</option>
          <option value="negative">Alto impacto (+10%)</option>
          <option value="positive">Redução de carga</option>
        </select>
      </div>

      {/* Results count */}
      {(search || regimeFilter || riskFilter) && !loading && (
        <p className="text-sm text-[#6b7280] mb-4">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}{' '}
          <button onClick={() => { setSearch(''); setRegimeFilter(''); setRiskFilter('') }} className="text-[#c49a2a] hover:text-[#b8881f] font-medium">Limpar filtros</button>
        </p>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="hidden md:block bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafaf8] border-b border-[#e5e7eb]">
                {['Cliente', 'CNPJ', 'Regime', 'Faturamento', 'Impacto', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          {clients.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum cliente cadastrado"
              subtitle="Comece adicionando seu primeiro cliente à carteira."
              action={{ label: 'Adicionar primeiro cliente', onClick: openAddModal }}
            />
          ) : (
            <EmptyState
              icon="👥"
              title="Nenhum cliente encontrado"
              subtitle="Tente ajustar os filtros ou adicione um novo cliente."
              action={{ label: 'Limpar filtros', onClick: () => { setSearch(''); setRegimeFilter(''); setRiskFilter('') } }}
            />
          )}
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
                  const statusInfo = statusMap[client.status] || { variant: 'success' as const, label: client.status }
                  const impactColor = client.tax_impact > 10 ? '#dc2626' : client.tax_impact > 0 ? '#f59e0b' : '#16a34a'
                  const isConfirmingDelete = confirmDeleteId === client.id
                  return (
                    <tr key={client.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold" style={{ backgroundColor: regimeColors[client.regime] || '#6b7280' }}>
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0d0e11]">{client.name}</p>
                            <p className="text-xs text-[#9ca3af]">{client.sector}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280] font-mono text-xs">{client.cnpj || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="default">{client.regime}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#23252c] font-mono">{formatRevenue(client.revenue)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold font-mono" style={{ color: impactColor }}>
                          {client.tax_impact > 0 ? '+' : ''}{client.tax_impact.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-[#6b7280]">Tem certeza?</span>
                            <button
                              onClick={() => handleDelete(client.id)}
                              disabled={deleting}
                              className="text-xs px-2 py-1 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors disabled:opacity-60"
                            >
                              {deleting ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-1 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f3f4f6] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(client)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#c49a2a] hover:bg-[#fefce8] transition-colors" title="Editar">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button onClick={() => setConfirmDeleteId(client.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors" title="Excluir">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        )}
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
              const statusInfo = statusMap[client.status] || { variant: 'success' as const, label: client.status }
              const impactColor = client.tax_impact > 10 ? '#dc2626' : client.tax_impact > 0 ? '#f59e0b' : '#16a34a'
              const isConfirmingDelete = confirmDeleteId === client.id
              return (
                <div key={client.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: regimeColors[client.regime] || '#6b7280' }}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0d0e11]">{client.name}</p>
                        <p className="text-xs text-[#9ca3af]">{client.sector}</p>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
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
                        {client.tax_impact > 0 ? '+' : ''}{client.tax_impact.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#f3f4f6]">
                      <span className="text-xs text-[#6b7280] flex-1">Tem certeza?</span>
                      <button onClick={() => handleDelete(client.id)} disabled={deleting} className="text-xs px-2 py-1 bg-[#dc2626] text-white rounded-lg">
                        {deleting ? '...' : 'Confirmar'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 border border-[#e5e7eb] text-[#6b7280] rounded-lg">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 pt-2 border-t border-[#f3f4f6]">
                      <button onClick={() => openEditModal(client)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#c49a2a] hover:bg-[#fefce8] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => setConfirmDeleteId(client.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  )}
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
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#0d0e11] text-white' : 'text-[#6b7280] hover:bg-[#f3f4f6]'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[520px] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-base font-semibold text-[#0d0e11]">
                {modalMode === 'add' ? 'Adicionar Cliente' : 'Editar Cliente'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#0d0e11] hover:bg-[#f3f4f6] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleModalSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg px-4 py-3">
                  <p className="text-sm text-[#dc2626]">{formError}</p>
                </div>
              )}

              <div>
                <label className="label">Nome <span className="text-[#dc2626]">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Razão social ou nome" className="input-field" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">CNPJ</label>
                  <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="input-field" maxLength={18} />
                </div>
                <div>
                  <label className="label">Regime <span className="text-[#dc2626]">*</span></label>
                  <select value={form.regime} onChange={(e) => setForm({ ...form, regime: e.target.value as ClientForm['regime'] })} className="input-field">
                    <option value="SN">Simples Nacional</option>
                    <option value="LP">Lucro Presumido</option>
                    <option value="LR">Lucro Real</option>
                    <option value="MEI">MEI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Setor <span className="text-[#dc2626]">*</span></label>
                <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Tecnologia, Saúde, Comércio..." className="input-field" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Faturamento anual (R$) <span className="text-[#dc2626]">*</span></label>
                  <input type="number" min="0" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} placeholder="0" className="input-field" />
                </div>
                <div>
                  <label className="label">Impacto tributário (%)</label>
                  <input type="number" step="0.1" value={form.tax_impact} onChange={(e) => setForm({ ...form, tax_impact: e.target.value })} placeholder="0.0" className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientForm['status'] })} className="input-field">
                  <option value="active">Ativo</option>
                  <option value="warning">Atenção</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre o cliente..." rows={3} className="input-field resize-none" />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-[#0d0e11] text-white rounded-lg text-sm font-medium hover:bg-[#23252c] transition-colors disabled:opacity-60">
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Salvando...
                    </>
                  ) : (
                    modalMode === 'add' ? 'Adicionar cliente' : 'Salvar alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
