import { createClient } from '@/lib/supabase/server'
import AlertasContent from './AlertasContent'

export default async function AlertasPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <AlertasContent user={user} />
}
