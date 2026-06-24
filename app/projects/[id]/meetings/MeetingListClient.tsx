'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MeetingRow {
  id: string
  week_start: string
  week_end: string
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
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  const { week_start: thisWeekStart } = getThisWeekRange()
  const thisWeekExists = meetings.some(m => m.week_start === thisWeekStart)

  async function handleCreate() {
    setError(null)
    setCreating(true)
    const { week_start, week_end } = getThisWeekRange()
    const res = await fetch(`/api/projects/${projectId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, week_end }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
    router.push(`/projects/${projectId}/meetings/${data.id}`)
  }

  // 화면 표시: 최신 회의가 위 (내림차순), seq는 오름차순 기준
  const displayed = [...meetings].reverse()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">정례회의</h1>
        <div className="flex items-center gap-3">
          {thisWeekExists && (
            <span className="text-xs text-on-surface-variant">이번 주 회의가 이미 있습니다</span>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || thisWeekExists}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            {creating ? '생성 중...' : '회의 생성'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {meetings.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] opacity-30 mb-3">groups</span>
          <p className="text-sm">아직 생성된 회의가 없습니다</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {displayed.map((m, i) => {
            const seq = meetings.findIndex(x => x.id === m.id) + 1
            return (
              <div
                key={m.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-container/50 transition-colors ${i > 0 ? 'border-t border-outline-variant/40' : ''}`}
              >
                <Link href={`/projects/${projectId}/meetings/${m.id}`} className="flex-1 flex items-center gap-4 min-w-0">
                  <span className="text-[11px] font-bold text-on-surface-variant font-mono w-8 shrink-0">
                    {String(seq).padStart(2, '0')}차
                  </span>
                  <span className="text-sm font-medium text-on-surface">
                    {fmtWeek(m.week_start, m.week_end)}
                  </span>
                </Link>
                <MeetingRowMenu
                  projectId={projectId}
                  meetingId={m.id}
                  onDelete={() => setMeetings(prev => prev.filter(x => x.id !== m.id))}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
