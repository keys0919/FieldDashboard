'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MeetingRow {
  id: string
  week_start: string
  week_end: string
  meeting_type: 'regular' | 'ad_hoc'
  title: string | null
}

interface Props {
  projectId: string
  meetings: MeetingRow[]
}

function fmtWeek(start: string, end: string) {
  const [, sm, sd] = start.split('-')
  const [, em, ed] = end.split('-')
  return `${Number(sm)}/${Number(sd)} – ${Number(em)}/${Number(ed)}`
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

function getThisWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const toISO = (d: Date) => d.toISOString().split('T')[0]
  return { week_start: toISO(monday), week_end: toISO(sunday) }
}

function MeetingRowMenu({
  projectId,
  meetingId,
  onDelete,
}: {
  projectId: string
  meetingId: string
  onDelete: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); setConfirming(false) }}
        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-surface-container transition-colors text-outline hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden">
          {!confirming ? (
            <>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/projects/${projectId}/meetings/${meetingId}`) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                수정
              </button>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirming(true) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                삭제
              </button>
            </>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-[11px] text-on-surface-variant leading-snug">삭제하면 복구할 수 없습니다.</p>
              <div className="flex gap-1.5">
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirming(false); setOpen(false) }}
                  className="flex-1 py-1.5 text-[11px] font-medium text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async e => {
                    e.preventDefault(); e.stopPropagation()
                    await fetch(`/api/projects/${projectId}/meetings/${meetingId}`, { method: 'DELETE' })
                    onDelete()
                  }}
                  className="flex-1 py-1.5 text-[11px] font-medium text-white bg-rose-600 rounded hover:opacity-90 transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MeetingListClient({ projectId, meetings: initial }: Props) {
  const router = useRouter()
  const [meetings, setMeetings] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const typeMenuRef = useRef<HTMLDivElement>(null)

  const [showAdHocForm, setShowAdHocForm] = useState(false)
  const [adHocTitle, setAdHocTitle] = useState('')

  useEffect(() => {
    if (!showTypeMenu) return
    function handle(e: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showTypeMenu])

  const regularMeetings = meetings.filter(m => m.meeting_type === 'regular')
  const { week_start: thisWeekStart } = getThisWeekRange()
  const thisWeekExists = regularMeetings.some(m => m.week_start === thisWeekStart)

  async function handleCreateRegular() {
    setShowTypeMenu(false)
    setError(null)
    setCreating(true)
    const { week_start, week_end } = getThisWeekRange()
    const res = await fetch(`/api/projects/${projectId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_type: 'regular', week_start, week_end }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
    router.push(`/projects/${projectId}/meetings/${data.id}`)
  }

  async function handleCreateAdHoc() {
    if (!adHocTitle.trim()) return
    setError(null)
    setCreating(true)
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`/api/projects/${projectId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_type: 'ad_hoc', title: adHocTitle.trim(), meeting_date: today }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
    router.push(`/projects/${projectId}/meetings/${data.id}`)
  }

  const displayed = [...meetings].reverse()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">회의</h1>
        <div className="flex items-center gap-3">
          {thisWeekExists && (
            <span className="text-xs text-on-surface-variant">이번 주 정례회의가 이미 있습니다</span>
          )}
          <div ref={typeMenuRef} className="relative">
            <button
              onClick={() => setShowTypeMenu(v => !v)}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              회의 생성
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {showTypeMenu && (
              <div className="absolute right-0 top-9 z-50 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={handleCreateRegular}
                  disabled={thisWeekExists}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[15px] text-violet-500">event_repeat</span>
                  정례회의 (이번 주)
                </button>
                <div className="border-t border-outline-variant/40" />
                <button
                  onClick={() => { setShowTypeMenu(false); setShowAdHocForm(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[15px] text-sky-500">event_note</span>
                  일반 회의
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdHocForm && (
        <div className="bg-surface-container rounded-xl p-3 border border-outline-variant flex items-center gap-2">
          <input
            autoFocus
            value={adHocTitle}
            onChange={e => setAdHocTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateAdHoc()
              if (e.key === 'Escape') { setShowAdHocForm(false); setAdHocTitle('') }
            }}
            placeholder="회의 제목을 입력하세요"
            className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface"
          />
          <button
            onClick={handleCreateAdHoc}
            disabled={creating || !adHocTitle.trim()}
            className="px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {creating ? '생성 중...' : '생성'}
          </button>
          <button
            onClick={() => { setShowAdHocForm(false); setAdHocTitle('') }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {meetings.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">groups</span>
          <p className="text-sm">아직 생성된 회의가 없습니다</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl">
          {displayed.map((m, i) => {
            const isRegular = m.meeting_type === 'regular'
            const regularSeq = isRegular
              ? regularMeetings.findIndex(x => x.id === m.id) + 1
              : 0
            const isFirst = i === 0
            const isLast = i === displayed.length - 1
            return (
              <div
                key={m.id}
                className={`flex items-center hover:bg-surface-container/50 transition-colors ${i > 0 ? 'border-t border-outline-variant/40' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''}`}
              >
                <Link href={`/projects/${projectId}/meetings/${m.id}`} className="flex-1 flex items-center gap-4 min-w-0 px-5 py-4">
                  {isRegular ? (
                    <>
                      <span className="text-[11px] font-bold text-violet-600 font-mono w-8 shrink-0">
                        {String(regularSeq).padStart(2, '0')}차
                      </span>
                      <span className="text-sm font-medium text-on-surface">
                        정례회의 · {fmtWeek(m.week_start, m.week_end)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-bold text-sky-600 font-mono w-8 shrink-0 text-center">일반</span>
                      <div className="flex-1 min-w-0 flex items-baseline gap-3">
                        <span className="text-sm font-medium text-on-surface truncate">{m.title ?? '일반 회의'}</span>
                        <span className="text-[11px] font-mono text-on-surface-variant shrink-0">{fmtDate(m.week_start)}</span>
                      </div>
                    </>
                  )}
                </Link>
                <div className="pr-5">
                  <MeetingRowMenu
                    projectId={projectId}
                    meetingId={m.id}
                    onDelete={() => setMeetings(prev => prev.filter(x => x.id !== m.id))}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
