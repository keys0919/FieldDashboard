import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id, name, client, description, status, start_date, end_date, screener_schema, activity_types, participant_groups')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return (
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="text-xl font-bold text-on-surface tracking-tight mb-6">프로젝트 편집</h1>
      <EditForm project={project} />
    </div>
  )
}
