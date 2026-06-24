import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MeetingDetail from './MeetingDetail'

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>
}) {
  const { id, mid } = await params
  const sb = createServerClient()

  const { data: meeting } = await sb.from('meetings').select('*').eq('id', mid).single()
  if (!meeting) notFound()

  const prevStart = new Date(meeting.week_start)
  prevStart.setDate(prevStart.getDate() - 7)
  const prevEnd = new Date(meeting.week_start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const toISO = (d: Date) => d.toISOString().split('T')[0]

  const [
    { data: allMeetings },
    { data: project },
    { data: prevActivities },
    { data: currActivities },
    { data: participants },
    { data: items },
  ] = await Promise.all([
    sb.from('meetings').select('id, week_start, meeting_type').eq('project_id', id).order('week_start'),
    sb.from('projects').select('activity_types').eq('id', id).single(),
    sb.from('activities')
      .select('id, participant_id, type_key, status')
      .eq('project_id', id)
      .gte('date', toISO(prevStart))
      .lte('date', toISO(prevEnd))
      .order('date').order('start_time'),
    sb.from('activities')
      .select('id, participant_id, type_key, status')
      .eq('project_id', id)
      .gte('date', meeting.week_start)
      .lte('date', meeting.week_end)
      .order('date').order('start_time'),
    sb.from('participants').select('id, name').eq('project_id', id),
    sb.from('meeting_items')
      .select('*')
      .eq('project_id', id)
      .order('created_at'),
  ])

  const meetings = allMeetings ?? []
  const regularMeetings = meetings.filter(m => m.meeting_type === 'regular')
  const seq = regularMeetings.findIndex(m => m.id === mid) + 1

  // regular meeting_id → 차수 매핑
  const seqMap: Record<string, number> = {}
  regularMeetings.forEach((m, i) => { seqMap[m.id] = i + 1 })

  // 이 회의 시점까지 존재하는 정례회의 항목만 포함
  const validMeetingIds = new Set(regularMeetings.slice(0, seq).map(m => m.id))

  const typeLabels: Record<string, string> = {}
  for (const t of project?.activity_types ?? []) typeLabels[t.key] = t.label

  const participantMap: Record<string, string> = {}
  for (const p of participants ?? []) participantMap[p.id] = p.name

  return (
    <div className="px-6 pt-5 pb-12">
      <MeetingDetail
        projectId={id}
        meeting={meeting}
        seq={seq}
        items={(items ?? []).filter(item => validMeetingIds.has(item.meeting_id))}
        seqMap={seqMap}
        prevActivities={prevActivities ?? []}
        currActivities={currActivities ?? []}
        typeLabels={typeLabels}
        participantMap={participantMap}
        prevWeekStart={toISO(prevStart)}
        prevWeekEnd={toISO(prevEnd)}
      />
    </div>
  )
}
