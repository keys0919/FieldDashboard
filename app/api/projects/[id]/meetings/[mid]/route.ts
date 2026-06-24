import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const { mid } = await params
  const sb = createServerClient()
  const { data, error } = await sb.from('meetings').select('*').eq('id', mid).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id: project_id, mid } = await params
  const body = await req.json()
  const { new_items, close_items } = body

  const sb = createServerClient()

  // 존재하는 필드만 업데이트 (없는 필드는 기존값 유지)
  const meetingUpdates: Record<string, unknown> = {}
  const scalarFields = [
    'schedule_comment_prev',
    'schedule_comment_curr',
    'minutes',
  ] as const
  for (const field of scalarFields) {
    if (field in body) meetingUpdates[field] = body[field] ?? null
  }

  if (Object.keys(meetingUpdates).length > 0) {
    const { error } = await sb.from('meetings').update(meetingUpdates).eq('id', mid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 신규 아이템 생성
  if (Array.isArray(new_items) && new_items.length > 0) {
    const rows = new_items.map((item: { type: string; text: string }) => ({
      project_id,
      meeting_id: mid,
      type: item.type,
      text: item.text,
      status: item.type === 'decision' ? 'pending' : 'open',
    }))
    const { error } = await sb.from('meeting_items').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 아이템 해소 처리
  if (Array.isArray(close_items) && close_items.length > 0) {
    for (const ci of close_items as { id: string; close_reason?: string }[]) {
      const { data: item } = await sb.from('meeting_items').select('type').eq('id', ci.id).single()
      if (!item) continue
      const closedStatus = item.type === 'decision' ? 'confirmed' : 'resolved'
      const { error } = await sb.from('meeting_items').update({
        status: closedStatus,
        closed_meeting_id: mid,
        close_reason: ci.close_reason ?? null,
      }).eq('id', ci.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data } = await sb.from('meetings').select('*').eq('id', mid).single()
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const { mid } = await params
  const sb = createServerClient()
  const { error } = await sb.from('meetings').delete().eq('id', mid)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
