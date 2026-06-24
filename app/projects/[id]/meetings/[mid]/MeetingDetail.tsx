'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ActivityRow {
  id: string
  participant_id: string
  type_key: string
  status: string
}

interface MeetingItemRow {
  id: string
  meeting_id: string
  type: 'issue' | 'open_question' | 'decision'
  text: string
  status: 'open' | 'resolved' | 'pending' | 'confirmed'
  closed_meeting_id: string | null
  close_reason: string | null
}

interface Meeting {
  id: string
  week_start: string
  week_end: string
  schedule_comment_prev: string | null
  schedule_comment_curr: string | null
  minutes_date: string | null
  minutes_attendees: string | null
  minutes_content: string | null
}

interface Props {
  projectId: string
  meeting: Meeting
  seq: number
  items: MeetingItemRow[]
  seqMap: Record<string, number>
  prevActivities: ActivityRow[]
  currActivities: ActivityRow[]
  typeLabels: Record<string, string>
  participantMap: Record<string, string>
  prevWeekStart: string
  prevWeekEnd: string
  isClientView?: boolean
}

const PERIOD_BG   = ['bg-violet-200', 'bg-sky-200',   'bg-amber-200',   'bg-emerald-200', 'bg-rose-200']
const PERIOD_TEXT = ['text-violet-800','text-sky-800', 'text-amber-800', 'text-emerald-800','text-rose-800']

const STATUS_CHIP: Record<string, string> = {
  scheduled:     'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  submitted:     'bg-emerald-50 text-emerald-700 border border-emerald-100',
  completed:     'bg-sky-50 text-sky-700 border border-sky-100',
  not_submitted: 'bg-rose-50 text-rose-700 border border-rose-100',
  delayed:       'bg-amber-50 text-amber-700 border border-amber-100',
  cancelled:     'bg-surface-container text-outline border border-outline-variant',
}
const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', submitted: '제출', completed: '완료',
  not_submitted: '미제출', delayed: '지연', cancelled: '취소',
}

const ITEM_CHIP: Record<string, string> = {
  open:      'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  resolved:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  pending:   'bg-amber-50 text-amber-700 border border-amber-100',
  confirmed: 'bg-sky-50 text-sky-700 border border-sky-100',
}
const ITEM_LABEL: Record<string, string> = {
  open: '미해소', resolved: '해소', pending: '요청중', confirmed: '확정',
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="print-section-label flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold text-on-surface-variant font-mono tracking-widest opacity-50">{num}</span>
      <h2 className="text-sm font-bold text-on-surface tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-outline-variant/50" />
    </div>
  )
}

