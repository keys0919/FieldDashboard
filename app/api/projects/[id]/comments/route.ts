import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const objectType = searchParams.get('object_type')
  const objectId   = searchParams.get('object_id')

  if (!objectType || !objectId) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const sb = createServerClient()
  const { data } = await sb
    .from('comments')
    .select('id, author_type, content, created_at')
    .eq('project_id', id)
    .eq('object_type', objectType)
    .eq('object_id', objectId)
    .order('created_at')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { object_type, object_id, content } = body

  if (!object_type || !object_id || !content?.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb
    .from('comments')
    .insert({ project_id: id, object_type, object_id, author_type: 'researcher', content: content.trim() })
    .select('id, author_type, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
