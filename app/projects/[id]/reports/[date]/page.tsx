import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DayReport from './DayReport'

export default async function DayReportPage({ params }: { params: Promise<{ id: string; date: string }> }) {
  const { id, date } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: activities }, { data: summary }, { data: findings }] = await Promise.all([
    sb.from('projects').select('id, name, client, activity_types').eq('id', id).single(),
    sb.from('activities').select('*').eq('project_id', id).eq('date', date).order('participant_id'),
    sb.from('summaries').select('*').eq('project_id', id).eq('date', date).maybeSingle(),
    sb.from('findings').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ])

  if (!project) notFound()

  const activityIds = (activities ?? []).map(a => a.id)
  const participantIds = [...new Set((activities ?? []).map(a => a.participant_id))]

  const [{ data: quotes }, { data: participants }] = await Promise.all([
    activityIds.length
      ? sb.from('quotes').select('*').in('activity_id', activityIds).order('id')
      : Promise.resolve({ data: [] }),
    participantIds.length
      ? sb.from('participants').select('id, name, age, gender, group').in('id', participantIds)
      : Promise.resolve({ data: [] }),
  ])

  type QuoteRow = NonNullable<typeof quotes>[number]
  const quotesByActivity: Record<string, QuoteRow[]> = {}
  for (const q of quotes ?? []) {
    if (!quotesByActivity[q.activity_id]) quotesByActivity[q.activity_id] = []
    quotesByActivity[q.activity_id]!.push(q)
  }

  type ParticipantRow = { id: string; name: string; age: number | null; gender: string | null; group: string | null }
  const participantMap: Record<string, ParticipantRow> = {}
  for (const p of (participants ?? []) as ParticipantRow[]) participantMap[p.id] = p

  const typeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) typeLabels[t.key] = t.label

  return (
    <div className="px-6 py-6 print:px-0 print:py-0 max-w-3xl">
      <div className="mb-6 print:hidden">
        <Link href={`/projects/${id}/reports`} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          리포트 목록
        </Link>
      </div>
      <DayReport
        projectId={id}
        projectName={project.name}
        projectClient={project.client ?? null}
        date={date}
        activities={activities ?? []}
        quotesByActivity={quotesByActivity}
        participantMap={participantMap}
        summary={summary}
        findings={findings ?? []}
        typeLabels={typeLabels}
      />
    </div>
  )
}
