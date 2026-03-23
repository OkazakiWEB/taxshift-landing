import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Parse body
    const body = await request.json().catch(() => ({}))
    const { client_id } = body as { client_id?: string }

    if (!client_id) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 })
    }

    // Verify client belongs to user
    const { data: clientRow, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !clientRow) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Check if items already exist for this client/user
    const { data: existing } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Checklist já inicializado para este cliente' }, { status: 409 })
    }

    // Fetch all templates
    const { data: templates, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('sort_order', { ascending: true })

    if (templateError || !templates || templates.length === 0) {
      return NextResponse.json({ error: 'Nenhum template encontrado' }, { status: 500 })
    }

    // Build checklist items from templates
    const checklistItems = templates.map((template) => ({
      user_id: user.id,
      client_id,
      template_id: template.id,
      category: template.category,
      title: template.title,
      description: template.description ?? '',
      priority: template.priority ?? 'medium',
      status: 'pending',
      phase: template.phase ?? null,
      due_date: null,
      notes: '',
      completed_at: null,
    }))

    // Insert all items
    const { data: inserted, error: insertError } = await supabase
      .from('checklist_items')
      .insert(checklistItems)
      .select('id')

    if (insertError) {
      console.error('[api/checklist/initialize] insert error:', insertError.message)
      return NextResponse.json({ error: 'Erro ao criar tarefas: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        count: inserted?.length ?? checklistItems.length,
        client_name: clientRow.name,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[api/checklist/initialize] unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
