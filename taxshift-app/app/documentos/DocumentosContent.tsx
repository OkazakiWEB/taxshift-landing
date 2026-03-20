'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ToastNotification, { ToastType } from '@/components/ui/ToastNotification'
import {
  getDocuments,
  getClients,
  createDocument,
  deleteDocument,
  Document,
  Client,
} from '@/lib/db'

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

const typeColors: Record<string, string> = {
  'NF-e': '#2563eb',
  'SPED': '#7c3aed',
  'DCTF': '#c49a2a',
  'ECF': '#16a34a',
}

function formatCurrency(value: number): string {
  if (value === 0) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

interface DocumentForm {
  client_name: string
  client_id: string
  type: 'NF-e' | 'SPED' | 'DCTF' | 'ECF'
  period: string
  due_date: string
  value: string
  status: 'emitted' | 'pending' | 'error'
  notes: string
}

const emptyDocForm: DocumentForm = {
  client_name: '',
  client_id: '',
  type: 'NF-e',
  period: '',
  due_date: '',
  value: '',
  status: 'pending',
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
          <div className="h-4 bg-[#f3f4f6] rounded animate-pulse" style={{ width: i === 1 ? '70%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

export default function DocumentosContent({ user }: { user: User | null }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<DocumentForm>(emptyDocForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState<Toast | null>(null)
  const showToast = (message: string, type: ToastType) => setToast({ message, type })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [docsData, clientsData] = await Promise.all([getDocuments(), getClients()])
    setDocuments(docsData)
    setClients(clientsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Stats from real data
  const stats = useMemo(() => ({
    total: documents.length,
    emitted: documents.filter((d) => d.status === 'emitted').length,
    pending: documents.filter((d) => d.status === 'pending').length,
    error: documents.filter((d) => d.status === 'error').length,
  }), [documents])

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        !search ||
        (doc.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
        doc.type.toLowerCase().includes(search.toLowerCase()) ||
        (doc.period || '').toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || doc.type === typeFilter
      const matchStatus = !statusFilter || doc.status === statusFilter
      return matchSearch && matchType && matchStatus
    })
  }, [documents, search, typeFilter, statusFilter])

  // Modal save
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.client_name.trim()) { setFormError('Nome do cliente é obrigatório.'); return }
    if (!form.type) { setFormError('Tipo é obrigatório.'); return }

    setSaving(true)

    // Find client id if name matches
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === form.client_name.toLowerCase()
    )

    const result = await createDocument({
      client_id: matchedClient?.id || form.client_id || null,
      client_name: form.client_name.trim(),
      type: form.type,
      period: form.period.trim(),
      due_date: form.due_date || null,
      value: Number(form.value) || 0,
      status: form.status,
      notes: form.notes.trim(),
    })

    if (!result) {
      setFormError('Erro ao salvar documento. Tente novamente.')
      setSaving(false)
      return
    }

    setSaving(false)
    setModalOpen(false)
    setForm(emptyDocForm)
    showToast('Documento adicionado com sucesso!', 'success')
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const ok = await deleteDocument(id)
    if (ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      showToast('Documento removido.', 'info')
    } else {
      showToast('Erro ao remover documento.', 'error')
    }
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  return (
    <AppShell user={user}>
      {toast && (
        <ToastNotification message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif text-[#0d0e11]">Documentos Fiscais</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">Gerencie NF-e, SPED, DCTF e ECF</p>
        </div>
        <button onClick={() => { setForm(emptyDocForm); setFormError(''); setModalOpen(true) }} className="btn-primary self-start sm:self-auto">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar documento
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: loading ? '…' : stats.total, color: '#6b7280', bg: '#f3f4f6' },
          { label: 'Emitidos', value: loading ? '…' : stats.emitted, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Pendentes', value: loading ? '…' : stats.pending, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Com erro', value: loading ? '…' : stats.error, color: '#dc2626', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold font-mono flex-shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
              {stat.value}
            </div>
            <p className="text-sm text-[#6b7280]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar por cliente, tipo ou período..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-full sm:w-40">
          <option value="">Todos os tipos</option>
          <option value="NF-e">NF-e</option>
          <option value="SPED">SPED</option>
          <option value="DCTF">DCTF</option>
          <option value="ECF">ECF</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-full sm:w-40">
          <option value="">Todos os status</option>
          <option value="emitted">Emitido</option>
          <option value="pending">Pendente</option>
          <option value="error">Erro</option>
        </select>
      </div>

      {/* Results count */}
      {(search || typeFilter || statusFilter) && !loading && (
        <p className="text-sm text-[#6b7280] mb-4">
          {filtered.length} documento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}{' '}
          <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }} className="text-[#c49a2a] hover:text-[#b8881f] font-medium">Limpar</button>
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="hidden md:block bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafaf8] border-b border-[#e5e7eb]">
                {['Tipo', 'Cliente', 'Período', 'Vencimento', 'Valor', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          {documents.length === 0 ? (
            <EmptyState
              icon="📄"
              title="Nenhum documento cadastrado"
              subtitle="Adicione documentos fiscais dos seus clientes."
              action={{ label: 'Adicionar primeiro documento', onClick: () => { setForm(emptyDocForm); setModalOpen(true) } }}
            />
          ) : (
            <EmptyState
              icon="📄"
              title="Nenhum documento encontrado"
              subtitle="Tente ajustar os filtros de busca."
              action={{ label: 'Limpar filtros', onClick: () => { setSearch(''); setTypeFilter(''); setStatusFilter('') } }}
            />
          )}
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
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Vencimento</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Valor</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((doc) => {
                  const status = statusConfig[doc.status] || { variant: 'warning' as const, label: doc.status }
                  const isConfirming = confirmDeleteId === doc.id
                  return (
                    <tr key={doc.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-5 py-3.5">
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
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-[#23252c] font-medium">{doc.client_name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280]">{doc.period || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#6b7280] font-mono">
                          {doc.due_date ? formatDate(doc.due_date) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-[#23252c] font-mono">{formatCurrency(doc.value)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={status.variant} dot>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-[#6b7280]">Tem certeza?</span>
                            <button onClick={() => handleDelete(doc.id)} disabled={deleting} className="text-xs px-2 py-1 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors disabled:opacity-60">
                              {deleting ? '...' : 'Confirmar'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f3f4f6] transition-colors">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(doc.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
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
              const status = statusConfig[doc.status] || { variant: 'warning' as const, label: doc.status }
              const isConfirming = confirmDeleteId === doc.id
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
                  <p className="text-sm font-medium text-[#0d0e11] mb-1">{doc.client_name}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                    <span>{doc.period || '—'}</span>
                    {doc.due_date && <><span>·</span><span className="font-mono">{formatDate(doc.due_date)}</span></>}
                    {doc.value > 0 && <><span>·</span><span className="font-mono text-[#23252c]">{formatCurrency(doc.value)}</span></>}
                  </div>
                  {isConfirming ? (
                    <div className="flex items-center gap-2 pt-3 mt-2 border-t border-[#f3f4f6]">
                      <span className="text-xs text-[#6b7280] flex-1">Tem certeza?</span>
                      <button onClick={() => handleDelete(doc.id)} disabled={deleting} className="text-xs px-2 py-1 bg-[#dc2626] text-white rounded-lg">{deleting ? '...' : 'Confirmar'}</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 border border-[#e5e7eb] text-[#6b7280] rounded-lg">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-2 mt-1 border-t border-[#f3f4f6]">
                      <button onClick={() => setConfirmDeleteId(doc.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add Document Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-base font-semibold text-[#0d0e11]">Adicionar Documento</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#0d0e11] hover:bg-[#f3f4f6] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleModalSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg px-4 py-3">
                  <p className="text-sm text-[#dc2626]">{formError}</p>
                </div>
              )}

              <div>
                <label className="label">Cliente <span className="text-[#dc2626]">*</span></label>
                {clients.length > 0 ? (
                  <select
                    value={form.client_name}
                    onChange={(e) => {
                      const selected = clients.find((c) => c.name === e.target.value)
                      setForm({ ...form, client_name: e.target.value, client_id: selected?.id || '' })
                    }}
                    className="input-field"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="__custom__">Outro (digitar nome)</option>
                  </select>
                ) : (
                  <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Nome do cliente" className="input-field" />
                )}
                {form.client_name === '__custom__' && (
                  <input type="text" value={form.client_id} onChange={(e) => setForm({ ...form, client_name: e.target.value, client_id: '' })} placeholder="Nome do cliente" className="input-field mt-2" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo <span className="text-[#dc2626]">*</span></label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentForm['type'] })} className="input-field">
                    <option value="NF-e">NF-e</option>
                    <option value="SPED">SPED</option>
                    <option value="DCTF">DCTF</option>
                    <option value="ECF">ECF</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DocumentForm['status'] })} className="input-field">
                    <option value="pending">Pendente</option>
                    <option value="emitted">Emitido</option>
                    <option value="error">Erro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Período</label>
                  <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Ex: Mar/2025" className="input-field" />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Valor (R$)</label>
                <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" className="input-field" />
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações..." rows={2} className="input-field resize-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-[#0d0e11] text-white rounded-lg text-sm font-medium hover:bg-[#23252c] transition-colors disabled:opacity-60">
                  {saving ? (
                    <><LoadingSpinner size="sm" color="white" />Salvando...</>
                  ) : (
                    'Adicionar documento'
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
