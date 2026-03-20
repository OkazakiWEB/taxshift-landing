import { createClient } from '@/lib/supabase/server'
import AdminContent from './AdminContent'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // NOTE: In production, add admin role check here.
  // e.g., check user.user_metadata.role === 'admin'

  return <AdminContent user={user} />
}
