import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type Params = { params: Promise<{ id: string; actId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: projectId, actId } = await params
  const sb = createServerClient()

  // activity 존재 확인
  const { data: activity, error: actErr } = await sb
    .from('activities')
    .select('id, content')
    .eq('id', actId)
    .eq('project_id', projectId)
    .single()

  if (actErr || !activity) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  // 파일 파싱
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${projectId}/${actId}/${Date.now()}.${ext}`

  // Supabase Storage 업로드
  const { error: uploadErr } = await sb.storage
    .from('diary-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = sb.storage.from('diary-images').getPublicUrl(path)

  // activity.content.images 배열에 추가
  const prevContent = (activity.content ?? {}) as Record<string, unknown>
  const images = [...((prevContent.images ?? []) as string[]), publicUrl]

  const { error: updateErr } = await sb
    .from('activities')
    .update({ content: { ...prevContent, images } })
    .eq('id', actId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: projectId, actId } = await params
  const sb = createServerClient()
  const { url } = await req.json() as { url: string }

  const { data: activity } = await sb
    .from('activities')
    .select('content')
    .eq('id', actId)
    .eq('project_id', projectId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevContent = (activity.content ?? {}) as Record<string, unknown>
  const images = ((prevContent.images ?? []) as string[]).filter(u => u !== url)

  await sb.from('activities').update({ content: { ...prevContent, images } }).eq('id', actId)

  // Storage에서도 삭제
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/diary-images/`
  const filePath = url.replace(storageBase, '')
  await sb.storage.from('diary-images').remove([filePath])

  return NextResponse.json({ ok: true })
}
