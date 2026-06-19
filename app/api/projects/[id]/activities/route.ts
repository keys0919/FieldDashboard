import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const month = req.nextUrl.searchParams.get('month') // YYYY-MM
  const sb = createServerClient()

  let query = sb.from('activities').select('*').eq('project_id', id).order('date').order('start_time')

  if (month) {
    const [year, mon] = month.split('-')
    const from = `${year}-${mon}-01`
    const lastDay = new Date(Number(year), Number(mon), 0).getDate()
    const to = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', from).lte('date', to)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params
  const body = await req.json()
  const { participant_id, type_key, title, date, start_time, end_time, status, diary_day } = body

  if (!participant_id || !type_key || !title || !date) {
    return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb
    .from('activities')
    .insert({
      project_id, participant_id, type_key, title, date,
      start_time: start_time || null,
      end_time: end_time || null,
      status: status || 'scheduled',
      diary_day: diary_day ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
