import { createClient } from '@/lib/supabase/server'
import PerfilContent from './PerfilContent'

export default async function PerfilPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <PerfilContent user={user} />
}
