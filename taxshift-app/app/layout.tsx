import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaxShift PRO — CRM Tributário',
  description: 'CRM inteligente para gestão tributária e impacto da Reforma Tributária brasileira',
  keywords: ['reforma tributária', 'IBS', 'CBS', 'contabilidade', 'CRM tributário'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
