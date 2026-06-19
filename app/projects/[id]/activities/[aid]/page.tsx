import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ActivityDetail from './ActivityDetail'

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>
}) {
  const { id, aid } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: activity }, { data: quotes }] = await Promise.all([
    sb.from('projects').select('id, name, activity_types').eq('id', id).single(),
    sb.from('activities').select('*').eq('project_id', id).eq('id', aid).single(),
    sb.from('quotes').select('*').eq('activity_id', aid).order('id'),
  ])

  if (!project || !activity) notFound()

  const typeLabel = (project.activity_types ?? []).find((t: { key: string }) => t.key === activity.type_key)?.label ?? activity.type_key

  return (
    <div className="px-6 py-6 max-w-3xl">
      <ActivityDetail
        projectId={id}
        activity={activity}
        typeLabel={typeLabel}
        quotes={quotes ?? []}
      />
    </div>
  )
}
