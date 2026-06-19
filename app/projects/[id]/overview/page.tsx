import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ScreenerQuestion } from '@/types'
import DocumentsEditor from './DocumentsEditor'
import ShareTokenCard from './ShareTokenCard'

const DOC_TYPE_LABEL: Record<string, string> = {
  guide:   '인터뷰 가이드',
  survey:  '설문지',
  consent: '동의서',
  plan:    '연구 계획서',
  other:   '기타',
}
const DOC_TYPE_ICON: Record<string, string> = {
  guide:   'record_voice_over',
  survey:  'assignment',
  consent: 'handshake',
  plan:    'description',
  other:   'link',
}

const STATUS_LABEL: Record<string, string> = {
  active: '진행 중', completed: '완료', archived: '보관',
}

function SectionCard({ icon, title, children, action }: {
  icon: string; title: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-surface-container border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
          <h2 className="text-sm font-bold text-on-surface">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const schema: ScreenerQuestion[] = project.screener_schema ?? []
  const shareToken: string = project.share_token ?? ''
  const activityTypes: Array<{ key: string; label: string; content_schema?: Record<string, unknown> }> = project.activity_types ?? []
  const documents: Array<{ label: string; url: string; type: string }> = project.documents ?? []

  return (
    <div className="px-6 py-6 max-w-3xl space-y-4">

      {/* 연구 개요 */}
      <SectionCard
        icon="info"
        title="Overview"
        action={
          <Link href={`/projects/${id}/edit`} className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[13px]">edit</span>
            편집
          </Link>
        }
      >
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

      {/* 고객 공유 */}
      <SectionCard icon="share" title="고객 공유">
        <p className="text-[11px] text-on-surface-variant mb-3">
          아래 URL로 고객이 로그인 없이 프로젝트 진행 현황을 열람할 수 있습니다.
          운영 메모·연구자 노트는 표시되지 않습니다.
        </p>
        <ShareTokenCard token={shareToken} />
      </SectionCard>

      {/* 주요 문서 */}
      <SectionCard icon="folder_open" title="주요 문서">
        {documents.length > 0 && (
          <div className="space-y-2 mb-4">
            {documents.map((doc, i) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors group"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                  {DOC_TYPE_ICON[doc.type] ?? 'link'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{doc.label}</p>
                  <p className="text-[10px] text-on-surface-variant">{DOC_TYPE_LABEL[doc.type] ?? doc.type}</p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0">open_in_new</span>
              </a>
            ))}
          </div>
        )}
        <DocumentsEditor projectId={id} initialDocuments={documents} />
      </SectionCard>

      {/* 스크리너 질문지 */}
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
                        : q.type === 'number' ? '숫자'
                        : '텍스트'}
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

      {/* Activity 유형 정의 */}
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
