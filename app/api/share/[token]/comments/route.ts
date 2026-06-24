import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

async function resolveProjectId(sb: ReturnType<typeof createServerClient>, token: string) {
  const { data } = await sb.from('projects').select('id').eq('share_token', token).single()
  return data?.id ?? null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { searchParams } = new URL(req.url)
  const objectType = searchParams.get('object_type')
  const objectId   = searchParams.get('object_id')

  if (!objectType || !objectId) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const sb = createServerClient()
  const projectId = await resolveProjectId(sb, token)
  if (!projectId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data } = await sb
    .from('comments')
    .select('id, author_type, content, created_at')
    .eq('project_id', projectId)
    .eq('object_type', objectType)
    .eq('object_id', objectId)
    .order('created_at')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const { object_type, object_id, content } = body

  if (!object_type || !object_id || !content?.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const sb = createServerClient()
  const projectId = await resolveProjectId(sb, token)
  if (!projectId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data, error } = await sb
    .from('comments')
    .insert({ project_id: projectId, object_type, object_id, author_type: 'client', content: content.trim() })
    .select('id, author_type, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
