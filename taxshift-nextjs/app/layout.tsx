import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import Toast from '@/components/ui/Toast'
import WhatsAppButton from '@/components/ui/WhatsAppButton'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TaxShift — Sua empresa vai pagar mais imposto em 2027. Quanto mais, depende de você.',
  description:
    'Plataforma de planejamento tributário para escritórios contábeis. Simule o impacto da Reforma Tributária (EC 132/2023) em toda sua carteira de clientes em minutos.',
  keywords: [
    'reforma tributária',
    'EC 132/2023',
    'planejamento tributário',
    'contabilidade',
    'CBS',
    'IBS',
    'lucro presumido',
    'simples nacional',
    'software contábil',
    'TaxShift',
  ],
  authors: [{ name: 'TaxShift' }],
  creator: 'TaxShift Tecnologia Ltda',
  openGraph: {
    title: 'TaxShift — Sua empresa vai pagar mais imposto em 2027',
    description:
      'Simule o impacto da Reforma Tributária em toda sua carteira de clientes. 7 dias grátis, sem cartão de crédito.',
    url: 'https://taxshift.com.br',
    siteName: 'TaxShift',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://taxshift.com.br/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxShift — Planejamento tributário inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxShift — Planejamento tributário para a Reforma de 2027',
    description:
      'Simule o impacto da EC 132/2023 em toda sua carteira. Software para contadores brasileiros.',
    images: ['https://taxshift.com.br/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSerif.variable}`}
    >
      <body className="font-sans antialiased bg-bg text-ink">
        <AppProvider>
          {children}
          <Toast />
          <WhatsAppButton />
        </AppProvider>
      </body>
    </html>
  )
}
