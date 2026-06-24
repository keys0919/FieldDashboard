import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// 리서처: 어떤 커멘트든 삭제 가능
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const { id, cid } = await params
  const sb = createServerClient()

  const { error } = await sb
    .from('comments')
    .delete()
    .eq('id', cid)
    .eq('project_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
