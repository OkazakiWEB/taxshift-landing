'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

const planLabels: Record<string, string> = {
  free: 'Gratuito',
  basico: 'Básico',
  pro: 'Profissional',
}

export default function CadastroModal() {
  const { modal, selectedPlan, closeModal, switchModal, showToast } = useApp()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    officeName: '',
    cnpj: '',
    clientCount: '',
    source: '',
  })
  const [loading, setLoading] = useState(false)

  const isOpen = modal === 'cadastro'

  const update = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }))

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep(3)
    }, 1400)
  }

  const handleClose = () => {
    closeModal()
    setTimeout(() => {
      setStep(1)
      setForm({ name: '', email: '', officeName: '', cnpj: '', clientCount: '', source: '' })
    }, 300)
  }

  const planLabel = selectedPlan ? planLabels[selectedPlan] : 'Profissional'

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
            </div>
            {step < 3 && (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
                >
                  Plano {planLabel}
                </span>
                <span className="text-xs text-ink4">Passo {step} de 2</span>
              </div>
            )}
          </div>
          <button onClick={handleClose} className="text-ink4 hover:text-ink transition-colors p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        {step < 3 && (
          <div className="flex gap-1.5 mb-7">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-ink' : 'bg-line'}`} />
            ))}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-ink mb-1">Crie sua conta</h2>
            <p className="text-xs text-ink3 mb-6">7 dias grátis. Sem cartão de crédito.</p>

            {/* Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-line text-sm font-medium text-ink hover:bg-bg transition-colors duration-150 mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs text-ink4">ou preencha</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="João da Silva"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">E-mail profissional</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="joao@escritorio.com.br"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-ink hover:bg-ink-2 transition-all duration-150">
                Continuar →
              </button>
            </form>

            <p className="text-center text-xs text-ink3 mt-5">
              Já tem conta?{' '}
              <button onClick={() => switchModal('login')} className="text-ink font-medium hover:underline bg-transparent border-none cursor-pointer">
                Entrar
              </button>
            </p>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-ink mb-1">Sobre seu escritório</h2>
            <p className="text-xs text-ink3 mb-6">Isso nos ajuda a personalizar sua experiência.</p>

            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Nome do escritório</label>
                <input
                  type="text"
                  value={form.officeName}
                  onChange={(e) => update('officeName', e.target.value)}
                  placeholder="Silva & Associados Contabilidade"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">CNPJ do escritório</label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => update('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Quantos clientes você atende?</label>
                <select
                  value={form.clientCount}
                  onChange={(e) => update('clientCount', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors bg-bg appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="1-10">1 a 10 clientes</option>
                  <option value="11-25">11 a 25 clientes</option>
                  <option value="26-50">26 a 50 clientes</option>
                  <option value="51-100">51 a 100 clientes</option>
                  <option value="100+">Mais de 100 clientes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Como nos conheceu?</label>
                <select
                  value={form.source}
                  onChange={(e) => update('source', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors bg-bg appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="google">Google</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indicacao">Indicação</option>
                  <option value="evento">Evento / Webinar</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-ink3 border border-line bg-bg hover:border-ink3 transition-all duration-150"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-ink hover:bg-ink-2 transition-all duration-150 disabled:opacity-60"
                >
                  {loading ? 'Criando conta...' : 'Criar conta grátis →'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-bg flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">Conta criada com sucesso!</h2>
            <p className="text-sm text-ink3 mb-2">
              Bem-vindo, <strong>{form.name || 'contador'}</strong>!
            </p>
            <p className="text-xs text-ink4 mb-8">
              Você tem 7 dias de acesso completo ao plano {planLabel}. Nenhum cartão foi cobrado.
            </p>
            <button
              onClick={() => {
                showToast('Redirecionando para o painel...', '🚀')
                handleClose()
              }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-ink hover:bg-ink-2 transition-all duration-150"
            >
              Acessar meu painel →
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
