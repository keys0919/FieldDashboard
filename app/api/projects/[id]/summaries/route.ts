import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params
  const body = await req.json()

  if (!body.date || !body.scope) {
    return NextResponse.json({ error: 'date, scope는 필수입니다' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb
    .from('summaries')
    .upsert({ project_id, ...body }, { onConflict: 'project_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
