import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuotesClient from './QuotesClient'

export default async function QuotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: quotesRaw }, { data: activities }, { data: participants }] = await Promise.all([
    sb.from('projects').select('id, activity_types').eq('id', id).single(),
    sb.from('quotes').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    sb.from('activities').select('id, type_key, date').eq('project_id', id),
    sb.from('participants').select('id, name').eq('project_id', id),
  ])

  if (!project) notFound()

  const activityMap: Record<string, { type_key: string; date: string }> = {}
  for (const a of activities ?? []) activityMap[a.id] = a

  const participantMap: Record<string, string> = {}
  for (const p of participants ?? []) participantMap[p.id] = p.name

  const typeLabels: Record<string, string> = {}
  for (const t of (project.activity_types as { key: string; label: string }[] ?? [])) {
    typeLabels[t.key] = t.label
  }

  const quotes = (quotesRaw ?? []).map(q => ({
    id: q.id as string,
    participant_id: q.participant_id as string,
    text: q.text as string,
    context: q.context as string | null,
    tags: (q.tags as string[]) ?? [],
    activity_date: activityMap[q.activity_id]?.date ?? '',
    activity_type: activityMap[q.activity_id]?.type_key ?? '',
  }))

  const tagCounts: Record<string, number> = {}
  for (const q of quotes) {
    for (const tag of q.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const tagCloud = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))

  return (
    <div className="px-6 pt-5 pb-12">
      <QuotesClient
        quotes={quotes}
        tagCloud={tagCloud}
        participantMap={participantMap}
        typeLabels={typeLabels}
      />
    </div>
  )
}
