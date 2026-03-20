'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EsqueciSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.')
      return
    }

    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (authError) {
      const msg =
        authError.message === 'User not found'
          ? 'Nenhuma conta encontrada com este e-mail.'
          : `Erro ao enviar e-mail: ${authError.message}`
      setError(msg)
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#0d0e11] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z" stroke="#c49a2a" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 7V11M7 9H11" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[#0d0e11] font-semibold text-lg">TaxShift <span className="text-[#c49a2a]">PRO</span></span>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-xl p-7 shadow-sm">
          {!success ? (
            <>
              <div className="w-11 h-11 rounded-xl bg-[#fefce8] border border-[#c49a2a]/30 flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-[#0d0e11] mb-1">Recuperar senha</h2>
              <p className="text-[#6b7280] text-sm mb-6">
                Digite o e-mail da sua conta. Enviaremos um link para redefinir sua senha.
              </p>

              {error && (
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3 mb-4">
                  <p className="text-[#dc2626] text-sm">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail da conta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className="input-field"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0d0e11] text-white rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#23252c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#16a34a]/30 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0d0e11] mb-2">E-mail enviado!</h3>
              <p className="text-[#6b7280] text-sm mb-1">
                Enviamos um link de recuperação para:
              </p>
              <p className="text-[#0d0e11] font-medium text-sm mb-6">{email}</p>
              <p className="text-[#9ca3af] text-xs mb-6">
                Verifique sua caixa de entrada e spam. O link expira em 24 horas.
              </p>
              <button
                onClick={() => { setSuccess(false); setEmail('') }}
                className="text-sm text-[#6b7280] hover:text-[#0d0e11] underline underline-offset-2 transition-colors"
              >
                Reenviar para outro e-mail
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[#6b7280] mt-5">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-[#0d0e11] font-semibold hover:text-[#c49a2a] transition-colors">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
