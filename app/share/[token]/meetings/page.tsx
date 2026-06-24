import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function fmtWeek(start: string, end: string) {
  const [, sm, sd] = start.split('-')
  const [, em, ed] = end.split('-')
  return `${Number(sm)}/${Number(sd)} – ${Number(em)}/${Number(ed)}`
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

export default async function ShareMeetingsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = createServerClient()

  const { data: project } = await sb.from('projects').select('id').eq('share_token', token).single()
  if (!project) notFound()

  const { data: meetings } = await sb
    .from('meetings')
    .select('id, week_start, week_end, meeting_type, title')
    .eq('project_id', project.id)
    .order('week_start', { ascending: true })

  const list = (meetings ?? []) as { id: string; week_start: string; week_end: string; meeting_type: 'regular' | 'ad_hoc'; title: string | null }[]
  const regularList = list.filter(m => m.meeting_type === 'regular')
  const displayed = [...list].reverse()

  return (
    <div className="px-6 pt-5 pb-4 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">회의</h1>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">groups</span>
          <p className="text-sm font-medium">회의 기록이 없습니다</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {displayed.map((m, i) => {
            const isRegular = m.meeting_type === 'regular'
            const regularSeq = isRegular ? regularList.findIndex(x => x.id === m.id) + 1 : 0
            return (
              <Link
                key={m.id}
                href={`/share/${token}/meetings/${m.id}`}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container-low transition-colors group ${
                  i > 0 ? 'border-t border-outline-variant/40' : ''
                }`}
              >
                {isRegular ? (
                  <>
                    <span className="text-[11px] font-bold text-violet-600 font-mono w-8 shrink-0">
                      {String(regularSeq).padStart(2, '0')}차
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">정례회의</p>
                      <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                        {fmtWeek(m.week_start, m.week_end)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-sky-600 font-mono w-8 shrink-0 text-center">일반</span>
                    <div className="flex-1 min-w-0 flex items-baseline gap-3">
                      <p className="text-sm font-semibold text-on-surface truncate">{m.title ?? '일반 회의'}</p>
                      <span className="text-[11px] font-mono text-on-surface-variant shrink-0">{fmtDate(m.week_start)}</span>
                    </div>
                  </>
                )}
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0">
                  chevron_right
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
