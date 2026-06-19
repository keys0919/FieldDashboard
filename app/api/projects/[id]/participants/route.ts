import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()
  const { data, error } = await sb
    .from('participants')
    .select('*')
    .eq('project_id', id)
    .order('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params
  const body = await req.json()
  const { id, name, age, gender, group, screener_answers } = body

  if (!id?.trim()) return NextResponse.json({ error: '참여자 ID는 필수입니다 (예: P01)' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: '이름은 필수입니다' }, { status: 400 })

  const sb = createServerClient()
  const { data, error } = await sb
    .from('participants')
    .insert({
      id: id.trim().toUpperCase(),
      project_id,
      name: name.trim(),
      age: age ? Number(age) : null,
      gender: gender?.trim() || null,
      group: group?.trim() || null,
      screener_answers: screener_answers ?? {},
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `${id} 는 이미 존재합니다` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
