import { createClient } from '@/lib/supabase/server'
import DocumentosContent from './DocumentosContent'

export default async function DocumentosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <DocumentosContent user={user} />
}
