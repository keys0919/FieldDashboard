'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

type SortKey = 'id' | 'name' | 'group' | 'gender' | 'age' | 'status' | 'activity'
type SortDir = 'asc' | 'desc'

const STATUS_LABEL: Record<string, string> = {
  active: '진행 중', completed: '완료', dropped: '탈락', replaced: '대체됨',
}
const STATUS_CHIP: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed: 'bg-sky-50 text-sky-700 border border-sky-100',
  dropped:   'bg-rose-50 text-rose-700 border border-rose-100',
  replaced:  'bg-surface-container-high text-on-surface-variant border border-outline-variant',
}
const STATUS_ORDER: Record<string, number> = {
  active: 0, completed: 1, dropped: 2, replaced: 3,
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id',       label: 'ID' },
  { key: 'name',     label: '이름' },
  { key: 'group',    label: '그룹' },
  { key: 'gender',   label: '성별' },
  { key: 'age',      label: '나이' },
  { key: 'status',   label: '상태' },
  { key: 'activity', label: 'Activity' },
]

const COL = 'grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1fr)_2rem_3rem_5.5rem_4.5rem]'

interface Participant {
  id: string
  name: string
  age: number | null
  gender: string | null
  group: string | null
  status: string
  screener_answers: Record<string, unknown>
}

interface Props {
  projectId: string
  participants: Participant[]
  actCount: Record<string, { total: number; done: number }>
  schema: unknown[]
}

export default function ParticipantList({ projectId, participants, actCount }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 시 닫힘
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setOpen(false)
  }

  const currentLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? sortKey

  const sorted = [...participants].sort((a, b) => {
    let cmp = 0
    if      (sortKey === 'id')       cmp = a.id.localeCompare(b.id)
    else if (sortKey === 'name')     cmp = a.name.localeCompare(b.name, 'ko')
    else if (sortKey === 'group')    cmp = (a.group ?? '').localeCompare(b.group ?? '', 'ko')
    else if (sortKey === 'gender')   cmp = (a.gender ?? '').localeCompare(b.gender ?? '', 'ko')
    else if (sortKey === 'age')      cmp = (a.age ?? 0) - (b.age ?? 0)
    else if (sortKey === 'status')   cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
    else if (sortKey === 'activity') cmp = (actCount[a.id]?.total ?? 0) - (actCount[b.id]?.total ?? 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      {/* Sticky 헤더: 타이틀 + 정렬 + 컬럼 헤더 */}
      <div className="sticky top-14 z-10 bg-surface border-b border-outline-variant/60">
        {/* 타이틀 행 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h1 className="text-xl font-bold text-on-surface tracking-tight">참여자</h1>
          <div className="flex items-center gap-2">
            {/* 정렬 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  sortKey !== 'id' || sortDir !== 'asc'
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">swap_vert</span>
                <span>
                  {sortKey === 'id' && sortDir === 'asc' ? '정렬' : `정렬 · ${currentLabel}`}
                </span>
                <span className="material-symbols-outlined text-[12px] opacity-50">expand_more</span>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border border-outline-variant rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">기준</p>
                  </div>
                  {SORT_OPTIONS.map(opt => {
                    const active = sortKey === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => { setSortKey(opt.key); setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-surface-container transition-colors ${
                          active ? 'text-primary font-semibold' : 'text-on-surface'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[13px] ${active ? 'opacity-100' : 'opacity-0'}`}>check</span>
                        {opt.label}
                      </button>
                    )
                  })}
                  <div className="px-3 pt-2.5 pb-1 mt-1 border-t border-outline-variant/40">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">방향</p>
                  </div>
                  {(['asc', 'desc'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => { setSortDir(dir); setOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-surface-container transition-colors ${
                        sortDir === dir ? 'text-primary font-semibold' : 'text-on-surface'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[13px] ${sortDir === dir ? 'opacity-100' : 'opacity-0'}`}>check</span>
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                        {dir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      {dir === 'asc' ? '오름차순' : '내림차순'}
                    </button>
                  ))}
                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* 추가 버튼 */}
            <Link
              href={`/projects/${projectId}/participants/new`}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">person_add</span>
              추가
            </Link>
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div className={`grid ${COL} gap-x-4 px-6 py-2.5 bg-surface-container-low border-t border-outline-variant/40`}>
          {[
            { label: 'ID' },
            { label: '이름' },
            { label: '그룹' },
            { label: '성별', center: true },
            { label: '나이', right: true },
            { label: '상태' },
            { label: 'Activity', right: true },
          ].map(col => (
            <span
              key={col.label}
              className={`text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] ${col.center ? 'text-center' : col.right ? 'text-right' : ''}`}
            >
              {col.label}
            </span>
          ))}
        </div>
      </div>

      {/* 데이터 행 */}
      <div className="px-6 py-4">
        <div className="glass-card rounded-xl overflow-hidden">
          {sorted.map((p, i) => {
            const cnt = actCount[p.id] ?? { total: 0, done: 0 }
            return (
              <Link
                key={p.id}
                href={`/projects/${projectId}/participants/${p.id}`}
                className={`grid ${COL} gap-x-4 items-center px-6 py-3 hover:bg-surface-container-low transition-colors group ${
                  i > 0 ? 'border-t border-outline-variant/40' : ''
                }`}
              >
                <span className="text-[11px] font-bold font-mono text-on-surface-variant">{p.id}</span>
                <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{p.name}</span>
                <span className="text-[12px] text-on-surface-variant truncate">
                  {p.group ?? <span className="opacity-30">—</span>}
                </span>
                <span className="text-[12px] text-on-surface-variant text-center">
                  {p.gender ?? <span className="opacity-30">—</span>}
                </span>
                <span className="text-[12px] font-mono text-on-surface-variant text-right tabular-nums">
                  {p.age != null ? `${p.age}세` : <span className="opacity-30">—</span>}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border w-fit ${STATUS_CHIP[p.status] ?? 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
                <div className="text-right tabular-nums">
                  <span className="text-sm font-semibold text-on-surface">{cnt.total}</span>
                  {cnt.total > 0 && (
                    <span className="text-[10px] text-on-surface-variant ml-1">({cnt.done})</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
