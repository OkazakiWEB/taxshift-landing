import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  user_id: string
  name: string
  cnpj: string
  regime: 'SN' | 'LP' | 'LR' | 'MEI'
  sector: string
  revenue: number
  tax_impact: number
  status: 'active' | 'warning' | 'urgent'
  notes: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  type: 'NF-e' | 'SPED' | 'DCTF' | 'ECF'
  period: string
  status: 'emitted' | 'pending' | 'error'
  due_date: string | null
  value: number
  notes: string
  created_at: string
}

export interface Alert {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  type: 'deadline' | 'warning' | 'info'
  title: string
  description: string
  read: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  office_name: string
  cnpj: string
  phone: string
  address: string
  plan: string
  created_at: string
  updated_at: string
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[db] getClients error:', error.message)
      return []
    }
    return (data ?? []) as Client[]
  } catch (err) {
    console.error('[db] getClients unexpected error:', err)
    return []
  }
}

export async function createClient_db(
  data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Client | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: inserted, error } = await supabase
      .from('clients')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[db] createClient error:', error.message)
      return null
    }
    return inserted as Client
  } catch (err) {
    console.error('[db] createClient unexpected error:', err)
    return null
  }
}

export async function updateClient(
  id: string,
  data: Partial<Client>
): Promise<Client | null> {
  try {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('clients')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[db] updateClient error:', error.message)
      return null
    }
    return updated as Client
  } catch (err) {
    console.error('[db] updateClient unexpected error:', err)
    return null
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) {
      console.error('[db] deleteClient error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[db] deleteClient unexpected error:', err)
    return false
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[db] getDocuments error:', error.message)
      return []
    }
    return (data ?? []) as Document[]
  } catch (err) {
    console.error('[db] getDocuments unexpected error:', err)
    return []
  }
}

export async function createDocument(
  data: Omit<Document, 'id' | 'user_id' | 'created_at'>
): Promise<Document | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: inserted, error } = await supabase
      .from('documents')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[db] createDocument error:', error.message)
      return null
    }
    return inserted as Document
  } catch (err) {
    console.error('[db] createDocument unexpected error:', err)
    return null
  }
}

export async function updateDocument(
  id: string,
  data: Partial<Document>
): Promise<Document | null> {
  try {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('documents')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[db] updateDocument error:', error.message)
      return null
    }
    return updated as Document
  } catch (err) {
    console.error('[db] updateDocument unexpected error:', err)
    return null
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) {
      console.error('[db] deleteDocument error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[db] deleteDocument unexpected error:', err)
    return false
  }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<Alert[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[db] getAlerts error:', error.message)
      return []
    }
    return (data ?? []) as Alert[]
  } catch (err) {
    console.error('[db] getAlerts unexpected error:', err)
    return []
  }
}

export async function markAlertRead(id: string): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', id)
    if (error) console.error('[db] markAlertRead error:', error.message)
  } catch (err) {
    console.error('[db] markAlertRead unexpected error:', err)
  }
}

export async function markAllAlertsRead(): Promise<void> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) console.error('[db] markAllAlertsRead error:', error.message)
  } catch (err) {
    console.error('[db] markAllAlertsRead unexpected error:', err)
  }
}

export async function createAlert(
  data: Omit<Alert, 'id' | 'user_id' | 'created_at'>
): Promise<Alert | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: inserted, error } = await supabase
      .from('alerts')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[db] createAlert error:', error.message)
      return null
    }
    return inserted as Alert
  } catch (err) {
    console.error('[db] createAlert unexpected error:', err)
    return null
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[db] getProfile error:', error.message)
      return null
    }
    return data as Profile
  } catch (err) {
    console.error('[db] getProfile unexpected error:', err)
    return null
  }
}

export async function updateProfile(
  data: Partial<Profile>
): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[db] updateProfile error:', error.message)
      return null
    }
    return updated as Profile
  } catch (err) {
    console.error('[db] updateProfile unexpected error:', err)
    return null
  }
}

export async function ensureProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    if (error) console.error('[db] ensureProfile error:', error.message)
  } catch (err) {
    console.error('[db] ensureProfile unexpected error:', err)
  }
}
