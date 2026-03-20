'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'

const faqs = [
  {
    q: 'O TaxShift já está atualizado com a EC 132/2023?',
    a: 'Sim. Nossa equipe tributária acompanha todas as regulamentações da Reforma Tributária em tempo real. Assim que sai nova instrução normativa ou decreto, atualizamos os modelos de cálculo automaticamente.',
  },
  {
    q: 'Preciso ter conhecimento técnico para usar?',
    a: 'Não. O TaxShift foi desenvolvido especificamente para contadores. A interface é intuitiva e os relatórios são gerados automaticamente. Se você sabe usar uma planilha, vai aprender em menos de 30 minutos.',
  },
  {
    q: 'Como funciona o período de teste de 7 dias?',
    a: 'Você cria sua conta gratuitamente, sem precisar colocar cartão de crédito. Durante 7 dias, tem acesso completo ao plano Profissional. Após esse período, escolhe qual plano continuar ou cancela sem custo.',
  },
  {
    q: 'Posso importar meus clientes de uma planilha?',
    a: 'Sim. Aceitamos importação via CSV e Excel. Também temos integração nativa com os principais sistemas contábeis do mercado brasileiro.',
  },
  {
    q: 'Os dados dos meus clientes estão seguros?',
    a: 'Absolutamente. Utilizamos criptografia AES-256, servidores no Brasil (AWS São Paulo), e somos 100% conformes com a LGPD. Seus dados nunca são compartilhados com terceiros.',
  },
  {
    q: 'E se a lei mudar novamente antes de 2027?',
    a: 'Essa é exatamente nossa proposta de valor. Toda vez que sair nova regulamentação, atualizamos os modelos automaticamente e você recebe notificação imediata sobre quais clientes são impactados.',
  },
]

export default function FAQ() {
  const { openModal } = useApp()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">FAQ</p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-5">
              Perguntas
              <br />
              frequentes
            </h2>
            <p className="text-sm text-ink3 leading-relaxed mb-8">
              Não encontrou o que procurava? Fale diretamente com nosso time.
            </p>
            <button
              onClick={() => openModal('contato')}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-ink border border-line bg-bg hover:shadow-sm transition-all duration-150"
            >
              Falar com suporte →
            </button>
          </div>

          {/* Right */}
          <div className="lg:col-span-3 space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-line rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent hover:bg-bg transition-colors duration-150"
                >
                  <span className="text-sm font-medium text-ink pr-4">{faq.q}</span>
                  <span
                    className={`text-ink3 transition-transform duration-200 shrink-0 ${
                      open === i ? 'rotate-180' : ''
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    open === i ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <p className="px-5 pb-4 text-sm text-ink3 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
