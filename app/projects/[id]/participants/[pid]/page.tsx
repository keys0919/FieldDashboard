import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ScreenerQuestion } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  active: '진행 중', completed: '완료', dropped: '탈락', replaced: '대체됨',
}
const STATUS_CHIP: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed: 'bg-sky-50 text-sky-700 border border-sky-100',
  dropped:   'bg-rose-50 text-rose-700 border border-rose-100',
  replaced:  'bg-surface-container-high text-on-surface-variant border border-outline-variant',
}
const ACT_STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', submitted: '제출', completed: '완료',
  not_submitted: '미제출', delayed: '지연', cancelled: '취소',
}
const ACT_STATUS_CHIP: Record<string, string> = {
  scheduled:     'bg-slate-50 text-slate-600 border-slate-200',
  submitted:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  completed:     'bg-sky-50 text-sky-700 border-sky-100',
  not_submitted: 'bg-rose-50 text-rose-700 border-rose-100',
  delayed:       'bg-amber-50 text-amber-700 border-amber-100',
  cancelled:     'bg-surface-container text-outline border-outline-variant',
}
const TIMELINE_BG: Record<string, string> = {
  completed:     'bg-sky-500',
  submitted:     'bg-emerald-500',
  scheduled:     'bg-slate-400',
  not_submitted: 'bg-rose-400',
  delayed:       'bg-amber-500',
  cancelled:     'bg-surface-container-highest',
}

function typeIcon(typeKey: string) {
  return typeKey.includes('diary') ? 'edit_note' : 'location_on'
}

