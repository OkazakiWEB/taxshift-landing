import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import SocialProof from '@/components/sections/SocialProof'
import Problems from '@/components/sections/Problems'
import HowItWorks from '@/components/sections/HowItWorks'
import Testimonials from '@/components/sections/Testimonials'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import CTASection from '@/components/sections/CTASection'
import LoginModal from '@/components/modals/LoginModal'
import CadastroModal from '@/components/modals/CadastroModal'
import EnterpriseModal from '@/components/modals/EnterpriseModal'
import DemoModal from '@/components/modals/DemoModal'
import ContatoModal from '@/components/modals/ContatoModal'
import TermosPage from '@/components/modals/TermosPage'
import PrivacidadePage from '@/components/modals/PrivacidadePage'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <Problems />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />

      {/* Modals */}
      <LoginModal />
      <CadastroModal />
      <EnterpriseModal />
      <DemoModal />
      <ContatoModal />
      <TermosPage />
      <PrivacidadePage />
    </>
  )
}
