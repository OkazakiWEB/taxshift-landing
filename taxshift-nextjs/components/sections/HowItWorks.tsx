const steps = [
  {
    num: '01',
    title: 'Cadastre seu escritório',
    desc: 'Importe sua carteira de clientes via planilha ou adicione manualmente. Leva menos de 5 minutos.',
  },
  {
    num: '02',
    title: 'Simule o impacto',
    desc: 'Nossa IA analisa cada CNPJ e calcula automaticamente o impacto da CBS e IBS por regime tributário.',
  },
  {
    num: '03',
    title: 'Tome decisões',
    desc: 'Veja qual regime será mais vantajoso pós-2027 para cada cliente, com comparativo lado a lado.',
  },
  {
    num: '04',
    title: 'Monitore continuamente',
    desc: 'Receba alertas quando sair nova regulamentação e quando algum cliente mudar de faixa de risco.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-20 px-5"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
            Como funciona
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
            De zero a diagnóstico completo
            <br />
            em menos de 10 minutos
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-6 left-full w-4 -translate-x-2 text-white/20 text-lg"
                  aria-hidden="true"
                >
                  →
                </div>
              )}

              {/* Number */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold font-mono mb-4 shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--gold)' }}
              >
                {step.num}
              </div>

              <h3 className="font-semibold text-white text-sm mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