// content 유형별 렌더러
function ContentBlock({ typeKey, content }: { typeKey: string; content: Record<string, unknown> }) {
  if (!content || Object.keys(content).length === 0) return null

  if (typeKey.includes('diary')) {
    const entries = content.entries as Array<{ time?: string; text?: string; tags?: string[] }> | undefined
    const images  = content.images  as string[] | undefined
    return (
      <div className="space-y-4">
        {(entries ?? []).map((e, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              {e.time && (
                <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{e.time}</span>
              )}
              {(e.tags ?? []).map((t, j) => (
                <span key={j} className="text-[10px] text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
            {e.text && <p className="text-sm text-on-surface leading-relaxed">{e.text}</p>}
          </div>
        ))}
        {(images ?? []).length > 0 && (
          <div className={`grid gap-2 mt-2 ${(images!).length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images!.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className={`w-full object-cover rounded-xl border border-outline-variant hover:opacity-90 transition-opacity ${images!.length === 1 ? 'max-h-64' : 'h-32'}`}
                />
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeKey.includes('field')) {
    const observations = content.observations as Array<Record<string, string>> | undefined
    return (
      <div className="space-y-3">
        {(content.location as string | undefined) && (
          <p className="text-[10px] text-on-surface-variant">
            장소: <span className="font-medium text-on-surface">{String(content.location)}</span>
            {(content.duration_minutes as number | undefined) && <span className="ml-2">{String(content.duration_minutes)}분</span>}
          </p>
        )}
        {(observations ?? []).map((o, i) => (
          <div key={i} className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-1 text-sm">
            {o.scene          && <><span className="text-[10px] text-on-surface-variant font-medium pt-0.5">장면</span><span className="text-on-surface leading-relaxed">{o.scene}</span></>}
            {o.memo           && <><span className="text-[10px] text-on-surface-variant font-medium pt-0.5">메모</span><span className="text-on-surface leading-relaxed">{o.memo}</span></>}
            {o.interpretation && <><span className="text-[10px] text-on-surface-variant font-medium pt-0.5">해석</span><span className="text-on-surface-variant leading-relaxed italic">{o.interpretation}</span></>}
          </div>
        ))}
      </div>
    )
  }

  if (typeKey.includes('idi')) {
    const sections = content.sections as Array<Record<string, string>> | undefined
    return (
      <div className="space-y-4">
        {(sections ?? []).map((s, i) => (
          <div key={i} className="space-y-1">
            {s.topic && <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">{s.topic}</p>}
            {s.question && <p className="text-sm text-on-surface-variant">Q. {s.question}</p>}
            {s.answer && <p className="text-sm text-on-surface leading-relaxed">A. {s.answer}</p>}
          </div>
        ))}
      </div>
    )
  }

  // 기타: raw JSON
  return (
    <pre className="text-[10px] font-mono text-on-surface-variant bg-surface-container rounded-lg p-3 overflow-auto whitespace-pre-wrap">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>
}) {
  const { id, pid } = await params
  const sb = createServerClient()

  const [{ data: project }, { data: participant }, { data: activities }] = await Promise.all([
    sb.from('projects').select('id, screener_schema, activity_types').eq('id', id).single(),
    sb.from('participants').select('*').eq('project_id', id).eq('id', pid).single(),
    sb.from('activities')
      .select('id, type_key, date, start_time, status, title, diary_day, content')
      .eq('project_id', id)
      .eq('participant_id', pid)
      .order('date', { ascending: true }),
  ])

  if (!project || !participant) notFound()

  const activityIds = (activities ?? []).map(a => a.id)
  const { data: quotes } = activityIds.length
    ? await sb.from('quotes').select('*').in('activity_id', activityIds).order('id')
    : { data: [] }

  type QuoteRow = { id: string; activity_id: string; text: string; context: string | null; tags: string[] }
  const quotesByActivity: Record<string, QuoteRow[]> = {}
  for (const q of (quotes ?? []) as QuoteRow[]) {
    if (!quotesByActivity[q.activity_id]) quotesByActivity[q.activity_id] = []
    quotesByActivity[q.activity_id]!.push(q)
  }

  const schema: ScreenerQuestion[] = project.screener_schema ?? []
  const answers = participant.screener_answers ?? {}
  const typeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) typeLabels[t.key] = t.label

  const doneCount = (activities ?? []).filter(a =>
    a.status === 'completed' || a.status === 'submitted'
  ).length

  return (
    <div className="px-6 py-6 max-w-3xl space-y-4">

      {/* ── 프로필 카드 ── */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-on-primary-container font-mono">{participant.id}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-on-surface-variant tracking-wider mb-0.5">ID: {participant.id}</p>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">{participant.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {participant.group && (
                <span className="flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="material-symbols-outlined text-[13px]">group</span>
                  {participant.group}
                </span>
              )}
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_CHIP[participant.status] ?? 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                {STATUS_LABEL[participant.status] ?? participant.status}
              </span>
              {(participant.age || participant.gender) && (
                <span className="text-xs text-on-surface-variant">
                  {[participant.age && `${participant.age}세`, participant.gender].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-on-surface tabular-nums">{activities?.length ?? 0}</span>
            <span className="text-xs text-on-surface-variant ml-1.5">건 ({doneCount}완료)</span>
          </div>
        </div>

        {/* 스크리너 프로필 — 접기/펼치기 */}
        <details className="mt-5 pt-5 border-t border-outline-variant group">
            <summary className="flex items-center gap-2 cursor-pointer list-none text-[11px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors select-none">
              <span className="material-symbols-outlined text-[15px]">assignment_ind</span>
              스크리너 프로필 보기
              <span className="material-symbols-outlined text-[14px] ml-auto transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {schema.length > 0
                ? schema.map(q => {
                    const answer = answers[q.id]
                    return (
                      <div key={q.id} className="border-b border-outline-variant/40 pb-3">
                        <dt className="text-[10px] text-on-surface-variant mb-0.5 font-medium">{q.label}</dt>
                        <dd className="text-sm font-semibold text-on-surface">
                          {answer === undefined || answer === null || answer === ''
                            ? <span className="text-outline font-normal opacity-50">—</span>
                            : Array.isArray(answer) ? answer.join(', ') : String(answer)}
                        </dd>
                      </div>
                    )
                  })
                : Object.entries(answers).map(([k, v]) => (
                    <div key={k} className="border-b border-outline-variant/40 pb-3">
                      <dt className="text-[10px] text-on-surface-variant mb-0.5 font-medium">{k}</dt>
                      <dd className="text-sm font-semibold text-on-surface">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </dd>
                    </div>
                  ))
              }
            </dl>
          </details>
      </div>

      {/* ── Activity 결과 카드 ── */}
      {(!activities || activities.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] opacity-30 mb-3">history</span>
          <p className="text-sm">Activity가 없습니다</p>
        </div>
      ) : (
        <div className="relative space-y-3 before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-outline-variant/60">
          {activities.map(a => {
            const qs = quotesByActivity[a.id] ?? []
            const hasContent = a.content && Object.keys(a.content).length > 0
            const isCancelled = a.status === 'cancelled'

            return (
              <div key={a.id} className={`relative pl-12 ${isCancelled ? 'opacity-40' : ''}`}>
                {/* 상태 인디케이터 */}
                <div className={`absolute left-0 top-5 w-[38px] h-[38px] rounded-full flex items-center justify-center border-4 border-surface ${TIMELINE_BG[a.status] ?? 'bg-slate-300'}`}>
                  <span className="material-symbols-outlined text-[15px] text-white">{typeIcon(a.type_key)}</span>
                </div>

                {/* 카드 */}
                <div className="glass-card rounded-xl overflow-hidden">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between px-5 py-3 bg-surface-container border-b border-outline-variant/60">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-on-surface">
                        {typeLabels[a.type_key] ?? a.type_key}
                        {a.diary_day != null && (
                          <span className="ml-1.5 text-[10px] font-bold text-on-surface-variant">Day {a.diary_day}</span>
                        )}
                      </h3>
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${ACT_STATUS_CHIP[a.status] ?? ACT_STATUS_CHIP.scheduled}`}>
                        {ACT_STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                      {a.start_time && <span className="font-mono">{a.start_time.slice(0, 5)}</span>}
                      <span className="font-mono">{a.date}</span>
                    </div>
                  </div>

                  {/* 카드 본문: content + quotes */}
                  <div className="px-5 py-4 space-y-4">
                    {hasContent
                      ? <ContentBlock typeKey={a.type_key} content={a.content as Record<string, unknown>} />
                      : <p className="text-sm text-on-surface-variant opacity-40">데이터 없음</p>
                    }

                    {qs.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-outline-variant/40">
                        {qs.map(q => (
                          <blockquote key={q.id} className="border-l-2 border-primary-fixed pl-3">
                            <p className="text-[9px] font-mono text-outline mb-0.5">{q.id}</p>
                            <p className="text-sm text-on-surface leading-relaxed">"{q.text}"</p>
                            {q.context && <p className="text-[10px] text-on-surface-variant mt-0.5">{q.context}</p>}
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
