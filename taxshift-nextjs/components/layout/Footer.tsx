'use client'
import { useApp } from '@/context/AppContext'

export default function Footer() {
  const { openModal, showToast } = useApp()

  return (
    <footer className="border-t border-line bg-bg">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Logo */}
          <div>
            <div className="font-serif text-xl font-normal text-ink tracking-tight">
              Tax<span className="text-gold">Shift</span>{' '}
              <span className="text-xs text-ink3 font-sans font-medium tracking-wider">PRO</span>
            </div>
            <p className="mt-2 text-xs text-ink4 max-w-xs">
              Planejamento tributário inteligente para escritórios contábeis na era da Reforma.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-ink3">
            <button
              onClick={() => openModal('termos')}
              className="hover:text-ink transition-colors duration-150 bg-transparent border-none cursor-pointer"
            >
              Termos de Uso
            </button>
            <button
              onClick={() => openModal('privacidade')}
              className="hover:text-ink transition-colors duration-150 bg-transparent border-none cursor-pointer"
            >
              Privacidade
            </button>
            <button
              onClick={() => openModal('contato')}
              className="hover:text-ink transition-colors duration-150 bg-transparent border-none cursor-pointer"
            >
              Contato
            </button>
            <button
              onClick={() => showToast('Blog em breve! 🚀')}
              className="hover:text-ink transition-colors duration-150 bg-transparent border-none cursor-pointer"
            >
              Blog
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-line-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink4">
            © 2026 TaxShift. Todos os direitos reservados.
          </p>
          <p className="text-xs text-ink4">
            EC 132/2023 · Reforma Tributária Brasileira
          </p>
        </div>
      </div>
    </footer>
  )
}
