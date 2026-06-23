'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DayDetailPanel, { type Participant } from './DayDetailPanel'

interface Activity {
  id: string
  participant_id: string
  type_key: string
  title: string
  date: string
  start_time: string | null
  status: string
  diary_day: number | null
}

interface Period {
  key: string
  label: string
  start: string
  end: string
  colorIdx: number
}

interface Props {
  projectId: string
  activities: Activity[]
  activityTypeLabels: Record<string, string>
  participants: Participant[]
  year: number
  month: number
}

const STATUS_BAR: Record<string, string> = {
  scheduled:     'bg-slate-400',
  submitted:     'bg-emerald-500',
  completed:     'bg-sky-400',
  not_submitted: 'bg-rose-400',
  delayed:       'bg-amber-500',
  cancelled:     'bg-surface-container-highest',
}

// period bar 색상 팔레트 (bg / text)
const PERIOD_BG   = ['bg-violet-200', 'bg-sky-200',   'bg-amber-200',   'bg-emerald-200', 'bg-rose-200']
const PERIOD_TEXT = ['text-violet-800','text-sky-800', 'text-amber-800', 'text-emerald-800','text-rose-800']

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

function computePeriods(activities: Activity[], labels: Record<string, string>): Period[] {
  const map: Record<string, Period> = {}
  let idx = 0
  for (const a of activities) {
    const pkey = a.type_key + (a.diary_day != null ? `_${a.diary_day}` : '')
    if (!map[pkey]) {
      const raw = (labels[a.type_key] ?? a.type_key).replace(/[()]/g, '').trim()
      map[pkey] = {
        key: pkey,
        label: raw + (a.diary_day != null ? ` D${a.diary_day}` : ''),
        start: a.date,
        end: a.date,
        colorIdx: idx++,
      }
    } else {
      if (a.date < map[pkey].start) map[pkey].start = a.date
      if (a.date > map[pkey].end)   map[pkey].end   = a.date
    }
  }
  return Object.values(map).sort((a, b) => a.start.localeCompare(b.start))
}

export default function CalendarView({ projectId, activities, activityTypeLabels, participants, year, month }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const participantMap = participants.reduce<Record<string, Participant>>((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  const periods = computePeriods(activities, activityTypeLabels)

  function navigate(y: number, m: number) {
    router.push(`/projects/${projectId}?month=${y}-${String(m).padStart(2, '0')}`)
  }
  function prevMonth() { month === 1 ? navigate(year - 1, 12) : navigate(year, month - 1) }
  function nextMonth() { month === 12 ? navigate(year + 1, 1) : navigate(year, month + 1) }

  const firstDay = new Date(year, month - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalDays = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const byDate: Record<string, Activity[]> = {}
  for (const a of activities) {
    if (!byDate[a.date]) byDate[a.date] = []
    byDate[a.date].push(a)
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  // flat cells → 주 단위 rows
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="pb-4">
      {/* Sticky 헤더: 월 내비 + 범례 + 요일 */}
      <div className="sticky top-14 z-10 bg-surface px-6 pb-2">
        {/* 월 내비 + 범례 */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <h2 className="text-base font-bold text-on-surface tabular-nums tracking-tight w-24 text-center">
              {year}. {String(month).padStart(2, '0')}
            </h2>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          {/* 범례 */}
          <div className="flex items-center gap-3 flex-1 px-4">
            {periods.map(p => (
              <div key={p.key} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-sm shrink-0 ${PERIOD_BG[p.colorIdx % PERIOD_BG.length]}`} />
                <span className="text-[10px] text-on-surface-variant truncate">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7">
          {DAYS.map(d => (
            <div key={d} className="text-[11px] text-center text-on-surface-variant py-1.5 font-bold uppercase tracking-wider">{d}</div>
          ))}
        </div>
      </div>

      {/* 날짜 그리드 */}
      <div className="mx-6 border-l border-t border-outline-variant/50 rounded-lg overflow-hidden mt-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 min-h-[6.5rem]">
            {week.map((day, ci) => {
              const colIdx  = ci  // 0=월 6=일
              const dateStr = day
                ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : null
              const dayActivities = dateStr ? (byDate[dateStr] ?? []) : []
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selectedDate

              const cellPeriods = dateStr
                ? periods.filter(p => dateStr >= p.start && dateStr <= p.end)
                : []

              return (
                <div
                  key={ci}
                  onClick={() => dateStr && setSelectedDate(dateStr)}
                  className={`border-r border-b border-outline-variant/40 overflow-hidden transition-colors
                    ${day ? 'cursor-pointer' : 'bg-surface-container-lowest/30'}
                    ${isSelected ? 'bg-primary-fixed/20' : day ? 'bg-white hover:bg-surface-container-low/50' : ''}
                  `}
                >
                  {day && (
                    <>
                      <div className="px-1.5 pt-1">
                        <div className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                        }`}>
                          {day}
                        </div>
                      </div>

                      {cellPeriods.length > 0 && (
                        <div className="flex flex-col gap-px mt-0.5">
                          {cellPeriods.slice(0, 2).map(p => {
                            const isStart   = dateStr === p.start
                            const isEnd     = dateStr === p.end
                            const showLabel = isStart || colIdx === 0
                            return (
                              <div
                                key={p.key}
                                className={`h-[15px] flex items-center overflow-hidden
                                  ${PERIOD_BG[p.colorIdx % PERIOD_BG.length]}
                                  ${isStart ? 'rounded-l-full' : ''}
                                  ${isEnd   ? 'rounded-r-full' : ''}
                                `}
                              >
                                {showLabel && (
                                  <span className={`text-[10px] font-semibold leading-none px-1.5 truncate ${PERIOD_TEXT[p.colorIdx % PERIOD_TEXT.length]}`}>
                                    {p.label}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="px-1.5 mt-1 overflow-hidden">
                        <DaySummary activities={dayActivities} activityTypeLabels={activityTypeLabels} />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Day Detail Panel */}
      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          activities={byDate[selectedDate] ?? []}
          participantMap={participantMap}
          activityTypeLabels={activityTypeLabels}
          projectId={projectId}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

// ── 날짜 셀 요약 (dots only) ──────────────────────────────────
interface DaySummaryProps {
  activities: Activity[]
  activityTypeLabels: Record<string, string>
}

function DaySummary({ activities, activityTypeLabels }: DaySummaryProps) {
  const groups = activities.reduce<Record<string, { type_key: string; diary_day: number | null; items: Activity[] }>>(
    (acc, a) => {
      const key = a.type_key + (a.diary_day != null ? `_${a.diary_day}` : '')
      if (!acc[key]) acc[key] = { type_key: a.type_key, diary_day: a.diary_day, items: [] }
      acc[key].items.push(a)
      return acc
    }, {}
  )

  return (
    <div className="space-y-0.5">
      {Object.entries(groups).map(([key, group]) => (
        <div key={key} className="flex flex-wrap gap-0.5">
          {group.items.map(a => (
            <span
              key={a.id}
              className={`w-2 h-2 rounded-full shrink-0 ${STATUS_BAR[a.status] ?? 'bg-slate-400'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
