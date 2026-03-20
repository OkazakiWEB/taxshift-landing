'use client'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

export default function TermosPage() {
  const { modal, closeModal } = useApp()
  const isOpen = modal === 'termos'

  return (
    <ModalOverlay isOpen={isOpen} onClose={closeModal} maxWidth="max-w-2xl">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
            </div>
            <h2 className="text-lg font-semibold text-ink">Termos de Uso</h2>
            <p className="text-xs text-ink4 mt-1">Última atualização: janeiro de 2026</p>
          </div>
          <button onClick={closeModal} className="text-ink4 hover:text-ink transition-colors p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="prose prose-sm max-w-none text-ink3 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">1. Aceitação dos Termos</h3>
            <p className="text-xs leading-relaxed">
              Ao acessar e utilizar a plataforma TaxShift, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">2. Descrição do Serviço</h3>
            <p className="text-xs leading-relaxed">
              O TaxShift é uma plataforma de software como serviço (SaaS) destinada a contadores e escritórios contábeis brasileiros. Oferecemos ferramentas de simulação tributária, análise de impacto da Reforma Tributária (EC 132/2023), e gestão de carteira de clientes. As informações fornecidas têm caráter orientativo e não substituem a consulta a um advogado tributarista.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">3. Cadastro e Conta</h3>
            <p className="text-xs leading-relaxed">
              Para utilizar o TaxShift, você deve criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso. Notifique-nos imediatamente em caso de uso não autorizado de sua conta.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">4. Planos e Pagamentos</h3>
            <p className="text-xs leading-relaxed">
              Oferecemos planos pagos com faturamento mensal ou anual. O período de teste gratuito de 7 dias não requer cartão de crédito. Após o período de teste, o plano é cancelado automaticamente caso nenhum método de pagamento seja fornecido. Não há reembolso proporcional para cancelamentos durante o período vigente.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">5. Propriedade Intelectual</h3>
            <p className="text-xs leading-relaxed">
              Todo o conteúdo, código, algoritmos e marca TaxShift são de propriedade exclusiva da TaxShift Tecnologia Ltda. É proibida a cópia, modificação, distribuição ou engenharia reversa de qualquer parte da plataforma sem autorização prévia e expressa.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">6. Limitação de Responsabilidade</h3>
            <p className="text-xs leading-relaxed">
              O TaxShift fornece estimativas baseadas na legislação vigente, mas não garante a precisão absoluta dos cálculos tributários. As simulações devem ser validadas por profissional habilitado. Não nos responsabilizamos por decisões tomadas com base exclusivamente nos resultados da plataforma.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">7. Vigência e Rescisão</h3>
            <p className="text-xs leading-relaxed">
              Estes termos entram em vigor na data de criação de sua conta e permanecem válidos até o cancelamento. Podemos suspender ou encerrar sua conta em caso de violação destes termos, com aviso prévio de 30 dias salvo em casos de uso malicioso.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">8. Lei Aplicável</h3>
            <p className="text-xs leading-relaxed">
              Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da Comarca de São Paulo, Estado de São Paulo, com renúncia expressa a qualquer outro foro.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">9. Contato</h3>
            <p className="text-xs leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato pelo e-mail legal@taxshift.com.br ou pelo endereço: Av. Paulista, 1000 – Conjunto 101, São Paulo/SP, CEP 01310-100.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-5 border-t border-line">
          <button
            onClick={closeModal}
            className="w-full py-3 rounded-xl text-sm font-medium text-ink border border-line hover:shadow-sm transition-all duration-150"
          >
            Fechar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
