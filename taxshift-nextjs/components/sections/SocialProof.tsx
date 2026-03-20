export default function SocialProof() {
  const segments = [
    'Comércio',
    'Serviços',
    'Construção',
    'Saúde',
    'Tecnologia',
    'Agronegócio',
  ]

  return (
    <section className="py-10 border-y border-line bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <p className="text-center text-xs font-medium text-ink4 uppercase tracking-widest mb-8">
          Escritórios que já saíram na frente da Reforma
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {segments.map((seg) => (
            <span
              key={seg}
              className="font-serif text-xl text-ink opacity-40 hover:opacity-70 transition-opacity duration-200 cursor-default select-none"
            >
              {seg}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
