const testimonials = [
  {
    stars: 5,
    quote:
      'Antes levava 2 dias para fazer análise de impacto tributário nos meus 80 clientes. Com TaxShift, faço em menos de 1 hora. O relatório que gero é algo que meu cliente nunca viu antes.',
    name: 'Ricardo Mendes',
    role: 'Sócio — RMC Assessoria Tributária',
    initials: 'RM',
    color: 'bg-blue',
  },
  {
    stars: 5,
    quote:
      'Já perdemos dois clientes grandes para concorrentes que chegaram com análise pronta da Reforma. Depois que implantamos o TaxShift, viramos referência no assunto na nossa cidade.',
    name: 'Ana Beatriz Lopes',
    role: 'Sócia — Lopes & Carvalho Contabilidade',
    initials: 'AL',
    color: 'bg-gold',
  },
  {
    stars: 5,
    quote:
      'Sou contador autônomo com 35 clientes. Não tenho equipe. O TaxShift me dá superpoder — consigo entregar análise de Reforma tributária igual (ou melhor) que os grandes escritórios.',
    name: 'Thiago Ramos',
    role: 'Contador Autônomo — Curitiba',
    initials: 'TR',
    color: 'bg-green',
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">Depoimentos</p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
            Quem já usa TaxShift não volta mais
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col p-6 rounded-2xl border border-line bg-bg hover:shadow-md transition-shadow duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-ink3 leading-relaxed flex-1 mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink4">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
