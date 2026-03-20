'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function translateAuthError(error: string): string {
  const translations: Record<string, string> = {
    'User already registered': 'Este e-mail já está cadastrado. Tente entrar na sua conta.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Invalid email': 'E-mail inválido.',
    'Signup requires a valid password': 'Informe uma senha válida.',
    'Network request failed': 'Falha de conexão. Verifique sua internet.',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde e tente novamente.',
  }
  return translations[error] || `Erro: ${error}`
}

interface Step1Data {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface Step2Data {
  officeName: string
  cnpj: string
  clientCount: string
  howFound: string
}

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [step1, setStep1] = useState<Step1Data>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [step2, setStep2] = useState<Step2Data>({
    officeName: '',
    cnpj: '',
    clientCount: '',
    howFound: '',
  })

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!step1.name.trim()) {
      setError('Por favor, informe seu nome completo.')
      return
    }
    if (!step1.email.trim()) {
      setError('Por favor, informe seu e-mail.')
      return
    }
    if (step1.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (step1.password !== step1.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: step1.email,
      password: step1.password,
      options: {
        data: {
          full_name: step1.name,
        },
      },
    })

    if (authError) {
      setError(translateAuthError(authError.message))
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(2)
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!step2.officeName.trim()) {
      setError('Por favor, informe o nome do seu escritório.')
      return
    }

    setLoading(true)

    // Update user metadata with office info
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        office_name: step2.officeName,
        office_cnpj: step2.cnpj,
        client_count: step2.clientCount,
        how_found: step2.howFound,
      },
    })

    if (updateError) {
      setError(translateAuthError(updateError.message))
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(3)
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
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
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

        {/* Progress indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    s <= step
                      ? 'bg-[#0d0e11] text-white'
                      : 'bg-[#e5e7eb] text-[#9ca3af]'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 2 && (
                  <div className={`w-12 h-px transition-colors ${s < step ? 'bg-[#0d0e11]' : 'bg-[#e5e7eb]'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-[#e5e7eb] rounded-xl p-7 shadow-sm">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-[#0d0e11] mb-1">Criar sua conta</h2>
              <p className="text-[#6b7280] text-sm mb-6">Passo 1 de 2 — Dados de acesso</p>

              {error && (
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3 mb-4">
                  <p className="text-[#dc2626] text-sm">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    type="text"
                    value={step1.name}
                    onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                    placeholder="João da Silva"
                    className="input-field"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="label">E-mail profissional</label>
                  <input
                    type="email"
                    value={step1.email}
                    onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                    placeholder="joao@escritorio.com.br"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={step1.password}
                      onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
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

                <div>
                  <label className="label">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={step1.confirmPassword}
                      onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                      placeholder="Repita a senha"
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0d0e11] text-white rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#23252c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta →'
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-[#0d0e11] mb-1">Sobre seu escritório</h2>
              <p className="text-[#6b7280] text-sm mb-6">Passo 2 de 2 — Configurações iniciais</p>

              {error && (
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg px-4 py-3 mb-4">
                  <p className="text-[#dc2626] text-sm">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <label className="label">Nome do escritório *</label>
                  <input
                    type="text"
                    value={step2.officeName}
                    onChange={(e) => setStep2({ ...step2, officeName: e.target.value })}
                    placeholder="Silva & Associados Contabilidade"
                    className="input-field"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="label">CNPJ do escritório</label>
                  <input
                    type="text"
                    value={step2.cnpj}
                    onChange={(e) => setStep2({ ...step2, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0001-00"
                    className="input-field"
                    maxLength={18}
                  />
                </div>

                <div>
                  <label className="label">Quantos clientes você atende?</label>
                  <select
                    value={step2.clientCount}
                    onChange={(e) => setStep2({ ...step2, clientCount: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    <option value="1-10">1 a 10 clientes</option>
                    <option value="11-30">11 a 30 clientes</option>
                    <option value="31-100">31 a 100 clientes</option>
                    <option value="101-300">101 a 300 clientes</option>
                    <option value="300+">Mais de 300 clientes</option>
                  </select>
                </div>

                <div>
                  <label className="label">Como conheceu o TaxShift?</label>
                  <select
                    value={step2.howFound}
                    onChange={(e) => setStep2({ ...step2, howFound: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    <option value="google">Busca no Google</option>
                    <option value="instagram">Instagram / Redes Sociais</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indicacao">Indicação de colega</option>
                    <option value="cfc">CFC / Evento contábil</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white border border-[#e5e7eb] text-[#23252c] rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#f3f4f6] transition-colors"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0d0e11] text-white rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#23252c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Concluir →'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-[#0d0e11] mb-2">Conta criada com sucesso!</h2>
              <p className="text-[#6b7280] text-sm mb-2">
                Bem-vindo ao TaxShift PRO! Seu escritório contábil agora tem uma central tributária inteligente.
              </p>
              <p className="text-[#9ca3af] text-xs mb-8">
                Verifique seu e-mail para confirmar a conta antes de entrar.
              </p>

              <div className="bg-[#fefce8] border border-[#c49a2a]/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-[#c49a2a] mb-2">O que você pode fazer agora:</p>
                <ul className="space-y-1">
                  {[
                    'Cadastrar seus primeiros clientes',
                    'Simular o impacto da Reforma Tributária',
                    'Configurar alertas de vencimentos',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-[#6b7280] flex items-center gap-2">
                      <span className="text-[#c49a2a]">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-[#0d0e11] text-white rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-[#23252c] transition-colors"
              >
                Acessar o TaxShift PRO →
              </button>
            </div>
          )}
        </div>

        {step < 3 && (
          <p className="text-center text-sm text-[#6b7280] mt-5">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#0d0e11] font-semibold hover:text-[#c49a2a] transition-colors">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
