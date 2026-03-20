'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function translateAuthError(error: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos. Verifique seus dados.',
    'Email not confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
    'Too many requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'User not found': 'Usuário não encontrado.',
    'Invalid email': 'E-mail inválido.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Email already registered': 'Este e-mail já está cadastrado.',
    'Network request failed': 'Falha de conexão. Verifique sua internet.',
  }
  return translations[error] || `Erro: ${error}`
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.')
      return
    }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(translateAuthError(authError.message))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(translateAuthError(authError.message))
      setGoogleLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setLoading(true)
    setError('')
    // For demo purposes, just redirect to dashboard
    // In production, would use a demo account
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — dark, hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-shrink-0 bg-[#0d0e11] flex-col justify-between p-10 xl:p-12">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-[#c49a2a] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 7V11M7 9H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">TaxShift <span className="text-[#c49a2a]">PRO</span></span>
          </div>

          <h1 className="font-serif text-white text-3xl xl:text-4xl leading-tight mb-4">
            Bem-vindo de volta ao seu escritório tributário
          </h1>
          <p className="text-[#6b7280] text-base leading-relaxed mb-10">
            Gerencie clientes, simule o impacto da Reforma Tributária e nunca perca um prazo fiscal.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '⚡', text: 'Simule o impacto da Reforma Tributária (IBS/CBS) para cada cliente' },
              { icon: '✅', text: 'Checklist automatizado de obrigações fiscais e prazos' },
              { icon: '📊', text: 'Relatórios em PDF prontos para enviar ao cliente' },
              { icon: '🔔', text: 'Alertas automáticos de vencimentos e mudanças na legislação' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{benefit.icon}</span>
                <p className="text-[#9ca3af] text-sm leading-relaxed">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="mt-10">
          <div className="inline-flex items-center gap-2 bg-[#c49a2a]/10 border border-[#c49a2a]/30 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-[#c49a2a] animate-pulse" />
            <span className="text-[#c49a2a] text-xs font-medium">+340 escritórios já usam o TaxShift PRO</span>
          </div>
          <p className="text-[#6b7280] text-xs mt-4">
            © 2025 TaxShift. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#fafaf8]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#0d0e11] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z" stroke="#c49a2a" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 7V11M7 9H11" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[#0d0e11] font-semibold text-lg">TaxShift <span className="text-[#c49a2a]">PRO</span></span>
          </div>

          <h2 className="text-2xl font-semibold text-[#0d0e11] mb-1">Entrar na sua conta</h2>
          <p className="text-[#6b7280] text-sm mb-7">Acesse seu painel tributário.</p>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5e7eb] rounded-lg py-2.5 px-4 text-sm font-medium text-[#23252c] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-[#9ca3af] border-t-[#0d0e11] rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2C17.64 8.57 17.58 7.96 17.47 7.36H9V10.84H13.84C13.63 11.97 12.99 12.93 12.04 13.56V15.82H14.96C16.66 14.25 17.64 11.93 17.64 9.2Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.47 17.19 14.96 15.82L12.04 13.56C11.23 14.1 10.21 14.42 9 14.42C6.66 14.42 4.68 12.84 3.96 10.71H0.95V13.04C2.44 15.98 5.48 18 9 18Z" fill="#34A853"/>
                <path d="M3.96 10.71C3.78 10.17 3.68 9.59 3.68 9C3.68 8.41 3.78 7.83 3.96 7.29V4.96H0.95C0.34 6.17 0 7.55 0 9C0 10.45 0.34 11.83 0.95 13.04L3.96 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.58C10.32 3.58 11.51 4.05 12.44 4.95L15.02 2.37C13.47 0.9 11.43 0 9 0C5.48 0 2.44 2.02 0.95 4.96L3.96 7.29C4.68 5.16 6.66 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Conectando...' : 'Continuar com Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-xs text-[#9ca3af] font-medium">ou entre com e-mail</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
              <span className="text-[#dc2626] text-sm mt-0.5">⚠️</span>
              <p className="text-[#dc2626] text-sm">{error}</p>
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="input-field"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="input-field pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#0d0e11] cursor-pointer"
                />
                <span className="text-sm text-[#6b7280]">Lembrar de mim</span>
              </label>
              <Link
                href="/esqueci-senha"
                className="text-sm text-[#c49a2a] hover:text-[#b8881f] font-medium transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#0d0e11] text-white rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#23252c] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar →'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-[#6b7280] mt-6">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#0d0e11] font-semibold hover:text-[#c49a2a] transition-colors">
              Criar conta grátis
            </Link>
          </p>

          {/* Demo access */}
          <div className="mt-4 pt-4 border-t border-[#e5e7eb] text-center">
            <button
              onClick={handleDemoAccess}
              className="text-xs text-[#9ca3af] hover:text-[#6b7280] transition-colors underline underline-offset-2"
            >
              Ver demonstração com dados fictícios →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
