import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; actId: string }> }) {
  const { id: project_id, actId: activity_id } = await params
  const { quotes } = await req.json()

  if (!Array.isArray(quotes) || quotes.length === 0) {
    return NextResponse.json({ error: 'quotes 배열이 필요합니다' }, { status: 400 })
  }

  const sb = createServerClient()

  const { data: activity } = await sb
    .from('activities')
    .select('participant_id')
    .eq('id', activity_id)
    .single()

  if (!activity) return NextResponse.json({ error: 'Activity를 찾을 수 없습니다' }, { status: 404 })

  const rows = quotes.map((q: { id: string; text: string; context?: string; tags?: string[] }) => ({
    id: q.id,
    project_id,
    activity_id,
    participant_id: activity.participant_id,
    text: q.text,
    context: q.context ?? null,
    tags: q.tags ?? [],
  }))

  const { data, error } = await sb
    .from('quotes')
    .upsert(rows, { onConflict: 'project_id,id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
