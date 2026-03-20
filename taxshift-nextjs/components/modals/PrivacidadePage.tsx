'use client'
import { useApp } from '@/context/AppContext'
import ModalOverlay from './ModalOverlay'

export default function PrivacidadePage() {
  const { modal, closeModal } = useApp()
  const isOpen = modal === 'privacidade'

  return (
    <ModalOverlay isOpen={isOpen} onClose={closeModal} maxWidth="max-w-2xl">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-serif text-xl text-ink mb-1">
              Tax<span className="text-gold">Shift</span>
            </div>
            <h2 className="text-lg font-semibold text-ink">Política de Privacidade</h2>
            <p className="text-xs text-ink4 mt-1">Última atualização: janeiro de 2026 · LGPD compliant</p>
          </div>
          <button onClick={closeModal} className="text-ink4 hover:text-ink transition-colors p-1" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-ink3">
          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">1. Quem somos</h3>
            <p className="text-xs leading-relaxed">
              TaxShift Tecnologia Ltda, CNPJ 00.000.000/0001-00, com sede em São Paulo/SP, é a controladora dos dados pessoais tratados por esta plataforma, conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">2. Dados que coletamos</h3>
            <p className="text-xs leading-relaxed mb-2">Coletamos as seguintes categorias de dados:</p>
            <ul className="text-xs space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CNPJ do escritório</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span><strong>Dados de clientes:</strong> informações fiscais que você cadastra sobre seus clientes (CNPJ, regime tributário, faturamento)</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span><strong>Dados de uso:</strong> logs de acesso, funcionalidades utilizadas, tempo de sessão</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span><strong>Dados de pagamento:</strong> processados por terceiro certificado PCI DSS (não armazenamos dados de cartão)</span></li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">3. Como usamos seus dados</h3>
            <ul className="text-xs space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span>Prestação dos serviços contratados (base legal: execução de contrato)</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span>Comunicações sobre o produto, atualizações e alertas (base legal: legítimo interesse)</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span>Melhoria da plataforma via análise de uso anonimizado (base legal: legítimo interesse)</span></li>
              <li className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span>Cumprimento de obrigações legais (base legal: obrigação legal)</span></li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">4. Segurança e armazenamento</h3>
            <p className="text-xs leading-relaxed">
              Seus dados são armazenados em servidores na região de São Paulo (AWS sa-east-1), com criptografia AES-256 em repouso e TLS 1.3 em trânsito. Realizamos backups diários e testes de segurança trimestrais. Nossos sistemas são monitorados 24/7.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">5. Compartilhamento de dados</h3>
            <p className="text-xs leading-relaxed">
              Não vendemos seus dados. Compartilhamos apenas com prestadores de serviço essenciais (processador de pagamentos, serviço de e-mail, infraestrutura cloud), todos sob acordo de processamento de dados conforme a LGPD. Nunca compartilhamos dados de seus clientes com terceiros.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">6. Seus direitos (LGPD, art. 18)</h3>
            <p className="text-xs leading-relaxed mb-2">Você tem direito a:</p>
            <ul className="text-xs space-y-1 ml-4">
              {['Confirmação de tratamento e acesso aos dados', 'Correção de dados incompletos ou inexatos', 'Anonimização, bloqueio ou eliminação de dados desnecessários', 'Portabilidade dos dados para outro fornecedor', 'Eliminação de todos os seus dados (exceto obrigações legais)', 'Revogação do consentimento a qualquer momento'].map((r) => (
                <li key={r} className="flex items-start gap-2"><span className="text-gold shrink-0 mt-0.5">•</span><span>{r}</span></li>
              ))}
            </ul>
            <p className="text-xs mt-2">
              Para exercer seus direitos, envie e-mail para privacidade@taxshift.com.br. Respondemos em até 15 dias.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">7. Cookies</h3>
            <p className="text-xs leading-relaxed">
              Utilizamos cookies estritamente necessários para funcionamento da plataforma e cookies analíticos (Google Analytics) para melhorar a experiência. Você pode desabilitar cookies analíticos nas configurações do seu navegador sem impacto no uso do produto.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">8. Retenção de dados</h3>
            <p className="text-xs leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, excluímos os dados em até 90 dias, exceto os que devemos manter por obrigação legal (5 anos para dados fiscais).
            </p>
          </section>
        </div>

        <div className="mt-6 pt-5 border-t border-line">
          <p className="text-xs text-ink4 mb-4">
            DPO (Encarregado de Proteção de Dados): dpo@taxshift.com.br
          </p>
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
