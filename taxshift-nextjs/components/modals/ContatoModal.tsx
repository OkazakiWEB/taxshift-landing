'use client'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

export default function ContatoModal() {
  const { modal, closeModal, showToast } = useApp()
  const isOpen = modal === 'contato'

  const whatsappMsg = encodeURIComponent(
    'Olá! Vim pelo site do TaxShift e preciso de ajuda. Pode me atender?'
  )

  const options = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      label: 'WhatsApp',
      desc: 'Resposta imediata em dias úteis',
      action: () => window.open(`https://wa.me/5511992175848?text=${whatsappMsg}`, '_blank'),
      color: 'text-[#25D366]',
      bg: 'hover:bg-[#25D366]/5',
      border: 'border-line hover:border-[#25D366]/30',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'E-mail',
      desc: 'contato@taxshift.com.br',
      action: () => {
        window.open('mailto:contato@taxshift.com.br?subject=Contato pelo site TaxShift', '_blank')
        showToast('Abrindo seu cliente de e-mail...', '📧')
      },
      color: 'text-blue',
      bg: 'hover:bg-blue/5',
      border: 'border-line hover:border-blue/30',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Agendar reunião',
      desc: 'Demo personalizada em 30 min',
      action: () => {
        showToast('Abrindo agenda... 📅')
        window.open('https://calendly.com/taxshift', '_blank')
      },
      color: 'text-gold',
      bg: 'hover:bg-gold/5',
      border: 'border-line hover:border-gold/30',
    },
  ]

  return (
    <ModalOverlay isOpen={isOpen} onClose={closeModal}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
            </div>
            <h2 className="text-lg font-semibold text-ink">Fale com a gente</h2>
            <p className="text-xs text-ink3 mt-1">Escolha o canal mais conveniente para você</p>
          </div>
          <button onClick={closeModal} className="text-ink4 hover:text-ink transition-colors p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${opt.bg} ${opt.border}`}
            >
              <div className={`shrink-0 ${opt.color}`}>{opt.icon}</div>
              <div>
                <p className="text-sm font-semibold text-ink">{opt.label}</p>
                <p className="text-xs text-ink4">{opt.desc}</p>
              </div>
              <svg className="w-4 h-4 text-ink4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-ink4 mt-6">
          Horário de atendimento: segunda a sexta, 9h às 18h (horário de Brasília)
        </p>
      </div>
    </ModalOverlay>
  )
}