function ActivityList({ activities, typeLabels }: {
  activities: ActivityRow[]
  typeLabels: Record<string, string>
}) {
  if (activities.length === 0) {
    return <p className="text-xs text-on-surface-variant opacity-40">활동 없음</p>
  }
  return (
    <div className="space-y-1.5">
      {activities.map(a => (
        <div key={a.id} className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-outline w-7 shrink-0">{a.participant_id}</span>
          <span className="text-xs text-on-surface truncate flex-1">{typeLabels[a.type_key] ?? a.type_key}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_CHIP[a.status] ?? STATUS_CHIP.scheduled}`}>
            {STATUS_LABEL[a.status] ?? a.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function ItemRow({ item, seqMap, showId }: { item: MeetingItemRow; seqMap: Record<string, number>; showId: boolean }) {
  const createdSeq = seqMap[item.meeting_id] ?? '?'
  const closedSeq  = item.closed_meeting_id ? (seqMap[item.closed_meeting_id] ?? '?') : null

  return (
    <div className="print-block flex items-start gap-3 py-2.5 border-b border-outline-variant/30 last:border-0">
      <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${ITEM_CHIP[item.status]}`}>
        {ITEM_LABEL[item.status]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface leading-relaxed">{item.text}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className="text-[10px] font-mono text-outline">{createdSeq}차 발생</span>
          {closedSeq && (
            <>
              <span className="text-[10px] text-outline-variant">→</span>
              <span className="text-[10px] font-mono text-outline">{closedSeq}차 해소</span>
              {item.close_reason && (
                <span className="text-[10px] text-on-surface-variant">· {item.close_reason}</span>
              )}
            </>
          )}
          {showId && ['open', 'pending'].includes(item.status) && (
            <span className="text-[9px] font-mono text-outline bg-surface-container px-1.5 py-0.5 rounded select-all ml-1">
              {item.id}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TrackingSection({
  num, title, items, seqMap, showId,
}: {
  num: string
  title: string
  items: MeetingItemRow[]
  seqMap: Record<string, number>
  showId: boolean
}) {
  const [showClosed, setShowClosed] = useState(false)

  const open   = items.filter(i => ['open', 'pending'].includes(i.status))
  const closed = items.filter(i => ['resolved', 'confirmed'].includes(i.status))

  return (
    <section className="mb-10">
      <SectionLabel num={num} title={title} />
      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant opacity-40">항목 없음</p>
      ) : (
        <div>
          {open.length === 0 && !showClosed && (
            <p className="text-xs text-on-surface-variant opacity-40 pb-2">진행 중인 항목 없음</p>
          )}
          {open.map(item => (
            <ItemRow key={item.id} item={item} seqMap={seqMap} showId={showId} />
          ))}
          {closed.length > 0 && (
            <>
              <button
                onClick={() => setShowClosed(v => !v)}
                className="print:hidden flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mt-2 mb-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showClosed ? 'expand_less' : 'expand_more'}
                </span>
                해소된 항목 {closed.length}건
              </button>
              <div className={showClosed ? '' : 'hidden print:block'}>
                {closed.map(item => (
                  <ItemRow key={item.id} item={item} seqMap={seqMap} showId={false} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default function MeetingDetail({
  projectId, meeting, seq, items, seqMap,
  prevActivities, currActivities,
  typeLabels, participantMap,
  prevWeekStart, prevWeekEnd,
  isClientView = false,
}: Props) {
  const router = useRouter()

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'overview' | 'minutes'>('overview')

  // 회의 현황 탭 — JSON 입력
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 회의록 탭 — 직접 편집
  const [minutesDate, setMinutesDate] = useState(meeting.minutes_date ?? '')
  const [minutesAttendees, setMinutesAttendees] = useState(meeting.minutes_attendees ?? '')
  const [minutesContent, setMinutesContent] = useState(meeting.minutes_content ?? '')
  const [minutesSaving, setMinutesSaving] = useState(false)
  const [minutesError, setMinutesError] = useState<string | null>(null)
  const [minutesSaved, setMinutesSaved] = useState(false)

  const issues         = items.filter(i => i.type === 'issue')
  const openQuestions  = items.filter(i => i.type === 'open_question')
  const decisions      = items.filter(i => i.type === 'decision')

  const hasMinutes = !!(meeting.minutes_content || meeting.minutes_date || meeting.minutes_attendees)

  async function handleImport() {
    setImportError(null)
    setSaving(true)
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(importJson) } catch {
      setImportError('JSON 형식이 올바르지 않습니다')
      setSaving(false)
      return
    }
    const res = await fetch(`/api/projects/${projectId}/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setImportError(data.error ?? '오류가 발생했습니다'); return }
    setShowImport(false)
    setImportJson('')
    router.refresh()
  }

  async function handleMinutesSave() {
    setMinutesError(null)
    setMinutesSaved(false)
    setMinutesSaving(true)
    const res = await fetch(`/api/projects/${projectId}/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minutes_date: minutesDate || null,
        minutes_attendees: minutesAttendees || null,
        minutes_content: minutesContent || null,
      }),
    })
    const data = await res.json()
    setMinutesSaving(false)
    if (!res.ok) { setMinutesError(data.error ?? '오류가 발생했습니다'); return }
    setMinutesSaved(true)
    setTimeout(() => setMinutesSaved(false), 2000)
    router.refresh()
  }

  const overviewPlaceholder = JSON.stringify({
    schedule_comment_prev: '지난주 진행 내용 요약',
    schedule_comment_curr: '이번 주 계획 요약',
    new_items: [
      { type: 'issue', text: '새 이슈 내용' },
      { type: 'open_question', text: '새 질문' },
      { type: 'decision', text: '의사결정 요청 내용' },
    ],
    close_items: [
      { id: '아이템-UUID', close_reason: '해소 사유' },
    ],
  }, null, 2)

  return (
    <div className="max-w-3xl">

      {/* 공통 헤더 */}
      <div className="mb-6">
        {/* Row 1: 뒤로가기 */}
        <Link
          href={`/projects/${projectId}/meetings`}
          className="print:hidden flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mb-2"
        >
          <span className="material-symbols-outlined text-[13px]">arrow_back</span>
          정례회의 목록
        </Link>

        {/* Row 2: 제목 + PDF 버튼 */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-on-surface tracking-tight">
            {String(seq).padStart(2, '0')}차 정례회의
          </h1>
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            PDF 저장
          </button>
        </div>

        {/* Row 3: 기간 + 이번 주 액티비티 색인 */}
        {(() => {
          const typeCount: Record<string, number> = {}
          for (const a of currActivities) {
            typeCount[a.type_key] = (typeCount[a.type_key] ?? 0) + 1
          }
          const groups = Object.entries(typeCount).map(([key, count], i) => ({ key, count, colorIdx: i }))
          return (
            <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-3 pl-1">
              <span className="text-sm font-mono text-on-surface-variant">
                {fmtDate(meeting.week_start)} – {fmtDate(meeting.week_end)}
              </span>
              {groups.map(g => (
                <span
                  key={g.key}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PERIOD_BG[g.colorIdx % PERIOD_BG.length]} ${PERIOD_TEXT[g.colorIdx % PERIOD_TEXT.length]}`}
                >
                  {typeLabels[g.key] ?? g.key} {g.count}명
                </span>
              ))}
            </div>
          )
        })()}

        {/* 탭 */}
        <div className="print:hidden flex gap-1 mt-5 border-b border-outline-variant">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'overview'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            회의 현황
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('minutes')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'minutes'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            회의록
            {hasMinutes && activeTab !== 'minutes' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            )}
            {activeTab === 'minutes' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* ── 회의 현황 탭 ── */}
      <div className={activeTab === 'overview' ? '' : 'hidden print:block'}>

        {/* print용 섹션 구분 */}
        <div className="hidden print:flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant">
          <h2 className="text-base font-bold text-on-surface">회의 현황</h2>
        </div>

        {/* 현황 탭 액션 버튼 */}
        {!isClientView && (
          <div className="print:hidden mb-6 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowImport(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-[11px] font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">{showImport ? 'close' : 'edit'}</span>
              {showImport ? '닫기' : '내용 입력 / 수정'}
            </button>
          </div>
        )}

        {showImport && (
          <div className="print:hidden mb-6 space-y-2 bg-surface-container rounded-xl p-3 border border-outline-variant">
            <p className="text-[10px] text-on-surface-variant font-mono leading-relaxed">
              schedule_comment: 스케줄 코멘트 업데이트<br />
              new_items: 신규 항목 추가 (type: issue | open_question | decision)<br />
              close_items: 항목 해소 처리 (id는 아래 각 항목 옆 UUID 참조)
            </p>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              rows={14}
              placeholder={overviewPlaceholder}
              className="w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/50 resize-none text-on-surface"
            />
            {importError && <p className="text-[10px] text-rose-600">{importError}</p>}
            <button
              onClick={handleImport}
              disabled={saving || !importJson.trim()}
              className="px-4 py-1.5 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        {/* 01. 주간 스케줄 */}
        <section className="mb-10">
          <SectionLabel num="01" title="주간 스케줄" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container/50 rounded-xl p-4 border border-outline-variant/40">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                지난주 · {fmtDate(prevWeekStart)} – {fmtDate(prevWeekEnd)}
              </p>
              <ActivityList activities={prevActivities} typeLabels={typeLabels} />
              {meeting.schedule_comment_prev && (
                <p className="mt-3 pt-3 border-t border-outline-variant/40 text-sm text-on-surface leading-relaxed">
                  {meeting.schedule_comment_prev}
                </p>
              )}
            </div>
            <div className="bg-surface-container/50 rounded-xl p-4 border border-outline-variant/40">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                이번 주 · {fmtDate(meeting.week_start)} – {fmtDate(meeting.week_end)}
              </p>
              <ActivityList activities={currActivities} typeLabels={typeLabels} />
              {meeting.schedule_comment_curr && (
                <p className="mt-3 pt-3 border-t border-outline-variant/40 text-sm text-on-surface leading-relaxed">
                  {meeting.schedule_comment_curr}
                </p>
              )}
            </div>
          </div>
        </section>

        <TrackingSection num="02" title="이슈 사항"  items={issues}        seqMap={seqMap} showId={showImport} />
        <TrackingSection num="03" title="열린 질문"  items={openQuestions} seqMap={seqMap} showId={showImport} />
        <TrackingSection num="04" title="의사결정"   items={decisions}     seqMap={seqMap} showId={showImport} />
      </div>

      {/* ── 회의록 탭 ──
           화면: minutes 탭일 때만 보임
           print: minutes 데이터가 있을 때만 보임  */}
      <div className={activeTab === 'minutes' ? '' : hasMinutes ? 'hidden print:block' : 'hidden'}>

        {/* print용 섹션 구분 */}
        <div className="hidden print:flex items-center gap-2 mb-6 pb-4 border-t border-outline-variant pt-8 mt-8">
          <h2 className="text-base font-bold text-on-surface">회의록</h2>
        </div>

        <div className="space-y-5">

          {/* 회의 일자 + 참석자 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                회의 일자
              </label>
              <input
                type="date"
                value={minutesDate}
                onChange={e => setMinutesDate(e.target.value)}
                className={`${isClientView ? 'hidden' : 'print:hidden'} w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary/50`}
              />
              <p className={`${isClientView ? '' : 'hidden print:block'} text-sm text-on-surface font-mono`}>{minutesDate || '—'}</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                참석자
              </label>
              <input
                type="text"
                value={minutesAttendees}
                onChange={e => setMinutesAttendees(e.target.value)}
                placeholder="홍길동, 김리서처, 이매니저"
                className={`${isClientView ? 'hidden' : 'print:hidden'} w-full border border-outline-variant bg-surface rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50`}
              />
              <p className={`${isClientView ? '' : 'hidden print:block'} text-sm text-on-surface`}>{minutesAttendees || '—'}</p>
            </div>
          </div>

          {/* 회의록 본문 */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              회의록
            </label>
            <textarea
              value={minutesContent}
              onChange={e => setMinutesContent(e.target.value)}
              rows={20}
              placeholder={'회의 내용을 자유롭게 입력하세요.\n전사 내용을 그대로 붙여넣거나 요약해서 작성할 수 있습니다.'}
              className={`${isClientView ? 'hidden' : 'print:hidden'} w-full border border-outline-variant bg-surface rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed focus:outline-none focus:border-primary/50 resize-y`}
            />
            <div className={`${isClientView ? '' : 'hidden print:block'} bg-surface-container/30 rounded-xl px-4 py-4 border border-outline-variant/40`}>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{minutesContent || '—'}</p>
            </div>
          </div>

          {/* 저장 버튼 */}
          {!isClientView && (
            <div className="print:hidden flex items-center gap-3">
              <button
                onClick={handleMinutesSave}
                disabled={minutesSaving}
                className="px-5 py-2 bg-primary text-on-primary text-[11px] font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {minutesSaving ? '저장 중...' : '저장'}
              </button>
              {minutesSaved && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  저장됨
                </span>
              )}
              {minutesError && <span className="text-[11px] text-rose-600">{minutesError}</span>}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
