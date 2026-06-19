import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import NewParticipantForm from './NewParticipantForm'
import { ScreenerQuestion } from '@/types'

export default async function NewParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()
  const { data: project } = await sb
    .from('projects')
    .select('id, name, participant_groups, screener_schema')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return (
    <NewParticipantForm
      projectId={id}
      projectName={project.name}
      groups={project.participant_groups ?? []}
      screenerSchema={(project.screener_schema ?? []) as ScreenerQuestion[]}
    />
  )
}
