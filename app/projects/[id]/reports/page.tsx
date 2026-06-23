import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_BAR: Record<string, string> = {
  submitted:     'bg-emerald-400',
  completed:     'bg-sky-400',
  not_submitted: 'bg-rose-400',
  scheduled:     'bg-outline-variant',
  delayed:       'bg-amber-400',
  cancelled:     'bg-surface-container-highest',
}

const PERIOD_BG   = ['bg-violet-200', 'bg-sky-200',    'bg-amber-200',    'bg-emerald-200',  'bg-rose-200']
const PERIOD_TEXT = ['text-violet-800','text-sky-800',  'text-amber-800',  'text-emerald-800','text-rose-800']

interface ActivityRow { id: string; date: string; participant_id: string; type_key: string; status: string; diary_day: number | null }
interface Period { key: string; label: string; start: string; end: string; colorIdx: number }

function computePeriods(acts: ActivityRow[], labels: Record<string, string>): Period[] {
  const map: Record<string, Period> = {}
  let idx = 0
  for (const a of acts) {
    const pkey = a.type_key + (a.diary_day != null ? `_${a.diary_day}` : '')
    if (!map[pkey]) {
      const raw = (labels[a.type_key] ?? a.type_key).replace(/[()]/g, '').trim()
      map[pkey] = { key: pkey, label: raw + (a.diary_day != null ? ` D${a.diary_day}` : ''), start: a.date, end: a.date, colorIdx: idx++ }
    } else {
      if (a.date < map[pkey].start) map[pkey].start = a.date
      if (a.date > map[pkey].end)   map[pkey].end   = a.date
    }
  }
  return Object.values(map).sort((a, b) => a.start.localeCompare(b.start))
}

function typeIcon(typeKey: string) {
  if (typeKey.includes('diary')) return 'edit_note'
  return 'location_on'
}

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: activities }, { data: summaries }] = await Promise.all([
    sb.from('projects').select('id, activity_types').eq('id', id).single(),
    sb.from('activities').select('id, date, participant_id, type_key, status, diary_day').eq('project_id', id).order('date').order('participant_id'),
    sb.from('summaries').select('date').eq('project_id', id),
  ])

  if (!project) notFound()

  const typeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) typeLabels[t.key] = t.label

  const allActs: ActivityRow[] = (activities ?? []) as ActivityRow[]
  const periods = computePeriods(allActs, typeLabels)

  const byDate: Record<string, ActivityRow[]> = {}
  for (const a of allActs) {
    if (!byDate[a.date]) byDate[a.date] = []
    byDate[a.date].push(a)
  }

  const summaryDates = new Set((summaries ?? []).map(s => s.date))
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div>
      {/* Sticky 헤더: 타이틀 + 기간 범례 */}
      <div className="sticky top-14 z-10 bg-surface py-4">
        <div className="max-w-3xl px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-on-surface tracking-tight shrink-0">리포트</h1>
          {periods.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {periods.map(p => (
                <span key={p.key} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${PERIOD_BG[p.colorIdx % PERIOD_BG.length]} ${PERIOD_TEXT[p.colorIdx % PERIOD_TEXT.length]}`}>
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-4 max-w-3xl">
      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">analytics</span>
          <p className="text-sm font-medium">Activity가 없습니다</p>
          <Link
            href={`/projects/${id}/activities/new`}
            className="mt-4 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            + Activity 추가
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {dates.map((date, i) => {
            const acts = byDate[date]!
            const hasSummary = summaryDates.has(date)
            const isToday = date === todayStr
            const datePeriods = periods.filter(p => date >= p.start && date <= p.end)
            const typeKeys = [...new Set(acts.map(a => a.type_key))]

            return (
              <Link
                key={date}
                href={`/projects/${id}/reports/${date}`}
                className={`flex items-center justify-between px-5 py-3 hover:bg-surface-container-low transition-colors group ${
                  i > 0 ? 'border-t border-outline-variant/40' : ''
                } ${isToday ? 'bg-primary-fixed/10' : ''}`}
              >
                {/* 날짜 + 오늘 뱃지 */}
                <div className="flex items-center gap-1.5 w-36 shrink-0">
                  <span className={`text-xs font-mono font-semibold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{date}</span>
                  {isToday && (
                    <span className="text-[9px] font-bold bg-primary text-on-primary px-1.5 py-0.5 rounded-full leading-none">오늘</span>
                  )}
                </div>

                {/* 기간 색인 */}
                {datePeriods.length > 0 && (
                  <div className="flex gap-1 flex-wrap mr-3">
                    {datePeriods.map(p => (
                      <span key={p.key} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${PERIOD_BG[p.colorIdx % PERIOD_BG.length]} ${PERIOD_TEXT[p.colorIdx % PERIOD_TEXT.length]}`}>
                        {p.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* 유형 아이콘 + 상태 dots */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {typeKeys.map(tk => (
                      <span key={tk} className="material-symbols-outlined text-[14px] text-on-surface-variant" title={typeLabels[tk] ?? tk}>
                        {typeIcon(tk)}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-0.5 items-center">
                    {acts.map(a => (
                      <span
                        key={a.id}
                        className={`w-1.5 h-3.5 rounded-full ${STATUS_BAR[a.status] ?? 'bg-outline-variant'}`}
                        title={`${a.participant_id} · ${STATUS_BAR[a.status] ? a.status : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-outline">{acts.length}명</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasSummary && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      완료
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                    chevron_right
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
