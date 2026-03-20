import { createClient } from '@/lib/supabase/server'
import ClientesContent from './ClientesContent'

export default async function ClientesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ClientesContent user={user} />
}
