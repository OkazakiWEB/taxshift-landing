import { createClient } from '@/lib/supabase/server'
import SimuladorContent from './SimuladorContent'

export const metadata = {
  title: 'Simulador Tributário — TaxShift PRO',
  description: 'Simule o impacto da Reforma Tributária EC 132/2023 para seus clientes',
}

export default async function SimuladorPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <SimuladorContent user={user} />
}
