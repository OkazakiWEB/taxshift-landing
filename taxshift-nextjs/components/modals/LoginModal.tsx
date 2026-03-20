'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

export default function LoginModal() {
  const { modal, closeModal, switchModal, showToast } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const isOpen = modal === 'login'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showToast('Login realizado com sucesso!', '✓')
      closeModal()
    }, 1200)
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={closeModal}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
            </div>
            <h2 className="text-lg font-semibold text-ink">Entrar na plataforma</h2>
            <p className="text-xs text-ink3 mt-1">Acesse seu painel tributário</p>
          </div>
          <button
            onClick={closeModal}
            className="text-ink4 hover:text-ink transition-colors p-1"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-ink4">ou</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com.br"
              required
              className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors duration-150 bg-bg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink">Senha</label>
              <button type="button" className="text-xs text-gold hover:underline bg-transparent border-none cursor-pointer">
                Esqueci minha senha
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink placeholder:text-ink4 focus:outline-none focus:border-ink transition-colors duration-150 bg-bg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-ink hover:bg-ink-2 transition-all duration-150 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-ink3 mt-5">
          Não tem conta?{' '}
          <button
            onClick={() => switchModal('cadastro')}
            className="text-ink font-medium hover:underline bg-transparent border-none cursor-pointer"
          >
            Criar gratuitamente
          </button>
        </p>
      </div>
    </ModalOverlay>
  )
}
