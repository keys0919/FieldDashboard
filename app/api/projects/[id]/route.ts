import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServerClient()
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { name, client, description, start_date, end_date, status, documents,
          screener_schema, activity_types, participant_groups } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: '프로젝트 이름은 필수입니다' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb
    .from('projects')
    .update({
      ...(name !== undefined && { name: name.trim() }),
      ...(client !== undefined && { client: client?.trim() || null }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(start_date !== undefined && { start_date: start_date || null }),
      ...(end_date !== undefined && { end_date: end_date || null }),
      ...(status !== undefined && { status }),
      ...(documents !== undefined && { documents }),
      ...(screener_schema !== undefined && { screener_schema }),
      ...(activity_types !== undefined && { activity_types }),
      ...(participant_groups !== undefined && { participant_groups }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sb = createServerClient()
  const { error } = await sb.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
