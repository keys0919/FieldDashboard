import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ParticipantList from './ParticipantList'
import { ScreenerQuestion } from '@/types'

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: participants }, { data: activities }] = await Promise.all([
    sb.from('projects').select('id, screener_schema').eq('id', id).single(),
    sb.from('participants').select('*').eq('project_id', id).order('id'),
    sb.from('activities').select('participant_id, status').eq('project_id', id),
  ])

  if (!project) notFound()

  const actCount: Record<string, { total: number; done: number }> = {}
  for (const a of activities ?? []) {
    if (!actCount[a.participant_id]) actCount[a.participant_id] = { total: 0, done: 0 }
    actCount[a.participant_id].total++
    if (a.status === 'completed' || a.status === 'submitted') actCount[a.participant_id].done++
  }

  const schema: ScreenerQuestion[] = project.screener_schema ?? []

  return (
    <div>
      {(!participants || participants.length === 0) ? (
        <div className="px-6 py-6 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-on-surface tracking-tight">참여자</h1>
            <Link
              href={`/projects/${id}/participants/new`}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">person_add</span>
              추가
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">group</span>
            <p className="text-sm font-medium">참여자가 없습니다</p>
            <p className="text-xs mt-1 opacity-60">참여자를 추가해 시작하세요</p>
          </div>
        </div>
      ) : (
        <ParticipantList
          projectId={id}
          participants={participants}
          actCount={actCount}
          schema={schema}
        />
      )}
    </div>
  )
}
