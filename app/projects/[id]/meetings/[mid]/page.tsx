import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MeetingDetail from './MeetingDetail'
import CommentsPanel from '@/components/CommentsPanel'

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>
}) {
  const { id, mid } = await params
  const sb = createServerClient()
  const toISO = (d: Date) => d.toISOString().split('T')[0]

  // Round trip 1: meeting과 날짜 무관한 쿼리를 동시에 실행
  const [
    { data: meeting },
    { data: allMeetings },
    { data: project },
    { data: participants },
  ] = await Promise.all([
    sb.from('meetings').select('*').eq('id', mid).single(),
    sb.from('meetings').select('id, week_start, meeting_type').eq('project_id', id).order('week_start'),
    sb.from('projects').select('activity_types').eq('id', id).single(),
    sb.from('participants').select('id, name').eq('project_id', id),
  ])

  if (!meeting) notFound()

  const meetings = allMeetings ?? []
  const regularMeetings = meetings.filter(m => m.meeting_type === 'regular')
  const seq = regularMeetings.findIndex(m => m.id === mid) + 1

  const seqMap: Record<string, number> = {}
  regularMeetings.forEach((m, i) => { seqMap[m.id] = i + 1 })

  const validMeetingIdsList = regularMeetings.slice(0, seq).map(m => m.id)

  const prevStart = new Date(meeting.week_start)
  prevStart.setDate(prevStart.getDate() - 7)
  const prevEnd = new Date(meeting.week_start)
  prevEnd.setDate(prevEnd.getDate() - 1)

  // Round trip 2: meeting 날짜 기반 쿼리 + DB 필터된 items 동시 실행
  const [
    { data: prevActivities },
    { data: currActivities },
    { data: items },
  ] = await Promise.all([
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
    validMeetingIdsList.length > 0
      ? sb.from('meeting_items').select('*').in('meeting_id', validMeetingIdsList).order('created_at')
      : Promise.resolve({ data: [] as { id: string; meeting_id: string; type: string; text: string; status: string; closed_meeting_id: string | null; close_reason: string | null }[] }),
  ])

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
        items={items ?? []}
        seqMap={seqMap}
        prevActivities={prevActivities ?? []}
        currActivities={currActivities ?? []}
        typeLabels={typeLabels}
        participantMap={participantMap}
        prevWeekStart={toISO(prevStart)}
        prevWeekEnd={toISO(prevEnd)}
      />
      <CommentsPanel
        apiBase={`/api/projects/${id}/comments`}
        objectType="meeting"
        objectId={mid}
        authorType="researcher"
      />
    </div>
  )
}
