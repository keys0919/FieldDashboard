import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ScreenerQuestion } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  active: '진행 중', completed: '완료', archived: '보관',
}

function SectionCard({ icon, title, children }: {
  icon: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-surface-container border-b border-outline-variant">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
        <h2 className="text-sm font-bold text-on-surface">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default async function ShareOverviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = createServerClient()

  const { data: project } = await sb.from('projects').select('*').eq('share_token', token).single()
  if (!project) notFound()

  const schema: ScreenerQuestion[] = project.screener_schema ?? []
  const activityTypes: Array<{ key: string; label: string }> = project.activity_types ?? []

  return (
    <div className="px-6 py-6 max-w-3xl space-y-4">

      <SectionCard icon="info" title="Overview">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {project.client && (
            <div>
              <dt className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">고객사</dt>
              <dd className="text-sm font-semibold text-on-surface">{project.client}</dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">상태</dt>
            <dd className="text-sm font-semibold text-on-surface">{STATUS_LABEL[project.status] ?? project.status}</dd>
          </div>
          {(project.start_date || project.end_date) && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">기간</dt>
              <dd className="text-sm font-semibold text-on-surface font-mono">
                {project.start_date ?? '—'} ~ {project.end_date ?? '—'}
              </dd>
            </div>
          )}
          {project.description && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">설명</dt>
              <dd className="text-sm text-on-surface leading-relaxed">{project.description}</dd>
            </div>
          )}
        </dl>
      </SectionCard>

      {schema.length > 0 && (
        <SectionCard icon="assignment_ind" title="스크리너 질문지">
          <ol className="space-y-4">
            {schema.map((q, i) => (
              <li key={q.id} className="flex gap-4">
                <span className="text-[11px] font-mono font-bold text-on-surface-variant opacity-50 pt-0.5 shrink-0 w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface mb-1">{q.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                      {q.type === 'single_choice' ? '단일 선택'
                        : q.type === 'multi_choice' ? '복수 선택'
                        : q.type === 'number' ? '숫자' : '텍스트'}
                    </span>
                    {q.id && <span className="text-[9px] font-mono text-outline">{q.id}</span>}
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {q.options.map((opt: string, j: number) => (
                        <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/60">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {activityTypes.length > 0 && (
        <SectionCard icon="category" title="Activity 유형 정의">
          <div className="space-y-3">
            {activityTypes.map(t => (
              <div key={t.key} className="flex items-start gap-3 py-3 border-b border-outline-variant/40 last:border-0">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
                  {t.key.includes('diary') ? 'edit_note' : 'location_on'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{t.label}</p>
                  <p className="text-[10px] font-mono text-outline mt-0.5">{t.key}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
