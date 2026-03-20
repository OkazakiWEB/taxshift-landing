'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'

interface User {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    office_name?: string
    office_cnpj?: string
    phone?: string
    address?: string
    avatar_url?: string
  }
}

export default function PerfilContent({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()

  const meta = user?.user_metadata || {}
  const displayName = meta.full_name || meta.name || user?.email?.split('@')[0] || 'Usuário'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const [form, setForm] = useState({
    name: displayName,
    officeName: meta.office_name || '',
    cnpj: meta.office_cnpj || '',
    phone: meta.phone || '',
    address: meta.address || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaveSuccess(false)

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.name,
        office_name: form.officeName,
        office_cnpj: form.cnpj,
        phone: form.phone,
        address: form.address,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
    setSavingPassword(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-[#0d0e11]">Meu Perfil</h2>
        <p className="text-sm text-[#9ca3af] mt-0.5">Gerencie suas informações e configurações de conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Avatar + summary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile card */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-[#0d0e11] flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">{initials}</span>
            </div>
            <h3 className="text-base font-semibold text-[#0d0e11] mb-0.5">{displayName}</h3>
            <p className="text-sm text-[#9ca3af] mb-3">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fefce8] border border-[#c49a2a]/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#c49a2a]" />
              <span className="text-xs font-semibold text-[#c49a2a]">Plano PRO</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Resumo da conta</h4>
            <div className="space-y-3">
              {[
                { label: 'Clientes ativos', value: '47' },
                { label: 'Documentos este mês', value: '12' },
                { label: 'Alertas não lidos', value: '5' },
                { label: 'Membro desde', value: 'Jan 2025' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#0d0e11] font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Edit form */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-[#0d0e11]">Informações do Perfil</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {saveSuccess && (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-4 py-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-sm text-[#16a34a] font-medium">Alterações salvas com sucesso!</p>
                </div>
              )}
              {saveError && (
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3">
                  <p className="text-sm text-[#dc2626]">⚠️ {saveError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-field bg-[#f3f4f6] cursor-not-allowed text-[#9ca3af]"
                    readOnly
                  />
                  <p className="text-xs text-[#9ca3af] mt-1">O e-mail não pode ser alterado aqui.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome do escritório</label>
                  <input
                    type="text"
                    value={form.officeName}
                    onChange={(e) => setForm({ ...form, officeName: e.target.value })}
                    placeholder="Silva & Associados"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">CNPJ do escritório</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0001-00"
                    className="input-field"
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Rua, número, cidade - UF"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password section */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-[#0d0e11]">Alterar Senha</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {passwordSuccess && (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-4 py-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-sm text-[#16a34a] font-medium">Senha alterada com sucesso!</p>
                </div>
              )}
              {passwordError && (
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3">
                  <p className="text-sm text-[#dc2626]">⚠️ {passwordError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nova senha</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repita a senha"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-secondary"
                >
                  {savingPassword ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar senha'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div className="bg-white border border-[#fecaca] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#fecaca] bg-[#fef2f2]">
              <h3 className="text-sm font-semibold text-[#dc2626]">Zona de Perigo</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#0d0e11]">Sair da conta</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    Você será redirecionado para a página de login.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#dc2626] text-[#dc2626] rounded-lg text-sm font-medium hover:bg-[#fef2f2] transition-colors disabled:opacity-60 flex-shrink-0"
                >
                  {loggingOut ? (
                    <LoadingSpinner size="sm" color="#dc2626" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  )}
                  Sair da conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
