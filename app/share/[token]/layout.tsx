import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ShareSidebar from '@/components/ShareSidebar'

export default async function ShareLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const sb = createServerClient()

  const { data: project } = await sb
    .from('projects')
    .select('id, name, client')
    .eq('share_token', token)
    .single()

  if (!project) notFound()

  return (
    <div className="min-h-screen">
      {/* Top App Bar */}
      <header className="glass-header border-b border-outline-variant/60 h-14 flex items-center px-4 lg:px-6 z-20 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
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
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide bg-surface-container-high border border-outline-variant px-2.5 py-1 rounded-full shrink-0">
          read-only
        </span>
      </header>

      {/* Body */}
      <div className="flex pt-14">
        <ShareSidebar token={token} />
        <main className="flex-1 bg-surface pb-16 lg:pb-0 lg:pl-64 min-h-[calc(100vh-3.5rem)] [overflow-x:clip]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-header border-t border-outline-variant/60 flex items-center justify-around h-14">
        {[
          { icon: 'info',           label: '개요',     path: 'overview' },
          { icon: 'calendar_today', label: 'Calendar', path: '' },
          { icon: 'analytics',      label: 'Reports',  path: 'reports' },
          { icon: 'groups',         label: 'Meetings', path: 'meetings' },
          { icon: 'library_books',  label: '자료실',   path: 'resources' },
        ].map(item => (
          <a
            key={item.label}
            href={item.path ? `/share/${token}/${item.path}` : `/share/${token}`}
            className="flex flex-col items-center gap-0.5 px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[9px] tracking-wide">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
