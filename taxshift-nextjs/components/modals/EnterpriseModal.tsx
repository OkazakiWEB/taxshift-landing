'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

export default function EnterpriseModal() {
  const { modal, closeModal, showToast } = useApp()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    officeName: '',
    clientCount: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const isOpen = modal === 'enterprise'

  const update = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      showToast('Proposta enviada! Nossa equipe entrará em contato em breve.', '✓')
    }, 1500)
  }

  const handleClose = () => {
    closeModal()
    setTimeout(() => {
      setSent(false)
      setForm({ name: '', email: '', phone: '', officeName: '', clientCount: '' })
    }, 300)
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
              <span className="text-xs text-ink3 font-sans ml-1">Enterprise</span>
            </div>
            <h2 className="text-lg font-semibold text-ink">Fale com nosso time comercial</h2>
            <p className="text-xs text-ink3 mt-1">Para redes e grupos contábeis com múltiplos escritórios</p>
          </div>
          <button onClick={handleClose} className="text-ink4 hover:text-ink transition-colors p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!sent ? (
          <>
            {/* Enterprise perks */}
            <div
              className="rounded-xl p-4 mb-6 text-sm"
              style={{ backgroundColor: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
            >
              <p className="font-semibold text-ink mb-2">O que está incluso no Enterprise:</p>
              <ul className="space-y-1.5">
                {[
                  'Múltiplas filiais e escritórios em uma conta',
                  'Usuários ilimitados com controle de acesso',
                  'Onboarding e treinamento presencial ou remoto',
                  'SLA de 4h em dias úteis',
                  'Integração ERP personalizada',
                  'Gestor de conta exclusivo',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-ink3">
                    <span className="text-gold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">Seu nome</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="João Silva"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">E-mail corporativo</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="joao@grupo.com.br"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Nome do grupo / rede</label>
                <input
                  type="text"
                  value={form.officeName}
                  onChange={(e) => update('officeName', e.target.value)}
                  placeholder="Grupo Contábil Brasil"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors bg-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Total de clientes na rede</label>
                <select
                  value={form.clientCount}
                  onChange={(e) => update('clientCount', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors bg-bg appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="101-300">101 a 300 clientes</option>
                  <option value="301-500">301 a 500 clientes</option>
                  <option value="501-1000">501 a 1.000 clientes</option>
                  <option value="1000+">Mais de 1.000 clientes</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-ink transition-all duration-150 disabled:opacity-60 hover:opacity-90"
                style={{ backgroundColor: 'var(--gold)' }}
              >
                {loading ? 'Enviando...' : 'Solicitar proposta personalizada →'}
              </button>
            </form>
            <p className="text-center text-xs text-ink4 mt-4">
              Retornamos em até 1 dia útil por e-mail ou WhatsApp.
            </p>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-bg flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Proposta enviada!</h3>
            <p className="text-sm text-ink3 mb-6">
              Nossa equipe comercial entrará em contato em até 1 dia útil no e-mail <strong>{form.email}</strong>.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-ink border border-line hover:shadow-sm transition-all duration-150"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
