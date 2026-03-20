'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import Badge from '@/components/ui/Badge'
import KPICard from '@/components/ui/KPICard'

interface User {
  id?: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

const mockUsers = [
  { id: '1', name: 'João da Silva', email: 'joao@silva.com.br', office: 'Silva & Associados', plan: 'PRO', clients: 47, status: 'active', createdAt: '15/01/2025' },
  { id: '2', name: 'Maria Santos', email: 'maria@contabilidadeplus.com.br', office: 'Contabilidade Plus', plan: 'PRO', clients: 32, status: 'active', createdAt: '20/01/2025' },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos@tributariaco.com.br', office: 'Tributária & Co', plan: 'Basic', clients: 18, status: 'active', createdAt: '05/02/2025' },
  { id: '4', name: 'Ana Ferreira', email: 'ana@analisecontabil.com.br', office: 'Análise Contábil', plan: 'PRO', clients: 61, status: 'active', createdAt: '10/02/2025' },
  { id: '5', name: 'Roberto Lima', email: 'roberto@contarplus.com.br', office: 'ContarPlus', plan: 'Basic', clients: 9, status: 'inactive', createdAt: '22/02/2025' },
]

const mockActivity = [
  { id: '1', action: 'Novo usuário cadastrado', detail: 'Ana Ferreira — Análise Contábil', time: '2h atrás', type: 'success' },
  { id: '2', action: 'Upgrade de plano', detail: 'João da Silva: Basic → PRO', time: '5h atrás', type: 'info' },
  { id: '3', action: 'Falha no pagamento', detail: 'Roberto Lima — Cartão recusado', time: '1 dia atrás', type: 'error' },
  { id: '4', action: 'Novo usuário cadastrado', detail: 'Carlos Oliveira — Tributária & Co', time: '2 dias atrás', type: 'success' },
  { id: '5', action: 'Relatório exportado', detail: 'Maria Santos — 12 documentos', time: '3 dias atrás', type: 'info' },
]

export default function AdminContent({ user }: { user: User | null }) {
  const totalUsers = mockUsers.length
  const activeUsers = mockUsers.filter((u) => u.status === 'active').length
  const proUsers = mockUsers.filter((u) => u.plan === 'PRO').length
  const totalRevenue = proUsers * 297 + (totalUsers - proUsers) * 97

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-serif text-[#0d0e11]">Administração</h2>
          <span className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs font-semibold px-2 py-0.5 rounded-full">
            Restrito
          </span>
        </div>
        <p className="text-sm text-[#9ca3af]">Visão geral da plataforma TaxShift PRO</p>
      </div>

      {/* KPI cards */}
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
          label="Total Usuários"
          value={totalUsers}
          accentColor="#2563eb"
          subtitle="escritórios cadastrados"
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          label="Usuários Ativos"
          value={activeUsers}
          accentColor="#16a34a"
          subtitle={`${Math.round((activeUsers / totalUsers) * 100)}% do total`}
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
          label="Planos PRO"
          value={proUsers}
          accentColor="#c49a2a"
          subtitle={`${totalUsers - proUsers} no plano Basic`}
        />
        <KPICard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          label="Receita Mensal"
          value={`R$${totalRevenue.toLocaleString('pt-BR')}`}
          accentColor="#16a34a"
          subtitle="MRR estimado"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Users table */}
        <div className="xl:col-span-2 bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0d0e11]">Usuários Cadastrados</h3>
            <span className="text-xs text-[#9ca3af]">{totalUsers} no total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#e5e7eb]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wide hidden sm:table-cell">Escritório</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Plano</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide hidden md:table-cell">Clientes</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {mockUsers.map((u) => {
                  const initials = u.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                  return (
                    <tr key={u.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#0d0e11] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-semibold">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0d0e11]">{u.name}</p>
                            <p className="text-xs text-[#9ca3af]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-[#6b7280]">{u.office}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={u.plan === 'PRO' ? 'gold' : 'default'}>
                          {u.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-sm font-mono text-[#23252c]">{u.clients}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={u.status === 'active' ? 'success' : 'default'} dot>
                          {u.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3f4f6]">
            <h3 className="text-sm font-semibold text-[#0d0e11]">Atividade Recente</h3>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {mockActivity.map((activity) => {
              const dotColors = {
                success: 'bg-[#16a34a]',
                error: 'bg-[#dc2626]',
                info: 'bg-[#2563eb]',
              }
              const dotColor = dotColors[activity.type as keyof typeof dotColors] || 'bg-[#9ca3af]'
              return (
                <div key={activity.id} className="px-5 py-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d0e11]">{activity.action}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">{activity.detail}</p>
                    <p className="text-xs text-[#9ca3af] mt-1">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Admin note */}
      <div className="mt-6 bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 flex items-start gap-3">
        <span className="text-base flex-shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-medium text-[#dc2626]">Área administrativa</p>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Em produção, esta página requer verificação de role de administrador. Configure a verificação de permissões no servidor usando user_metadata.role === &apos;admin&apos; ou uma tabela de perfis no Supabase.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
