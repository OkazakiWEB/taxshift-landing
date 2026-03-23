'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { getClients, getChecklistItems, updateChecklistItem, Client, ChecklistItem } from '@/lib/db'

interface User {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

interface ChecklistContentProps {
  user: User | null
}

type CategoryKey = 'all' | 'diagnostico' | 'sistemas' | 'contratos' | 'treinamento' | 'documentacao' | 'fiscal'

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'Todos',
  diagnostico: 'Diagnóstico',
  sistemas: 'Sistemas',
  contratos: 'Contratos',
  treinamento: 'Treinamento',
  documentacao: 'Documentação',
  fiscal: 'Fiscal',
}

const CATEGORY_ICONS: Record<string, string> = {
  diagnostico: '🔍',
  sistemas: '💻',
  contratos: '📝',
  treinamento: '🎓',
  documentacao: '📁',
  fiscal: '📊',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#9ca3af',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
}

const PRIORITY_DOTS: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '⚪',
}

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  '2026': { bg: '#fee2e2', text: '#dc2626' },
  '2027': { bg: '#ffedd5', text: '#ea580c' },
  '2029': { bg: '#ede9fe', text: '#7c3aed' },
  '2033': { bg: '#ede9fe', text: '#7c3aed' },
  ongoing: { bg: '#f3f4f6', text: '#6b7280' },
}

const STATUS_NEXT: Record<ChecklistItem['status'], ChecklistItem['status']> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
  not_applicable: 'pending',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluído',
  not_applicable: 'N/A',
}

function getPhaseColor(phase: string | null): { bg: string; text: string } {
  if (!phase) return PHASE_COLORS['ongoing']
  if (phase.startsWith('2026')) return PHASE_COLORS['2026']
  if (phase.startsWith('2027')) return PHASE_COLORS['2027']
  if (phase.startsWith('2029') || phase.startsWith('2028') || phase.startsWith('2032')) return PHASE_COLORS['2029']
  if (phase.startsWith('2033')) return PHASE_COLORS['2033']
  return PHASE_COLORS['ongoing']
}

function PhaseLabel({ phase }: { phase: string | null }) {
  const colors = getPhaseColor(phase)
  const label = phase === 'ongoing' ? 'Contínuo' : phase ?? 'Contínuo'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] ?? '#9ca3af'
  const label = PRIORITY_LABELS[priority] ?? priority
  const dot = PRIORITY_DOTS[priority] ?? '⚪'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={{ color, borderColor: color, backgroundColor: color + '14' }}
    >
      <span>{dot}</span>
      {label}
    </span>
  )
}

function ProgressRing({ percent, size = 80 }: { percent: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDash = (percent / 100) * circumference
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#c49a2a"
        strokeWidth="8"
        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size > 100 ? '20' : '14'}
        fontWeight="700"
        fill="#0d0e11"
      >
        {percent}%
      </text>
    </svg>
  )
}

interface TaskCardProps {
  item: ChecklistItem
  onStatusChange: (id: string, newStatus: ChecklistItem['status']) => void
  onNotesChange: (id: string, notes: string) => void
}

