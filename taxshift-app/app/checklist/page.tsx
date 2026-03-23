import { createClient } from '@/lib/supabase/server'
import ChecklistContent from './ChecklistContent'

export default async function ChecklistPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ChecklistContent user={user} />
}
