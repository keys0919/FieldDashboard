import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

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

export default async function ShareResourcesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = createServerClient()

  const { data: project } = await sb.from('projects').select('id, documents').eq('share_token', token).single()
  if (!project) notFound()

  const documents: Array<{ label: string; url: string; type: string }> = project.documents ?? []

  return (
    <div>
      <div className="sticky top-14 z-10 bg-surface border-b border-outline-variant/60">
        <div className="max-w-3xl px-6 py-4 flex items-center">
          <h1 className="text-xl font-bold text-on-surface tracking-tight">자료실</h1>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">folder_open</span>
            <p className="text-sm font-medium">등록된 문서가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-low transition-colors group glass-card"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
                  {DOC_TYPE_ICON[doc.type] ?? 'link'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                    {doc.label}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    {DOC_TYPE_LABEL[doc.type] ?? doc.type}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                  open_in_new
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
