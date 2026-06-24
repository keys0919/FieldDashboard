import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()
  const { data, error } = await sb
    .from('meetings')
    .select('*')
    .eq('project_id', id)
    .order('week_start', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params
  const body = await req.json()
  const { meeting_type = 'regular', title, week_start, week_end, meeting_date } = body

  const sb = createServerClient()

  if (meeting_type === 'ad_hoc') {
    if (!title?.trim()) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 })
    }
    const date = meeting_date ?? new Date().toISOString().split('T')[0]
    const { data, error } = await sb
      .from('meetings')
      .insert({ project_id, meeting_type: 'ad_hoc', title: title.trim(), week_start: date, week_end: date })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  if (!week_start || !week_end) {
    return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
  }
  const { data, error } = await sb
    .from('meetings')
    .insert({ project_id, meeting_type: 'regular', week_start, week_end })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '해당 주차 회의가 이미 존재합니다' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
