import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('projects')
    .select('id, name, client, start_date, end_date, status, share_token, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, client, description, start_date, end_date, participant_groups, activity_types, screener_schema } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: '프로젝트 이름은 필수입니다' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb
    .from('projects')
    .insert({
      name: name.trim(),
      client: client?.trim() || null,
      description: description?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
      participant_groups: participant_groups ?? [],
      activity_types: activity_types ?? [],
      screener_schema: screener_schema ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
