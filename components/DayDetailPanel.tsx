'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface Participant {
  id: string
  name: string
  age: number | null
  gender: string | null
  group: string | null
}

export interface ActivityItem {
  id: string
  participant_id: string
  type_key: string
  start_time: string | null
  status: string
  diary_day: number | null
}

interface Props {
  date: string
  activities: ActivityItem[]
  participantMap: Record<string, Participant>
  activityTypeLabels: Record<string, string>
  projectId: string
  onClose: () => void
}

const STATUS_CHIP: Record<string, string> = {
  scheduled:     'bg-slate-50 text-slate-600 border-slate-200',
  submitted:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  completed:     'bg-sky-50 text-sky-700 border-sky-100',
  not_submitted: 'bg-rose-50 text-rose-700 border-rose-100',
  delayed:       'bg-amber-50 text-amber-700 border-amber-100',
  cancelled:     'bg-surface-container text-outline border-outline-variant',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled:     '예정',
  submitted:     '제출',
  completed:     '완료',
  not_submitted: '미제출',
  delayed:       '지연',
  cancelled:     '취소',
}

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_KO[d.getDay()]})`
}

const isDone = (status: string) => status === 'submitted' || status === 'completed'

export default function DayDetailPanel({
  date, activities, participantMap, activityTypeLabels, projectId, onClose,
}: Props) {
  const [showProfilePopup, setShowProfilePopup] = useState(false)

  type Group = { type_key: string; diary_day: number | null; items: ActivityItem[] }

  const groups: Group[] = Object.values(
    activities.reduce<Record<string, Group>>((acc, a) => {
      const key = a.type_key + (a.diary_day != null ? `_${a.diary_day}` : '')
      if (!acc[key]) acc[key] = { type_key: a.type_key, diary_day: a.diary_day, items: [] }
      acc[key].items.push(a)
      return acc
    }, {})
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />

      {/* Panel: mobile=bottom sheet / desktop=right panel */}
      <div className="
        fixed z-40 bg-white shadow-2xl overflow-y-auto
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[70vh]
        md:inset-y-0 md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-80
        md:rounded-none md:max-h-none md:border-l md:border-outline-variant
      ">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant sticky top-0 bg-white z-10">
          <div>
            <p className="text-sm font-bold text-on-surface">{formatDate(date)}</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{activities.length}개 activity</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {activities.length === 0 ? (
            <p className="text-sm text-center text-on-surface-variant py-8">activity가 없습니다</p>
          ) : groups.map(group => {
            const label = activityTypeLabels[group.type_key] ?? group.type_key
            const cleanLabel = label.replace(/[()]/g, '').trim()
            const sorted = [...group.items].sort((a, b) =>
              (a.start_time ?? '').localeCompare(b.start_time ?? '')
            )

            return (
              <section key={group.type_key + group.diary_day}>
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
                  {cleanLabel}{group.diary_day != null ? ` · Day ${group.diary_day}` : ''} · {group.items.length}명
                </h4>

                <div className="space-y-2">
                  {sorted.map(a => {
                    const p = participantMap[a.participant_id]
                    return (
                      <Link
                        key={a.id}
                        href={`/projects/${projectId}/participants/${a.participant_id}`}
                        onClick={onClose}
                        className="block border border-outline-variant rounded-xl p-3 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {a.start_time && (
                              <p className="text-[10px] font-mono text-outline mb-1">{a.start_time.slice(0, 5)}</p>
                            )}
                            <p className="text-sm font-semibold text-on-surface">{p?.name ?? a.participant_id}</p>
                            {p && (p.age || p.gender || p.group) && (
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                {[p.age && `${p.age}세`, p.gender, p.group].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 mt-0.5 ${STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled}`}>
                            {STATUS_LABEL[a.status] ?? a.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
          {activities.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-outline-variant/60 pt-3 pb-4 mt-4 -mx-4 px-4">
              {activities.some(a => isDone(a.status)) ? (
                <Link
                  href={`/projects/${projectId}/reports/${date}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  리포트 보기
                </Link>
              ) : (
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-on-surface text-surface text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  프로필 보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showProfilePopup && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowProfilePopup(false)}
          />
          <div className="fixed z-50 inset-6 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[calc(100vh-80px)] bg-white rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
              <div>
                <p className="text-base font-bold text-on-surface">{formatDate(date)} 참여자</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{activities.length}명</p>
              </div>
              <button
                onClick={() => setShowProfilePopup(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-container-lowest">
                  <tr className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide">
                    <th className="text-left px-6 py-3">이름</th>
                    <th className="text-left px-4 py-3">나이</th>
                    <th className="text-left px-4 py-3">성별</th>
                    <th className="text-left px-4 py-3">그룹</th>
                    <th className="text-left px-4 py-3">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {[...activities]
                    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
                    .map(a => {
                      const p = participantMap[a.participant_id]
                      return (
                        <tr key={a.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-3.5 font-medium text-on-surface">
                            <Link
                              href={`/projects/${projectId}/participants/${a.participant_id}`}
                              onClick={() => { setShowProfilePopup(false); onClose() }}
                              className="hover:text-primary transition-colors"
                            >
                              {p?.name ?? a.participant_id}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-on-surface-variant">{p?.age ? `${p.age}세` : '-'}</td>
                          <td className="px-4 py-3.5 text-on-surface-variant">{p?.gender ?? '-'}</td>
                          <td className="px-4 py-3.5 text-on-surface-variant">{p?.group ?? '-'}</td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-outline">{a.start_time ? a.start_time.slice(0, 5) : '-'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
