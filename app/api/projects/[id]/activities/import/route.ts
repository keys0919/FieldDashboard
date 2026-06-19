import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params
  const body = await req.json()
  const { activity: actData, quotes = [] } = body

  if (!actData?.participant_id || !actData?.type_key || !actData?.date) {
    return NextResponse.json({ error: 'activity.participant_id, type_key, date는 필수입니다' }, { status: 400 })
  }

  const sb = createServerClient()

  // 기존 activity 탐색: participant + type_key + date (+ diary_day)
  let query = sb
    .from('activities')
    .select('id, participant_id')
    .eq('project_id', project_id)
    .eq('participant_id', actData.participant_id)
    .eq('type_key', actData.type_key)
    .eq('date', actData.date)

  if (actData.diary_day != null) {
    query = query.eq('diary_day', actData.diary_day)
  }

  const { data: existing } = await query.maybeSingle()

  const patch = {
    status:     actData.status     ?? undefined,
    content:    actData.content    ?? undefined,
    start_time: actData.start_time ?? undefined,
    end_time:   actData.end_time   ?? undefined,
    diary_day:  actData.diary_day  ?? undefined,
    notes:      actData.notes      ?? undefined,
  }
  // undefined 키 제거
  Object.keys(patch).forEach(k => patch[k as keyof typeof patch] === undefined && delete patch[k as keyof typeof patch])

  let activityId: string

  if (existing) {
    const { data, error } = await sb
      .from('activities')
      .update(patch)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    activityId = data.id
  } else {
    const title = actData.title
      ?? `${actData.participant_id} · ${actData.type_key}${actData.diary_day != null ? ` D${actData.diary_day}` : ''}`
    const { data, error } = await sb
      .from('activities')
      .insert({
        project_id,
        participant_id: actData.participant_id,
        type_key:       actData.type_key,
        date:           actData.date,
        title,
        ...patch,
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    activityId = data.id
  }

  // quotes upsert
  let savedQuotes: unknown[] = []
  if (Array.isArray(quotes) && quotes.length > 0) {
    const rows = quotes.map((q: { id: string; text: string; context?: string; tags?: string[] }) => ({
      id:           q.id,
      project_id,
      activity_id:  activityId,
      participant_id: actData.participant_id,
      text:         q.text,
      context:      q.context ?? null,
      tags:         q.tags    ?? [],
    }))
    const { data, error } = await sb
      .from('quotes')
      .upsert(rows, { onConflict: 'project_id,id' })
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    savedQuotes = data ?? []
  }

  return NextResponse.json({ activityId, quotes: savedQuotes }, { status: 200 })
}
