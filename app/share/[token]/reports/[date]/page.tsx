import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DayReport from '@/app/projects/[id]/reports/[date]/DayReport'

export default async function ShareDayReportPage({
  params,
}: {
  params: Promise<{ token: string; date: string }>
}) {
  const { token, date } = await params
  const sb = createServerClient()

  const { data: project } = await sb.from('projects').select('id, name, client, activity_types').eq('share_token', token).single()
  if (!project) notFound()

  const id = project.id

  const [{ data: activities }, { data: summary }, { data: findings }] = await Promise.all([
    sb.from('activities').select('*').eq('project_id', id).eq('date', date).order('participant_id'),
    sb.from('summaries').select('*').eq('project_id', id).eq('date', date).maybeSingle(),
    sb.from('findings').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ])

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
    <div className="px-6 py-6 max-w-3xl">
      <div className="mb-6">
        <Link href={`/share/${token}/reports`} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
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
        isClientView={true}
      />
    </div>
  )
}
