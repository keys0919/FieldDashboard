'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  token: string
}

const NAV = [
  { label: '개요',         icon: 'info',           path: 'overview' },
  { label: 'Calendar',     icon: 'calendar_today', path: '' },
  { label: 'Reports',      icon: 'analytics',      path: 'reports' },
  { label: 'Meetings',     icon: 'groups',         path: 'meetings' },
  { label: '자료실',       icon: 'library_books',  path: 'resources' },
]

export default function ShareSidebar({ token }: Props) {
  const pathname = usePathname()
  const base = `/share/${token}`

  function isActive(path: string) {
    const href = path ? `${base}/${path}` : base
    if (!path) return pathname === base
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col gap-2 p-4 fixed top-14 bottom-0 left-0 w-64 bg-surface-container border-r border-outline-variant overflow-y-auto z-10">
      <nav className="flex flex-col gap-0.5">
        {NAV.map(item => {
          const href = item.path ? `${base}/${item.path}` : base
          const active = isActive(item.path)
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
      </nav>
    </aside>
  )
}
