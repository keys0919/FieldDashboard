import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import NewActivityForm from './NewActivityForm'

export default async function NewActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const { date } = await searchParams
  const sb = createServerClient()

  const [{ data: project }, { data: participants }] = await Promise.all([
    sb.from('projects').select('id, name, activity_types').eq('id', id).single(),
    sb.from('participants').select('id, name').eq('project_id', id).eq('status', 'active').order('id'),
  ])

  if (!project) notFound()

  return (
    <NewActivityForm
      projectId={id}
      projectName={project.name}
      activityTypes={project.activity_types ?? []}
      participants={participants ?? []}
      defaultDate={date ?? ''}
    />
  )
}
