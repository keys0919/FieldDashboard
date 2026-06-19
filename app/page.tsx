import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import ProjectCardMenu from '@/components/ProjectCardMenu'

type ProjectRow = {
  id: string
  name: string
  client: string | null
  start_date: string | null
  end_date: string | null
  status: string
  share_token: string
  created_at: string
}

async function getProjects(): Promise<ProjectRow[]> {
  const sb = createServerClient()
  const { data } = await sb
    .from('projects')
    .select('id, name, client, start_date, end_date, status, share_token, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: '완료',
  archived: '보관',
}

const STATUS_CHIP: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed: 'bg-sky-50 text-sky-700 border border-sky-100',
  archived: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-500',
  completed: 'bg-sky-400',
  archived: 'bg-outline-variant',
}

export default async function Home() {
  const projects = await getProjects()

  const active = projects.filter(p => p.status === 'active')
  const rest = projects.filter(p => p.status !== 'active')

  return (
    <div className="min-h-screen bg-surface">
      {/* Top App Bar */}
      <header className="bg-surface border-b border-outline-variant h-16 flex items-center px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1">
          <span className="material-symbols-outlined text-[22px] text-on-surface-variant">grid_view</span>
          <span className="text-lg font-bold text-on-surface tracking-tight">Field Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center border border-outline-variant shrink-0">
            <span className="text-[11px] font-bold text-on-primary-fixed select-none">FD</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-30 mb-4">folder_open</span>
            <p className="text-sm font-medium">프로젝트가 없습니다</p>
            <p className="text-xs mt-1 opacity-60">새 프로젝트를 만들어 시작하세요</p>
            <Link
              href="/projects/new"
              className="mt-6 px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              + 새 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-1">Overview</p>
                <h2 className="text-3xl font-bold text-on-surface tracking-tight">My Projects</h2>
              </div>
              <Link
                href="/projects/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity w-fit"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                새 프로젝트
              </Link>
            </div>

            {active.length > 0 && (
              <section>
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-4">
                  진행 중 — {active.length}개
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-4">
                  기타 — {rest.length}개
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project: p }: { project: ProjectRow }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="group glass-card rounded-lg p-6 flex flex-col hover:border-primary transition-colors"
    >
      {/* Status badge + more_vert */}
      <div className="flex items-center justify-between mb-4">
        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded ${STATUS_CHIP[p.status] ?? 'bg-surface-container text-on-surface-variant border border-outline-variant'}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[p.status] ?? 'bg-outline-variant'} ${p.status === 'active' ? 'animate-pulse' : ''}`} />
          {STATUS_LABEL[p.status] ?? p.status}
        </span>
        <ProjectCardMenu projectId={p.id} />
      </div>

      {/* Name + Client */}
      <h3 className="text-base font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug truncate mb-1">
        {p.name}
      </h3>
      {p.client && (
        <p className="text-sm text-secondary truncate mb-6">{p.client}</p>
      )}

      {/* Date range row */}
      {(p.start_date || p.end_date) && (
        <div className="mt-auto flex items-center justify-between border-b border-outline-variant pb-2">
          <span className="text-[11px] text-on-surface-variant">기간</span>
          <span className="text-[11px] font-mono text-on-surface">{p.start_date ?? '?'} – {p.end_date ?? '?'}</span>
        </div>
      )}
    </Link>
  )
}