function TaskCard({ item, onStatusChange, onNotesChange }: TaskCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(item.notes ?? '')
  const [saving, setSaving] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const isDone = item.status === 'done'
  const isInProgress = item.status === 'in_progress'

  let cardBg = 'bg-white'
  if (isDone) cardBg = 'bg-green-50'
  else if (isInProgress) cardBg = 'bg-blue-50/40'

  const handleStatusClick = () => {
    const next = STATUS_NEXT[item.status]
    onStatusChange(item.id, next)
  }

  const handleNotesSave = async () => {
    setSaving(true)
    await onNotesChange(item.id, notesValue)
    setSaving(false)
    setShowNotes(false)
  }

  return (
    <div
      className={`${cardBg} border rounded-xl p-4 transition-all hover:shadow-sm`}
      style={{
        borderColor: isDone ? '#86efac' : isInProgress ? '#93c5fd' : '#e5e7eb',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <button
          onClick={handleStatusClick}
          className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
          style={{
            borderColor: isDone ? '#16a34a' : isInProgress ? '#2563eb' : '#d1d5db',
            backgroundColor: isDone ? '#16a34a' : isInProgress ? '#2563eb' : 'transparent',
          }}
          title={`Status: ${STATUS_LABELS[item.status]} — clique para avançar`}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isInProgress && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2.5" />
              <path d="M12 8v4l2 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm">{CATEGORY_ICONS[item.category] ?? '📋'}</span>
            <PriorityBadge priority={item.priority} />
            <PhaseLabel phase={item.phase} />
          </div>

          {/* Title */}
          <p
            className={`text-sm font-semibold text-[#0d0e11] leading-snug mb-1 ${isDone ? 'line-through text-[#9ca3af]' : ''}`}
          >
            {item.title}
          </p>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-[#6b7280] leading-relaxed mb-2">{item.description}</p>
          )}

          {/* Footer row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status toggle button */}
            <button
              onClick={handleStatusClick}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-all hover:opacity-80"
              style={{
                color: isDone ? '#16a34a' : isInProgress ? '#2563eb' : '#6b7280',
                borderColor: isDone ? '#86efac' : isInProgress ? '#93c5fd' : '#e5e7eb',
                backgroundColor: isDone ? '#f0fdf4' : isInProgress ? '#eff6ff' : '#f9fafb',
              }}
            >
              {STATUS_LABELS[item.status]}
            </button>

            {/* Due date */}
            {item.due_date && (
              <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {new Date(item.due_date).toLocaleDateString('pt-BR')}
              </span>
            )}

            {/* Notes toggle */}
            <button
              onClick={() => {
                setShowNotes((v) => !v)
                setTimeout(() => notesRef.current?.focus(), 50)
              }}
              className="text-xs text-[#9ca3af] hover:text-[#6b7280] flex items-center gap-1 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {item.notes ? 'Ver notas' : 'Adicionar nota'}
            </button>
          </div>

          {/* Inline notes textarea */}
          {showNotes && (
            <div className="mt-3 space-y-2">
              <textarea
                ref={notesRef}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full text-xs text-[#374151] bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#c49a2a]/30 focus:border-[#c49a2a]"
                rows={3}
                placeholder="Adicione observações, links ou referências..."
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNotesSave}
                  disabled={saving}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#0d0e11] text-white hover:bg-[#1a1b1f] transition-colors disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar nota'}
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-[#9ca3af] hover:text-[#6b7280] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PhaseProgressCard({
  phase,
  label,
  items,
}: {
  phase: string
  label: string
  items: ChecklistItem[]
}) {
  const total = items.length
  const done = items.filter((i) => i.status === 'done').length
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'in_progress').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const colors = getPhaseColor(phase)
  const nextItem = items.find((i) => i.status === 'pending' || i.status === 'in_progress')

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {label}
        </span>
        <span className="text-lg font-bold text-[#0d0e11]">{pct}%</span>
      </div>
      <div className="w-full bg-[#f3f4f6] rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: colors.text }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-2">
        <span>{done} concluídas</span>
        <span>{pending} pendentes</span>
      </div>
      {nextItem && (
        <div className="mt-2 pt-2 border-t border-[#f3f4f6]">
          <p className="text-xs text-[#6b7280] font-medium">Próxima ação:</p>
          <p className="text-xs text-[#374151] leading-snug mt-0.5 line-clamp-2">
            {CATEGORY_ICONS[nextItem.category] ?? '📋'} {nextItem.title}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ChecklistContent({ user }: ChecklistContentProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('all')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [clientsData, itemsData] = await Promise.all([
      getClients(),
      getChecklistItems(),
    ])
    setClients(clientsData)
    setItems(itemsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter items for selected client
  const clientItems = selectedClientId === 'all'
    ? items
    : items.filter((i) => i.client_id === selectedClientId)

  // Filter by category tab
  const visibleItems = activeCategory === 'all'
    ? clientItems
    : clientItems.filter((i) => i.category === activeCategory)

  // Stats
  const totalItems = clientItems.length
  const doneItems = clientItems.filter((i) => i.status === 'done').length
  const inProgressItems = clientItems.filter((i) => i.status === 'in_progress').length
  const pendingItems = clientItems.filter((i) => i.status === 'pending').length
  const criticalPending = clientItems.filter((i) => i.priority === 'critical' && i.status !== 'done').length
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // Category counts (pending in that category, for selected client)
  const categoryCounts: Record<string, number> = {}
  const cats: CategoryKey[] = ['diagnostico', 'sistemas', 'contratos', 'treinamento', 'documentacao', 'fiscal']
  cats.forEach((cat) => {
    categoryCounts[cat] = clientItems.filter(
      (i) => i.category === cat && (i.status === 'pending' || i.status === 'in_progress')
    ).length
  })

  // Determine if the selected client has items initialized
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const hasItems = clientItems.length > 0
  const showEmptyState = selectedClientId !== 'all' && !hasItems && !loading

  const handleInitialize = async () => {
    if (!selectedClientId || selectedClientId === 'all') return
    setInitializing(true)
    setInitError(null)
    try {
      const res = await fetch('/api/checklist/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClientId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setInitError(err?.error ?? 'Erro ao inicializar checklist')
      } else {
        await fetchData()
      }
    } catch {
      setInitError('Erro de conexão. Tente novamente.')
    }
    setInitializing(false)
  }

  const handleStatusChange = useCallback(
    async (id: string, newStatus: ChecklistItem['status']) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus,
                completed_at: newStatus === 'done' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      )
      // Persist
      await updateChecklistItem(id, {
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
    },
    []
  )

  const handleNotesChange = useCallback(async (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, notes, updated_at: new Date().toISOString() } : item
      )
    )
    await updateChecklistItem(id, { notes })
  }, [])

  const handleMarkVisibleDone = async () => {
    const ids = visibleItems
      .filter((i) => i.status !== 'done')
      .map((i) => i.id)
    if (ids.length === 0) return
    const now = new Date().toISOString()
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? { ...item, status: 'done' as const, completed_at: now, updated_at: now }
          : item
      )
    )
    await Promise.all(
      ids.map((id) =>
        updateChecklistItem(id, { status: 'done', completed_at: now })
      )
    )
  }

  const handleResetFilters = () => {
    setActiveCategory('all')
    setSelectedClientId('all')
  }

  const handleExport = () => {
    const rows = [
      ['Categoria', 'Título', 'Prioridade', 'Fase', 'Status', 'Notas'],
      ...clientItems.map((i) => [
        CATEGORY_LABELS[i.category as CategoryKey] ?? i.category,
        i.title,
        PRIORITY_LABELS[i.priority] ?? i.priority,
        i.phase ?? '',
        STATUS_LABELS[i.status] ?? i.status,
        i.notes ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checklist-reforma-${selectedClientId === 'all' ? 'escritorio' : selectedClient?.name ?? 'cliente'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Phase cards data
  const phaseGroups = [
    { phase: '2026', label: '2026 — Fase Inicial', items: clientItems.filter((i) => i.phase === '2026') },
    { phase: '2027', label: '2027 — Transição', items: clientItems.filter((i) => i.phase === '2027') },
    {
      phase: '2029',
      label: '2029-2032 — Consolidação',
      items: clientItems.filter((i) => i.phase === '2028' || i.phase === '2029' || i.phase === '2032'),
    },
    { phase: '2033', label: '2033 — Vigência Plena', items: clientItems.filter((i) => i.phase === '2033' || i.phase === 'ongoing') },
  ]

  return (
    <AppShell user={user}>
      {/* Header */}
      <div className="mb-6 fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-serif text-[#0d0e11] mb-1">
              Checklist da Reforma Tributária
            </h2>
            <p className="text-sm text-[#9ca3af]">
              Acompanhe o progresso de adequação por cliente — EC 132/2023 até 2033
            </p>
          </div>
          {hasItems && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#6b7280] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Top stats row */}
      {!loading && hasItems && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 fade-in">
          {/* Progress ring */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm flex items-center gap-5">
            <ProgressRing percent={overallPct} size={100} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#0d0e11]">Progresso geral</p>
              <p className="text-xs text-[#9ca3af]">
                {selectedClientId === 'all' ? 'Todos os clientes' : selectedClient?.name ?? ''}
              </p>
              {criticalPending > 0 && (
                <p className="text-xs font-semibold text-[#dc2626]">
                  {criticalPending} tarefa{criticalPending !== 1 ? 's' : ''} crítica{criticalPending !== 1 ? 's' : ''} pendente{criticalPending !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-3 shadow-sm text-center">
              <p className="text-xl font-bold text-[#0d0e11]">{totalItems}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Total tarefas</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 shadow-sm text-center">
              <p className="text-xl font-bold text-[#16a34a]">{doneItems}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Concluídas</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm text-center">
              <p className="text-xl font-bold text-[#2563eb]">{inProgressItems}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Em andamento</p>
            </div>
            <div className="bg-[#fff7ed] border border-orange-200 rounded-xl p-3 shadow-sm text-center">
              <p className="text-xl font-bold text-[#ea580c]">{pendingItems}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Pendentes</p>
            </div>
          </div>
        </div>
      )}

      {/* Client selector + controls */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-[#6b7280] whitespace-nowrap">Ver checklist de:</label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value)
              setActiveCategory('all')
            }}
            className="flex-1 text-sm text-[#0d0e11] border border-[#e5e7eb] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#c49a2a]/30 focus:border-[#c49a2a]"
          >
            <option value="all">Visão geral do escritório</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.regime}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {hasItems && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleMarkVisibleDone}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-[#f0fdf4] text-[#16a34a] border border-green-200 hover:bg-green-100 transition-colors"
            >
              ✓ Marcar visíveis como concluídas
            </button>
            <button
              onClick={handleResetFilters}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors"
            >
              Resetar filtros
            </button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      {hasItems && (
        <div className="flex gap-1 flex-wrap mb-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-1.5">
          {(['all', ...cats] as CategoryKey[]).map((cat) => {
            const isActive = activeCategory === cat
            const count = cat === 'all'
              ? clientItems.filter((i) => i.status !== 'done').length
              : categoryCounts[cat] ?? 0
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-white text-[#0d0e11] shadow-sm border border-[#e5e7eb]'
                    : 'text-[#6b7280] hover:text-[#0d0e11] hover:bg-white/50'
                  }`}
              >
                {cat !== 'all' && <span>{CATEGORY_ICONS[cat]}</span>}
                {CATEGORY_LABELS[cat]}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                      ${isActive ? 'bg-[#dc2626] text-white' : 'bg-[#f3f4f6] text-[#9ca3af]'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 fade-in">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#f3f4f6] animate-pulse flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 bg-[#f3f4f6] rounded-full animate-pulse w-16" />
                    <div className="h-5 bg-[#f3f4f6] rounded-full animate-pulse w-12" />
                  </div>
                  <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — no clients */}
      {!loading && clients.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#e5e7eb] rounded-xl shadow-sm fade-in">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-semibold text-[#0d0e11] mb-2">Nenhum cliente cadastrado</p>
          <p className="text-xs text-[#9ca3af] mb-4">
            Adicione clientes para inicializar o checklist de adequação à reforma tributária.
          </p>
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d0e11] text-white text-sm font-medium hover:bg-[#1a1b1f] transition-colors"
          >
            Ir para Clientes →
          </Link>
        </div>
      )}

      {/* Empty state — client has no items yet */}
      {showEmptyState && !loading && (
        <div className="text-center py-16 bg-white border border-[#e5e7eb] rounded-xl shadow-sm fade-in">
          <div className="text-4xl mb-3">🚀</div>
          <p className="text-sm font-semibold text-[#0d0e11] mb-2">
            Nenhuma tarefa ainda para {selectedClient?.name}
          </p>
          <p className="text-xs text-[#9ca3af] mb-6 max-w-sm mx-auto">
            Inicialize o checklist para criar automaticamente todas as tarefas de adequação à reforma tributária (EC 132/2023) para este cliente.
          </p>
          {initError && (
            <p className="text-xs text-[#dc2626] mb-3 font-medium">{initError}</p>
          )}
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c49a2a] text-white text-sm font-semibold hover:bg-[#b8881f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {initializing ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Inicializando...
              </>
            ) : (
              <>
                ✅ Inicializar checklist para {selectedClient?.name}
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state — overview mode with no items at all */}
      {!loading && selectedClientId === 'all' && items.length === 0 && clients.length > 0 && (
        <div className="text-center py-16 bg-white border border-[#e5e7eb] rounded-xl shadow-sm fade-in">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-semibold text-[#0d0e11] mb-2">Nenhuma tarefa ainda</p>
          <p className="text-xs text-[#9ca3af] mb-4">
            Selecione um cliente no filtro acima e inicialize o checklist para começar.
          </p>
        </div>
      )}

      {/* Task list */}
      {!loading && visibleItems.length > 0 && (
        <div className="space-y-3 fade-in">
          {visibleItems.map((item) => (
            <TaskCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
            />
          ))}
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && hasItems && visibleItems.length === 0 && (
        <div className="text-center py-10 bg-white border border-[#e5e7eb] rounded-xl shadow-sm fade-in">
          <p className="text-sm text-[#9ca3af]">Nenhuma tarefa nesta categoria.</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-2 text-xs font-medium text-[#c49a2a] hover:text-[#b8881f]"
          >
            Ver todas as categorias →
          </button>
        </div>
      )}

      {/* Progress by phase */}
      {!loading && hasItems && (
        <div className="mt-8 fade-in">
          <h3 className="text-sm font-semibold text-[#0d0e11] mb-4">Progresso por fase da reforma</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {phaseGroups.map((pg) =>
              pg.items.length > 0 ? (
                <PhaseProgressCard
                  key={pg.phase}
                  phase={pg.phase}
                  label={pg.label}
                  items={pg.items}
                />
              ) : null
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
