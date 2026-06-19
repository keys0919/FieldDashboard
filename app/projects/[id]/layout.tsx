import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectSidebar from '@/components/ProjectSidebar'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id, name, client, share_token')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top App Bar */}
      <header className="glass-header border-b border-outline-variant/60 h-14 flex items-center px-4 lg:px-6 shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/" className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div className="w-px h-4 bg-outline-variant mx-0.5 shrink-0" />
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">clinical_notes</span>
          <div className="flex items-center gap-2 min-w-0">
            {project.client && (
              <>
                <span className="text-sm font-medium text-on-surface-variant shrink-0">{project.client}</span>
                <span className="text-outline-variant shrink-0 select-none">/</span>
              </>
            )}
            <span className="text-sm font-bold text-on-surface truncate">{project.name}</span>
          </div>
        </div>

      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar projectId={id} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface pb-16 lg:pb-0 flex flex-col">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-header border-t border-outline-variant/60 flex items-center justify-around h-14">
        <Link href={`/projects/${id}/overview`} className="flex flex-col items-center gap-0.5 px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">info</span>
          <span className="text-[9px] tracking-wide">개요</span>
        </Link>
        <Link href={`/projects/${id}`} className="flex flex-col items-center gap-0.5 px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">calendar_today</span>
          <span className="text-[9px] tracking-wide">Calendar</span>
        </Link>
        <Link href={`/projects/${id}/participants`} className="flex flex-col items-center gap-0.5 px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">group</span>
          <span className="text-[9px] tracking-wide">Participants</span>
        </Link>
        <Link href={`/projects/${id}/activities/new`} className="flex flex-col items-center gap-0.5 px-4 py-2">
          <div className="w-9 h-9 -mt-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-on-primary text-[20px]">add</span>
          </div>
          <span className="text-[9px] tracking-wide text-on-surface-variant mt-0.5">Add</span>
        </Link>
        <Link href={`/projects/${id}/reports`} className="flex flex-col items-center gap-0.5 px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">analytics</span>
          <span className="text-[9px] tracking-wide">Reports</span>
        </Link>
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">folder_open</span>
          <span className="text-[9px] tracking-wide">Projects</span>
        </Link>
      </nav>
    </div>
  )
}
