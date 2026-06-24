import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MeetingListClient from './MeetingListClient'

export default async function MeetingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: meetings }] = await Promise.all([
    sb.from('projects').select('id, name').eq('id', id).single(),
    sb.from('meetings')
      .select('id, week_start, week_end, meeting_type, title, created_at')
      .eq('project_id', id)
      .order('week_start', { ascending: true }),
  ])

  if (!project) notFound()

  return (
    <div className="px-6 pt-5 pb-4 max-w-3xl">
      <MeetingListClient projectId={id} meetings={meetings ?? []} />
    </div>
  )
}
