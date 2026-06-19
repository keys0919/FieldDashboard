import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', submitted: '제출', completed: '완료',
  not_submitted: '미제출', delayed: '지연', cancelled: '취소',
}
const STATUS_CHIP: Record<string, string> = {
  scheduled: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  submitted: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed: 'bg-sky-50 text-sky-700 border border-sky-100',
  not_submitted: 'bg-rose-50 text-rose-700 border border-rose-100',
  delayed: 'bg-amber-50 text-amber-700 border border-amber-100',
  cancelled: 'bg-surface-container text-outline border border-outline-variant',
}
const STATUS_BAR: Record<string, string> = {
  submitted: 'bg-emerald-400',
  completed: 'bg-sky-400',
  not_submitted: 'bg-rose-400',
  scheduled: 'bg-outline-variant',
  delayed: 'bg-amber-400',
  cancelled: 'bg-surface-container-highest',
}
const FINDING_LABEL: Record<string, string> = {
  observation: '관찰', pattern: '패턴', insight: '인사이트', rqmt_candidate: 'RQMT 후보',
}
const FINDING_CHIP: Record<string, string> = {
  observation: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  pattern: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  insight: 'bg-violet-50 text-violet-700 border border-violet-100',
  rqmt_candidate: 'bg-orange-50 text-orange-700 border border-orange-100',
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id, name, client, description, start_date, end_date, activity_types')
    .eq('share_token', token)
    .single()

  if (!project) notFound()

  const [{ data: activities }, { data: summaries }, { data: findings }] = await Promise.all([
    sb.from('activities')
      .select('id, participant_id, type_key, date, start_time, status')
      .eq('project_id', project.id)
      .order('date', { ascending: false })
      .order('participant_id'),
    sb.from('summaries')
      .select('id, date, scope, key_patterns, next_focus, notable_cases, submitted_participants, pending_participants')
      .eq('project_id', project.id)
      .order('date', { ascending: false }),
    sb.from('findings')
      .select('id, type, title, description')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
  ])

  const typeLabels: Record<string, string> = {}
  for (const t of project.activity_types ?? []) typeLabels[t.key] = t.label

  const byDate: Record<string, typeof activities> = {}
  for (const a of activities ?? []) {
    if (!byDate[a.date]) byDate[a.date] = []
    byDate[a.date]!.push(a)
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="glass-header sticky top-0 z-10 border-b border-outline-variant/60 h-14 flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">science</span>
          <span className="text-sm font-bold text-on-surface">Field Dashboard</span>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide bg-surface-container-high border border-outline-variant px-2.5 py-1 rounded-full">
            read-only
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 프로젝트 헤더 */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-2">Research Progress</p>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">{project.name}</h1>
          {project.client && <p className="text-sm text-on-surface-variant mt-1">{project.client}</p>}
          {(project.start_date || project.end_date) && (
            <p className="text-xs text-outline mt-2 font-mono">{project.start_date} – {project.end_date}</p>
          )}
          {project.description && (
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed border-t border-outline-variant/40 pt-3">{project.description}</p>
          )}
        </div>

        <div className="space-y-5">
          {/* 일정 현황 */}
          <section>
            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-3">
              일정 현황 <span className="font-normal normal-case opacity-60">({(activities ?? []).length}개)</span>
            </h2>
            {dates.length === 0 ? (
              <p className="text-sm text-on-surface-variant opacity-60">등록된 일정 없음</p>
            ) : (
              <div className="glass-card rounded-xl overflow-hidden">
                {dates.slice(0, 10).map((date, i) => (
                  <div key={date} className={`px-5 py-4 ${i > 0 ? 'border-t border-outline-variant/40' : ''}`}>
                    <p className="text-[10px] font-mono font-bold text-on-surface-variant mb-2">{date}</p>
                    <div className="space-y-1.5">
                      {byDate[date]!.map(a => (
                        <div key={a.id} className="flex items-center gap-3">
                          <span className={`w-1 h-3 rounded-full shrink-0 ${STATUS_BAR[a.status] ?? 'bg-outline-variant'}`} />
                          <span className="font-mono text-[10px] text-outline w-8">{a.participant_id}</span>
                          <span className="text-sm text-on-surface">{typeLabels[a.type_key] ?? a.type_key}</span>
                          {a.start_time && <span className="text-[10px] text-outline font-mono">{a.start_time.slice(0, 5)}</span>}
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ml-auto ${STATUS_CHIP[a.status] ?? 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                            {STATUS_LABEL[a.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Summary 목록 */}
          {(summaries ?? []).length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-3">리서치 요약</h2>
              <div className="glass-card rounded-xl overflow-hidden">
                {summaries!.map((s, i) => (
                  <div key={s.id} className={`px-5 py-4 ${i > 0 ? 'border-t border-outline-variant/40' : ''}`}>
                    <p className="text-sm font-semibold text-on-surface mb-3">{s.date} — {s.scope}</p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] text-on-surface-variant mb-1 font-medium">완료</p>
                        <p className="text-sm text-on-surface">{s.submitted_participants.join(', ') || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant mb-1 font-medium">미완료</p>
                        <p className="text-sm text-on-surface-variant">{s.pending_participants.join(', ') || '—'}</p>
                      </div>
                    </div>
                    {s.key_patterns.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] text-on-surface-variant mb-2 font-medium">주요 패턴</p>
                        <ul className="space-y-1">
                          {s.key_patterns.map((p: string, j: number) => (
                            <li key={j} className="text-sm text-on-surface flex gap-2">
                              <span className="text-outline shrink-0">·</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.next_focus && (
                      <div>
                        <p className="text-[10px] text-on-surface-variant mb-1 font-medium">다음 확인사항</p>
                        <p className="text-sm text-on-surface-variant">{s.next_focus}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Findings */}
          {(findings ?? []).length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-3">
                주요 발견 <span className="font-normal normal-case opacity-60">({findings!.length})</span>
              </h2>
              <div className="glass-card rounded-xl overflow-hidden">
                {findings!.map((f, i) => (
                  <div key={f.id} className={`px-5 py-4 ${i > 0 ? 'border-t border-outline-variant/40' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${FINDING_CHIP[f.type] ?? 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                        {FINDING_LABEL[f.type] ?? f.type}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{f.title}</p>
                        {f.description && <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{f.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <p className="text-[10px] text-outline text-center mt-12 opacity-50">read-only · Field Dashboard</p>
      </div>
    </div>
  )
}
