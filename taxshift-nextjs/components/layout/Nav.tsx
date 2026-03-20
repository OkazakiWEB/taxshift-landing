'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'

export default function Nav() {
  const { openModal } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(250,250,248,0.88)',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="font-serif text-xl font-normal text-ink tracking-tight select-none"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >
          Tax<span className="text-gold">Shift</span>{' '}
          <sup className="text-xs text-ink3 font-sans font-medium tracking-wider">PRO</sup>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-ink3 md:flex" style={{ ['@media (max-width: 900px)' as string]: { display: 'none' } }}>
          <button
            onClick={() => scrollTo('como-funciona')}
            className="hover:text-ink transition-colors duration-150 cursor-pointer bg-transparent border-none"
          >
            Como funciona
          </button>
          <button
            onClick={() => scrollTo('planos')}
            className="hover:text-ink transition-colors duration-150 cursor-pointer bg-transparent border-none"
          >
            Planos
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="hover:text-ink transition-colors duration-150 cursor-pointer bg-transparent border-none"
          >
            FAQ
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('login')}
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-ink3 rounded-lg border border-line hover:border-ink3 hover:text-ink transition-all duration-150"
          >
            Entrar
          </button>
          <button
            onClick={() => openModal('cadastro', 'pro')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-ink rounded-lg hover:bg-ink-2 transition-all duration-150 shadow-sm"
          >
            Calcular grátis <span className="ml-1">→</span>
          </button>

          {/* Hamburger */}
          <button
            className="ml-1 flex flex-col gap-1.5 p-1.5 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ borderTop: menuOpen ? '1px solid var(--line)' : 'none', backgroundColor: 'rgba(250,250,248,0.97)' }}
      >
        <div className="px-5 py-4 flex flex-col gap-3">
          <button
            onClick={() => scrollTo('como-funciona')}
            className="text-left text-sm font-medium text-ink3 hover:text-ink py-2 border-b border-line-2 bg-transparent border-x-0 border-t-0"
          >
            Como funciona
          </button>
          <button
            onClick={() => scrollTo('planos')}
            className="text-left text-sm font-medium text-ink3 hover:text-ink py-2 border-b border-line-2 bg-transparent border-x-0 border-t-0"
          >
            Planos
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="text-left text-sm font-medium text-ink3 hover:text-ink py-2 border-b border-line-2 bg-transparent border-x-0 border-t-0"
          >
            FAQ
          </button>
          <button
            onClick={() => { setMenuOpen(false); openModal('login') }}
            className="text-left text-sm font-medium text-ink3 hover:text-ink py-2 bg-transparent border-none"
          >
            Entrar
          </button>
        </div>
      </div>
    </nav>
  )
}
