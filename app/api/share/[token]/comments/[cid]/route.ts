import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// 클라이언트: client 커멘트만 삭제 가능
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; cid: string }> }
) {
  const { token, cid } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id')
    .eq('share_token', token)
    .single()

  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { error } = await sb
    .from('comments')
    .delete()
    .eq('id', cid)
    .eq('project_id', project.id)
    .eq('author_type', 'client')   // 클라이언트 커멘트만 허용

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
