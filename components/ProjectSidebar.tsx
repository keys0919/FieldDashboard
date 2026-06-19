'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  projectId: string
}

const NAV = [
  { label: '개요',         icon: 'info',             href: (id: string) => `/projects/${id}/overview` },
  { label: 'Calendar',     icon: 'calendar_today',   href: (id: string) => `/projects/${id}` },
  { label: 'Participants', icon: 'group',             href: (id: string) => `/projects/${id}/participants` },
  { label: 'Reports',      icon: 'analytics',         href: (id: string) => `/projects/${id}/reports` },
]

export default function ProjectSidebar({ projectId }: Props) {
  const pathname = usePathname()

  function isActive(href: string, label: string) {
    if (label === 'Calendar') {
      return pathname === `/projects/${projectId}` ||
        pathname.startsWith(`/projects/${projectId}/activities`)
    }
    if (label === '개요') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col gap-2 p-4 h-full w-64 bg-surface-container border-r border-outline-variant shrink-0 overflow-y-auto">
      {/* 내비게이션 */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map(item => {
          const href = item.href(projectId)
          const active = isActive(href, item.label)
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                active
                  ? 'bg-secondary-fixed text-on-primary-fixed font-semibold translate-x-0.5'
                  : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-xs font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}

        <div className="my-3 border-t border-outline-variant opacity-50" />

        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-secondary hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">folder_open</span>
          <span className="text-xs font-medium tracking-wide">All Projects</span>
        </Link>
      </nav>

      {/* 하단 액션 */}
      <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant">
        <Link
          href={`/projects/${projectId}/activities/new`}
          className="flex items-center gap-3 px-3 py-2.5 text-secondary hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span className="text-xs font-medium tracking-wide">Activity 추가</span>
        </Link>
        <Link
          href={`/projects/${projectId}/participants/new`}
          className="flex items-center gap-3 px-3 py-2.5 text-secondary hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span className="text-xs font-medium tracking-wide">참여자 추가</span>
        </Link>
      </div>
    </aside>
  )
}
